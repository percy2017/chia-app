import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

import { onDownloadProgress, updateNative } from '../update/native';
import type { UpdateInfo } from '../update/check';
import { Icon } from './icons';
import { useTheme } from './theme';

import { Focusable } from './Focusable';

type Phase = 'idle' | 'permission' | 'downloading' | 'ready' | 'done' | 'error';

function mb(bytes: number): string {
  if (!bytes || bytes <= 0) {
    return '';
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Aviso de version nueva: descarga el APK y abre el instalador de Android. */
export function UpdateModal({
  info,
  onLater,
  onSkip,
}: {
  info: UpdateInfo | null;
  onLater: () => void;
  onSkip: () => void;
}) {
  const { c } = useTheme();
  const [phase, setPhase] = useState<Phase>('idle');
  const [downloaded, setDownloaded] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (info) {
      setPhase('idle');
      setDownloaded(0);
      setTotal(info.bytes);
      setError('');
    }
  }, [info]);

  useEffect(() => {
    if (phase !== 'downloading') {
      return;
    }
    const off = onDownloadProgress((bytes, size) => {
      setDownloaded(bytes);
      if (size > 0) {
        setTotal(size);
      }
    });
    return off;
  }, [phase]);

  const install = useCallback(async () => {
    if (!info) {
      return;
    }
    const native = updateNative();
    try {
      setError('');
      if (!(await native.canInstall())) {
        await native.openInstallSettings();
        setPhase('permission');
        return;
      }
      setPhase('downloading');
      const apk = await native.download(info.url, info.sha256);
      setPhase('ready');
      await native.install(apk.path);
      setPhase('done');
    }
    catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
      setPhase('error');
    }
  }, [info]);

  if (!info) {
    return null;
  }

  const percent = total > 0 ? Math.min(1, downloaded / total) : 0;
  const busy = phase === 'downloading' || phase === 'ready';

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={info.obligatoria ? () => {} : onLater}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: c.bg, borderColor: c.border }]}>
          <View style={styles.head}>
            <View style={[styles.badge, { backgroundColor: `${c.accent}22` }]}>
              <Icon name="download" size={13} color={c.accent} />
            </View>
            <Text style={[styles.title, { color: c.text }]}>Actualizacion disponible</Text>
          </View>

          <Text style={[styles.meta, { color: c.muted }]}>
            {info.versionName ? `${info.versionName} · ` : ''}v{info.versionCode}
            {info.bytes > 0 ? ` · ${mb(info.bytes)}` : ''}
          </Text>

          {info.changelog
            ? (
                <Text style={[styles.changelog, { color: c.text }]} numberOfLines={6}>
                  {info.changelog}
                </Text>
              )
            : null}

          {phase === 'downloading'
            ? (
                <View style={styles.progressBox}>
                  <View style={[styles.track, { backgroundColor: c.surface }]}>
                    <View
                      style={[
                        styles.fill,
                        {
                          backgroundColor: c.accent,
                          width: `${Math.round(percent * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.meta, { color: c.muted }]}>
                    {total > 0
                      ? `Descargando ${Math.round(percent * 100)}% · ${mb(downloaded)} de ${mb(total)}`
                      : `Descargando ${mb(downloaded)}`}
                  </Text>
                </View>
              )
            : null}

          {phase === 'ready'
            ? (
                <Text style={[styles.meta, { color: c.muted }]}>
                  Verificado. Abriendo el instalador...
                </Text>
              )
            : null}

          {phase === 'permission'
            ? (
                <Text style={[styles.hint, { color: c.muted }]}>
                  Activa "Permitir desde esta fuente" para ChiaNative y toca Actualizar otra vez.
                </Text>
              )
            : null}

          {phase === 'done'
            ? (
                <Text style={[styles.hint, { color: c.muted }]}>
                  Confirma "Instalar" en el aviso de Android. La app se cierra sola y queda
                  actualizada.
                </Text>
              )
            : null}

          {phase === 'error'
            ? <Text style={[styles.hint, { color: c.danger }]}>{error}</Text>
            : null}

          {busy
            ? (
                <View style={styles.row}>
                  <ActivityIndicator size="small" color={c.accent} />
                  <Text style={[styles.meta, { color: c.muted }]}>No cierres la app</Text>
                </View>
              )
            : (
                <View style={styles.actions}>
                  {phase === 'done'
                    ? (
                        <Focusable
                          onPress={onLater}
                          style={({ pressed }) => [
                            styles.primary,
                            { backgroundColor: c.accent, opacity: pressed ? 0.7 : 1 },
                          ]}
                        >
                          <Text style={[styles.primaryText, { color: c.onAccent }]}>Entendido</Text>
                        </Focusable>
                      )
                    : (
                        <>
                          {!info.obligatoria
                            ? (
                                <Focusable
                                  onPress={onLater}
                                  style={({ pressed }) => [
                                    styles.ghost,
                                    { borderColor: c.border, opacity: pressed ? 0.6 : 1 },
                                  ]}
                                >
                                  <Text style={[styles.ghostText, { color: c.muted }]}>
                                    Despues
                                  </Text>
                                </Focusable>
                              )
                            : null}
                          <Focusable
                            onPress={() => void install()}
                            style={({ pressed }) => [
                              styles.primary,
                              { backgroundColor: c.accent, opacity: pressed ? 0.7 : 1 },
                            ]}
                          >
                            <Text style={[styles.primaryText, { color: c.onAccent }]}>
                              {phase === 'error' || phase === 'permission'
                                ? 'Reintentar'
                                : 'Actualizar'}
                            </Text>
                          </Focusable>
                        </>
                      )}
                </View>
              )}

          {!info.obligatoria && !busy && phase !== 'done'
            ? (
                <Focusable onPress={onSkip} hitSlop={8} accessibilityRole="button">
                  <Text style={[styles.skip, { color: c.muted }]}>
                    No volver a avisar de esta version
                  </Text>
                </Focusable>
              )
            : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 10,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  meta: {
    fontSize: 12,
  },
  changelog: {
    fontSize: 13,
    lineHeight: 19,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
  },
  progressBox: {
    gap: 6,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 4,
  },
  primary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ghost: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ghostText: {
    fontSize: 13,
    fontWeight: '600',
  },
  skip: {
    fontSize: 11,
    textAlign: 'center',
    paddingTop: 2,
  },
});
