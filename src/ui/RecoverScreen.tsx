import React, { useCallback, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';

import { STUDIO_BASE_URL, authMessage, confirmarPin, pedirPin } from '../auth/api';
import { normalizePhone, normalizePin } from '../auth/normalize';
import { getAuth, setAuth } from '../settings/store';
import { useTheme } from './theme';
import { AuthLayout } from './auth/Layout';
import { Button, Field, Notice } from './auth/Field';
import { PhoneField } from './auth/PhoneField';
import { PinBoxes } from './auth/PinBoxes';

import { Focusable } from './Focusable';

const PIN_LENGTH = 4;

/**
 * Recupera la llave del Studio API por WhatsApp: se pide un PIN de 4 digitos
 * (`/usuarios/recuperar-token`) y al confirmarlo (`/usuarios/confirmar-pin`)
 * se entra con la llave que devuelve el servidor.
 */
export function RecoverScreen({
  onLogin,
  onDone,
  onCancel,
}: {
  onLogin: () => void;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const { c } = useTheme();
  const stored = getAuth();

  const [step, setStep] = useState<'phone' | 'pin'>('phone');
  const [phone, setPhone] = useState(stored.phone);
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; pin?: string }>({});
  const [notice, setNotice] = useState<{ tone: 'ok' | 'bad' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const baseUrl = stored.baseUrl || STUDIO_BASE_URL;

  const onSend = useCallback(() => {
    if (busy) {
      return;
    }
    const clean = normalizePhone(phone);
    setErrors({ phone: clean.error || undefined });
    if (clean.error) {
      return;
    }
    Keyboard.dismiss();
    setNotice(null);
    setBusy(true);
    void pedirPin(clean.value, baseUrl)
      .then(() => {
        setPhone(clean.value);
        setPin('');
        setStep('pin');
        setNotice({
          tone: 'ok',
          text: `Te enviamos un PIN de ${PIN_LENGTH} digitos al WhatsApp ${clean.value}. Vale 24 horas.`,
        });
      })
      .catch((failure: unknown) => {
        setNotice({ tone: 'bad', text: authMessage(failure) });
      })
      .finally(() => setBusy(false));
  }, [baseUrl, busy, phone]);

  const onConfirm = useCallback(
    (value: string) => {
      if (busy) {
        return;
      }
      const cleanPin = normalizePin(value);
      const cleanPhone = normalizePhone(phone);
      setErrors({ pin: cleanPin.error || undefined, phone: cleanPhone.error || undefined });
      if (cleanPin.error || cleanPhone.error) {
        return;
      }
      Keyboard.dismiss();
      setNotice(null);
      setBusy(true);
      void confirmarPin(cleanPhone.value, cleanPin.value, baseUrl)
        .then((token) => {
          setAuth({ baseUrl, token, phone: cleanPhone.value });
          onDone();
        })
        .catch((failure: unknown) => {
          setPin('');
          setNotice({ tone: 'bad', text: authMessage(failure) });
        })
        .finally(() => setBusy(false));
    },
    [baseUrl, busy, onDone, phone],
  );

  return (
    <AuthLayout
      title=""
      subtitle=""
      logo
      onBack={onCancel}
      footer={
        <Focusable onPress={onLogin} style={styles.link}>
          <Text style={[styles.footerText, { color: c.muted }]}>
            ¿Ya tenes llave?{' '}
            <Text style={{ color: c.accent }}>Entrar con Llave</Text>
          </Text>
        </Focusable>
      }
    >
      {notice ? <Notice tone={notice.tone} text={notice.text} /> : null}

      {step === 'phone' ? (
        <>
          <PhoneField
            value={phone}
            onChange={(value) => {
              setPhone(value);
              setErrors(current => ({ ...current, phone: undefined }));
            }}
            error={errors.phone}
            hint="El numero con el que te registraste."
            editable={!busy}
          />
          <Button
            label="Enviar PIN por WhatsApp"
            onPress={onSend}
            busy={busy}
            disabled={busy}
          />
        </>
      ) : (
        <>
          <Field
            label="WhatsApp"
            value={phone}
            onChangeText={() => {}}
            editable={false}
            hint=""
          />
          <View style={styles.pinBlock}>
            <Text style={[styles.pinLabel, { color: c.muted }]}>PIN de {PIN_LENGTH} digitos</Text>
            <PinBoxes
              value={pin}
              onChange={(value) => {
                setPin(value);
                setErrors(current => ({ ...current, pin: undefined }));
              }}
              onComplete={onConfirm}
              error={errors.pin}
              editable={!busy}
              autoFocus
              length={PIN_LENGTH}
            />
          </View>
          <Button
            label="Recuperar llave"
            onPress={() => onConfirm(pin)}
            busy={busy}
            disabled={busy || pin.length !== PIN_LENGTH}
          />
          <Button
            label="Reenviar PIN"
            variant="ghost"
            onPress={onSend}
            disabled={busy}
          />
          <Button
            label="Cambiar numero"
            variant="ghost"
            onPress={() => {
              setStep('phone');
              setPin('');
              setErrors({});
              setNotice(null);
            }}
            disabled={busy}
          />
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  pinBlock: {
    marginBottom: 14,
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});
