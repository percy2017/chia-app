import { phoneNative } from '../phone/native';
import { encodeBase64 } from './vec';

const TEMP_DIR = '/sdcard/Android/data/com.chianative/files/rag';
const MAX_BYTES = 25 * 1024 * 1024;
const TIMEOUT_MS = 120000;

async function base64Of(response: Response): Promise<string> {
  try {
    const buffer = await response.arrayBuffer();
    return encodeBase64(new Uint8Array(buffer));
  }
  catch {
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('no se pudo leer la descarga'));
      reader.readAsDataURL(blob);
    });
    const comma = dataUrl.indexOf(',');
    if (comma < 0 || dataUrl.length === comma + 1) {
      throw new Error('la descarga vino vacia');
    }
    return dataUrl.slice(comma + 1);
  }
}

export async function downloadToPhone(url: string, name: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ChiaNative',
        Accept: 'application/pdf,application/octet-stream,*/*',
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`la descarga respondio ${response.status}`);
    }
    const declared = Number(response.headers.get('content-length') ?? 0);
    if (declared > MAX_BYTES) {
      throw new Error('el archivo pasa de 25 MB');
    }
    const base64 = await base64Of(response);
    if (base64.length < 8) {
      throw new Error('la descarga vino vacia');
    }
    if (base64.length > (MAX_BYTES / 3) * 4 + 8) {
      throw new Error('el archivo pasa de 25 MB');
    }
    const ext = name.split('.').pop()?.toLowerCase() ?? 'bin';
    const path = `${TEMP_DIR}/chia-rag-${Date.now()}.${ext}`;
    await phoneNative().filesWrite(path, base64, 'base64', false);
    return path;
  }
  finally {
    clearTimeout(timer);
  }
}

export async function removeTempFile(path: string): Promise<void> {
  if (!path) {
    return;
  }
  try {
    await phoneNative().filesDelete(path, false);
  }
  catch {
    // Queda el temporal: no rompe el indexado.
  }
}
