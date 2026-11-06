import React, { useCallback, useState } from 'react';
import { Keyboard, StyleSheet, Text } from 'react-native';

import { STUDIO_BASE_URL, authMessage, normalizeToken, verificarToken } from '../auth/api';
import { normalizeBaseUrl } from '../auth/normalize';
import { getAuth, setAuth } from '../settings/store';
import { useTheme } from './theme';
import { AuthLayout } from './auth/Layout';
import { Button, Field, Notice } from './auth/Field';

import { Focusable } from './Focusable';


export function LoginScreen({
  onDone,
  onRegister,
  onRecover,
  onCancel,
}: {
  onDone: () => void;
  onRegister: () => void;
  onRecover: () => void;
  onCancel?: () => void;
}) {
  const { c } = useTheme();
  const stored = getAuth();

  const [baseUrl, setBaseUrl] = useState(stored.baseUrl || STUDIO_BASE_URL);
  const [token, setToken] = useState(stored.token);
  const [errors, setErrors] = useState<{ baseUrl?: string; token?: string }>({});
  const [notice, setNotice] = useState<{ tone: 'ok' | 'bad' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const onEnter = useCallback(() => {
    if (busy) {
      return;
    }
    const base = normalizeBaseUrl(baseUrl);
    const clean = normalizeToken(token);
    setErrors({
      baseUrl: base.error || undefined,
      token: clean.error || undefined,
    });
    if (base.error || clean.error) {
      return;
    }
    Keyboard.dismiss();
    setNotice(null);
    setBusy(true);
    void verificarToken(clean.value, base.value)
      .then(() => {
        setAuth({ token: clean.value, baseUrl: base.value });
        onDone();
      })
      .catch((failure: unknown) => {
        setNotice({ tone: 'bad', text: authMessage(failure) });
      })
      .finally(() => setBusy(false));
  }, [baseUrl, busy, onDone, token]);

  return (
    <AuthLayout
      title=""
      logo
      subtitle=""
      onBack={onCancel}
      footer={
        <Focusable onPress={onRegister} style={styles.link}>
          <Text style={[styles.footerText, { color: c.muted }]}>
            ¿No tenes cuenta?{' '}
            <Text style={{ color: c.accent }}>Registrate gratis</Text>
          </Text>
        </Focusable>
      }
    >
      {notice ? <Notice tone={notice.tone} text={notice.text} /> : null}

      <Field
        label="Servidor"
        value="https://studio.percyalvarez.lat"
        onChangeText={(value) => {
          setBaseUrl(value);
          setErrors(current => ({ ...current, baseUrl: undefined }));
        }}
        placeholder={STUDIO_BASE_URL}
        error={errors.baseUrl}
        hint=""
      />

      <Field
        label="Llave"
        value={token}
        onChangeText={(value) => {
          setToken(value);
          setErrors(current => ({ ...current, token: undefined }));
        }}
        placeholder=""
        error={errors.token}
        hint=""
        secure
        maxLength={200}
      />

      <Button label="Entrar" onPress={onEnter} busy={busy} disabled={busy} />

      <Focusable onPress={onRecover} style={styles.link}>
        <Text style={[styles.recover, { color: c.muted }]}>
          ¿Olvidaste tu llave?{' '}
          <Text style={{ color: c.accent }}>Recuperar por WhatsApp</Text>
        </Text>
      </Focusable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  recover: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
  },
  link: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
});
