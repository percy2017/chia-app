export const STUDIO_BASE_URL = 'https://studio.percyalvarez.lat';

export type AuthErrorCode = 'bad_token' | 'unauthorized' | 'offline' | 'server' | 'quota' | 'exists' | 'datos';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;

  constructor(code: AuthErrorCode, message: string, status = 0) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

const FALLBACK: Record<AuthErrorCode, string> = {
  bad_token: 'Token invalido: revisa que lo copiaste completo.',
  unauthorized: 'El token no sirve o fue regenerado. Pide uno nuevo.',
  offline: 'No se pudo conectar con el Studio API. Revisa tu red.',
  server: 'El Studio API respondio con un error. Intenta mas tarde.',
  quota: 'El Studio API esta sin creditos. Avisa a soporte.',
  exists: 'Ese WhatsApp ya tiene cuenta. Entra con tu llave.',
  datos: 'Revisa los datos: el Studio API los rechazo.',
};

export const TIMEOUT_MS = 15000;
export type FieldResult = { value: string; error: string };
export function normalizeToken(input: string): FieldResult {
  const value = input
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^bearer\s+/i, '')
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
  if (!value) {
    return { value: '', error: 'Falta el token.' };
  }
  if (/\s/.test(value)) {
    return { value, error: 'El token no lleva espacios.' };
  }
  if (value.length < 16) {
    return { value, error: 'El token esta incompleto.' };
  }
  return { value, error: '' };
}

type ErrorBody = { detail?: unknown };

type RawResponse = {
  ok: boolean;
  status: number;
  text: string;
  body: Record<string, unknown>;
};

async function postJson(
  baseUrl: string,
  path: string,
  payload: unknown,
  token?: string,
): Promise<RawResponse> {
  const base = baseUrl.trim().replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : null),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  }
  catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new AuthError(
      'offline',
      aborted ? 'El Studio API no respondio a tiempo.' : FALLBACK.offline,
    );
  }
  finally {
    clearTimeout(timer);
  }
  const text = await response.text().catch(() => '');
  let body: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === 'object') {
      body = parsed as Record<string, unknown>;
    }
  }
  catch {
    // Respuesta en texto plano.
  }
  return { ok: response.ok, status: response.status, text, body };
}

/** Texto util del error del servidor (`{detail:"..."}` o validation). */
function detailOf(text: string): string {
  const body = text.trim();
  if (!body) {
    return '';
  }
  try {
    const parsed = JSON.parse(body) as ErrorBody;
    if (typeof parsed.detail === 'string') {
      return parsed.detail;
    }
  }
  catch {
    // Respuesta en texto plano.
  }
  return body.slice(0, 300);
}

export async function verificarToken(
  token: string,
  baseUrl = STUDIO_BASE_URL,
): Promise<void> {
  const base = baseUrl.trim().replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${base}/embed`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ texto: 'ping', tipo: 'consulta' }),
      signal: controller.signal,
    });
  }
  catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new AuthError(
      'offline',
      aborted ? 'El Studio API no respondio a tiempo.' : FALLBACK.offline,
    );
  }
  finally {
    clearTimeout(timer);
  }

  if (response.ok) {
    return;
  }
  const text = await response.text().catch(() => '');
  const detail = detailOf(text);
  if (response.status === 401 || response.status === 403) {
    throw new AuthError('unauthorized', detail || FALLBACK.unauthorized, response.status);
  }
  if (response.status === 402 || /quota|credit/i.test(text)) {
    throw new AuthError('quota', detail || FALLBACK.quota, response.status);
  }
  throw new AuthError('server', detail || FALLBACK.server, response.status);
}

export type RegistroDatos = {
  nombre: string;
  whatsapp: string;
  email?: string;
  suscripcion?: string;
};

export async function registrarUsuario(
  baseUrl = STUDIO_BASE_URL,
  datos: RegistroDatos,
): Promise<string> {
  const base = baseUrl.trim().replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${base}/usuarios`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        nombre: datos.nombre,
        whatsapp: datos.whatsapp,
        email: datos.email || null,
        suscripcion: datos.suscripcion || 'free',
      }),
      signal: controller.signal,
    });
  }
  catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new AuthError(
      'offline',
      aborted ? 'El Studio API no respondio a tiempo.' : FALLBACK.offline,
    );
  }
  finally {
    clearTimeout(timer);
  }

  const text = await response.text().catch(() => '');
  let body: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === 'object') {
      body = parsed as Record<string, unknown>;
    }
  }
  catch {
    // Respuesta en texto plano.
  }
  const token = typeof body.token === 'string' ? body.token.trim() : '';

  if (response.ok) {
    if (!token) {
      throw new AuthError('server', 'El Studio API creo la cuenta pero no devolvio el token.');
    }
    return token;
  }

  const detail = detailOf(text);
  if (response.status === 409 || /ya existe|duplicad|registrad/i.test(text)) {
    const numero = datos.whatsapp.trim();
    throw new AuthError(
      'exists',
      numero
        ? `El WhatsApp ${numero} ya esta registrado. Entra con tu llave o usa otro numero.`
        : FALLBACK.exists,
      response.status,
    );
  }
  if (response.status === 422 || response.status === 400) {
    throw new AuthError('datos', detail || FALLBACK.datos, response.status);
  }
  if (response.status === 401 || response.status === 403) {
    throw new AuthError('unauthorized', detail || FALLBACK.unauthorized, response.status);
  }
  throw new AuthError('server', detail || FALLBACK.server, response.status);
}

export async function pedirPin(
  whatsapp: string,
  baseUrl = STUDIO_BASE_URL,
): Promise<void> {
  const result = await postJson(baseUrl, '/usuarios/recuperar-token', {
    whatsapp: whatsapp.trim(),
  });
  if (result.ok) {
    return;
  }
  const detail = detailOf(result.text);
  if (result.status === 400 || result.status === 404 || result.status === 422) {
    throw new AuthError('datos', detail || FALLBACK.datos, result.status);
  }
  if (result.status === 401 || result.status === 403) {
    throw new AuthError('unauthorized', detail || FALLBACK.unauthorized, result.status);
  }
  throw new AuthError('server', detail || FALLBACK.server, result.status);
}

export async function confirmarPin(
  whatsapp: string,
  pin: string,
  baseUrl = STUDIO_BASE_URL,
  regenerar = true,
): Promise<string> {
  const result = await postJson(baseUrl, '/usuarios/confirmar-pin', {
    whatsapp: whatsapp.trim(),
    pin: pin.trim(),
    regenerar,
  });
  const token = typeof result.body.token === 'string' ? result.body.token.trim() : '';
  if (result.ok) {
    if (!token) {
      throw new AuthError('server', 'El Studio API valido el PIN pero no devolvio la llave.');
    }
    return token;
  }
  const detail = detailOf(result.text);
  if (
    result.status === 400
    || result.status === 401
    || result.status === 403
    || result.status === 410
    || result.status === 422
  ) {
    throw new AuthError('datos', detail || 'El Studio API rechazo el PIN.', result.status);
  }
  throw new AuthError('server', detail || FALLBACK.server, result.status);
}

export function authMessage(error: unknown): string {
  if (error instanceof AuthError) {
    return error.message || FALLBACK[error.code];
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return FALLBACK.server;
}
