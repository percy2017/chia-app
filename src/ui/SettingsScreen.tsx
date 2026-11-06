
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
  Keyboard,
  Modal,
  PanResponder,
  ScrollView,
  SectionList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getSnapshot,
  setLlm,
  setTools,
  subscribe,
  updateSsh,
  updateVoice,
} from '../settings/store';
import { applyDoctorFixes, doctorSummary, runDoctor } from '../settings/doctor';
import type { DoctorCheck } from '../settings/doctor';
import { Icon } from './icons';
import type { IconName } from './icons';
import { useTheme } from './theme';

import { Focusable } from './Focusable';


type Draft = {
  systemPrompt: string;
  host: string;
  port: string;
  username: string;
  password: string;
  toolsMaxChars: string;
  toolsMaxBytesKb: string;
  voiceGender: string;
};

function draftFromStore(): Draft {
  const s = getSnapshot();
  return {
    systemPrompt: s.systemPrompt,
    host: s.ssh.host,
    port: String(s.ssh.port),
    username: s.ssh.username,
    password: s.ssh.password,
    toolsMaxChars: String(s.tools.maxChars),
    toolsMaxBytesKb: String(s.tools.maxBytesKb),
    voiceGender: s.voice.gender,
  };
}

type TextKey = {
  [K in keyof Draft]: Draft[K] extends string ? K : never;
}[keyof Draft];

type RowBase =
  | { kind: 'switch'; label: string; about: string; hint?: string; value: boolean; onChange: (value: boolean) => void }
  | { kind: 'area'; key: TextKey; label: string; about: string; placeholder?: string };

type CardField =
  | { kind: 'area'; key: TextKey; label: string; about?: string }
  | { kind: 'switch'; label: string; about?: string; value: boolean; onChange: (value: boolean) => void }
  | {
    kind: 'choice';
    label: string;
    about?: string;
    options: Array<{ value: string; label: string; hint?: string; icon: IconName }>;
    value: string;
    onSelect: (value: string) => void;
  }
  | {
    kind: 'triple';
    fields: [
      { key: TextKey; label: string; numeric?: boolean },
      { key: TextKey; label: string; numeric?: boolean },
      { key: TextKey; label: string; numeric?: boolean },
    ];
  }
  | {
    kind: 'tripleCtl';
    cells: CtlCell[];
  }
  | {
    kind: 'pair';
    left: { key: TextKey; label: string; numeric?: boolean; secure?: boolean; flex?: number };
    right: { key: TextKey; label: string; numeric?: boolean; secure?: boolean; flex?: number };
  }
  | {
    kind: 'pairSelectSwitch';
    select: {
      label: string;
      options: Array<{ value: string; label: string }>;
      value: string;
      onSelect: (value: string) => void;
    };
    toggle: { label: string; value: boolean; onChange: (value: boolean) => void };
  };

type CtlCell =
  | { kind: 'switch'; label: string; value: boolean; onChange: (value: boolean) => void }
  | {
    kind: 'select';
    label: string;
    options: Array<{ value: string; label: string }>;
    value: string;
    onSelect: (value: string) => void;
  };

type Row = RowBase | {
  kind: 'card';
  title?: string;
  /** Accion del header: icono a la derecha del titulo. */
  action?: { onPress: () => void; label: string };
  fields: CardField[];
};

type Section = { title: string; data: Row[] };

function FieldLabel({
  label,
  about,
  hint,
  color,
  muted,
}: {
  label: string;
  about?: string;
  hint?: string;
  color: string;
  muted: string;
}) {
  return (
    <>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color }]}>{label}</Text>
        {about ? (
          <Focusable
            onPress={() => Alert.alert(label, about)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Que hace ${label}`}
          >
            <Icon name="info" size={12} color={muted} />
          </Focusable>
        ) : null}
      </View>
      {hint ? <Text style={[styles.hint, { color: muted }]}>{hint}</Text> : null}
    </>
  );
}

const AREA_MIN = 172;
const AREA_MAX = 430;

const CardGap = () => <View style={styles.gap} />;

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [draft, setDraft] = useState<Draft>(draftFromStore);
  const [doctorOpen, setDoctorOpen] = useState(false);
  const [doctorChecks, setDoctorChecks] = useState<DoctorCheck[]>([]);
  const [doctorRunning, setDoctorRunning] = useState(false);
  const [doctorFixed, setDoctorFixed] = useState(0);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [picker, setPicker] = useState<{
    title: string;
    options: Array<{ value: string; label: string }>;
    value: string;
    onSelect: (value: string) => void;
  } | null>(null);

  const [keyboard, setKeyboard] = useState(0);
  const [areaHeights, setAreaHeights] = useState<Record<string, number>>({});
  const areaHeightsRef = useRef(areaHeights);
  areaHeightsRef.current = areaHeights;
  const areaStartRef = useRef<Record<string, number>>({});
  const areaResponders = useRef<Record<string, ReturnType<typeof PanResponder.create>>>({});

  /** Handle de arrastre en la esquina inferior izquierda del textarea. */
  const areaResponder = useCallback((key: TextKey) => {
    const existing = areaResponders.current[key];
    if (existing) {
      return existing;
    }
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        areaStartRef.current[key] = areaHeightsRef.current[key] ?? AREA_MIN;
      },
      onPanResponderMove: (_event, gesture) => {
        const start = areaStartRef.current[key] ?? AREA_MIN;
        const next = Math.min(AREA_MAX, Math.max(AREA_MIN, start + gesture.dy));
        setAreaHeights(prev => ({ ...prev, [key]: next }));
      },
    });
    areaResponders.current[key] = responder;
    return responder;
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboard(event.endCoordinates.height);
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
    });
    return () => subscription.remove();
  }, []);

  const bottom = keyboard > 0 ? keyboard + insets.bottom : insets.bottom;

  const onInputFocus = useCallback(() => {
    setKeyboard(Keyboard.metrics()?.height ?? 0);
  }, []);

  const patch = useCallback((values: Partial<Draft>) => {
    setDraft(current => ({ ...current, ...values }));
  }, []);

  /** Valida y guarda la seccion completa: prompt, tools y voz. */
  const onSaveAgent = useCallback(() => {
    const fail = (error: string) => Alert.alert('Agente', error);

    const toolsMaxChars = Number(draft.toolsMaxChars);
    const toolsMaxBytesKb = Number(draft.toolsMaxBytesKb);

    if (!Number.isInteger(toolsMaxChars) || toolsMaxChars < 200) {
      fail('Max caracteres debe ser un entero mayor o igual a 200.');
      return;
    }
    if (!Number.isInteger(toolsMaxBytesKb) || toolsMaxBytesKb < 1) {
      fail('Max bytes debe ser un entero mayor o igual a 1 KB.');
      return;
    }

    setLlm({ systemPrompt: draft.systemPrompt });
    setTools({
      maxChars: toolsMaxChars,
      maxBytesKb: toolsMaxBytesKb,
    });
    const gender = draft.voiceGender === 'hombre' ? 'hombre' : 'mujer';
    updateVoice({ gender, idioma: getSnapshot().voice.idioma || 'es' });
    setDraft(current => ({
      ...current,
      toolsMaxChars: String(toolsMaxChars),
      toolsMaxBytesKb: String(toolsMaxBytesKb),
      voiceGender: gender,
    }));
    Alert.alert('Guardado', 'Agente actualizado.');
  }, [draft.systemPrompt, draft.toolsMaxBytesKb, draft.toolsMaxChars, draft.voiceGender]);

  /** Valida y guarda solo la seccion SSH. */
  const onSaveSsh = useCallback(() => {
    const fail = (error: string) => {
      Alert.alert('Hosting Web', error);
    };
    const host = draft.host.trim();
    const username = draft.username.trim();
    const port = Number(draft.port);

    if (!host) {
      fail('Falta el host.');
      return;
    }
    if (/s/.test(host)) {
      fail('El host no puede tener espacios.');
      return;
    }
    if (!username) {
      fail('Falta el usuario SSH.');
      return;
    }
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      fail('El puerto debe ser un entero entre 1 y 65535.');
      return;
    }
    updateSsh({ host, port, username, password: draft.password });
    setDraft(current => ({
      ...current,
      host,
      username,
      port: String(port),
    }));
    Alert.alert('Guardado', 'Hosting Web actualizado.');
  }, [draft]);

  /** Ejecuta el doctor: pruebas de red + revisiones de configuracion. */
  const runDoctorChecks = useCallback(() => {
    setDoctorRunning(true);
    void runDoctor()
      .then(checks => setDoctorChecks(checks))
      .catch((error: unknown) => {
        setDoctorChecks([{
          id: 'doctor',
          label: 'Doctor',
          status: 'error',
          detail: error instanceof Error ? error.message : String(error),
        }]);
      })
      .finally(() => setDoctorRunning(false));
  }, []);

  const openDoctor = useCallback(() => {
    setDoctorOpen(true);
    setDoctorFixed(0);
    runDoctorChecks();
  }, [runDoctorChecks]);

  /** Aplica los arreglos automaticos y refleja el resultado en el formulario. */
  const onDoctorFix = useCallback(() => {
    const applied = applyDoctorFixes(doctorChecks);
    setDoctorFixed(applied);
    setDoctorChecks(current => current.map(check => (check.fix
      ? { ...check, status: 'fixed' as const, detail: `corregido: ${check.fix.label}`, fix: undefined }
      : check)));
    setDraft(draftFromStore());
  }, [doctorChecks]);

  // Con el doctor abierto, al volver de Ajustes se revalida solo: si el
  // usuario ya activo el acceso, el error desaparece sin tocar "Revalidar".
  useEffect(() => {
    if (!doctorOpen) {
      return;
    }
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        runDoctorChecks();
      }
    });
    return () => subscription.remove();
  }, [doctorOpen, runDoctorChecks]);

  /** Recarga lo que detecta el lado nativo y la cache del doctor. */

  const sections = useMemo<Section[]>(() => [
    {
      title: '',
      data: [
        {
          kind: 'card',
          title: 'Configuracion base',
          action: { onPress: onSaveAgent, label: 'Actualizar' },
          fields: [
            {
              kind: 'area',
              key: 'systemPrompt',
              label: 'Instrucciones',
              about: '',
            },
            {
              kind: 'pair',
              left: { key: 'toolsMaxBytesKb', label: 'Max KB', numeric: true },
              right: { key: 'toolsMaxChars', label: 'Max chars', numeric: true },
            },
            {
              kind: 'choice',
              label: 'Generos',
              options: [
                { value: 'mujer', label: 'Mujer', hint: 'Norah · LatAm', icon: 'female' },
                { value: 'hombre', label: 'Hombre', hint: 'Juan Carlos · LatAm', icon: 'male' },
              ],
              value: draft.voiceGender,
              onSelect: value => patch({ voiceGender: value }),
            },
          ],
        },
        {
          kind: 'card',
          title: 'Acceso al Hosting web VPS',
          action: { onPress: onSaveSsh, label: 'Actualizar' },
          fields: [
            {
              kind: 'pair',
              left: { key: 'host', label: 'Host', flex: 3 },
              right: { key: 'port', label: 'Puerto', numeric: true, flex: 1 },
            },
            {
              kind: 'pair',
              left: { key: 'username', label: 'Usuario' },
              right: { key: 'password', label: 'Clave', secure: true },
            },
          ],
        },
      ],
    },
  ], [onSaveAgent, onSaveSsh, patch]);

  const renderField = useCallback((field: CardField, index: number) => {
    const line = null;
    if (field.kind === 'switch') {
      return (
        <View key={`f-${index}`}>
          {line}
          <View style={styles.cardRow}>
            <View style={styles.labelCol}>
              <Text style={[styles.cardLabel, { color: c.muted }]}>{field.label}</Text>
              {field.about
                ? <Text style={[styles.cardHint, { color: c.muted }]}>{field.about}</Text>
                : null}
            </View>
            <Switch
              value={field.value}
              onValueChange={field.onChange}
              trackColor={{ true: c.accent, false: c.border }}
              thumbColor={c.onAccent}
            />
          </View>
        </View>
      );
    }
    if (field.kind === 'choice') {
      return (
        <View key={`f-${index}`} style={styles.choiceWrap}>
          <Text style={[styles.cardLabel, { color: c.muted }]}>{field.label}</Text>
          {field.about
            ? <Text style={[styles.cardHint, { color: c.muted }]}>{field.about}</Text>
            : null}
          <View style={styles.choiceRow}>
            {field.options.map((option) => {
              const active = option.value === field.value;
              const tint = active ? c.accent : c.muted;
              return (
                <Focusable
                  key={option.value}
                  onPress={() => field.onSelect(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.label}
                  style={[
                    styles.choiceCard,
                    {
                      borderColor: active ? c.accent : c.border,
                      backgroundColor: active ? c.surface : 'transparent',
                    },
                  ]}
                >
                  <Icon name={option.icon} size={20} color={tint} strokeWidth={1.9} />
                  <Text style={[styles.choiceLabel, { color: tint }]}>{option.label}</Text>
                  {option.hint
                    ? (
                        <Text style={[styles.choiceHint, { color: c.muted }]} numberOfLines={2}>
                          {option.hint}
                        </Text>
                      )
                    : null}
                </Focusable>
              );
            })}
          </View>
        </View>
      );
    }
    if (field.kind === 'tripleCtl') {
      return (
        <View key={`f-${index}`} style={styles.cardRow}>
          {field.cells.map((cell, cellIndex) => (
            <View key={`c-${cellIndex}`} style={styles.pairCol}>
              <Text style={[styles.cardLabel, { color: c.muted }]} numberOfLines={2}>
                {cell.label}
              </Text>
              {cell.kind === 'switch' ? (
                <Switch
                  value={cell.value}
                  onValueChange={cell.onChange}
                  trackColor={{ true: c.accent, false: c.border }}
                  thumbColor={c.onAccent}
                />
              ) : (
                <Focusable
                  onPress={() => setPicker({
                    title: cell.label,
                    options: cell.options,
                    value: cell.value,
                    onSelect: cell.onSelect,
                  })}
                  accessibilityRole="button"
                  accessibilityLabel={`${cell.label}: ${cell.value}`}
                >
                  <Text style={[styles.value, { color: c.accent }]} numberOfLines={1}>
                    {cell.options.find(option => option.value === cell.value)?.label
                      ?? cell.value}
                  </Text>
                </Focusable>
              )}
            </View>
          ))}
        </View>
      );
    }
    if (field.kind === 'pairSelectSwitch') {
      return (
        <View key={`f-${index}`} style={styles.cardRow}>
          <Focusable
            onPress={() => setPicker({
              title: field.select.label,
              options: field.select.options,
              value: field.select.value,
              onSelect: field.select.onSelect,
            })}
            style={styles.pairCol}
            accessibilityRole="button"
            accessibilityLabel={`${field.select.label}: ${field.select.value}`}
          >
            <Text style={[styles.cardLabel, { color: c.muted }]}>{field.select.label}</Text>
            <Text style={[styles.value, { color: c.accent }]} numberOfLines={1}>
              {field.select.options.find(option => option.value === field.select.value)?.label
                ?? field.select.value}
            </Text>
          </Focusable>
          <View style={styles.pairCol}>
            <Text style={[styles.cardLabel, { color: c.muted }]}>{field.toggle.label}</Text>
            <Switch
              value={field.toggle.value}
              onValueChange={field.toggle.onChange}
              trackColor={{ true: c.accent, false: c.border }}
              thumbColor={c.onAccent}
            />
          </View>
        </View>
      );
    }
    if (field.kind === 'triple') {
      return (
        <View key={`f-${index}`} style={styles.cardRow}>
          {field.fields.map(item => (
            <View key={item.key} style={styles.pairCol}>
              <Text style={[styles.cardLabel, { color: c.muted }]}>{item.label}</Text>
              <View style={styles.cardInputRow}>
                <TextInput
                  onFocus={onInputFocus}
                  value={draft[item.key]}
                  onChangeText={value => patch({ [item.key]: value } as Partial<Draft>)}
                  placeholder=""
                  placeholderTextColor={c.muted}
                  keyboardType={item.numeric ? 'numeric' : 'default'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.cardInput, { color: c.text, borderColor: c.border }]}
                />
              </View>
            </View>
          ))}
        </View>
      );
    }
    if (field.kind === 'pair') {
      return (
        <View key={`f-${index}`} style={styles.cardRow}>
          <View style={[styles.pairCol, { flex: field.left.flex ?? 1 }]}>
            <Text style={[styles.cardLabel, { color: c.muted }]}>{field.left.label}</Text>
            <View style={styles.cardInputRow}>
              <TextInput
                onFocus={onInputFocus}
                value={draft[field.left.key]}
                onChangeText={value => patch({ [field.left.key]: value } as Partial<Draft>)}
                placeholder=""
                placeholderTextColor={c.muted}
                keyboardType={field.left.numeric ? 'numeric' : 'default'}
                secureTextEntry={field.left.secure === true && !revealed[field.left.key]}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.cardInput, { color: c.text, borderColor: c.border }]}
              />
              {field.left.secure
                ? (
                    <Focusable
                      onPress={() => setRevealed(current => ({ ...current, [field.left.key]: !current[field.left.key] }))}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={revealed[field.left.key] ? 'Ocultar' : 'Mostrar'}
                    >
                      <Icon name={revealed[field.left.key] ? 'eyeOff' : 'eye'} size={14} color={c.muted} />
                    </Focusable>
                  )
                : null}
            </View>
          </View>
          <View style={[styles.pairCol, { flex: field.right.flex ?? 1 }]}>
            <Text style={[styles.cardLabel, { color: c.muted }]}>{field.right.label}</Text>
            <View style={styles.cardInputRow}>
              <TextInput
                onFocus={onInputFocus}
                value={draft[field.right.key]}
                onChangeText={value => patch({ [field.right.key]: value } as Partial<Draft>)}
                placeholder=""
                placeholderTextColor={c.muted}
                keyboardType={field.right.numeric ? 'numeric' : 'default'}
                secureTextEntry={field.right.secure === true && !revealed[field.right.key]}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.cardInput, { color: c.text, borderColor: c.border }]}
              />
              {field.right.secure
                ? (
                    <Focusable
                      onPress={() => setRevealed(current => ({ ...current, [field.right.key]: !current[field.right.key] }))}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={revealed[field.right.key] ? 'Ocultar' : 'Mostrar'}
                    >
                      <Icon name={revealed[field.right.key] ? 'eyeOff' : 'eye'} size={14} color={c.muted} />
                    </Focusable>
                  )
                : null}
            </View>
          </View>
        </View>
      );
    }
    if (field.kind === 'area') {
      const height = areaHeights[field.key] ?? AREA_MIN;
      return (
        <View key={`f-${index}`}>
          {line}
          <View style={styles.cardStack}>
            <Text style={[styles.cardLabel, { color: c.muted }]}>{field.label}</Text>
            {field.about
              ? <Text style={[styles.cardHint, { color: c.muted }]}>{field.about}</Text>
              : null}
            <View>
              <TextInput
                onFocus={onInputFocus}
                value={draft[field.key]}
                onChangeText={value => patch({ [field.key]: value } as Partial<Draft>)}
                placeholder=""
                placeholderTextColor={c.muted}
                multiline
                autoCapitalize="sentences"
                textAlignVertical="top"
                style={[
                  styles.cardArea,
                  { height, color: c.text, borderColor: c.border },
                ]}
              />
              <View
                style={styles.areaGrip}
                {...areaResponder(field.key).panHandlers}
                accessibilityLabel="Arrastra para cambiar el alto"
              >
                <View style={[styles.areaGripBar, { backgroundColor: c.muted }]} />
                <View style={[styles.areaGripBar, { backgroundColor: c.muted }]} />
              </View>
            </View>
          </View>
        </View>
      );
    }
  }, [areaHeights, areaResponder, c, draft, onInputFocus, patch, revealed]);

  const renderRow = useCallback(({ item }: { item: Row }) => {
    if (item.kind === 'card') {
      return (
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          {item.title
            ? (
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: c.accent }]}>{item.title}</Text>
                  {item.action
                    ? (
                        <Focusable
                          onPress={item.action.onPress}
                          hitSlop={12}
                          accessibilityRole="button"
                          accessibilityLabel={item.action.label}
                          style={({ pressed }) => [styles.cardHeaderAction, { opacity: pressed ? 0.6 : 1 }]}
                        >
                          <Icon name="refresh" size={14} color={c.accent} strokeWidth={1.9} />
                        </Focusable>
                      )
                    : null}
                </View>
              )
            : null}
          {item.fields.map(renderField)}
        </View>
      );
    }
    if (item.kind === 'area') {
      return (
        <View style={styles.areaRow}>
          <FieldLabel
            label={item.label}
            about={item.about}
            color={c.text}
            muted={c.muted}
          />
          <TextInput
            onFocus={onInputFocus}
            value={draft[item.key]}
            onChangeText={value => patch({ [item.key]: value } as Partial<Draft>)}
            placeholder=""
            placeholderTextColor={c.muted}
            multiline
            autoCapitalize="sentences"
            textAlignVertical="top"
            style={[styles.area, { color: c.text, borderColor: c.border }]}
          />
        </View>
      );
    }

    if (item.kind === 'switch') {
      return (
        <View style={styles.row}>
          <View style={styles.labelCol}>
            <FieldLabel
              label={item.label}
              about={item.about}
              hint={item.hint}
              color={c.text}
              muted={c.muted}
            />
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onChange}
            trackColor={{ true: c.accent, false: c.border }}
            thumbColor={c.onAccent}
          />
        </View>
      );
    }

  }, [c, draft, patch, renderField, revealed]);
  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: c.bg }]}
      edges={['top']}
    >
      <View style={[styles.root, { paddingBottom: bottom }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Focusable
          onPress={onClose}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Icon name="arrowLeft" size={18} color={c.text} />
        </Focusable>
        <Text style={[styles.title, { color: c.text }]}>Configuracion</Text>
        <Focusable
          onPress={openDoctor}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Doctor: validar configuracion"
          style={styles.headerAction}
        >
          <Icon name="stethoscope" size={17} color={c.text} />
        </Focusable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.kind}-${index}`}
        renderItem={renderRow}
        ItemSeparatorComponent={CardGap}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={doctorOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDoctorOpen(false)}
      >
        <Focusable style={styles.backdrop} focusable={false} onPress={() => setDoctorOpen(false)}>
          <Focusable
            style={[styles.sheet, { backgroundColor: c.bg, borderColor: c.border }]}
            focusable={false}
            onPress={() => {}}
          >
            <View style={styles.doctorHead}>
              <Icon name="stethoscope" size={15} color={c.accent} />
              <Text style={[styles.sheetTitle, styles.doctorTitle, { color: c.muted }]}>Doctor</Text>
              <Focusable
                onPress={() => setDoctorOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Cerrar doctor"
              >
                <Icon name="close" size={14} color={c.muted} />
              </Focusable>
            </View>

            {doctorRunning
              ? (
                  <Text style={[styles.hint, styles.doctorHint, { color: c.muted }]}>
                    validando LLM, SSH, voz, CRM y acceso a notificaciones...
                  </Text>
                )
              : (
                  <Text style={[styles.hint, styles.doctorHint, { color: c.muted }]}>
                    {doctorSummary(doctorChecks).ok} ok ·{' '}
                    {doctorSummary(doctorChecks).warnings} avisos ·{' '}
                    {doctorSummary(doctorChecks).errors} errores
                    {doctorFixed > 0 ? ` · ${doctorFixed} corregidos` : ''}
                  </Text>
                )}

            <ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled">
              {doctorChecks.map(check => (
                <View key={check.id} style={styles.doctorRow}>
                  <View
                    style={[
                      styles.doctorDot,
                      {
                        backgroundColor: check.status === 'error'
                          ? c.danger
                          : check.status === 'warn'
                            ? '#f59e0b'
                            : c.accent,
                      },
                    ]}
                  />
                  <View style={styles.labelCol}>
                    <Text style={[styles.label, { color: c.text }]}>{check.label}</Text>
                    <Text style={[styles.hint, { color: c.muted }]}>{check.detail}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.doctorActions, { borderTopColor: c.border }]}>
              <Focusable
                onPress={onDoctorFix}
                disabled={doctorRunning || doctorSummary(doctorChecks).fixable === 0}
                accessibilityRole="button"
                accessibilityLabel="Corregir configuracion"
              >
                <Text
                  style={[
                    styles.value,
                    {
                      color: doctorRunning || doctorSummary(doctorChecks).fixable === 0
                        ? c.muted
                        : c.accent,
                    },
                  ]}
                >
                  {`Corregir (${doctorSummary(doctorChecks).fixable})`}
                </Text>
              </Focusable>
              <Focusable
                onPress={runDoctorChecks}
                disabled={doctorRunning}
                accessibilityRole="button"
                accessibilityLabel="Revalidar"
              >
                <Text style={[styles.value, { color: doctorRunning ? c.muted : c.text }]}>
                  Revalidar
                </Text>
              </Focusable>
            </View>
          </Focusable>
        </Focusable>
      </Modal>

      <Modal
        visible={picker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPicker(null)}
      >
        <Focusable style={styles.backdrop} focusable={false} onPress={() => setPicker(null)}>
          <Focusable
            style={[styles.sheet, { backgroundColor: c.bg, borderColor: c.border }]}
            focusable={false}
            onPress={() => {}}
          >
            <Text style={[styles.sheetTitle, { color: c.muted }]}>
              {picker?.title ?? ''}
            </Text>
            <ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled">
              {(picker?.options ?? []).map((option, index) => {
                const active = option.value === picker?.value;
                return (
                  <Focusable
                    key={option.value}
                    hasTVPreferredFocus={index === 0}
                    onPress={() => {
                      picker?.onSelect(option.value);
                      setPicker(null);
                    }}
                    style={styles.sheetRow}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.sheetOption,
                        { color: active ? c.accent : c.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {active ? <Icon name="check" size={14} color={c.accent} /> : null}
                  </Focusable>
                );
              })}
            </ScrollView>
          </Focusable>
        </Focusable>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '70%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 10,
  },
  sheetTitle: {
    paddingHorizontal: 10,
    paddingBottom: 6,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sheetList: {
    flexGrow: 0,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  sheetOption: {
    fontSize: 14,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  gap: {
    height: 10,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 2,
  },
  cardTitle: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  cardHeaderAction: {
    padding: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 1,
  },
  pairCol: {
    flex: 1,
    gap: 5,
  },
  cardStack: {
    gap: 4,
    paddingVertical: 8,
  },
  cardLabel: {
    fontSize: 11,
  },
  choiceWrap: {
    paddingVertical: 8,
    gap: 6,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  choiceLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  choiceHint: {
    fontSize: 10,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardHint: {
    fontSize: 11,
    lineHeight: 15,
  },
  cardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  cardInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  cardArea: {
    fontSize: 13,
    lineHeight: 18,
    height: 172,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    marginTop: 2,
  },
  areaGrip: {
    position: 'absolute',
    left: 6,
    bottom: 4,
    width: 34,
    height: 18,
    justifyContent: 'center',
    gap: 3,
  },
  areaGripBar: {
    height: 1.5,
    borderRadius: 1,
    width: 14,
    opacity: 0.7,
  },
  cardActionWrap: {
    paddingTop: 10,
    paddingBottom: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 30,
    paddingVertical: 2,
  },
  labelCol: {
    flexShrink: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontSize: 13,
  },
  hint: {
    fontSize: 10.5,
  },
  valueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 0,
    fontSize: 13,
  },
  areaRow: {
    paddingVertical: 4,
    gap: 3,
  },
  area: {
    minHeight: 96,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 13,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
  },
  doctorHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  doctorTitle: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  doctorHint: {
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  doctorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 6,
  },
  doctorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
