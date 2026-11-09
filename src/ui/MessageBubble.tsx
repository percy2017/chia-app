import type { ChatImage, ChatMessage } from '../llm/types';

import Clipboard from '@react-native-clipboard/clipboard';
import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  audioSeconds,
  playingAudioId,
  preparingAudioId,
  setPreparingAudio,
  subscribeAudioSeconds,
  subscribeAudioState,
} from '../audio/meta';
import { playFile, speakMessage, stopAudio } from '../audio/player';
import { retry } from '../agent/controller';
import { Icon } from './icons';
import { ImageViewer } from './ImageViewer';
import { Markdown } from './Markdown';
import { useTheme } from './theme';

import { Focusable } from './Focusable';

function CopyButton({ value }: { value: string }) {
  const { c } = useTheme();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
  }, []);

  const onCopy = useCallback(() => {
    Clipboard.setString(value);
    setCopied(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <Focusable
      onPress={onCopy}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copiado' : 'Copiar'}
      style={styles.copy}
    >
      <Icon
        name={copied ? 'check' : 'copy'}
        size={14}
        color={copied ? c.accent : c.muted}
      />
    </Focusable>
  );
}

/** Lee la respuesta: primero el modelo escribe el guion, luego el servidor de voz. */
function ListenButton({
  id,
  text,
  seconds,
}: {
  id: string;
  text: string;
  seconds?: number;
}) {
  const { c } = useTheme();
  // "Sonando" y "generando" salen del estado global del audio: la voz manual
  // (boton) y la automatica (al cerrar el turno) mueven lo mismo.
  const active = useSyncExternalStore(
    subscribeAudioState,
    () => playingAudioId() === id,
  );
  const preparing = useSyncExternalStore(
    subscribeAudioState,
    () => preparingAudioId() === id,
  );
  const color = active ? c.accent : c.muted;

  useEffect(() => () => {
    if (playingAudioId() === id) {
      stopAudio();
    }
  }, [id]);

  const onPress = useCallback(() => {
    if (active) {
      stopAudio();
      return;
    }
    if (preparing) {
      return;
    }
    if (!text.trim()) {
      return;
    }
    setPreparingAudio(id);
    void speakMessage(id, text)
      .catch((error: unknown) => {
        Alert.alert('Audio', error instanceof Error ? error.message : String(error));
      })
      .finally(() => setPreparingAudio(''));
  }, [active, id, preparing, text]);

  return (
    <Focusable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Detener audio' : 'Escuchar respuesta'}
      style={styles.listen}
    >
      {preparing
        ? <ActivityIndicator size="small" color={c.accent} />
        : <Icon name={active ? 'stop' : 'volume'} size={active ? 12 : 14} color={color} />}
      {typeof seconds === 'number' && seconds > 0
        ? <Text style={[styles.stamp, { color }]}>{formatAudio(seconds)}</Text>
        : null}
    </Focusable>
  );
}

/** Duracion corta para las metricas del bloque: 820ms, 4.2s, 1m 5s. */
function formatMs(ms: number): string {
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
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `0:${String(seconds).padStart(2, '0')}`;
}

function formatStamp(value?: number): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  const now = new Date();
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
  const sameDay
    = date.getDate() === now.getDate()
    && date.getMonth() === now.getMonth()
    && date.getFullYear() === now.getFullYear();
  if (sameDay) {
    return time;
  }
  const day = `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`;
  return `${day} ${time}`;
}

/** Total de caracteres del mensaje, con separador de miles (1234 -> 1.234). */
function formatChars(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Segundos de audio -> 42 s / 1m 5s. */
function formatAudio(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest} s`;
}

function Footer({
  value,
  stamp,
  chars,
  audio,
  align,
  speakable,
  speakId,
}: {
  value: string;
  stamp?: string;
  chars?: number;
  audio?: number;
  align: 'left' | 'right';
  speakable?: boolean;
  speakId?: string;
}) {
  const { c } = useTheme();
  // Cada dato va separado con "|" y los botones cierran la fila.
  const data: React.ReactNode[] = [];
  if (stamp) {
    data.push(<Text key="stamp" style={[styles.stamp, { color: c.muted }]}>{stamp}</Text>);
  }
  if (typeof chars === 'number') {
    data.push(
      <Text key="chars" style={[styles.stamp, { color: c.muted }]}>
        {formatChars(chars)} chars
      </Text>,
    );
  }

  return (
    <View
      style={[
        styles.footer,
        align === 'right' ? styles.footerRight : null,
      ]}
    >
      {data.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0
            ? <Text style={[styles.footerSep, { color: c.muted }]}>|</Text>
            : null}
          {item}
        </React.Fragment>
      ))}
      {data.length > 0
        ? <Text style={[styles.footerSep, { color: c.muted }]}>|</Text>
        : null}
      {speakable
        ? <ListenButton id={speakId ?? ''} text={value} seconds={audio} />
        : null}
      {speakable
        ? <Text style={[styles.footerSep, { color: c.muted }]}>|</Text>
        : null}
      <CopyButton value={value} />
    </View>
  );
}

/**
 * Memoizado: durante el stream solo cambia el mensaje en curso, asi que el
 * resto de burbujas no se re-renderiza (ni re-parsea su markdown) en cada delta.
 */
/** Chip de audio del mensaje: reproduce la grabacion guardada en el telefono. */
function AudioChip({
  path,
  durationMs,
  isUser,
}: {
  path?: string;
  durationMs: number;
  isUser: boolean;
}) {
  const { c } = useTheme();
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const done = DeviceEventEmitter.addListener('AudioDone', () => {
      setPlaying(false);
      setBusy(false);
    });
    return () => done.remove();
  }, []);

  const onPress = useCallback(() => {
    if (playing || busy) {
      stopAudio();
      setPlaying(false);
      setBusy(false);
      return;
    }
    if (!path) {
      return;
    }
    setBusy(true);
    void playFile(path)
      .then(() => {
        setBusy(false);
        setPlaying(true);
      })
      .catch((error: unknown) => {
        setBusy(false);
        setPlaying(false);
        Alert.alert('Audio', error instanceof Error ? error.message : String(error));
      });
  }, [busy, path, playing]);

  return (
    <View style={[styles.audioChip, { borderColor: isUser ? c.accent : c.border }]}>
      <Focusable
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Detener audio' : 'Reproducir audio'}
      >
        {busy
          ? <ActivityIndicator size="small" color={isUser ? c.accent : c.text} />
          : (
              <Icon
                name={playing ? 'pause' : 'play'}
                size={14}
                color={isUser ? c.accent : c.text}
              />
            )}
      </Focusable>
      <Text style={[styles.audioLabel, { color: isUser ? c.accent : c.muted }]}>
        audio {formatDuration(durationMs)}
      </Text>
    </View>
  );
}

/** Archivo que el usuario registro en la memoria rag: solo se muestra, no se abre. */
function DocChip({
  name,
  chunks,
  pages,
  isUser,
}: {
  name: string;
  chunks: number;
  pages: number;
  isUser: boolean;
}) {
  const { c } = useTheme();
  const extra = pages > 0 ? `${pages} pag · ` : '';
  return (
    <View style={[styles.audioChip, { borderColor: isUser ? c.accent : c.border }]}>
      <Icon name="fileText" size={14} color={isUser ? c.accent : c.text} />
      <Text
        style={[styles.audioLabel, { color: isUser ? c.accent : c.muted, flexShrink: 1 }]}
        numberOfLines={1}
      >
        {name} · {extra}{chunks} fragmentos
      </Text>
    </View>
  );
}

function Thumb({
  uri,
  image,
  onPress,
}: {
  uri: string;
  image?: ChatImage;
  onPress: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const entera = image?.layout === 'contain';
  const proporcion = image?.width && image?.height ? image.height / image.width : 0.62;
  const estilo = entera
    ? [styles.image, {
        width: THUMB_WIDTH,
        height: Math.round(THUMB_WIDTH * proporcion),
        backgroundColor: '#000000',
      }]
    : [styles.image, { width: THUMB_WIDTH, height: THUMB_HEIGHT }];

  return (
    <Focusable
      onPress={onPress}
      style={({ pressed }) => [styles.thumb, pressed ? styles.thumbPressed : null]}
      accessibilityRole="imagebutton"
      accessibilityLabel={entera ? 'Abrir fotogramas del video' : 'Abrir imagen a pantalla completa'}
    >
      <Image
        source={{ uri }}
        style={estilo}
        resizeMode={entera ? 'contain' : 'cover'}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />
      {loading
        ? (
            <View style={styles.thumbOverlay} pointerEvents="none">
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          )
        : null}
      {failed
        ? (
            <View style={styles.thumbOverlay} pointerEvents="none">
              <Icon name="image" size={16} color="#ffffff" />
            </View>
          )
        : null}
      <View style={styles.thumbHint} pointerEvents="none">
        <Icon name="eye" size={11} color="#ffffff" />
      </View>
    </Focusable>
  );
}

export const MessageBubble = React.memo(function MessageBubble({ message }: { message: ChatMessage }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  // Respuesta: hasta el 80% desde la izquierda. Prompt: hasta el 80% desde la
  // derecha (la fila lo alinea con rowUser).
  const maxWidth = Math.max(200, width * 0.8);
  const isUser = message.role === 'user';
  const isSummary = message.kind === 'summary';
  const stamp = formatStamp(message.createdAt);
  const [openImage, setOpenImage] = useState<number | null>(null);
  const images = message.images ?? [];
  const activeImage = openImage !== null ? images[openImage] : undefined;
  // Segundos del audio del mensaje: la grabacion del usuario o lo que duro el
  // audio que devolvio el servidor de voz para esta respuesta.
  const playedAudio = useSyncExternalStore(
    subscribeAudioSeconds,
    () => audioSeconds(message.id),
  );
  const audioDuration = message.audio?.durationMs
    ? message.audio.durationMs / 1000
    : playedAudio;
  // Herramientas del turno (llamadas resueltas) y tiempo que consumieron.
  const toolsUsed = (message.toolResults ?? []).length;
  const toolsMs = (message.toolResults ?? []).reduce(
    (sum, result) => sum + (Number.isFinite(result.durationMs) ? result.durationMs : 0),
    0,
  );
  // Total del turno si esta medido; si no, lo que duraron las tools.
  const elapsedMs = message.durationMs ?? toolsMs;
  const stats = toolsUsed > 0
    ? `${toolsUsed} ${toolsUsed === 1 ? 'tool' : 'tools'} · ${formatMs(elapsedMs)}`
    : message.durationMs
      ? formatMs(message.durationMs)
      : '';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : null]}>
      <View
        style={[
          styles.block,
          { maxWidth },
          // La respuesta ocupa el 80% para que las metricas queden pegadas al
          // borde derecho; el prompt se ajusta a su texto.
          !isSummary && !isUser ? { width: maxWidth } : null,
          isSummary
            ? null
            : [styles.card, { backgroundColor: c.surface, borderColor: c.border }],
        ]}
      >
        {isSummary
          ? (
              <View style={[styles.summary, { borderColor: c.border }]}>
                <Icon name="gauge" size={12} color={c.muted} />
                <Text style={[styles.summaryText, { color: c.muted }]}>
                  contexto compactado
                </Text>
              </View>
            )
          : null}
        {isSummary
          ? null
          : (
              <View style={[styles.head, isUser ? styles.headRight : null]}>
                <Icon name={isUser ? 'user' : 'bot'} size={12} color={c.muted} />
                {stats
                  ? (
                      <>
                        <View style={styles.headSpacer} />
                        <Text style={[styles.headMeta, { color: c.muted }]}>{stats}</Text>
                      </>
                    )
                  : null}
              </View>
            )}
        {images.length
          ? (
              <View style={styles.images}>
                {images.map((image, index) => (
                  <Thumb
                    key={`${message.id}-image-${index}`}
                    uri={`data:${image.mimeType};base64,${image.data}`}
                    image={image}
                    onPress={() => setOpenImage(index)}
                  />
                ))}
              </View>
            )
          : null}

        <ImageViewer
          uri={activeImage
            ? `data:${activeImage.mimeType};base64,${activeImage.data}`
            : null}
          caption={images.length > 1 && openImage !== null
            ? `imagen ${openImage + 1} de ${images.length}`
            : undefined}
          onClose={() => setOpenImage(null)}
        />

        {message.audio
          ? <AudioChip path={message.audio.path} durationMs={message.audio.durationMs} isUser={isUser} />
          : null}

        {message.doc
          ? (
              <DocChip
                name={message.doc.name}
                chunks={message.doc.chunks}
                pages={message.doc.pages}
                isUser={isUser}
              />
            )
          : null}

        {message.content
          ? (
              <Markdown
                text={message.content}
                color={c.text}
              />
            )
          : null}

        {message.status === 'error' && message.error
          ? (
              <View style={styles.errorBox}>
                <Text style={[styles.error, { color: c.danger }]}>{message.error}</Text>
                <Focusable
                  onPress={() => {
                    void retry(message.id);
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Reintentar"
                  style={styles.retry}
                >
                  <Icon name="refresh" size={13} color={c.accent} strokeWidth={2} />
                  <Text style={[styles.retryText, { color: c.accent }]}>Reintentar</Text>
                </Focusable>
              </View>
            )
          : null}

        {message.content
          ? (
              <Footer
                value={message.content}
                stamp={stamp}
                chars={isUser || isSummary ? undefined : message.content.length}
                audio={isUser || isSummary ? undefined : audioDuration}
                align={isUser ? 'right' : 'left'}
                speakable={!isUser && message.status === 'done'}
                speakId={message.id}
              />
            )
          : null}
      </View>
    </View>
  );
});

const THUMB_WIDTH = 240;
const THUMB_HEIGHT = 160;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  block: {
    flexShrink: 1,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  summaryText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  audioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 6,
  },
  audioLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  images: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  thumb: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbPressed: {
    opacity: 0.75,
  },
  image: {
    borderRadius: 10,
  },
  thumbOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  thumbHint: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  error: {
    marginTop: 4,
    fontSize: 12,
  },
  errorBox: {
    gap: 6,
    marginTop: 4,
  },
  retry: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headRight: {
    justifyContent: 'flex-end',
  },
  headSpacer: {
    flex: 1,
  },
  headMeta: {
    fontSize: 10,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  copy: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  footerRight: {
    justifyContent: 'flex-end',
  },
  footerSep: {
    fontSize: 9,
  },
  listen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stamp: {
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
});
