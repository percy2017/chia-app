import { TIMEOUT_MS } from './api';
export type UsageTotal = {
  creditos: number;
  ok: number;
  errores: number;
  tokensTotal: number;
  caracteres: number;
  segAudio: number;
  items: number;
  primeraLlamada: number;
  ultimaLlamada: number;
};

export type ServiceUsage = {
  creditos: number;
  errores: number;
  tokensIn: number;
  tokensOut: number;
  tokensTotal: number;
  caracteres: number;
  segAudio: number;
  items: number;
  ultimoUso: number;
};

export type EndpointUsage = {
  endpoint: string;
  metodo: string;
  creditos: number;
  errores: number;
};

export type Subscription = {
  id: string;
  nombre: string;
  precioUsd: number;
  creditosDia: number;
  usadoHoy: number;
  restante: number;
  /** Fin del mes de suscripcion (epoch ms). */
  vence: number;
};

export type UserProfile = {
  id: string;
  nombre: string;
  whatsapp: string;
  email: string;
  activo: boolean;
  creado: number;
  actualizado: number;
  ultimoUso: number;
  avatar: boolean;
  avatarActualizado: number;
  avatarUrl: string;
  planId: string;
  plan: Subscription | null;
  token: string;
  total: UsageTotal;
  ultimos30: UsageTotal;
  servicios: Record<string, ServiceUsage>;
  servicios30: Record<string, ServiceUsage>;
  endpoints: EndpointUsage[];
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function toTotal(value: unknown): UsageTotal {
  const raw = record(value);
  return {
    creditos: number(raw.creditos ?? raw.llamadas),
    ok: number(raw.ok),
    errores: number(raw.errores),
    tokensTotal: number(raw.tokens_total),
    caracteres: number(raw.caracteres),
    segAudio: number(raw.seg_audio),
    items: number(raw.items),
    primeraLlamada: number(raw.primera_llamada),
    ultimaLlamada: number(raw.ultima_llamada),
  };
}

function toService(value: unknown): ServiceUsage {
  const raw = record(value);
  return {
    creditos: number(raw.creditos ?? raw.llamadas),
    errores: number(raw.errores),
    tokensIn: number(raw.tokens_in),
    tokensOut: number(raw.tokens_out),
    tokensTotal: number(raw.tokens_total),
    caracteres: number(raw.caracteres),
    segAudio: number(raw.seg_audio),
    items: number(raw.items),
    ultimoUso: number(raw.ultimo_uso),
  };
}

function toServices(value: unknown): Record<string, ServiceUsage> {
  const out: Record<string, ServiceUsage> = {};
  for (const [key, item] of Object.entries(record(value))) {
    out[key] = toService(item);
  }
  return out;
}

function toSubscription(value: unknown): Subscription | null {
  const raw = record(value);
  const id = text(raw.suscripcion_id);
  if (!id) {
    return null;
  }
  return {
    id,
    nombre: text(raw.nombre),
    precioUsd: number(raw.precio_usd),
    creditosDia: number(raw.creditos_dia ?? raw.llamadas_dia),
    vence: number(raw.vence_at),
    usadoHoy: number(raw.usado_hoy),
    restante: number(raw.restante),
  };
}

const SERVICIOS = ['/chat', '/tts', '/stt', '/embed'];

function esServicio(endpoint: string): boolean {
  return SERVICIOS.some(prefijo => endpoint.startsWith(prefijo));
}

function toEndpoints(value: unknown): EndpointUsage[] {
  return Array.isArray(value)
    ? value
        .map((item) => {
          const raw = record(item);
          return {
            endpoint: text(raw.endpoint),
            metodo: text(raw.metodo).toUpperCase(),
            creditos: number(raw.creditos ?? raw.llamadas),
            errores: number(raw.errores),
          };
        })
        .filter(item => item.endpoint && esServicio(item.endpoint))
    : [];
}

/** Solo los servicios cobrados (la gestion de la cuenta no se cobra). */
function toServicios(raw: unknown): Record<string, ServiceUsage> {
  const out: Record<string, ServiceUsage> = {};
  for (const [key, item] of Object.entries(toServices(raw))) {
    if (item.creditos > 0 && key !== 'otros') {
      out[key] = item;
    }
  }
  return out;
}

function toProfile(raw: unknown): UserProfile {
  const body = record(raw);
  const metricas = record(body.metricas);
  const avatarUrl = text(body.avatar_url) || text(body.avatar_data_uri);
  return {
    id: text(body.id),
    nombre: text(body.nombre),
    whatsapp: text(body.whatsapp),
    email: text(body.email),
    activo: body.activo === true,
    creado: number(body.created_at),
    actualizado: number(body.updated_at),
    ultimoUso: number(body.ultimo_uso),
    avatar: body.avatar === true,
    avatarActualizado: number(body.avatar_actualizado),
    avatarUrl,
    planId: text(body.suscripcion_id),
    plan: toSubscription(body.suscripcion),
    token: text(body.token),
    total: toTotal(metricas.total),
    ultimos30: toTotal(metricas.ultimos_30_dias),
    servicios: toServicios(metricas.por_servicio),
    servicios30: toServicios(metricas.por_servicio_30d),
    endpoints: toEndpoints(metricas.endpoints),
  };
}

export async function fetchProfile(
  baseUrl: string,
  token: string,
): Promise<UserProfile> {
  const base = baseUrl.trim().replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${base}/usuarios/yo`, {
      headers: { accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
  }
  catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new Error(aborted
      ? 'El Studio API no respondio a tiempo.'
      : 'No se pudo conectar con el Studio API.');
  }
  finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    let detail = raw.trim().slice(0, 300);
    try {
      const parsed = JSON.parse(raw) as { detail?: unknown };
      if (typeof parsed.detail === 'string') {
        detail = parsed.detail;
      }
    }
    catch {
      // Texto plano.
    }
    throw new Error(detail || `El Studio API respondio HTTP ${response.status}.`);
  }

  return toProfile(await response.json());
}

export async function actualizarAvatar(
  baseUrl: string,
  token: string,
  usuarioId: string,
): Promise<void> {
  const base = baseUrl.trim().replace(/\/+$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${base}/usuarios/${encodeURIComponent(usuarioId)}`, {
      method: 'PATCH',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ actualizar_avatar: true }),
      signal: controller.signal,
    });
  }
  catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new Error(aborted
      ? 'El Studio API no respondio a tiempo.'
      : 'No se pudo conectar con el Studio API.');
  }
  finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    let detail = raw.trim().slice(0, 300);
    try {
      const parsed = JSON.parse(raw) as { detail?: unknown };
      if (typeof parsed.detail === 'string') {
        detail = parsed.detail;
      }
    }
    catch {
      // Texto plano.
    }
    throw new Error(detail || `El Studio API respondio HTTP ${response.status}.`);
  }
}
