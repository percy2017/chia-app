import type { ChatMessage } from '../llm/types';

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getToolsConfig } from '../settings/store';
import { Icon } from './icons';
import { useTheme } from './theme';

const mono = 'monospace';

function rawText(message: ChatMessage | null, maxChars: number): string {
  if (!message) {
    return '';
  }
  const parts: string[] = [];
  if (message.reasoning) {
    parts.push(message.reasoning);
  }
  if (message.content) {
    parts.push(message.content);
  }
  for (const call of message.toolCalls ?? []) {
    const result = message.toolResults?.find(item => item.toolCallId === call.id);
    const command = result?.command ?? call.arguments;
    const label = call.name === 'web_fetch' ? command : `$ ${command}`;
    parts.push(label);
    if (result?.output) {
      parts.push(result.output);
    }
  }
  const full = parts.join('\n');
  // Solo la cola: lo ultimo es lo que importa y evita ScrollView gigantes.
  return full.length > maxChars ? `…${full.slice(full.length - maxChars)}` : full;
}

type IconName = import('./icons').IconName;

type Phase = 'enviando' | 'razonando' | 'herramienta' | 'respuesta';

const PHASES: Record<Phase, { icon: IconName; label: string }> = {
  enviando: { icon: 'arrowUp', label: 'enviando' },
  razonando: { icon: 'sparkles', label: 'razonando' },
  herramienta: { icon: 'terminal', label: 'herramienta' },
  respuesta: { icon: 'pencil', label: 'respuesta' },
};

function phaseOf(message: ChatMessage | null): Phase {
  if (!message) {
    return 'enviando';
  }
  // La fase mira la ULTIMA actividad, no el historial: una tool ya resuelta no
  // debe seguir etiquetando el turno como "herramienta".
  const pending = (message.toolCalls ?? []).some(
    call => !(message.toolResults ?? []).some(result => result.toolCallId === call.id),
  );
  if (pending) {
    return 'herramienta';
  }
  if (message.content) {
    return 'respuesta';
  }
  if (message.reasoning) {
    return 'razonando';
  }
  return 'enviando';
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
  return `${seconds}.${tenths}s`;
}


const TOOL_ICONS: Record<string, IconName> = {
  web_fetch: 'globe',
  read: 'fileText',
  write: 'pencil',
  edit: 'pencil',
  android_phone: 'phone',
  shell_exec: 'terminal',
};

/** Tool del modelo que todavia no tiene resultado: la que esta corriendo. */
function runningCall(message: ChatMessage | null) {
  const results = message?.toolResults ?? [];
  return (message?.toolCalls ?? []).find(
    call => !results.some(result => result.toolCallId === call.id),
  ) ?? null;
}

function Elapsed({ startedAt }: { startedAt: number }) {
  const { c } = useTheme();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.timerRow}>
      <Icon name="timer" size={10} color={c.muted} strokeWidth={2} />
      <Text style={[styles.timer, { color: c.muted }]}>
        {formatElapsed(Math.max(0, now - startedAt))}
      </Text>
    </View>
  );
}

export function StreamBlock({
  message,
}: {
  message: ChatMessage | null;
}) {
  const { c } = useTheme();
  const maxChars = Math.max(400, getToolsConfig().maxChars);
  const startedAt = React.useRef(Date.now()).current;
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const pulse = useRef(new Animated.Value(0.4)).current;
  const text = React.useMemo(() => rawText(message, maxChars), [message, maxChars]);
  const phase: Phase = phaseOf(message);
  const meta = PHASES[phase];
  const running = runningCall(message);
  const headIcon = running ? TOOL_ICONS[running.name] ?? 'terminal' : meta.icon;
  const headLabel = running ? running.name : meta.label;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <Animated.View style={[styles.dot, { backgroundColor: c.accent, opacity: pulse }]} />
        <Icon name={headIcon} size={12} color={c.accent} strokeWidth={2.2} />
        <Text style={[styles.label, { color: c.accent }]}>{headLabel}</Text>
      </View>
      <ScrollView
        ref={scroll}
        style={styles.scroll}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      >
        <Text selectable style={[styles.raw, { color: c.muted }]}>
          {text || '...'}
        </Text>
      </ScrollView>
      <Elapsed startedAt={startedAt} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  scroll: {
    maxHeight: 180,
  },
  raw: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: mono,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  timer: {
    fontSize: 10,
    fontFamily: mono,
    textAlign: 'right',
  },
});
