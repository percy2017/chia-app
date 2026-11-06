import type { LlmConfig } from '../llm/types';
import type { SshProfile } from '../ssh/types';

import {
  AUTH_PREFIX,
  clearGroup,
  LLM_PREFIX,
  readGroup,
  SSH_PREFIX,
  TOOLS_PREFIX,
  UI_PREFIX,
  VOICE_PREFIX,
  writeSettings,
} from '../db/settings';
import { configureStartOnBoot } from '../boot/native';
import { configurePhoneTools } from '../phone/native';

export type ToolsSettings = {
  /** Tope de texto que devuelve una tool y de cada nota .md de memoria. */
  maxChars: number;
  /** KB maximos de bytes que devuelve o acepta cualquier tool. */
  maxBytesKb: number;
};

/** Las tools no tienen tope de tiempo: solo corta el sistema a las 24 h. */
export const NO_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export type ToolsConfig = ToolsSettings & {
  headChars: number;
  tailChars: number;
  maxTimeMs: number;
  /** Bytes efectivos (sale de `maxBytesKb`). */
  maxBytes: number;
};

/** Config del agente: el modelo y las credenciales los pone el servidor. */
export type LlmSettings = {
  systemPrompt: string;
};

export type ThemeMode = 'system' | 'dark' | 'light';

/**
 * Acceso: el cliente entra con el token del Studio API (el servidor lo genera
 * solo al crear el usuario). Ese token vale para chat, voz y rag.
 */
export type AuthState = {
  /** Token del Studio API (credencial unica de la app). */
  token: string;
  /** Servidor del Studio API. */
  baseUrl: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
  /** WhatsApp de soporte (plan y acceso). */
  supportPhone: string;
};

/** Servidor de voz (texto a voz y transcripcion). El token es futuro. */
export type VoiceGender = 'mujer' | 'hombre';

export type VoiceSettings = {
  baseUrl: string;
  token: string;
  /** Voz del servidor: mujer (Norah) u hombre (Juan Carlos). */
  gender: VoiceGender;
  /** Codigo ISO 639-1 del texto/audio (es por defecto). */
  idioma: string;
};

export type SettingsState = LlmSettings & {  theme: ThemeMode;
  /** Panel de metricas del chat visible. */
  sidebar: boolean;
  /** Abrir la app sola al terminar de arrancar Android. */
  startOnBoot: boolean;
  ssh: SshProfile;
  tools: ToolsSettings;
  /** Registro y PIN de acceso (pantallas Register / Login). */
  auth: AuthState;
  /** Servidor de voz / transcripcion (url base + token). */
  voice: VoiceSettings;
};


/** Valores sanos de `tools.*`: fallbacks del codigo, en un solo lugar. */
export function toolsDefaults(): ToolsSettings {
  return {
    maxChars: 2000,
    maxBytesKb: 512,
  };
}

/** Limites guardados; si falta o es invalido queda el valor por defecto. */
function toolsFromGroup(stored: Record<string, string>): ToolsSettings {
  const base = toolsDefaults();
  return {
    maxChars: intNumber(stored.maxChars) || base.maxChars,
    maxBytesKb: intNumber(stored.maxBytesKb) || base.maxBytesKb,
  };
}

/** Estado vacio: solo el saludo por defecto; el resto lo escribe el usuario. */
function emptyState(): SettingsState {
  return {
    systemPrompt: 'Hola soy chia tu asistente virtual, respondo de manera corta y resumida.',
    theme: 'system',
    sidebar: false,
    startOnBoot: true,
    ssh: {
      id: 'default',
      label: 'VPS',
      host: '',
      port: 0,
      username: '',
      authType: 'password',
      password: '',
      privateKey: '',
      passphrase: '',
    },
    tools: toolsDefaults(),
    auth: { token: '', baseUrl: '', name: '', phone: '', email: '', avatarUrl: '', supportPhone: '' },
    voice: { baseUrl: '', token: '', gender: 'mujer', idioma: 'es' },
  };
}

let state: SettingsState = emptyState();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function profileLabel(ssh: SshProfile): string {
  if (!ssh.host) {
    return 'VPS';
  }
  return ssh.username ? `${ssh.username}@${ssh.host}` : ssh.host;
}

function persist() {
  try {
    writeSettings({
      'llm.systemPrompt': state.systemPrompt,
      'ui.theme': state.theme,
      'ui.startOnBoot': state.startOnBoot ? 'true' : 'false',
      'ssh.host': state.ssh.host,
      'ssh.port': state.ssh.port,
      'ssh.username': state.ssh.username,
      'ssh.authType': state.ssh.authType,
      'ssh.password': state.ssh.password,
      'ssh.privateKey': state.ssh.privateKey,
      'ssh.passphrase': state.ssh.passphrase,
      'tools.maxChars': state.tools.maxChars,
      'tools.maxBytesKb': state.tools.maxBytesKb,
      'auth.token': state.auth.token,
      'auth.baseUrl': state.auth.baseUrl,
      'auth.name': state.auth.name,
      'auth.phone': state.auth.phone,
      'auth.email': state.auth.email,
      'auth.avatarUrl': state.auth.avatarUrl,
      'auth.supportPhone': state.auth.supportPhone,
      'voice.baseUrl': state.voice.baseUrl,
      'voice.token': state.voice.token,
      'voice.gender': state.voice.gender,
      'voice.idioma': state.voice.idioma,
    });
  }
  catch (error) {
    console.warn('[settings] no se pudo guardar en la base de datos', error);
  }
}

function setState(patch: Partial<SettingsState>) {
  state = { ...state, ...patch };
  persist();
  notify();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): SettingsState {
  return state;
}

function str(value: string | undefined, fallback = ''): string {
  return value === undefined ? fallback : value;
}

function nonNegative(value: string | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function intNumber(value: string | undefined, fallback = 0): number {
  return Math.floor(nonNegative(value, fallback));
}

/** Arranque con Android: el receptor de BOOT_COMPLETED lee SharedPreferences. */
function syncBootNative(): void {
  void configureStartOnBoot(state.startOnBoot);
}

/** Copia los limites de la tool phone a PhoneModule (nativo). */
function syncPhoneNative(): void {
  const tools = getToolsConfig();
  void configurePhoneTools({
    fileBytes: Math.min(tools.maxBytes, 2147483000),
    httpBytes: Math.min(tools.maxBytes, 2147483000),
  });
}

let hydrated = false;

type Stored = {
  llm: Record<string, string>;
  ssh: Record<string, string>;
  tools: Record<string, string>;
  ui: Record<string, string>;
  auth: Record<string, string>;
  voice: Record<string, string>;
};

function readAll(): Stored {
  return {
    llm: readGroup(LLM_PREFIX),
    ssh: readGroup(SSH_PREFIX),
    tools: readGroup(TOOLS_PREFIX),
    ui: readGroup(UI_PREFIX),
    auth: readGroup(AUTH_PREFIX),
    voice: readGroup(VOICE_PREFIX),
  };
}

function isBlank(stored: Stored): boolean {
  return Object.values(stored).every(group => Object.keys(group).length === 0);
}

/**
 * Carga la configuracion desde la tabla `settings`. La base arranca vacia:
 * los valores los escribe el usuario o el JSON importado.
 */
export function hydrateSettings(): void {
  if (hydrated) {
    return;
  }
  hydrated = true;
  try {
    let stored = readAll();
    const meta = readGroup('meta.');

    // (solo rellena claves ausentes; nunca pisa un valor del usuario).
    if (meta.toolsLimits !== '1') {
      writeSettings({ 'meta.toolsLimits': '1' });
    }
    // Configuracion del proveedor LLM viejo (antes del Studio API) y el plan
    // del CRM: ya no existen en el codigo, se limpian una sola vez.
    if (meta.studioOnly !== '1') {
      clearGroup('llm.model');
      clearGroup('llm.protocol');
      clearGroup('llm.effort');
      clearGroup('llm.apiKey');
      clearGroup('llm.baseUrl');
      clearGroup('llm.cacheEnabled');
      clearGroup('llm.key.');
      clearGroup('key.');
      clearGroup('ui.plan');
      clearGroup('notify.enabled');
      clearGroup('notify.crmEnabled');
      clearGroup('notify.crmUrl');
      clearGroup('notify.crmPin');
      writeSettings({ 'meta.studioOnly': '1' });
    }
    if (isBlank(stored)) {
      state = emptyState();
      syncPhoneNative();
      notify();
      return;
    }

    const { llm, ssh, tools, ui, auth: authGroup, voice } = stored;

    const sshProfile: SshProfile = {
      id: 'default',
      label: '',
      host: str(ssh.host),
      port: intNumber(ssh.port),
      username: str(ssh.username),
      authType: ssh.authType === 'key' ? 'key' : 'password',
      password: str(ssh.password),
      privateKey: str(ssh.privateKey),
      passphrase: str(ssh.passphrase),
    };

    state = {
      systemPrompt: str(llm.systemPrompt),
      theme: ui.theme === 'dark' || ui.theme === 'light' ? ui.theme : 'system',
      // Arranca oculto: se abre con el boton de metricas del header.
      // El sidebar es estado de la sesion: siempre arranca cerrado.
      sidebar: false,
      // El telefono arranca la app solo salvo que el usuario lo apague.
      // La app siempre arranca con Android: no es una opcion del usuario.
      startOnBoot: true,
      ssh: { ...sshProfile, label: profileLabel(sshProfile) },
      tools: toolsFromGroup(tools),
      auth: {
        token: str(authGroup.token),
        baseUrl: str(authGroup.baseUrl),
        name: str(authGroup.name),
        phone: str(authGroup.phone),
        email: str(authGroup.email),
        avatarUrl: str(authGroup.avatarUrl),
        supportPhone: str(authGroup.supportPhone),
      },
      voice: {
        baseUrl: str(voice.baseUrl),
        token: str(voice.token),
        gender: voice.gender === 'hombre' ? 'hombre' : 'mujer',
        idioma: str(voice.idioma) || 'es',
      },
    };
    // El arranque con Android vive en SharedPreferences (funciona con la app
    // cerrada): se re-sincroniza en cada arranque desde la base.
    syncPhoneNative();
    syncBootNative();
    notify();
  }
  catch (error) {
    console.warn('[settings] no se pudo leer la base de datos', error);
  }
}

/** Aplica los campos LLM tal cual los escribe el usuario. */
export function setLlm(patch: Partial<LlmSettings>) {
  setState(patch);
}

export function updateSsh(patch: Partial<SshProfile>) {
  const ssh = { ...state.ssh, ...patch };
  setState({ ssh: { ...ssh, label: profileLabel(ssh) } });
}

export function setTheme(theme: ThemeMode) {
  setState({ theme });
}

/** Abre/cierra el panel de metricas del chat. */
export function setSidebar(sidebar: boolean) {
  setState({ sidebar });
}


/** Abrir la app sola cuando Android termina de arrancar. */
export function setStartOnBoot(startOnBoot: boolean) {
  setState({ startOnBoot });
  void configureStartOnBoot(startOnBoot);
}

export function setTools(patch: Partial<ToolsSettings>) {
  setState({ tools: { ...state.tools, ...patch } });
  syncPhoneNative();
}

/** Limites efectivos de shell_exec, read, edit, web_fetch y phone (leidos del store). */
export function getToolsConfig(): ToolsConfig {
  const base = toolsDefaults();
  const tools = {
    maxChars: Math.floor(state.tools.maxChars) || base.maxChars,
    maxBytesKb: Math.floor(state.tools.maxBytesKb) || base.maxBytesKb,
  };
  const maxChars = Math.max(200, tools.maxChars);
  const headChars = Math.floor(maxChars * 0.8);
  return {
    ...tools,
    maxChars,
    headChars,
    tailChars: maxChars - headChars,
    maxTimeMs: NO_TIMEOUT_MS,
    maxBytes: Math.max(1, tools.maxBytesKb) * 1024,
  };
}

/**
 * Acceso: cada campo se guarda en cuanto se escribe (el registro sobrevive a
 * un cierre de la app). El token se copia al servidor de voz porque el mismo
 * token autentica chat, voz y rag. `clearAuth()` borra la credencial pero
 * conserva los datos del contacto para no reescribirlos al volver a entrar.
 */
export function setAuth(patch: Partial<AuthState>) {
  setState({ auth: { ...state.auth, ...patch } });
  if (patch.token !== undefined || patch.baseUrl !== undefined) {
    setState({
      voice: { ...state.voice, token: state.auth.token, baseUrl: state.auth.baseUrl },
    });
  }
}

/** Cierra la sesion (borra el token) y deja telefono/nombre guardados. */
export function clearAuth() {
  setAuth({ token: '' });
}

/** Sin token no hay sesion: la app pide login. */
export function hasSession(): boolean {
  return Boolean(state.auth.token);
}

/** Datos para el gate de arranque. */
export function getAuth(): AuthState {
  return state.auth;
}

/** Borra todo de la base y deja la configuracion vacia. */
export function resetSettings() {
  clearGroup(LLM_PREFIX);
  clearGroup(SSH_PREFIX);
  clearGroup(TOOLS_PREFIX);
  clearGroup(UI_PREFIX);
  clearGroup(AUTH_PREFIX);
  clearGroup(VOICE_PREFIX);
  state = emptyState();
  syncBootNative();
  notify();
}


export function updateVoice(patch: Partial<VoiceSettings>) {
  setState({ voice: { ...state.voice, ...patch } });
}

/**
 * El Studio API expone `/tts`, `/stt` y `/embed` en la raiz (no bajo `/v1`):
 * si la URL guardada termina en `/v1` se quita para no pegarle a un 404.
 */
function legacyBase(url: string): string {
  return url.replace(/\/+$/, '').replace(/\/v1$/i, '').replace(/\/+$/, '');
}

/**
 * Servidor de voz tal como esta en la base (unica fuente de verdad): sin
 * valores por defecto en el codigo. Si falta la URL no se puede sintetizar.
 */
export function getVoiceConfig(): VoiceSettings {
  return {
    baseUrl: legacyBase(state.voice.baseUrl.trim()),
    token: state.voice.token,
    gender: state.voice.gender,
    idioma: state.voice.idioma || 'es',
  };
}

/** true si hay servidor de voz configurado en la base. */
export function hasVoiceServer(): boolean {
  return getVoiceConfig().baseUrl.length > 0;
}

/** La conexion SSH usa el mismo tiempo maximo que el comando. */
export function getSshConnectTimeoutMs(): number {
  return getToolsConfig().maxTimeMs;
}

/** Config del chat: base y token de la sesion, modelo fijo del servidor. */
export function getLlmConfig(): LlmConfig | null {
  const token = state.auth.token || state.voice.token;
  const baseUrl = state.auth.baseUrl || state.voice.baseUrl;
  if (!token || !baseUrl) {
    return null;
  }
  return {
    baseUrl,
    token,
    systemPrompt: state.systemPrompt,
  };
}

export function getActiveSshProfile(): SshProfile {
  const ssh = state.ssh;
  if (ssh.port > 0) {
    return ssh;
  }
  // Puerto no configurado: 22 es el default del transporte, no config guardada.
  return { ...ssh, port: 22 };
}

export function hasSsh(): boolean {
  const ssh = state.ssh;
  if (!ssh.host || !ssh.username) {
    return false;
  }
  return ssh.authType === 'key'
    ? Boolean(ssh.privateKey.trim())
    : Boolean(ssh.password);
}

/** Un solo modelo: el historial no se reinicia por cambio de proveedor. */
export function settingsFingerprint(): string {
  return 'studio';
}
