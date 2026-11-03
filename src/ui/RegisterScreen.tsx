import React, { useCallback, useState } from 'react';
import { Keyboard, StyleSheet, Text } from 'react-native';

import { STUDIO_BASE_URL, authMessage, registrarUsuario } from '../auth/api';
import { normalizeEmail, normalizeName, normalizePhone } from '../auth/normalize';
import { getAuth, setAuth } from '../settings/store';
import { useTheme } from './theme';
import { AuthLayout } from './auth/Layout';
import { Button, Field, Notice } from './auth/Field';
import { PhoneField } from './auth/PhoneField';

type Errors = { name?: string; phone?: string; email?: string };

/** Crea la cuenta en el Studio API y entra directo con el token que devuelve. */
export function RegisterScreen({
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

  const [name, setName] = useState(stored.name);
  const [phone, setPhone] = useState(stored.phone);
  const [email, setEmail] = useState(stored.email);

  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<{ tone: 'ok' | 'bad' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const onRegister = useCallback(() => {
    if (busy) {
      return;
    }
    const cleanName = normalizeName(name);
    const cleanPhone = normalizePhone(phone);
    const cleanEmail = normalizeEmail(email);
    setErrors({
      name: cleanName.error || undefined,
      phone: cleanPhone.error || undefined,
      email: cleanEmail.error || undefined,
    });
    if (cleanName.error || cleanPhone.error || cleanEmail.error) {
      return;
    }
    Keyboard.dismiss();
    setNotice(null);
    setBusy(true);
    const baseUrl = stored.baseUrl || STUDIO_BASE_URL;
    void registrarUsuario(baseUrl, {
      nombre: cleanName.value,
      whatsapp: cleanPhone.value,
      email: cleanEmail.value || undefined,
    })
      .then((token) => {
        setAuth({
          baseUrl,
          token,
          name: cleanName.value,
          phone: cleanPhone.value,
          email: cleanEmail.value,
        });
        onDone();
      })
      .catch((failure: unknown) => {
        setNotice({ tone: 'bad', text: authMessage(failure) });
      })
      .finally(() => setBusy(false));
  }, [busy, email, name, onDone, phone, stored.baseUrl]);

  return (
    <AuthLayout
      title=""
      subtitle=""
      logo
      onBack={onCancel}
      footer={
        <Text style={[styles.footerText, { color: c.muted }]}>
          ¿Ya tenes llave?{' '}
          <Text style={{ color: c.accent }} onPress={onLogin}>
            Entrar con Llave
          </Text>
        </Text>
      }
    >
      {notice ? <Notice tone={notice.tone} text={notice.text} /> : null}

      <Field
        label="Nombre"
        value={name}
        onChangeText={(value) => {
          setName(value);
          setErrors(current => ({ ...current, name: undefined }));
        }}
        placeholder=""
        autoCapitalize="words"
        autoCorrect={false}
        error={errors.name}
      />
      <PhoneField
        value={phone}
        onChange={value => {
          setPhone(value);
          setErrors(current => ({ ...current, phone: undefined }));
        }}
        error={errors.phone}
        hint=""
      />
      <Field
        label="Correo (opcional)"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setErrors(current => ({ ...current, email: undefined }));
        }}
        placeholder=""
        error={errors.email}
      />

      <Button
        label={busy ? 'Creando cuenta...' : 'Registrate gratis'}
        onPress={onRegister}
        busy={busy}
        disabled={busy}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  legal: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});
