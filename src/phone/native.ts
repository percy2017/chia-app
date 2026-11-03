import { NativeModules } from 'react-native';

type PhoneNativeModule = {
  specs: (section: string) => Promise<string>;
  countryCode: () => Promise<string>;
  sensorsRead: (sensor: string, seconds: number) => Promise<string>;
  locationOnce: (timeoutSec: number) => Promise<string>;
  torch: (on: boolean) => Promise<boolean>;
  listApps: (limit: number) => Promise<string>;
  openApp: (pkg: string) => Promise<boolean>;
  openUrl: (url: string) => Promise<boolean>;
  vibrate: (ms: number) => Promise<boolean>;
  requestPermission: (permission: string) => Promise<boolean>;
  notificationsList: (
    limit: number,
    filter: string,
    includeRemoved: boolean,
  ) => Promise<string>;
  notificationsSettings: () => Promise<boolean>;
  notificationsDetailSettings: () => Promise<boolean>;
  installInfo: () => Promise<string>;
  mediaSessions: () => Promise<string>;
  mediaState: (pkg: string) => Promise<string>;
  mediaControl: (action: string, pkg: string, positionMs: number) => Promise<string>;
  mediaVolume: (action: string, percent: number) => Promise<string>;
  appInfo: (pkg: string) => Promise<string>;
  appSettings: (pkg: string) => Promise<boolean>;
  uninstallApp: (pkg: string) => Promise<boolean>;
  openStore: (pkg: string) => Promise<string>;
  appsUsage: (days: number, limit: number) => Promise<string>;
  usageSettings: () => Promise<boolean>;
  filesList: (path: string, limit: number, showHidden: boolean) => Promise<string>;
  filesStat: (path: string) => Promise<string>;
  filesRead: (
    path: string,
    offset: number,
    limit: number,
    maxBytes: number,
    encoding: string,
  ) => Promise<string>;
  filesWrite: (
    path: string,
    content: string,
    encoding: string,
    append: boolean,
  ) => Promise<string>;
  filesMkdir: (path: string) => Promise<string>;
  filesDelete: (path: string, recursive: boolean) => Promise<string>;
  filesMove: (
    from: string,
    to: string,
    overwrite: boolean,
    copy: boolean,
  ) => Promise<string>;
  filesSearch: (
    path: string,
    query: string,
    limit: number,
    maxDepth: number,
    showHidden: boolean,
  ) => Promise<string>;
  filesSettings: () => Promise<boolean>;
  netScan: (
    subnet: string,
    ports: string,
    timeoutMs: number,
    seconds: number,
    threads: number,
  ) => Promise<string>;
  netProbe: (host: string, port: number, timeoutMs: number) => Promise<string>;
  netDns: (host: string) => Promise<string>;
  netHttp: (
    url: string,
    method: string,
    headers: Record<string, string>,
    body: string,
    timeoutSec: number,
  ) => Promise<string>;
  netWifiScan: () => Promise<string>;
  btStatus: () => Promise<string>;
  btList: () => Promise<string>;
  btScan: (seconds: number) => Promise<string>;
  btPair: (address: string) => Promise<string>;
  btConnect: (address: string, connect: boolean) => Promise<string>;
  btSetEnabled: (enabled: boolean) => Promise<string>;
  btSettings: () => Promise<boolean>;
  permStatus: () => Promise<string>;
  configureTools: (json: string) => Promise<boolean>;
};

export type PhoneToolLimits = {
  fileBytes: number;
  httpBytes: number;
};

/** Copia los limites al lado nativo (SharedPreferences `chia_tools`). */
export async function configurePhoneTools(limits: PhoneToolLimits): Promise<boolean> {
  const module = NativeModules.Phone as PhoneNativeModule | undefined;
  if (!module?.configureTools) {
    return false;
  }
  try {
    return await module.configureTools(JSON.stringify(limits));
  }
  catch {
    return false;
  }
}

/** Permisos de Android que usan las tools, la captura y la voz. */
export type PhonePermissions = {
  notifications: boolean;
  postNotifications: boolean;
  camera: boolean;
  location: boolean;
  wifi: boolean;
  allFiles: boolean;
  usageAccess: boolean;
  bluetooth: boolean;
  batteryUnrestricted: boolean;
};

/** Estado de permisos leido desde PhoneModule (null si el modulo falta). */
export async function permStatus(): Promise<PhonePermissions | null> {
  const module = (NativeModules.Phone as PhoneNativeModule | undefined)
    ?? (NativeModules.Phone as unknown as { permStatus?: () => Promise<string> } | undefined);
  if (!module?.permStatus) {
    return null;
  }
  try {
    const raw = await module.permStatus();
    return JSON.parse(raw) as PhonePermissions;
  }
  catch {
    return null;
  }
}

/** Origen de la instalacion: Play Store o sideload (APK a mano). */
export type InstallInfo = {
  /** Paquete que instalo la app (vacio si no se sabe). */
  installer: string;
  /** true si no viene de Play Store: Android 13+ la marca como restringida. */
  sideload: boolean;
  /** El telefono tiene la pantalla de detalle del interruptor (API 30+). */
  detailSettings: boolean;
};

export async function installInfo(): Promise<InstallInfo | null> {
  const module = NativeModules.Phone as PhoneNativeModule | undefined;
  if (!module?.installInfo) {
    return null;
  }
  try {
    const raw = await module.installInfo();
    const parsed = JSON.parse(raw) as Partial<InstallInfo>;
    return {
      installer: String(parsed.installer ?? ''),
      sideload: parsed.sideload !== false,
      detailSettings: parsed.detailSettings === true,
    };
  }
  catch {
    return null;
  }
}

/**
 * Abre el acceso a notificaciones. Prefiere la pantalla del interruptor de
 * esta app (un toque); si el build nativo es viejo o el fabricante no la
 * trae, cae en la lista completa.
 */
export async function openNotificationsAccess(): Promise<boolean> {
  const module = NativeModules.Phone as PhoneNativeModule | undefined;
  if (!module) {
    throw new Error('Modulo nativo Phone no disponible (recompila la app).');
  }
  if (module.notificationsDetailSettings) {
    try {
      return await module.notificationsDetailSettings();
    }
    catch {
      // Sigue con la lista completa.
    }
  }
  return module.notificationsSettings();
}

export function phoneNative(): PhoneNativeModule {  const module = NativeModules.Phone as PhoneNativeModule | undefined;
  if (!module) {
    throw new Error('Modulo nativo Phone no disponible (recompila la app).');
  }
  return module;
}

/**
 * ISO2 del pais del usuario: ubicacion (GPS + Geocoder) si hay permiso,
 * luego la SIM y por ultimo el locale del telefono. Cadena vacia si nada.
 */
export async function countryCodeNative(): Promise<string> {
  const module = NativeModules.Phone as PhoneNativeModule | undefined;
  if (!module?.countryCode) {
    return '';
  }
  try {
    const raw = await module.countryCode();
    const parsed = JSON.parse(raw) as { iso?: string };
    return String(parsed.iso ?? '').trim().toUpperCase();
  }
  catch {
    return '';
  }
}
