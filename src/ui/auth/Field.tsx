import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';

import { Focusable } from '../Focusable';
import { Icon } from '../icons';
import { useTheme } from '../theme';

/** Campo de las pantallas de acceso: label, input del tema y linea de error. */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  hint,
  secure = false,
  numeric = false,
  maxLength,
  autoCapitalize = 'none',
  autoCorrect = false,
  onFocus,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  secure?: boolean;
  numeric?: boolean;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  autoCorrect?: boolean;
  onFocus?: () => void;
  editable?: boolean;
}) {
  const { c } = useTheme();
  const [visible, setVisible] = useState(false);
  const keyboardType: KeyboardTypeOptions = numeric ? 'number-pad' : 'default';
  const borderColor = error ? c.danger : c.border;
  const input = (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onFocus={onFocus}
      placeholder={placeholder}
      placeholderTextColor={c.muted}
      secureTextEntry={secure && !visible}
      keyboardType={keyboardType}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      editable={editable}
      style={[
        styles.input,
        secure ? styles.inputInRow : null,
        { color: c.text, borderColor, backgroundColor: c.surface },
      ]}
    />
  );
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
      {secure
        ? (
            <View style={styles.row}>
              {input}
              <Focusable
                onPress={() => setVisible(current => !current)}
                hitSlop={10}
                style={styles.eye}
                accessibilityRole="button"
                accessibilityLabel={visible ? 'Ocultar' : 'Mostrar'}
              >
                <Icon name={visible ? 'eyeOff' : 'eye'} size={16} color={c.muted} />
              </Focusable>
            </View>
          )
        : input}
      {error ? (
        <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: c.muted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Boton de las pantallas de acceso: `primary` lleno, `ghost` solo texto. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  busy = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  busy?: boolean;
}) {
  const { c } = useTheme();
  const off = disabled || busy;
  if (variant === 'ghost') {
    return (
      <Focusable
        onPress={onPress}
        disabled={off}
        style={styles.ghost}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={[styles.ghostText, { color: off ? c.muted : c.accent }]}>
          {busy ? '...' : label}
        </Text>
      </Focusable>
    );
  }
  const background = variant === 'danger' ? c.danger : c.accent;
  return (
    <Focusable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: background, opacity: off ? 0.45 : pressed ? 0.85 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.primaryText, { color: c.onAccent }]}>
        {busy ? 'Un momento...' : label}
      </Text>
    </Focusable>
  );
}

/** Aviso del flujo (PIN enviado, errores del servidor, cooldown). */
export function Notice({
  tone,
  text,
}: {
  tone: 'ok' | 'bad' | 'info';
  text: string;
}) {
  const { c } = useTheme();
  if (!text) {
    return null;
  }
  const color = tone === 'bad' ? c.danger : tone === 'ok' ? c.accent : c.muted;
  return (
    <View style={[styles.notice, { borderColor: color }]}>
      <Text style={[styles.noticeText, { color: tone === 'info' ? c.muted : color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputInRow: {
    flex: 1,
    paddingRight: 40,
  },
  eye: {
    position: 'absolute',
    right: 12,
    padding: 2,
  },
  hint: {
    fontSize: 11,
    marginTop: 5,
  },
  error: {
    fontSize: 11,
    marginTop: 5,
  },
  primary: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ghost: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostText: {
    fontSize: 13,
    fontWeight: '600',
  },
  notice: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 17,
  },
});
