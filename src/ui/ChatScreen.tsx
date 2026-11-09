import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  Alert,
  AppState,
  BackHandler,
  FlatList,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getMemorySnapshot, forgetMemory, subscribeMemory, syncMemory } from '../memory/store';
import { getSkillsSnapshot, forgetSkill, subscribeSkills, syncSkills } from '../skills/store';
import {
  clear,
  enqueuePrompt,
  setQueuedFollowUp,
  getSnapshot,
  removeQueued,
  send,
  stop,
  subscribe,
} from '../agent/controller';
import { formatTokens, usageTokens } from '../agent/context';
import { formatBytes, promptLimits, promptOverflow } from '../agent/prompt';
import { canonicalToolName, TOOL_REGISTRY } from '../agent/tools';
import {
  getAuth,
  getSnapshot as getSettingsSnapshot,
  setSidebar,
  subscribe as subscribeSettings,
} from '../settings/store';
import { fetchProfile } from '../auth/profile';
import type { Subscription } from '../auth/profile';
import { playFile } from '../audio/player';
import { documents, forgetDocument, indexFile, isRagFile } from '../rag';
import type { RagDocument } from '../db/rag';
import {
  cancelRecording,
  formatDuration as formatAudioDuration,
  hasMicPermission,
  requestMicPermission,
  startRecording,
  stopRecording,
  subscribeRecordLevel,
} from '../audio/record';
import type { RecordStop } from '../audio/record';
import { deletePhonePath, phoneExists } from '../chia/fs';
import { prepareChia } from '../chia/prepare';
import {
  formatSize,
  pickDocument,
  pickImage,
  uploadDocument,
} from '../attach';
import type { Attachment } from '../attach';
import type { ChatMessage } from '../llm/types';
import { Icon } from './icons';
import { MessageBubble } from './MessageBubble';
import { StreamBlock } from './StreamBlock';
import { useTheme } from './theme';
import { Welcome } from './Welcome';
import { Focusable } from './Focusable';
import { useLayout } from './layout';

const LOGO = require('../../assets/chia-logo.png');
const LOGO_HEAD = require('../../assets/chia-head.png');

/** Distancia (px) desde el ultimo mensaje a la que aparece el boton flotante. */
const LIST_AWAY_OFFSET = 320;

/** Comandos del chat que se listan al escribir `/`. */
const COMMANDS = [
  { name: '/clear', hint: 'borrar el historial del chat' },
];

function matchCommands(input: string) {
  const query = input.trimStart().toLowerCase();
  if (!query.startsWith('/') || query.includes(' ') || query.includes('\n')) {
    return [];
  }
  return COMMANDS.filter(command => command.name.startsWith(query));
}

// Identidad estable: sin esto, cada delta re-renderiza la lista completa.
const keyExtractor = (item: ChatMessage) => item.id;
const renderItem = ({ item }: { item: ChatMessage }) => <MessageBubble message={item} />;

function MetricRow({
  label,
  value,
  color,
  muted,
}: {
  label: string;
  value: string;
  color: string;
  muted: string;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={[styles.metricLabel, { color: muted }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.metricValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/** Duracion legible para las metricas: 1.4s, 2m 5s, 1h 3m. */
function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '0s';
  }
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ${Math.round(seconds % 60)}s`;
  }
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function ChatScreen({
  onOpenSettings,
  onOpenProfile,
}: {
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getSettingsSnapshot,
  );
  const layout = useLayout();
  const skills = useSyncExternalStore(subscribeSkills, getSkillsSnapshot, getSkillsSnapshot);
  const memory = useSyncExternalStore(subscribeMemory, getMemorySnapshot, getMemorySnapshot);
  const [text, setText] = useState('');
  const [audio, setAudio] = useState<RecordStop | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const [recordLevel, setRecordLevel] = useState(0);
  const autoSendAudio = useRef(false);

  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [docs, setDocs] = useState<RagDocument[]>([]);
  const [attachMenu, setAttachMenu] = useState(false);

  const [keyboard, setKeyboard] = useState(0);

  // Cuota del plan: se guarda en un ref (no pinta nada en la UI). Sirve para
  // avisar con un toast antes de mandar si ya no quedan llamadas del dia.
  const plan = useRef<Subscription | null>(null);
  const refreshPlan = useCallback(() => {
    const auth = getAuth();
    if (!auth.baseUrl || !auth.token) {
      plan.current = null;
      return;
    }
    void fetchProfile(auth.baseUrl, auth.token)
      .then((profile) => {
        plan.current = profile.plan;
      })
      .catch(() => {
        plan.current = null;
      });
  }, []);

  useEffect(() => {
    refreshPlan();
  }, [refreshPlan]);

  const wasStreaming = useRef(false);
  useEffect(() => {
    if (wasStreaming.current && !state.isStreaming) {
      refreshPlan();
    }
    wasStreaming.current = state.isStreaming;
  }, [refreshPlan, state.isStreaming]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', event => {
      // Con edge-to-edge la ventana no se redimensiona: el alto del teclado
      // (que ya incluye la barra de navegacion) es el unico margen valido.
      setKeyboard(Math.max(event.endCoordinates.height, Keyboard.metrics()?.height ?? 0));
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next !== 'active') {
        setKeyboard(0);
        return;
      }
      setKeyboard(Keyboard.metrics()?.height ?? 0);
      refreshPlan();
    });
    return () => subscription.remove();
  }, [refreshPlan]);

  // ReactRootView reporta el alto del IME menos la barra de navegacion
  // (imeInsets.bottom - barsInsets.bottom): hay que devolverle insets.bottom
  // o el composer queda tapado por esa franja.
  const bottom = keyboard > 0 ? keyboard + insets.bottom : insets.bottom;

  /** Cierra el sidebar en cuanto el usuario toca cualquier otra zona. */
  const closeSidebar = useCallback(() => {
    if (settings.sidebar) {
      setSidebar(false);
    }
  }, [settings.sidebar]);

  const onInputFocus = useCallback(() => {
    closeSidebar();
    setAttachMenu(false);
    const height = Keyboard.metrics()?.height ?? 0;
    setKeyboard(height);
  }, [closeSidebar]);

  const meter = useMemo(() => {
    for (let index = state.messages.length - 1; index >= 0; index -= 1) {
      const usage = state.messages[index].usage;
      if (usage) {
        return usage;
      }
    }
    return null;
  }, [state.messages]);

  /** Ventana de contexto real que reporto el servidor (`limits`). */
  const limits = useMemo(() => {
    for (let index = state.messages.length - 1; index >= 0; index -= 1) {
      const value = state.messages[index].limits;
      if (value && value.contextWindow > 0) {
        return value;
      }
    }
    return null;
  }, [state.messages]);

  // Cache de prompt acumulada: lo que el proveedor ya tenia en cache vs lo
  // que hubo que enviar de nuevo.
  const cache = useMemo(() => {
    let read = 0;
    let write = 0;
    let fresh = 0;
    for (const message of state.messages) {
      const usage = message.usage;
      if (!usage) {
        continue;
      }
      read += usage.cacheRead;
      write += usage.cacheWrite;
      fresh += usage.input;
    }
    const sent = read + write + fresh;
    const pct = sent > 0 ? (read / sent) * 100 : 0;
    return { read, write, fresh, sent, pct };
  }, [state.messages]);
  const counters = useMemo(() => {
    type ToolStat = {
      count: number;
      errors: number;
      ms: number;
      chars: number;
      tokens: number;
    };
    const emptyStat = (): ToolStat => ({ count: 0, errors: 0, ms: 0, chars: 0, tokens: 0 });
    const tools = new Map<string, ToolStat>(
      TOOL_REGISTRY.map(tool => [tool.name, emptyStat()]),
    );
    const toolStat = (name: string): ToolStat | null => {
      const key = canonicalToolName(name);
      if (!key) {
        return null;
      }
      const current = tools.get(key);
      if (current) {
        return current;
      }
      const created = emptyStat();
      tools.set(key, created);
      return created;
    };
    for (const message of state.messages) {
      if (message.kind === 'summary' || message.role === 'user') {
        continue;
      }
      for (const call of message.toolCalls ?? []) {
        const stat = toolStat(call.name);
        if (stat) {
          stat.count += 1;
        }
      }
      for (const result of message.toolResults ?? []) {
        const stat = toolStat(result.tool ?? '');
        if (!stat) {
          continue;
        }
        if (result.durationMs > 0) {
          stat.ms += result.durationMs;
        }
        if (result.isError) {
          stat.errors += 1;
        }
        stat.chars += result.output.length;
      }
    }
    const toolRows = [...tools.entries()].sort((a, b) => b[1].count - a[1].count);
    const toolTotal = toolRows.reduce((sum, [, stat]) => sum + stat.count, 0);
    const toolErrors = toolRows.reduce((sum, [, stat]) => sum + stat.errors, 0);
    const toolMs = toolRows.reduce((sum, [, stat]) => sum + stat.ms, 0);
    const toolChars = toolRows.reduce((sum, [, stat]) => sum + stat.chars, 0);
    const toolTokens = toolRows.reduce((sum, [, stat]) => sum + stat.tokens, 0);
    return {
      toolRows,
      toolTotal,
      toolErrors,
      toolMs,
      toolChars,
      toolTokens,
    };
  }, [state.messages]);

  const removeLocalPath = useCallback(async (path: string, requiredRoot: string) => {
    if (!path.includes(requiredRoot) || path.endsWith(requiredRoot)) {
      throw new Error(`ruta fuera de ${requiredRoot}`);
    }
    if (await phoneExists(path)) {
      await deletePhonePath(path);
    }
  }, []);

  const onDeleteSkill = useCallback((name: string, baseDir: string) => {
    Alert.alert(
      'Borrar skill',
      `Se borra ${name} del telefono.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            void removeLocalPath(baseDir, '/.chia/skills/')
              .then(() => forgetSkill(name))
              .then(() => syncSkills())
              .catch((error: unknown) => Alert.alert(
                'No se pudo borrar',
                error instanceof Error ? error.message : String(error),
              ));
          },
        },
      ],
    );
  }, [removeLocalPath]);

  const onDeleteMemory = useCallback((name: string, path: string) => {
    Alert.alert(
      'Borrar memoria',
      `Se borra ${name} del telefono.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            void removeLocalPath(path, '/.chia/memory/')
              .then(() => forgetMemory(name))
              .then(() => syncMemory())
              .catch((error: unknown) => Alert.alert(
                'No se pudo borrar',
                error instanceof Error ? error.message : String(error),
              ));
          },
        },
      ],
    );
  }, [removeLocalPath]);

  const lastUsage = limits ? limits.tokensTotal : meter ? usageTokens(meter) : 0;
  const usedPct = limits && limits.contextWindow > 0
    ? Math.max(0, Math.min(100, (limits.tokensTotal / limits.contextWindow) * 100))
    : 0;
  const barColor = usedPct >= 90 ? c.danger : usedPct >= 70 ? '#f59e0b' : c.accent;

  const streamMessage = useMemo(() => {
    if (!state.isStreaming) {
      return null;
    }
    const last = state.messages[state.messages.length - 1];
    return last && last.role === 'assistant' ? last : null;
  }, [state.isStreaming, state.messages]);


  const listRef = useRef<FlatList<ChatMessage> | null>(null);
  const [awayFromLatest, setAwayFromLatest] = useState(false);

  const jumpToLatest = useCallback(() => {
    setAwayFromLatest(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const onListScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setAwayFromLatest(event.nativeEvent.contentOffset.y > LIST_AWAY_OFFSET);
  }, []);

  const data = useMemo(() => {
    const visible = state.messages.filter(
      message =>
        message.id !== streamMessage?.id
        && (message.content.trim().length > 0
          || message.images?.length
          || message.status === 'error'
          || message.kind === 'summary'),
    );
    return visible
      .slice()
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      .reverse();
  }, [state.messages, streamMessage]);
  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const refreshDocs = useCallback(() => {
    try {
      setDocs(documents(100));
    }
    catch {
      setDocs([]);
    }
  }, []);

  useEffect(() => {
    if (settings.sidebar) {
      refreshDocs();
      void prepareChia();
    }
  }, [refreshDocs, settings.sidebar]);

  const onDeleteDoc = useCallback((id: string, name: string) => {
    Alert.alert(
      'Borrar del RAG',
      `Se borra ${name}, el archivo del telefono y sus vectores.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            void forgetDocument(id)
              .then(() => {
                refreshDocs();
              })
              .catch((error: unknown) => showToast(
                error instanceof Error ? error.message : String(error),
              ));
          },
        },
      ],
    );
  }, [refreshDocs, showToast]);


  const canSend = (text.trim().length > 0 || attachment !== null || audio !== null)
    && !state.isStreaming
    && !busy
    && !recording;
  const promptLimit = promptLimits();
  const overflow = promptOverflow(text, promptLimit);
  const tooBig = overflow?.tooBig === true;
  const commands = matchCommands(text);

  const onPickImage = useCallback(() => {
    if (state.isStreaming) {
      return;
    }
    void pickImage()
      .then((picked) => {
        if (picked) {
          setAttachment(picked);
        }
      })
      .catch((error: unknown) => {
        Alert.alert('Error al adjuntar', error instanceof Error ? error.message : String(error));
      });
  }, [state.isStreaming]);

  const onPickFile = useCallback(() => {
    if (state.isStreaming) {
      return;
    }
    void pickDocument()
      .then((picked) => {
        if (picked) {
          setAttachment(picked);
        }
      })
      .catch((error: unknown) => {
        Alert.alert('Error al adjuntar', error instanceof Error ? error.message : String(error));
      });
  }, [state.isStreaming]);

  // Nivel y tiempo de la grabacion en curso (10 eventos/s desde el nativo).
  useEffect(() => {
    if (!recording) {
      return;
    }
    return subscribeRecordLevel(event => {
      setRecordLevel(event.rms);
      setRecordMs(event.elapsedMs);
    });
  }, [recording]);

  // Grabar en background exigiria un foreground service tipo microphone:
  // preferimos cortar y conservar el archivo.
  useEffect(() => {
    if (!recording) {
      return;
    }
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        void stopRecording()
          .then((stopped) => {
            setRecording(false);
            setRecordLevel(0);
            if (stopped.bytes > 2048) {
              setAudio(stopped);
            }
          })
          .catch(() => {
            setRecording(false);
            setRecordLevel(0);
          });
      }
    });
    return () => subscription.remove();
  }, [recording]);

  // En TV el boton atras (B / back del control) cancela la grabacion.
  useEffect(() => {
    if (!recording) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      void cancelRecording();
      setRecording(false);
      setRecordLevel(0);
      setRecordMs(0);
      return true;
    });
    return () => subscription.remove();
  }, [recording]);

  const onMic = useCallback(() => {
    if (state.isStreaming || busy) {
      return;
    }
    if (recording) {
      void stopRecording()
        .then((stopped) => {
          setRecording(false);
          setRecordLevel(0);
          if (stopped.bytes < 2048 || stopped.durationMs < 700) {
            Alert.alert('Audio muy corto', 'Graba al menos un segundo.');
            setRecordMs(0);
            return;
          }
          setRecordMs(0);
          autoSendAudio.current = true;
          setAudio(stopped);
        })
        .catch((error: unknown) => {
          setRecording(false);
          Alert.alert('Error al grabar', error instanceof Error ? error.message : String(error));
        });
      return;
    }
    Keyboard.dismiss();
    setRecordMs(0);
    setRecordLevel(0);
    void hasMicPermission()
      .then((granted) => {
        if (granted) {
          return true;
        }
        return requestMicPermission().then((accepted) => {
          if (!accepted) {
            Alert.alert('Microfono', 'Acepta el permiso de microfono y vuelve a tocar el boton.');
          }
          return accepted;
        });
      })
      .then((granted) => {
        if (!granted) {
          return null;
        }
        return startRecording();
      })
      .then((started) => {
        if (started) {
          setRecording(true);
        }
      })
      .catch((error: unknown) => {
        setRecording(false);
        Alert.alert('Error al grabar', error instanceof Error ? error.message : String(error));
      });
  }, [busy, recording, state.isStreaming]);

  const onCancelAudio = useCallback(() => {
    if (recording) {
      void cancelRecording();
      setRecording(false);
      setRecordLevel(0);
      setRecordMs(0);
      return;
    }
    setAudio(null);
    setRecordMs(0);
  }, [recording]);

  const onCommand = useCallback((command: string) => {    if (state.messages.length === 0) {
      Alert.alert(command, 'No hay historial en este chat.');
      return;
    }
    if (command === '/clear') {
      Alert.alert(
        'Borrar historial',
        `Se borran los ${state.messages.length} mensajes de este chat.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Borrar', style: 'destructive', onPress: () => clear() },
        ],
      );
      return;
    }
  }, [state.messages.length]);

  const onSend = useCallback(() => {
    if (!canSend || tooBig) {
      return;
    }
    const quota = plan.current;
    if (quota && quota.restante <= 0) {
      showToast(
        `Plan ${quota.nombre}: sin creditos hoy (${quota.usadoHoy} de ${quota.creditosDia}). Se renueva a las 00:00 o compra mas creditos.`,
      );
      return;
    }
    Keyboard.dismiss();
    jumpToLatest();
    const currentText = text;
    const current = attachment;
    const command = currentText.trim().toLowerCase();
    if (!audio && !current && command === '/clear') {
      setText('');
      onCommand(command);
      return;
    }
    if (audio) {
      const recorded = audio;
      setBusy(true);
      void send(currentText, [], {
        path: recorded.path,
        durationMs: recorded.durationMs,
        bytes: recorded.bytes,
        mime: recorded.mime,
      })
        .then((result) => {
          if (!result.ok) {
            if (result.error) {
              showToast(result.error);
            }
            return;
          }
          setAudio(null);
          setText('');
          setAttachment(null);
          setRecordMs(0);
        })
        .finally(() => setBusy(false));
      return;
    }

    setText('');
    setAttachment(null);

    if (current?.kind === 'image') {
      void send(currentText, [current.image]);
      return;
    }

    if (current?.kind === 'file' && isRagFile(current.name)) {
      setBusy(true);
      void indexFile(current.uri, current.name)
        .then((indexed) => send(currentText, [], undefined, {
          id: indexed.doc.id,
          name: indexed.doc.name,
          path: indexed.doc.path,
          chunks: indexed.doc.chunks,
          pages: indexed.doc.pages,
        }))
        .then((result) => {
          if (!result.ok) {
            if (result.error) {
              showToast(result.error);
            }
            return;
          }
          setAttachment(null);
          setText('');
        })
        .catch((error: unknown) => {
          setAttachment(current);
          setText(currentText);
          showToast(`RAG: ${error instanceof Error ? error.message : String(error)}`);
        })
        .finally(() => setBusy(false));
      return;
    }

    if (current?.kind === 'file') {
      setBusy(true);
      void uploadDocument(current)
        .then((uploaded) => {
          const path = uploaded.kind === 'file' ? uploaded.remotePath ?? '' : '';
          return send(`${currentText}\n\n[adjunto] ${current.name} (${formatSize(current.size)}) en ${path}`.trim());
        })
        .catch((error: unknown) => {
          setAttachment(current);
          setText(currentText);
          Alert.alert('Error al subir', error instanceof Error ? error.message : String(error));
        })
        .finally(() => {
          setBusy(false);
        });
      return;
    }

    void send(currentText).then((result) => {
      if (!result.ok && result.error) {
        setText(currentText);
        showToast(result.error);
      }
    });
  }, [attachment, audio, busy, canSend, jumpToLatest, onCommand, showToast, text, tooBig]);

  // Audio primero: al terminar la grabacion se transcribe y se envia solo.
  useEffect(() => {
    if (!autoSendAudio.current || !audio || recording || busy) {
      return;
    }
    autoSendAudio.current = false;
    onSend();
  }, [audio, busy, onSend, recording]);

  const onEditQueued = useCallback((id: string, value: string) => {
    setText(current => (current.trim() ? `${current} ${value}` : value));
    removeQueued(id);
  }, []);

  const onQueue = useCallback(() => {
    void enqueuePrompt(text)
      .then((queued) => {
        if (!queued) {
          return;
        }
        setText('');
        setAttachment(null);
      })
      .catch((error: unknown) => showToast(
        error instanceof Error ? error.message : String(error),
      ));
  }, [text, showToast]);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: c.bg }]}
      edges={['top']}
    >
      <View style={[styles.root, { paddingBottom: bottom }]}>
      <View
        style={[styles.header, { borderBottomColor: c.border }]}
        onTouchStart={closeSidebar}
      >
        <View style={styles.brand}>
          <Image source={LOGO_HEAD} style={styles.logo} accessibilityLabel="ChiaNative" />
          <Text style={[styles.title, { color: c.text, fontSize: layout.s(18) }]}>Chia Agente</Text>
        </View>
        <View style={styles.headerActions}>
          <Focusable
            onPress={() => setSidebar(!settings.sidebar)}
            hitSlop={10}
            accessibilityLabel="Metricas del chat"
            accessibilityState={{ expanded: settings.sidebar }}
            style={styles.headerAction}
          >
            <Icon name="chart" size={18} color={settings.sidebar ? c.accent : c.text} />
          </Focusable>
          <Focusable
            onPress={onOpenSettings}
            hitSlop={10}
            accessibilityLabel="Configuracion"
            style={styles.headerAction}
          >
            <Icon name="settings" size={18} color={c.text} />
          </Focusable>
          <Focusable
            onPress={onOpenProfile}
            hitSlop={10}
            accessibilityLabel="Perfil"
            style={styles.headerAction}
          >
            <Icon name="user" size={18} color={c.text} />
          </Focusable>
        </View>
      </View>

      <View style={styles.body}>
      {state.hydrated && state.messages.length === 0 && !streamMessage
        ? (
            <View style={styles.welcome}>
              <Welcome text={settings.systemPrompt} logo={LOGO} />
            </View>
          )
        : (
            <FlatList
              ref={listRef}
              data={data}
              inverted
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onScroll={onListScroll}
              scrollEventThrottle={32}
            />
          )}

      {awayFromLatest
        ? (
            <Focusable
              onPress={jumpToLatest}
              style={[
                styles.jump,
                {
                  backgroundColor: c.surface,
                  borderColor: c.border,
                  bottom: 12,
                },
              ]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Ir al ultimo mensaje"
            >
              <Icon name="arrowDown" size={18} color={c.accent} />
            </Focusable>
          )
        : null}

      {state.isStreaming
        ? <StreamBlock message={streamMessage} />
        : null}

      {state.error
        ? <Text style={[styles.error, { color: c.danger }]}>{state.error}</Text>
        : null}

      {/* Al tocar fuera del sidebar (mensajes, cabecera, composer) se cierra. */}
      {settings.sidebar ? (
        <Focusable
          style={styles.backdrop}
          onPress={closeSidebar}
          accessibilityLabel="Cerrar metricas"
        />
      ) : null}

      {settings.sidebar ? (
        <View
          style={[
            styles.sidebar,
            { backgroundColor: c.bg, borderLeftColor: c.border },
          ]}
        >
          <View style={styles.sidebarHead}>
            <Text style={[styles.sidebarTitle, { color: c.text }]}>Estado</Text>
            <View style={styles.sidebarActions}>
              <Focusable
                onPress={() => setSidebar(false)}
                hitSlop={10}
                accessibilityLabel="Cerrar metricas"
                style={styles.sidebarAction}
              >
                <Icon name="close" size={16} color={c.muted} />
              </Focusable>
            </View>
          </View>

          <View style={styles.metricDualRow}>
            <View style={styles.metricDualCol}>
              <Text style={[styles.sidebarValue, { color: barColor }]}>
                {usedPct.toFixed(1)}%
              </Text>
              <Text style={[styles.sidebarHint, { color: c.muted }]} numberOfLines={2}>
                contexto · {formatTokens(lastUsage)}
                {limits ? ` / ${formatTokens(limits.contextWindow)}` : ''} tokens
              </Text>
            </View>
            <View style={[styles.metricDualCol, styles.metricDualRight]}>
              <Text style={[styles.sidebarValue, { color: c.accent }]}>
                {cache.pct.toFixed(1)}%
              </Text>
              <Text
                style={[styles.sidebarHint, styles.metricDualHintRight, { color: c.muted }]}
                numberOfLines={2}
              >
                cache · {formatTokens(cache.read)} leidos · {formatTokens(cache.write)} escritos ·{' '}
                {formatTokens(cache.fresh)} nuevos
              </Text>
            </View>
          </View>

          <View style={[styles.bar, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View
              style={[styles.barFill, { width: `${usedPct}%`, backgroundColor: barColor }]}
            />
          </View>
          <Text style={[styles.sidebarHint, { color: c.muted }]} numberOfLines={2}>
            {limits
              ? `${formatTokens(limits.tokensInput)} entrada · ${formatTokens(limits.tokensOutput)} salida · ${formatTokens(limits.tokensFree)} libres`
              : 'la ventana informa al servidor'}
          </Text>

          <ScrollView
            style={styles.metrics}
            contentContainerStyle={styles.metricsContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.skillHeaderFirst, { borderTopColor: c.border }]}>
              <Icon name="terminal" size={11} color={c.muted} />
              <Text style={[styles.skillHeaderText, { color: c.muted }]}>HERRAMIENTAS</Text>
              <Text style={[styles.skillHeaderMeta, { color: c.muted }]}>
                {counters.toolTotal} llamadas · {formatDuration(counters.toolMs)}
              </Text>
            </View>
            {counters.toolErrors > 0
              ? (
                  <MetricRow
                    label="con error"
                    value={String(counters.toolErrors)}
                    color={c.danger}
                    muted={c.muted}
                  />
                )
              : null}
            <View style={styles.metricRow}>
              <Text style={[styles.toolHeadLabel, { color: c.muted }]}>herramienta</Text>
              <Text style={[styles.toolCell, { color: c.muted }]}>llam</Text>
              <Text style={[styles.toolCell, { color: c.muted }]}>chars</Text>
              <Text style={[styles.toolCell, { color: c.muted }]}>tk</Text>
            </View>
            {counters.toolRows.map(([name, stat]) => (
              <View key={name} style={styles.metricRow}>
                <View style={styles.metricTool}>
                  <Icon name="terminal" size={11} color={stat.count > 0 ? c.accent : c.muted} />
                  <Text
                    style={[styles.metricLabel, { color: stat.count > 0 ? c.text : c.muted }]}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  {stat.errors > 0
                    ? (
                        <Text style={[styles.metricError, { color: c.danger }]}>
                          {stat.errors} err
                        </Text>
                      )
                    : null}
                  {stat.ms > 0
                    ? (
                        <Text style={[styles.metricError, { color: c.muted }]}>
                          {formatDuration(stat.ms)}
                        </Text>
                      )
                    : null}
                </View>
                <Text style={[styles.toolCell, { color: stat.count > 0 ? c.text : c.muted }]}>
                  {stat.count}
                </Text>
                <Text style={[styles.toolCell, { color: c.muted }]}>
                  {formatTokens(stat.chars)}
                </Text>
                <Text style={[styles.toolCell, { color: c.muted }]}>
                  {formatTokens(stat.tokens)}
                </Text>
              </View>
            ))}
            <View style={[styles.metricRow, styles.toolTotalRow, { borderTopColor: c.border }]}>
              <Text style={[styles.metricLabel, { color: c.muted }]}>Total</Text>
              <Text style={[styles.toolCell, { color: c.text }]}>{counters.toolTotal}</Text>
              <Text style={[styles.toolCell, { color: c.text }]}>
                {formatTokens(counters.toolChars)}
              </Text>
              <Text style={[styles.toolCell, { color: c.text }]}>
                {formatTokens(counters.toolTokens)}
              </Text>
            </View>

            <View style={[styles.skillHeader, { borderTopColor: c.border }]}>
              <Icon name="sparkles" size={11} color={c.muted} />
              <Text style={[styles.skillHeaderText, { color: c.muted }]}>
                HABILIDADES
              </Text>
            </View>
            {skills.length === 0
              ? (
                  <Text style={[styles.skillEmpty, { color: c.muted }]}>
                    sin skills en el telefono
                  </Text>
                )
              : skills.map(skill => (
                  <View key={skill.name} style={styles.skillItem}>
                    <View style={styles.skillBody}>
                      <Text style={[styles.skillName, { color: c.text }]} numberOfLines={1}>
                        {skill.name}
                        {skill.hidden ? '  · solo /skill' : ''}
                      </Text>
                      <Text style={[styles.skillDesc, { color: c.muted }]} numberOfLines={2}>
                        {skill.description}
                      </Text>
                    </View>
                    <Focusable
                      onPress={() => onDeleteSkill(skill.name, skill.baseDir)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Borrar skill ${skill.name}`}
                    >
                      <Icon name="trash" size={13} color={c.muted} />
                    </Focusable>
                  </View>
                ))}

            <View style={[styles.skillHeader, { borderTopColor: c.border }]}>
              <Icon name="fileText" size={11} color={c.muted} />
              <Text style={[styles.skillHeaderText, { color: c.muted }]}>
                MEMORIA
              </Text>
            </View>
            {memory.length === 0
              ? (
                  <Text style={[styles.skillEmpty, { color: c.muted }]}>
                    sin notas en el telefono
                  </Text>
                )
              : memory.map(note => (
                  <View key={note.name} style={styles.skillItem}>
                    <View style={styles.skillBody}>
                      <Text style={[styles.skillName, { color: c.text }]} numberOfLines={1}>
                        {note.name}
                      </Text>
                      {note.description
                        ? (
                            <Text style={[styles.skillDesc, { color: c.muted }]} numberOfLines={2}>
                              {note.description}
                            </Text>
                          )
                        : null}
                    </View>
                    <Focusable
                      onPress={() => onDeleteMemory(note.name, note.path)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Borrar memoria ${note.name}`}
                    >
                      <Icon name="trash" size={13} color={c.muted} />
                    </Focusable>
                  </View>
                ))}
            <View style={[styles.skillHeader, { borderTopColor: c.border }]}>
              <Icon name="fileText" size={11} color={c.muted} />
              <Text style={[styles.skillHeaderText, { color: c.muted }]}>RAG</Text>
              <Text style={[styles.skillHeaderMeta, { color: c.muted }]}>
                {docs.length} docs
              </Text>
            </View>
            {docs.length === 0
              ? (
                  <Text style={[styles.skillEmpty, { color: c.muted }]}>
                    sin archivos indexados
                  </Text>
                )
              : docs.map(doc => (
                  <View key={doc.id} style={styles.skillItem}>
                    <View style={styles.skillBody}>
                      <Text style={[styles.skillName, { color: c.text }]} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={[styles.skillDesc, { color: c.muted }]} numberOfLines={1}>
                        {doc.chunks} fragmentos
                        {doc.pages > 0 ? ` · ${doc.pages} pag` : ''}
                        {doc.bytes > 0 ? ` · ${formatSize(doc.bytes)}` : ''}
                      </Text>
                    </View>
                    <Focusable
                      onPress={() => onDeleteDoc(doc.id, doc.name)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Borrar ${doc.name} del RAG`}
                    >
                      <Icon name="trash" size={13} color={c.muted} />
                    </Focusable>
                  </View>
                ))}
          </ScrollView>
        </View>
      ) : null}
      </View>

      <View
        style={[styles.composer, { borderTopColor: c.border, backgroundColor: c.bg }]}
        onTouchStart={closeSidebar}
      >
        {commands.length > 0
          ? (
              <View
                style={[
                  styles.commands,
                  { backgroundColor: c.surface, borderColor: c.border },
                ]}
              >
                {commands.map(item => (
                  <Focusable
                    key={item.name}
                    onPress={() => setText(`${item.name} `)}
                    accessibilityRole="button"
                    accessibilityLabel={`Comando ${item.name}`}
                    style={styles.command}
                  >
                    <Text style={[styles.commandName, { color: c.accent }]}>
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.commandHint, { color: c.muted }]}
                      numberOfLines={1}
                    >
                      {item.hint}
                    </Text>
                  </Focusable>
                ))}
              </View>
            )
          : null}
        {attachment
          ? (
              <View style={[styles.chip, { borderColor: c.border }]}>
                <Icon
                  name={attachment.kind === 'image' ? 'image' : 'fileText'}
                  size={14}
                  color={c.muted}
                />
                <Text style={[styles.chipText, { color: c.muted }]} numberOfLines={1}>
                  {busy && attachment.kind === 'file' && isRagFile(attachment.name)
                    ? `${attachment.name}  ·  indexando...`
                    : `${attachment.name}  ${formatSize(attachment.size)}`}
                </Text>
                <Focusable
                  onPress={() => setAttachment(null)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar adjunto"
                >
                  <Icon name="close" size={13} color={c.muted} />
                </Focusable>
              </View>
            )
          : null}
        {state.queued.length > 0
          ? (
              <ScrollView
                style={[styles.queue, { maxHeight: windowHeight * 0.3 }]}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.queueHead, { color: c.muted }]}>
                  {state.queued.length} {state.queued.length === 1 ? 'pendiente' : 'pendientes'}
                </Text>
                {state.queued.map(item => (
                  <View key={item.id} style={[styles.queueChip, { borderColor: c.border }]}>
                    <Focusable
                      onPress={() => setQueuedFollowUp(item.id, !item.followUp)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={item.followUp ? 'Pasar a en cola' : 'Pasar a despues'}
                      style={[styles.queueLabelBox, { borderColor: c.border }]}
                    >
                      <Text style={[styles.queueLabel, { color: c.accent }]}>
                        {item.followUp ? 'despues' : 'en cola'}
                      </Text>
                    </Focusable>
                    <Focusable
                      onPress={() => onEditQueued(item.id, item.text)}
                      style={styles.queueTextWrap}
                      accessibilityRole="button"
                      accessibilityLabel="Editar prompt en espera"
                    >
                      <Text style={[styles.queueText, { color: c.muted }]}>
                        {item.text}
                      </Text>
                    </Focusable>
                    <Focusable
                      onPress={() => removeQueued(item.id)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel="Quitar de la cola"
                    >
                      <Icon name="close" size={12} color={c.muted} />
                    </Focusable>
                  </View>
                ))}
              </ScrollView>
            )
          : null}
        {recording
          ? (
              <View style={[styles.recBar, { borderColor: c.danger }]}>
                <View style={[styles.recDot, { backgroundColor: c.danger }]} />
                <Text style={[styles.recTime, { color: c.text }]}>
                  {formatAudioDuration(recordMs)}
                </Text>
                <View style={[styles.recTrack, { backgroundColor: c.border }]}>
                  <View
                    style={[
                      styles.recFill,
                      { backgroundColor: c.danger, width: `${Math.max(2, Math.round(recordLevel * 100))}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.recHint, { color: c.muted }]}>boton cuadrado para terminar</Text>
                <Focusable
                  onPress={onCancelAudio}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar grabacion"
                >
                  <Icon name="close" size={13} color={c.muted} />
                </Focusable>
              </View>
            )
          : null}
        {!recording && audio
          ? (
              <View style={styles.audioRow}>
                <View style={[styles.queueChip, { borderColor: c.border }]}>
                  <Icon name="mic" size={11} color={c.accent} />
                  <Text style={[styles.queueText, { color: c.text }]}>
                    {busy
                      ? 'transcribiendo...'
                      : `audio ${formatAudioDuration(audio.durationMs)} · ${formatSize(audio.bytes)}`}
                  </Text>
                  <Focusable
                    onPress={() => {
                      void playFile(audio.path).catch((error: unknown) => {
                        Alert.alert(
                          'No se pudo reproducir',
                          error instanceof Error ? error.message : String(error),
                        );
                      });
                    }}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Reproducir audio"
                  >
                    <Icon name="play" size={12} color={c.muted} />
                  </Focusable>
                  <Focusable
                    onPress={onCancelAudio}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Quitar audio"
                  >
                    <Icon name="close" size={12} color={c.muted} />
                  </Focusable>
                </View>
              </View>
            )
          : null}
        {attachMenu && !state.isStreaming
          ? (
              <View
                style={[
                  styles.attachMenu,
                  { backgroundColor: c.surface, borderColor: c.border },
                ]}
              >
                <Focusable
                  onPress={() => {
                    setAttachMenu(false);
                    onPickImage();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Adjuntar imagen"
                  style={styles.attachItem}
                >
                  <Icon name="image" size={18} color={c.text} />
                </Focusable>
                <Focusable
                  onPress={() => {
                    setAttachMenu(false);
                    onPickFile();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Adjuntar archivo"
                  style={styles.attachItem}
                >
                  <Icon name="fileText" size={18} color={c.text} />
                </Focusable>
              </View>
            )
          : null}
        {overflow
          ? (
              <Text
                style={[
                  styles.limitHint,
                  { color: overflow.tooBig ? c.danger : c.muted, fontSize: layout.s(11) },
                ]}
                numberOfLines={2}
              >
                {overflow.tooBig
                  ? `${overflow.chars} chars (${formatBytes(overflow.bytes)}) no entran: tope ${promptLimit.maxChars} chars / ${formatBytes(promptLimit.maxBytes)}. Parte el mensaje.`
                  : `${overflow.chars} chars pasan el tope de ${promptLimit.maxChars}: se envia como .txt de ${formatBytes(overflow.bytes)}.`}
              </Text>
            )
          : null}
        <View style={styles.composerRow}>
          <Focusable
            onPress={() => setAttachMenu(current => !current)}
            disabled={state.isStreaming}
            accessibilityRole="button"
            accessibilityLabel="Adjuntar"
            accessibilityState={{ expanded: attachMenu }}
            style={[
              styles.attach,
              {
                borderColor: attachMenu ? c.accent : c.border,
                opacity: state.isStreaming ? 0.35 : 1,
              },
            ]}
          >
            <Icon
              name="plus"
              size={19}
              color={attachMenu ? c.accent : (state.isStreaming ? c.muted : c.text)}
              strokeWidth={2.1}
            />
          </Focusable>
          <TextInput
            value={text}
            onChangeText={setText}
            onFocus={onInputFocus}
            placeholder="Escribe..."
            placeholderTextColor={c.muted}
            multiline
            style={[
              styles.input,
              {
                color: c.text,
                backgroundColor: c.surface,
                borderColor: c.border,
                fontSize: layout.s(15),
              },
            ]}
          />
          {state.isStreaming && text.trim().length > 0
            ? (
                <Focusable
                  onPress={onQueue}
                  accessibilityRole="button"
                  accessibilityLabel="Encolar mensaje"
                  style={[styles.button, { backgroundColor: c.accent }]}
                >
                  <Icon name="send" size={19} color={c.onAccent} strokeWidth={2} />
                </Focusable>
              )
            : null}
          <Focusable
            onPress={state.isStreaming ? stop : (recording || !canSend ? onMic : onSend)}
            accessibilityRole="button"
            accessibilityLabel={state.isStreaming
              ? 'Detener'
              : recording
                ? 'Terminar grabacion'
                : canSend
                  ? 'Enviar'
                  : 'Grabar audio'}
            hasTVPreferredFocus
            style={[
              styles.button,
              {
                backgroundColor: state.isStreaming || recording ? c.danger : c.accent,
                opacity: !state.isStreaming && !recording && !canSend ? 0.6 : 1,
              },
            ]}
          >
            <Icon
              name={state.isStreaming || recording ? 'stop' : (canSend ? 'send' : 'mic')}
              size={state.isStreaming || recording ? 13 : 19}
              color={c.onAccent}
              strokeWidth={2.3}
            />
          </Focusable>
        </View>
      </View>

      {toast
        ? (
            <Focusable
              onPress={() => setToast(null)}
              accessibilityRole="alert"
              accessibilityLabel={toast}
              style={[styles.toast, { backgroundColor: c.surface, borderColor: c.danger }]}
            >
              <Icon name="info" size={15} color={c.danger} />
              <Text style={[styles.toastText, { color: c.text }]} numberOfLines={4}>{toast}</Text>
            </Focusable>
          )
        : null}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  small: {
    fontSize: 12,
  },
  action: {
    fontSize: 13,
  },
  headerAction: {
    marginRight: 18,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 19,
    elevation: 11,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '74%',
    maxWidth: 320,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 20,
    elevation: 12,
  },
  sidebarHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sidebarTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sidebarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarAction: {
    marginLeft: 16,
  },
  sidebarValue: {
    fontSize: 26,
    fontWeight: '700',
  },
  metricDualRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  metricDualCol: {
    flexShrink: 1,
  },
  metricDualRight: {
    alignItems: 'flex-end',
    paddingLeft: 10,
  },
  metricDualHintRight: {
    textAlign: 'right',
  },
  sidebarHint: {
    fontSize: 11,
    marginTop: 2,
  },
  bar: {
    height: 8,
    marginTop: 8,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: {
    height: '100%',
  },
  metrics: {
    marginTop: 10,
    flexShrink: 1,
  },
  metricsContent: {
    paddingBottom: 28,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  metricLabel: {
    fontSize: 11,
  },
  metricTool: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    flexShrink: 1,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
  },
  toolHeadLabel: {
    fontSize: 9,
    letterSpacing: 0.4,
  },
  toolCell: {
    fontSize: 10,
    minWidth: 42,
    textAlign: 'right',
    marginLeft: 4,
  },
  toolTotalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
    paddingTop: 4,
  },
  skillHeaderFirst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 8,
  },
  skillHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  skillHeaderMeta: {
    fontSize: 10,
    marginLeft: 'auto',
  },
  metricError: {
    fontSize: 9,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  skillBody: {
    flex: 1,
    flexShrink: 1,
  },
  skillName: {
    fontSize: 11,
    fontWeight: '600',
  },
  skillDesc: {
    fontSize: 10,
    lineHeight: 13,
    marginTop: 1,
  },
  skillEmpty: {
    fontSize: 10,
    marginTop: 3,
  },
  welcome: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  list: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  jump: {
    position: 'absolute',
    left: '50%',
    marginLeft: -19,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 14,
    elevation: 14,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  error: {
    paddingHorizontal: 8,
    paddingBottom: 4,
    fontSize: 12,
  },
  composer: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  limitHint: {
    paddingHorizontal: 8,
  },
  toast: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    elevation: 13,
    zIndex: 21,
  },
  toastText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  queue: {
    gap: 4,
    marginBottom: 6,
  },
  commands: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingVertical: 2,
  },
  command: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  commandName: {
    fontSize: 12,
    fontWeight: '700',
  },
  commandHint: {
    flex: 1,
    fontSize: 11,
  },
  queueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  queueHead: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  queueLabelBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  queueLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  queueTextWrap: {
    flex: 1,
  },
  queueText: {
    fontSize: 11,
  },
  recBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 6,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recTime: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  recTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  recFill: {
    height: 4,
    borderRadius: 2,
  },
  recHint: {
    fontSize: 11,
  },
  audioRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attach: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 22,
  },
  attachMenu: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 2,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
  },
  attachItem: {
    width: 40,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    flex: 1,
    fontSize: 12,
  },
  chipClose: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 128,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  headerIcon: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  icon: {
    fontSize: 20,
    fontWeight: '700',
  },
});
