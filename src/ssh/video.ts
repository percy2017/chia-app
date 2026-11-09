import type { ChatImage } from '../llm/types';
import { getAuth } from '../settings/store';

export type VideoDescription = {
  descripcion: string;
  transcripcion: string;
  duracion: number;
  celdas: number;
  cada: number;
  segundosProceso: number;
  /** Hoja de contactos que miro el modelo (miniatura para el chat). */
  hoja?: ChatImage;
};

const VIDEO_EXTENSIONS = [
  'mp4',
  'mkv',
  'mov',
  'webm',
  'm4v',
  'avi',
  '3gp',
  'mpg',
  'mpeg',
  'flv',
  'ts',
];

/** Tope de la llamada: el servidor tarda ~1,2x el largo del video (whisper.cpp). */
const VIDEO_TIMEOUT_MS = 900000;

export function isVideoPath(path: string): boolean {
  const limpio = path.split('#')[0].split('?')[0];
  const ext = limpio.split('.').pop()?.toLowerCase() ?? '';
  return VIDEO_EXTENSIONS.includes(ext);
}

export function isRemoteUrl(path: string): boolean {
  return /^https?:\/\//i.test(path.trim());
}

type HojaRespuesta = {
  b64?: unknown;
  ancho?: unknown;
  alto?: unknown;
};

type Respuesta = {
  descripcion?: unknown;
  transcripcion_texto?: unknown;
  transcripcion?: unknown;
  hoja?: HojaRespuesta;
  metadata?: {
    duracion?: unknown;
    celdas?: unknown;
    cada?: unknown;
    segundos_proceso?: unknown;
  };
  detail?: unknown;
};

function hojaDe(body: Respuesta): ChatImage | undefined {
  const b64 = typeof body.hoja?.b64 === 'string' ? body.hoja.b64 : '';
  if (!b64) {
    return undefined;
  }
  const ancho = Number(body.hoja?.ancho ?? 0);
  const alto = Number(body.hoja?.alto ?? 0);
  return {
    mimeType: 'image/jpeg',
    data: b64,
    width: ancho > 0 ? ancho : undefined,
    height: alto > 0 ? alto : undefined,
    layout: 'contain',
  };
}

function detalle(body: Respuesta, status: number): string {
  const raw = body.detail ?? body.descripcion ?? '';
  const texto = typeof raw === 'string' ? raw : JSON.stringify(raw);
  return `${status}: ${texto.slice(0, 300) || 'sin detalle'}`;
}

/**
 * Describe un video con la API del Studio (`POST /video`): el servidor saca los
 * fotogramas, transcribe el audio y devuelve el texto. Aca no viaja el video.
 */
export async function describeVideo(path: string): Promise<VideoDescription> {
  const auth = getAuth();
  if (!auth.baseUrl || !auth.token) {
    throw new Error('Entra con tu token: el video usa la misma sesion que el chat.');
  }
  const url = `${auth.baseUrl.replace(/\/+$/, '')}/video?hoja=true`;
  const cuerpo = isRemoteUrl(path) ? { url: path.trim() } : { path: path.trim() };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VIDEO_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(cuerpo),
      signal: controller.signal,
    });
    const texto = await response.text();
    let body: Respuesta = {};
    try {
      body = JSON.parse(texto) as Respuesta;
    }
    catch {
      if (response.ok) {
        throw new Error(`respuesta ilegible del servidor: ${texto.slice(0, 200)}`);
      }
    }
    if (!response.ok) {
      throw new Error(detalle(body, response.status));
    }
    const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
    if (!descripcion) {
      throw new Error('la api devolvio el video sin descripcion');
    }
    const transcripcion = typeof body.transcripcion_texto === 'string'
      ? body.transcripcion_texto.trim()
      : (Array.isArray(body.transcripcion)
        ? body.transcripcion
            .map((seg) => {
              const item = seg as { t?: unknown; texto?: unknown };
              return typeof item.texto === 'string' ? item.texto.trim() : '';
            })
            .filter(Boolean)
            .join('\n')
        : '');
    return {
      descripcion,
      transcripcion,
      duracion: Number(body.metadata?.duracion ?? 0),
      celdas: Number(body.metadata?.celdas ?? 0),
      cada: Number(body.metadata?.cada ?? 0),
      segundosProceso: Number(body.metadata?.segundos_proceso ?? 0),
      hoja: hojaDe(body),
    };
  }
  catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('el servidor tardo mas de 15 minutos con el video');
    }
    throw error;
  }
  finally {
    clearTimeout(timer);
  }
}

/** Texto que recibe el modelo al leer un video. */
export function formatVideo(video: VideoDescription, nombre: string): string {
  const cabeza = [
    `[video] ${nombre}`,
    `${video.duracion.toFixed(1)} s`,
    `${video.celdas} fotogramas cada ${video.cada} s`,
    `procesado en ${video.segundosProceso} s`,
  ].join(' · ');
  const partes = [cabeza, '', video.descripcion];
  if (video.transcripcion) {
    partes.push('', 'TRANSCRIPCION:', video.transcripcion);
  }
  return partes.join('\n');
}
