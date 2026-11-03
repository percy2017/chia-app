import Clipboard from '@react-native-clipboard/clipboard';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authMessage } from '../auth/api';
import { fetchProfile, actualizarAvatar } from '../auth/profile';
import type { UserProfile } from '../auth/profile';
import { clearAuth, getAuth, setTheme } from '../settings/store';
import { Avatar } from './Avatar';
import { Icon } from './icons';
import type { IconName } from './icons';
import { useTheme } from './theme';
import type { ThemeMode } from './theme';

/** Los tres modos del tema, en el orden en que se muestran. */
const THEMES: Array<{ value: ThemeMode; label: string; icon: IconName }> = [
  { value: 'system', label: 'Sistema', icon: 'auto' },
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'dark', label: 'Oscuro', icon: 'moon' },
];

/** Entero con separador de miles: 32283515 -> 32.283.515. */
function formatInt(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return '0';
  }
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Fecha del API (ms) -> dd/mm/aaaa hh:mm. */
function formatDate(value?: number): string {
  if (!value || !Number.isFinite(value) || value <= 0) {
    return '—';
  }
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()} ${hours}:${minutes}`;
}

function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      {title
        ? (
            <Text style={[styles.cardTitle, { color: c.muted }]}>{title}</Text>
          )
        : null}
      {children}
    </View>
  );
}

function PlanMeter({ usado, tope }: { usado: number; tope: number }) {
  const { c } = useTheme();
  const pct = tope > 0 ? Math.max(0, Math.min(100, Math.round((usado / tope) * 100))) : 0;
  const color = pct >= 90 ? c.danger : c.accent;
  return (
    <View style={styles.meter}>
      <View style={styles.meterTop}>
        <Text style={[styles.statLabel, { color: c.muted }]}>Consumo de hoy</Text>
        <Text style={[styles.meterPct, { color }]}>{pct}%</Text>
      </View>
      <View style={[styles.meterTrack, { backgroundColor: c.border }]}>
        <View style={[styles.meterFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.meterHint, { color: c.muted }]}>
        {formatInt(usado)} de {formatInt(tope)} creditos del plan diario
      </Text>
    </View>
  );
}

function Row({
  label,
  value,
  onCopy,
  strong,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  strong?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View
      style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: c.muted }]}>{label}</Text>
        <Text
          style={[styles.rowValue, { color: c.text }, strong ? styles.rowStrong : null]}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
      {onCopy
        ? (
            <Pressable
              onPress={onCopy}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Copiar ${label}`}
            >
              <Icon name="copy" size={14} color={c.muted} />
            </Pressable>
          )
        : null}
    </View>
  );
}

export function ProfileScreen({
  onClose,
  onLoggedOut,
}: {
  onClose: () => void;
  onChangeSession?: () => void;
  onLoggedOut: () => void;
}) {
  const { c, mode } = useTheme();
  const auth = getAuth();
  const [revealed, setRevealed] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const config = getAuth();
    if (!config.baseUrl || !config.token) {
      setProfile(null);
      setError('Entra con tu token para ver el perfil y el consumo.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    void fetchProfile(config.baseUrl, config.token)
      .then(setProfile)
      .catch((failure: unknown) => setError(authMessage(failure)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefreshAvatar = useCallback(() => {
    const config = getAuth();
    if (!profile || avatarBusy || !config.baseUrl || !config.token) {
      return;
    }
    setAvatarBusy(true);
    void actualizarAvatar(config.baseUrl, config.token, profile.id)
      .then(load)
      .catch((failure: unknown) => {
        Alert.alert('No se pudo actualizar la foto', authMessage(failure));
      })
      .finally(() => setAvatarBusy(false));
  }, [avatarBusy, load, profile]);

  const onCopy = useCallback((label: string, value: string) => {
    Clipboard.setString(value);
    Alert.alert('Copiado', `${label}: ${value}`);
  }, []);

  const onLogout = useCallback(() => {
    Alert.alert('Cerrar sesion', 'Se borra el token de este telefono. ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesion',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          onLoggedOut();
        },
      },
    ]);
  }, [onLoggedOut]);

  const displayName = profile?.nombre || auth.name || 'Sin nombre';
  const whatsapp = profile?.whatsapp || auth.phone;
  const email = profile?.email || auth.email;
  const token = profile?.token || auth.token;
  // La foto es la URL publica que arma el API (`avatar_url`); el `v=` evita
  // que quede cacheada la anterior cuando el usuario cambia de foto.
  const avatarUri = profile?.avatarUrl
    ? `${profile.avatarUrl}${profile.avatarUrl.includes('?') ? '&' : '?'}v=${profile.avatarActualizado}`
    : auth.avatarUrl;
  const phoneText = whatsapp ? `+${whatsapp.replace(/^\+/, '')}` : '';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Volver">
          <Icon name="arrowLeft" size={18} color={c.text} />
        </Pressable>
        <Text style={[styles.title, { color: c.text }]}>Perfil</Text>
        <Pressable
          onPress={load}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Actualizar perfil"
          style={styles.headerAction}
        >
          <Icon name="refresh" size={17} color={loading ? c.muted : c.text} />
        </Pressable>
        <Pressable onPress={onLogout} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar sesion">
          <Icon name="logOut" size={17} color={c.danger} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card title="Cuenta">
          <View style={styles.heroRow}>
            <Pressable
              onPress={onRefreshAvatar}
              disabled={avatarBusy || !profile}
              style={styles.avatarWrap}
              accessibilityRole="button"
              accessibilityLabel="Actualizar foto de perfil"
            >
              <Avatar
                name={displayName}
                seed={whatsapp}
                uri={avatarUri}
                size={56}
              />
              {avatarBusy
                ? (
                    <View style={styles.avatarBusy}>
                      <ActivityIndicator color={c.accent} />
                    </View>
                  )
                : null}
            </Pressable>

            <View style={styles.heroData}>
              <Text style={[styles.heroName, { color: c.text }]} numberOfLines={1}>
                {displayName}
              </Text>

              <View style={styles.heroContact}>
                {phoneText
                  ? (
                      <Pressable
                        onPress={() => onCopy('WhatsApp', phoneText)}
                        hitSlop={8}
                        style={styles.contactLine}
                        accessibilityRole="button"
                        accessibilityLabel="Copiar WhatsApp"
                      >
                        <Icon name="whatsapp" size={12} color={c.muted} />
                        <Text style={[styles.contactText, { color: c.muted }]} numberOfLines={1}>
                          {phoneText}
                        </Text>
                        <Icon name="copy" size={12} color={c.muted} />
                      </Pressable>
                    )
                  : null}
                {email
                  ? (
                      <Pressable
                        onPress={() => onCopy('Correo', email)}
                        hitSlop={8}
                        style={styles.contactLine}
                        accessibilityRole="button"
                        accessibilityLabel="Copiar correo"
                      >
                        <Icon name="globe" size={12} color={c.muted} />
                        <Text style={[styles.contactText, { color: c.muted }]} numberOfLines={1}>
                          {email}
                        </Text>
                        <Icon name="copy" size={12} color={c.muted} />
                      </Pressable>
                    )
                  : null}
              </View>

              <View style={styles.badgeRow}>
                <View style={[styles.badge, { borderColor: c.accent }]}>
                  <Icon name="lock" size={11} color={c.accent} />
                  <Text style={[styles.badgeText, { color: c.accent }]}>token activo</Text>
                </View>
                {profile
                  ? (
                      <View style={[styles.badge, { borderColor: profile.activo ? c.accent : c.danger }]}>
                        <Icon
                          name="user"
                          size={11}
                          color={profile.activo ? c.accent : c.danger}
                        />
                        <Text
                          style={[styles.badgeText, { color: profile.activo ? c.accent : c.danger }]}
                        >
                          {profile.activo ? 'cuenta activa' : 'cuenta inactiva'}
                        </Text>
                      </View>
                    )
                  : null}
              </View>
            </View>
          </View>

          {profile
            ? (
                <>
                  <View style={styles.dateRow}>
                    <View style={styles.dateCol}>
                      <Text style={[styles.statLabel, { color: c.muted }]}>Suscripcion</Text>
                      <Text style={[styles.statValue, { color: c.text }]}>
                        {formatDate(profile.creado)}
                      </Text>
                    </View>
                    <View style={styles.dateCol}>
                      <Text style={[styles.statLabel, { color: c.muted }]}>Culminacion</Text>
                      <Text style={[styles.statValue, { color: c.text }]}>
                        {profile.plan?.vence ? formatDate(profile.plan.vence) : '—'}
                      </Text>
                    </View>
                  </View>
                  {profile.plan
                    ? (
                        <>
                          <View style={styles.dateRow}>
                            <View style={styles.dateCol}>
                              <Text style={[styles.statLabel, { color: c.muted }]}>Plan</Text>
                              <Text style={[styles.statValue, { color: c.text }]}>
                                {profile.plan.nombre || profile.plan.id}
                              </Text>
                            </View>
                            <View style={styles.dateCol}>
                              <Text style={[styles.statLabel, { color: c.muted }]}>Precio</Text>
                              <Text style={[styles.statValue, { color: c.text }]}>
                                {`${profile.plan.precioUsd} $`}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.dateRow}>
                            <View style={styles.dateCol}>
                              <Text style={[styles.statLabel, { color: c.muted }]}>Creditos/dia</Text>
                              <Text style={[styles.statValue, { color: c.text }]}>
                                {formatInt(profile.plan.creditosDia)}
                              </Text>
                            </View>
                            <View style={styles.dateCol}>
                              <Text style={[styles.statLabel, { color: c.muted }]}>Usado hoy</Text>
                              <Text style={[styles.statValue, { color: c.text }]}>
                                {formatInt(profile.plan.usadoHoy)}
                              </Text>
                            </View>
                            <View style={styles.dateCol}>
                              <Text style={[styles.statLabel, { color: c.muted }]}>Restante</Text>
                              <Text style={[styles.statValue, { color: c.text }]}>
                                {formatInt(profile.plan.restante)}
                              </Text>
                            </View>
                          </View>
                          <PlanMeter
                            usado={profile.plan.usadoHoy}
                            tope={profile.plan.creditosDia}
                          />
                        </>
                      )
                    : null}
                </>
              )
            : null}
        </Card>

        {loading && !profile
          ? (
              <View style={styles.center}>
                <ActivityIndicator color={c.accent} />
                <Text style={[styles.muted, { color: c.muted }]}>leyendo el perfil...</Text>
              </View>
            )
          : null}

        {error
          ? (
              <Card>
                <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
                <Pressable
                  onPress={load}
                  accessibilityRole="button"
                  accessibilityLabel="Reintentar"
                  style={[styles.retry, { borderColor: c.border }]}
                >
                  <Icon name="refresh" size={13} color={c.accent} />
                  <Text style={[styles.retryText, { color: c.accent }]}>reintentar</Text>
                </Pressable>
              </Card>
            )
          : null}


        <Card>
          <Row label="Servidor" value={auth.baseUrl || '—'} />
          <View
            style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}
          >
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: c.muted }]}>Token</Text>
              <Text style={[styles.rowValue, { color: c.text }]} numberOfLines={1}>
                {revealed ? token : '•'.repeat(Math.max(0, token.length))}
              </Text>
            </View>
            <Pressable
              onPress={() => setRevealed(value => !value)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={revealed ? 'Ocultar token' : 'Mostrar token'}
              style={styles.tokenIcons}
            >
              <Icon name={revealed ? 'eyeOff' : 'eye'} size={16} color={c.muted} />
            </Pressable>
            <Pressable
              onPress={() => onCopy('Token', token)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Copiar token"
            >
              <Icon name="copy" size={16} color={c.muted} />
            </Pressable>
          </View>

          <View style={[styles.group, { borderTopColor: c.border }]}>
            <Text style={[styles.cardTitle, { color: c.muted }]}>Tema</Text>
            <View style={styles.switchRow}>
              {THEMES.map(item => {
                const active = mode === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setTheme(item.value)}
                    accessibilityRole="button"
                    accessibilityLabel={`Tema ${item.label}`}
                    accessibilityState={{ selected: active }}
                    style={[styles.themeOption, { borderColor: active ? c.accent : c.border }]}
                  >
                    <Icon name={item.icon} size={14} color={active ? c.accent : c.muted} />
                    <Text style={[styles.themeLabel, { color: active ? c.accent : c.muted }]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>
      </ScrollView>
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
  headerAction: {
    marginLeft: 'auto',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 32,
    gap: 10,
  },
  center: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  tokenIcons: {
    marginRight: 12,
  },
  muted: {
    fontSize: 12,
    paddingVertical: 6,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  group: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
  },
  avatarWrap: {
    marginBottom: 0,
  },
  avatarBusy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroData: {
    flex: 1,
    alignItems: 'flex-start',
  },
  heroName: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'left',
  },
  heroContact: {
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 6,
    maxWidth: '100%',
  },
  contactLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
  },
  contactText: {
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 14,
  },
  rowStrong: {
    fontWeight: '700',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  meter: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
  },
  dateCol: {
    flex: 1,
  },
  meterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meterPct: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  meterTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  meterFill: {
    height: 6,
    borderRadius: 3,
  },
  meterHint: {
    fontSize: 10,
    marginTop: 5,
  },
  stat: {
    minWidth: 92,
    flexGrow: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  service: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  serviceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
  },
  serviceHeadMeta: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 6,
  },
  serviceFoot: {
    fontSize: 10,
    paddingTop: 4,
  },
  endpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  endpointMethod: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    width: 38,
  },
  endpointPath: {
    flex: 1,
    fontSize: 12,
  },
  endpointMeta: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  switchRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 4,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 9,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 9,
    marginBottom: 8,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
