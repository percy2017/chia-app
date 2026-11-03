import { Alert, AppState, PermissionsAndroid, Platform } from 'react-native';
import type { Permission } from 'react-native';

import { readGroup, writeSettings } from '../db/settings';
import { installInfo, openNotificationsAccess, permStatus, phoneNative } from '../phone/native';
import type { PhonePermissions } from '../phone/native';

type RuntimePermission = {
  label: string;
  permission: string;
  minSdk?: number;
  extra?: string[];
};

const RUNTIME: RuntimePermission[] = [
  { label: 'Camara', permission: 'android.permission.CAMERA' },
  { label: 'Microfono', permission: 'android.permission.RECORD_AUDIO' },
  { label: 'Ubicacion', permission: 'android.permission.ACCESS_FINE_LOCATION' },
  { label: 'WiFi cercano', permission: 'android.permission.NEARBY_WIFI_DEVICES', minSdk: 33 },
  {
    label: 'Bluetooth',
    permission: 'android.permission.BLUETOOTH_SCAN',
    minSdk: 31,
    extra: ['android.permission.BLUETOOTH_CONNECT'],
  },
  { label: 'Notificaciones', permission: 'android.permission.POST_NOTIFICATIONS', minSdk: 33 },
];

const APP_PACKAGE = 'com.chianative';
/** Accesos que el usuario ya decidio no activar: no se vuelve a preguntar. */
const MUTED_KEY = 'perm.muted';

/** Info de la app en Ajustes: ahi vive "Permitir ajustes restringidos". */
export function openAppInfo() {
  return phoneNative().appSettings(APP_PACKAGE).catch(() => false);
}

type SpecialKey = 'notifications' | 'allFiles' | 'usageAccess';

type SpecialPermission = {
  key: SpecialKey;
  label: string;
  why: string;
  open: () => Promise<unknown>;
};

/** Accesos que Android no deja pedir con dialogo: se activan a mano. */
const SPECIAL: SpecialPermission[] = [
  {
    key: 'notifications',
    label: 'Acceso a notificaciones',
    why: 'Captura, CRM y billeteras.',
    open: () => openNotificationsAccess(),
  },
  {
    key: 'allFiles',
    label: 'Acceso a todos los archivos',
    why: 'Leer y escribir en /sdcard (Android 11+).',
    open: () => phoneNative().filesSettings(),
  },
  {
    key: 'usageAccess',
    label: 'Datos de uso',
    why: 'Uso de apps.',
    open: () => phoneNative().usageSettings(),
  },
];

let verified = false;

function mutedKeys(): string[] {
  try {
    return (readGroup('perm.').muted ?? '').split(',').filter(Boolean);
  }
  catch {
    return [];
  }
}

function mute(keys: string[]): void {
  if (keys.length === 0) {
    return;
  }
  try {
    const all = new Set(mutedKeys());
    for (const key of keys) {
      all.add(key);
    }
    writeSettings({ [MUTED_KEY]: [...all].join(',') });
  }
  catch {
    // Sin base de datos no se recuerda: se vuelve a preguntar el proximo arranque.
  }
}

export async function ensurePermissions(): Promise<PhonePermissions | null> {
  if (verified) {
    return permStatus();
  }
  verified = true;
  if (Platform.OS !== 'android') {
    return null;
  }

  const version = Number(Platform.Version);
  const pending = RUNTIME.filter(item => item.minSdk === undefined || version >= item.minSdk);
  try {
    // Android solo muestra el dialogo si falta el permiso: no hay insistencia.
    await PermissionsAndroid.requestMultiple(
      pending.flatMap(item => [
        item.permission as unknown as Permission,
        ...(item.extra ?? []).map(name => name as unknown as Permission),
      ]),
    );
  }
  catch {
    // Sin actividad en primer plano el dialogo no sale; se revisa en el doctor.
  }

  const perms = await permStatus();
  if (!perms) {
    return null;
  }
  const muted = new Set(mutedKeys());
  const missing = SPECIAL.filter(item => !perms[item.key] && !muted.has(item.key));
  if (missing.length > 0) {
    const sideload = await installInfo()
      .then(info => info?.sideload ?? false)
      .catch(() => false);
    await askMissing(missing, missing.some(item => item.key === 'notifications') && sideload);
  }
  return permStatus();
}

function watchReturn(keys: SpecialKey[]): void {
  const subscription = AppState.addEventListener('change', (status) => {
    if (status !== 'active') {
      return;
    }
    subscription.remove();
    void permStatus()
      .then((after) => {
        if (after && keys.every(key => after[key])) {
          mute(keys);
        }
      })
      .catch(() => {});
  });
}

function askMissing(missing: SpecialPermission[], restricted: boolean): Promise<void> {
  const keys = missing.map(item => item.key);
  return new Promise((resolve) => {
    const lines = missing.map(item => `· ${item.label}: ${item.why}`).join('\n');
    const extra = restricted
      ? '\n\nAndroid bloquea el interruptor (sale gris) porque la app no viene de Play Store:'
        + ' Info de la app > menu de tres puntos > Permitir ajustes restringidos,'
        + ' y despues volve a activar el acceso.'
      : '';
    Alert.alert(
      'Permisos de Android',
      `${lines}${extra}\n\nSe activan a mano en Ajustes. "Omitir" no vuelve a preguntar.`,
      [
        {
          text: 'Omitir',
          style: 'cancel',
          onPress: () => {
            mute(keys);
            resolve();
          },
        },
        {
          text: 'Info de la app',
          onPress: () => {
            void openAppInfo();
            watchReturn(keys);
            resolve();
          },
        },
        {
          text: 'Abrir ajustes',
          onPress: () => {
            void missing[0].open().catch(() => false);
            watchReturn(keys);
            resolve();
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve() },
    );
  });
}
