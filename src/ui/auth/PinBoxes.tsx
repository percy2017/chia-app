import React, { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '../theme';

import { Focusable } from '../Focusable';

/**
 * PIN de 6 digitos como cajas OTP.
 *
 * Hay UN solo `TextInput` real, invisible: las cajas solo pintan los digitos.
 * Asi el autofill de SMS, el pegado y el backspace se comportan como en un
 * campo normal y no hay que mover el foco entre 6 inputs (fuente clasica de
 * bugs al borrar). Tocar cualquier caja enfoca el input.
 */
export function PinBoxes({
  value,
  onChange,
  onComplete,
  error,
  editable = true,
  autoFocus = false,
  length = 6,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Se llama al llegar a `length` digitos (auto-envio). */
  onComplete?: (value: string) => void;
  error?: string;
  editable?: boolean;
  autoFocus?: boolean;
  length?: number;
}) {
  const { c, dark } = useTheme();
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);

  const digits = value.slice(0, length).split('');
  const active = Math.min(digits.length, length - 1);
  const focused = editable;
  const boxBorder = (index: number) => {
    if (error) {
      return c.danger;
    }
    if (focused && index === active) {
      return c.accent;
    }
    return c.border;
  };

  return (
    <View>
      <Focusable
        onPress={() => input.current?.focus()}
        accessibilityRole="none"
        style={styles.row}
      >
        {Array.from({ length }, (_, index) => (
          <View
            key={index}
            style={[
              styles.box,
              {
                borderColor: boxBorder(index),
                backgroundColor: c.surface,
                borderWidth: index === active && focused ? 2 : StyleSheet.hairlineWidth * 2,
              },
            ]}
          >
            <Text style={[styles.digit, { color: c.text }]}>{digits[index] ?? ''}</Text>
            {index === active && focused && !digits[index] ? (
              <View style={[styles.caret, { backgroundColor: c.accent }]} />
            ) : null}
          </View>
        ))}

        <TextInput
          ref={input}
          value={value}
          onChangeText={text => {
            const clean = text.replace(/\D/g, '').slice(0, length);
            onChange(clean);
            if (onComplete && clean.length === length) {
              onComplete(clean);
            }
          }}
          keyboardType="number-pad"
          maxLength={length}
          editable={editable}
          autoFocus={autoFocus}
          caretHidden
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          // Fuera de la pantalla pero montado: mantiene el foco y el autofill.
          style={[styles.hidden, { color: dark ? '#000' : '#fff' }]}
          accessibilityLabel={`PIN de ${length} digitos`}
        />
      </Focusable>
      {error ? <Text style={[styles.error, { color: c.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: 24,
    fontWeight: '600',
  },
  caret: {
    position: 'absolute',
    width: 2,
    height: 22,
    borderRadius: 1,
    opacity: 0.7,
  },
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
    left: 0,
    bottom: 0,
  },
  error: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
});
