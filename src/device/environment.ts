import { Dimensions, PixelRatio, Platform } from 'react-native';
import { phoneNative } from '../phone/native';
import { getAuth } from '../settings/store';

type DevicePart = {
  manufacturer?: string;
  brand?: string;
  model?: string;
  android?: string;
  sdk?: number;
};

const APP_PACKAGE = 'com.chianative';

let deviceLines: string[] = [];
let loaded = false;
let loading: Promise<void> | null = null;

export function environmentSection(): string {
  const lines = [...deviceLines];
  const user = userLine();
  if (user) {
    lines.push(user);
  }
  return lines.length > 0 ? `Entorno:\n${lines.join('\n')}` : '';
}

function userLine(): string {
  try {
    const auth = getAuth();
    const who = [auth.name.trim(), auth.phone.trim(), auth.email.trim()].filter(Boolean);
    return who.length > 0 ? `- Usuario: ${who.join(' · ')}` : '';
  }
  catch {
    return '';
  }
}

export function ensureEnvironment(): Promise<void> {
  if (loaded) {
    return Promise.resolve();
  }
  if (loading) {
    return loading;
  }
  loading = load()
    .catch(() => {
      // Sin modulo nativo la seccion queda solo con lo que haya en la base.
    })
    .then(() => {
      loaded = true;
      loading = null;
    });
  return loading;
}

async function load(): Promise<void> {
  const device = await readDevice();
  const brand = [device.manufacturer, device.model]
    .map(value => (value ?? '').trim())
    .filter(Boolean)
    .join(' ');
  const lines: string[] = [];
  if (brand || device.android) {
    const android = device.android
      ? `Android ${device.android}${device.sdk ? ` (SDK ${device.sdk})` : ''}`
      : '';
    lines.push(`- Telefono: ${[brand, android].filter(Boolean).join(' · ')}`);
  }
  const screen = screenLine();
  if (screen) {
    lines.push(screen);
  }
  const app = await readAppVersion();
  if (app) {
    lines.push(`- App: ChiaNative ${app}`);
  }
  lines.push(`- Idioma: ${locale()}`);
  deviceLines = lines;
}

async function readDevice(): Promise<DevicePart> {
  try {
    const raw = await phoneNative().specs('device');
    const parsed = JSON.parse(raw) as { device?: DevicePart };
    return parsed.device ?? {};
  }
  catch {
    // Sin nativo se usa lo que da React Native.
    const constants = Platform.constants as { Brand?: string; Manufacturer?: string; Model?: string };
    return {
      manufacturer: constants.Manufacturer,
      model: constants.Model ?? constants.Brand,
      android: String(Platform.Version),
    };
  }
}

function screenLine(): string {
  const { width, height } = Dimensions.get('window');
  if (!width || !height) {
    return '';
  }
  const density = PixelRatio.get();
  const dp = `${Math.round(width / density)}x${Math.round(height / density)}`;
  const px = `${Math.round(width * density)}x${Math.round(height * density)}`;
  return `- Pantalla: ${dp} dp (${px} px) · ${density.toFixed(2)}x`;
}

async function readAppVersion(): Promise<string> {
  try {
    const raw = await phoneNative().appInfo(APP_PACKAGE);
    const parsed = JSON.parse(raw) as { version?: string };
    return (parsed.version ?? '').trim();
  }
  catch {
    return '';
  }
}

function locale(): string {
  try {
    return new Intl.DateTimeFormat().resolvedOptions().locale || 'es';
  }
  catch {
    return 'es';
  }
}
