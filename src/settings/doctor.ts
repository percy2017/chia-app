import { installInfo, openNotificationsAccess, permStatus, phoneNative } from '../phone/native';
import { getSnapshot, setStartOnBoot } from './store';
import { openAppInfo } from '../boot/permissions';
import { readStartOnBoot } from '../boot/native';

export type DoctorStatus = 'ok' | 'warn' | 'error' | 'fixed';

export type DoctorCheck = {
  id: string;
  label: string;
  status: DoctorStatus;
  detail: string;
  /** Arreglo automatico; si existe, el doctor puede corregirlo. */
  fix?: { label: string; run: () => void; opens?: boolean };
};

function openAccess(kind: 'notifications' | 'files' | 'usage'): () => void {
  return () => {
    try {
      const phone = phoneNative();
      if (kind === 'notifications') {
        void openNotificationsAccess();
      }
      else if (kind === 'files') {
        void phone.filesSettings();
      }
      else {
        void phone.usageSettings();
      }
    }
    catch {
      // Sin modulo nativo no hay nada que abrir.
    }
  };
}

/** Pide un permiso de runtime (el dialogo lo muestra Android). */
function requestAccess(kind: 'camera' | 'location' | 'wifi'): () => void {
  return () => {
    try {
      void phoneNative().requestPermission(kind);
    }
    catch {
      // Sin modulo nativo no se puede pedir.
    }
  };
}

/**
 * Permisos: el acceso a notificaciones, los de runtime y los especiales
 * (todos los archivos, datos de uso). Se conceden a mano: el doctor los
 * reporta y ofrece abrir la pantalla correspondiente.
 */
async function checkPermissions(): Promise<DoctorCheck[]> {
  const perms = await permStatus();
  if (!perms) {
    return [{
      id: 'perm',
      label: 'Permisos del telefono',
      status: 'warn',
      detail: 'Modulo nativo Phone no disponible (recompila la app) para leer permisos.',
    }];
  }
  const checks: DoctorCheck[] = [];
  const push = (
    id: string,
    label: string,
    ok: boolean,
    okDetail: string,
    badDetail: string,
    fix?: { label: string; run: () => void; opens?: boolean },
  ) => {
    checks.push({
      id,
      label,
      status: ok ? 'ok' : 'error',
      detail: ok ? okDetail : badDetail,
      fix: ok ? undefined : fix,
    });
  };

  const sideload = await installInfo()
    .then(info => info?.sideload ?? false)
    .catch(() => false);

  push(
    'perm.notifications',
    'Acceso a notificaciones',
    perms.notifications,
    'activo: captura, CRM y voz',
    'Sin acceso: no captura, no reenvia al CRM ni lee billeteras.',
    { label: 'abrir el interruptor de ChiaNative', run: openAccess('notifications'), opens: true },
  );
  checks.push({
    id: 'perm.installer',
    label: 'Origen de la instalacion',
    status: sideload && !perms.notifications ? 'error' : 'ok',
    detail: sideload
      ? (perms.notifications
          ? 'APK instalado a mano: Android restringe el acceso solo si el interruptor esta apagado; ahora esta activo.'
          : 'APK instalado a mano (no viene de Play Store): Android 13+ deja el interruptor de '
            + 'notificaciones en gris hasta que autorices "Permitir ajustes restringidos" en '
            + 'Info de la app > menu de tres puntos. Si aun asi no deja, Play Protect esta '
            + 'bloqueando la app: desactiva "Analizar apps en busca de amenazas" y proba de nuevo.')
      : 'instalada desde Play Store: sin configuracion restringida',
    fix: sideload && !perms.notifications
      ? { label: 'abrir info de la app', run: () => { void openAppInfo(); }, opens: true }
      : undefined,
  });
  push(
    'perm.postNotifications',
    'Notificaciones de la app',
    perms.postNotifications,
    'permitidas',
    'Android 13+ bloquea la notificacion del servicio en segundo plano (KeepAlive).',
    undefined,
  );
  push(
    'perm.camera',
    'Permiso de camara',
    perms.camera,
    'concedido',
    'Sin camara no hay fotos ni lectura de codigos.',
    { label: 'pedir camara', run: requestAccess('camera') },
  );
  push(
    'perm.location',
    'Permiso de ubicacion',
    perms.location,
    'concedido',
    'Sin ubicacion no funciona location.once.',
    { label: 'pedir ubicacion', run: requestAccess('location') },
  );
  push(
    'perm.wifi',
    'Permiso de WiFi cercano',
    perms.wifi,
    'concedido',
    'Sin NEARBY_WIFI_DEVICES no funciona net.wifi.scan.',
    { label: 'pedir WiFi', run: requestAccess('wifi') },
  );
  push(
    'perm.allFiles',
    'Acceso a todos los archivos',
    perms.allFiles,
    'concedido',
    'Android 11+ lo exige para files.* en /sdcard y para read target phone.',
    { label: 'abrir Acceso a todos los archivos', run: openAccess('files'), opens: true },
  );
  push(
    'perm.usageAccess',
    'Datos de uso',
    perms.usageAccess,
    'concedido',
    'Sin "Datos de uso" no funciona apps.usage.',
    { label: 'abrir Datos de uso', run: openAccess('usage'), opens: true },
  );
  if (!perms.batteryUnrestricted) {
    checks.push({
      id: 'perm.battery',
      label: 'Bateria sin restricciones',
      status: 'warn',
      detail: 'Android puede congelar el proceso con la pantalla apagada; se pide al iniciar un turno.',
    });
  }
  else {
    checks.push({
      id: 'perm.battery',
      label: 'Bateria sin restricciones',
      status: 'ok',
      detail: 'exenta de Doze',
    });
  }
  return checks;
}

/** Notificaciones capturadas: se muestra como informacion (no es permiso). */
async function checkCaptured(): Promise<DoctorCheck> {
  const base: DoctorCheck = {
    id: 'captured',
    label: 'Notificaciones capturadas',
    status: 'ok',
    detail: '',
  };
  try {
    const raw = await phoneNative().notificationsList(1, '', false);
    const parsed = JSON.parse(raw) as { enabled?: boolean; total?: number };
    if (parsed.enabled === false) {
      return {
        ...base,
        status: 'error',
        detail: 'sin acceso: no hay historial capturado (ver Acceso a notificaciones).',
        fix: { label: 'abrir el interruptor de ChiaNative', run: openAccess('notifications'), opens: true },
      };
    }
    return { ...base, status: 'ok', detail: `activo · ${parsed.total ?? 0} capturadas` };
  }
  catch (error: unknown) {
    return {
      ...base,
      status: 'warn',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Arranque con Android: compara el interruptor (SQLite) con el flag que lee
 * BootReceiver en SharedPreferences. Si no coinciden el receptor abre o no la
 * app al reves de lo configurado y el arreglo es volver a empujarlo.
 */
async function checkBoot(): Promise<DoctorCheck> {
  const base: DoctorCheck = {
    id: 'boot',
    label: 'Arranque con Android',
    status: 'ok',
    detail: '',
  };
  const enabled = getSnapshot().startOnBoot;
  const native = await readStartOnBoot();
  if (native === null) {
    return {
      ...base,
      status: 'warn',
      detail: 'Modulo nativo Boot no disponible (recompila la app): el receptor no tiene flag y usa el valor por defecto.',
    };
  }
  if (native !== enabled) {
    return {
      ...base,
      status: 'warn',
      detail: `El flag nativo dice ${native ? 'activo' : 'apagado'} y la configuracion ${enabled ? 'activo' : 'apagado'}.`,
      fix: { label: 'sincronizar con la configuracion', run: () => setStartOnBoot(enabled) },
    };
  }
  return {
    ...base,
    status: 'ok',
    detail: enabled
      ? 'activo · si el fabricante bloquea el autostart, permitelo en Ajustes > Inicio automatico'
      : 'apagado: la app no se abre sola al arrancar',
  };
}

/** Solo permisos y ajustes de Android: sin LLM, sin SSH y sin CRM. */
export async function runDoctor(): Promise<DoctorCheck[]> {
  const [captured, permissions] = await Promise.all([
    checkCaptured(),
    checkPermissions(),
  ]);
  return [captured, await checkBoot(), ...permissions];
}

/**
 * Aplica los arreglos automaticos; devuelve cuantos corrio. Los que abren una
 * pantalla de Ajustes se limitan al primero: Android apila los intents y el
 * usuario acabaria en la ultima, no en la que necesita.
 */
export function applyDoctorFixes(checks: DoctorCheck[]): number {
  let applied = 0;
  let opened = false;
  for (const check of checks) {
    if (!check.fix) {
      continue;
    }
    if (check.fix.opens) {
      if (opened) {
        continue;
      }
      opened = true;
    }
    try {
      check.fix.run();
      applied += 1;
    }
    catch {
      // Un arreglo que falla no debe romper el resto.
    }
  }
  return applied;
}

/** Cuenta por estado, para el resumen del modal. */
export function doctorSummary(checks: DoctorCheck[]): {
  errors: number;
  warnings: number;
  fixable: number;
  ok: number;
} {
  return {
    errors: checks.filter(check => check.status === 'error').length,
    warnings: checks.filter(check => check.status === 'warn').length,
    fixable: checks.filter(check => check.fix).length,
    ok: checks.filter(check => check.status === 'ok').length,
  };
}
