import { webConfig } from './config';

const USER_AGENT
  = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) ChiaNative/1.0 Mobile Safari/537.36';
const ACCEPT
  = 'text/html,application/xhtml+xml,application/json;q=0.9,text/plain;q=0.8,application/pdf;q=0.7,*/*;q=0.5';

export type WebFetchArgs = {
  url: string;
  mode?: string;
  offset?: number;
  find?: string;
};

export type WebFetchOutcome = {
  output: string;
  isError: boolean;
  truncated: boolean;
};

type CacheEntry = {
  at: number;
  outcome: WebFetchOutcome;
};

const cache = new Map<string, CacheEntry>();

const BLOCKED_HOSTS = [
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  '::1',
  '[::1]',
];

function isPrivateHost(host: string): boolean {
  const hostname = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (BLOCKED_HOSTS.includes(hostname) || hostname.endsWith('.local')) {
    return true;
  }
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [
      Number(ipv4[1]),
      Number(ipv4[2]),
    ];
    if (a === 10 || a === 127 || a === 0) {
      return true;
    }
    if (a === 169 && b === 254) {
      return true;
    }
    if (a === 192 && b === 168) {
      return true;
    }
    if (a === 172 && b >= 16 && b <= 31) {
      return true;
    }
    if (a === 100 && b >= 64 && b <= 127) {
      return true;
    }
  }
  if (hostname.startsWith('fc') || hostname.startsWith('fd') || hostname === '::') {
    return hostname.includes(':');
  }
  return false;
}

function validate(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  }
  catch {
    throw new Error(`URL invalida: ${raw}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Solo se permiten URLs http(s): ${parsed.protocol}`);
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new Error(`Host no permitido (red privada o local): ${parsed.hostname}`);
  }
  return parsed;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&ndash;/gi, '-')
    .replace(/&mdash;/gi, '-')
    .replace(/&hellip;/gi, '...');
}

export function htmlToText(html: string): string {
  let text = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ');

  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|header|footer|main|aside|nav|table|tr|blockquote|pre|h[1-6]|ul|ol|form)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<h[1-6][^>]*>/gi, '\n\n')
    .replace(/<hr\s*\/?>/gi, '\n---\n')
    .replace(/<[^>]+>/g, ' ');

  text = decodeEntities(text);

  return text
    .split('\n')
    .map(line => line.replace(/[ \t\u00A0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function slice(content: string, offset: number, find?: string): {
  text: string;
  truncated: boolean;
} {
  if (find && find.trim()) {
    const needle = find.trim().toLowerCase();
    const haystack = content.toLowerCase();
    const config = webConfig();
    const hits: string[] = [];
    let used = 0;
    let index = haystack.indexOf(needle);
    while (index !== -1 && used < config.maxChars) {
      const start = Math.max(0, index - config.findChars);
      const end = Math.min(content.length, index + needle.length + config.findChars);
      const hit = content.slice(start, end).trim();
      hits.push(hit);
      used += hit.length;
      index = haystack.indexOf(needle, index + needle.length);
    }
    if (hits.length === 0) {
      return { text: `(sin coincidencias para "${find}")`, truncated: false };
    }
    return {
      text: hits.map((hit, position) => `--- coincidencia ${position + 1} ---\n${hit}`).join('\n\n'),
      truncated: false,
    };
  }

  const start = Math.max(0, Math.min(offset, content.length));
  const sliceText = content.slice(start, start + webConfig().maxChars);
  const remaining = content.length - start - sliceText.length;
  return { text: sliceText, truncated: remaining > 0 };
}

function remember(url: string, outcome: WebFetchOutcome) {
  cache.set(url, { at: Date.now(), outcome });
}

function cached(url: string): WebFetchOutcome | null {
  return cache.get(url)?.outcome ?? null;
}

function formatResult(
  url: string,
  status: number,
  contentType: string,
  bytes: number,
  body: {
    text: string;
    truncated: boolean;
  },
): WebFetchOutcome {
  const header = [
    `url: ${url}`,
    `status: ${status}`,
    `content_type: ${contentType || 'desconocido'}`,
    `bytes: ${bytes}`,
    `chars: ${body.text.length}`,
    `truncated: ${body.truncated ? 'true' : 'false'}`,
  ];
  if (body.truncated) {
    header.push('nota: contenido cortado; repite la llamada con offset para seguir leyendo o usa find.');
  }
  return {
    output: `${header.join('\n')}\n\n${body.text}`,
    isError: status < 200 || status >= 400,
    truncated: body.truncated,
  };
}

export async function runWebFetch(args: WebFetchArgs): Promise<WebFetchOutcome> {
  const started = Date.now();
  let target: URL;
  try {
    target = validate(args.url);
  }
  catch (error) {
    return {
      output: error instanceof Error ? error.message : String(error),
      isError: true,
      truncated: false,
    };
  }

  const url = target.toString();
  const mode = args.mode === 'raw' ? 'raw' : 'texto';
  const offset = Number.isFinite(args.offset) ? Math.max(0, Number(args.offset)) : 0;
  const cacheKey = `${mode}|${url}`;
  const hit = !args.find && offset === 0 ? cached(cacheKey) : null;
  if (hit) {
    return hit;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), webConfig().timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': ACCEPT,
        'Accept-Language': 'es,en;q=0.8',
      },
    });

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    if (contentType.includes('pdf')) {
      const buffer = await response.arrayBuffer();
      return formatResult(response.url || url, response.status, contentType, buffer.byteLength, {
        text: `PDF de ${buffer.byteLength} bytes. No se puede extraer texto en el dispositivo; pide al usuario el contenido o usa una version HTML del documento.`,
        truncated: false,
      });
    }

    const text = await response.text();
    const bytes = new Blob([text]).size;
    const isHtml = contentType.includes('html') || /^\s*<(!doctype|html)/i.test(text);
    const isJson = contentType.includes('json');
    const isText
      = isJson
        || contentType.startsWith('text/')
        || contentType.includes('xml')
        || contentType.includes('javascript')
        || contentType === '';

    if (mode === 'raw' || isJson || (isText && !isHtml)) {
      const body = slice(text, offset, args.find);
      return formatResult(response.url || url, response.status, contentType, bytes, body);
    }

    if (!isHtml && !isText) {
      return formatResult(response.url || url, response.status, contentType, bytes, {
        text: '(contenido binario: no se muestra)',
        truncated: false,
      });
    }

    const clean = htmlToText(text);
    const body = slice(clean, offset, args.find);
    const outcome = formatResult(response.url || url, response.status, contentType, bytes, body);
    if (offset === 0 && !args.find) {
      remember(cacheKey, outcome);
    }
    return outcome;
  }
  catch (error) {
    const aborted
      = error instanceof Error
        && (error.name === 'AbortError' || controller.signal.aborted);
    const message = aborted
      ? `Tiempo agotado (${webConfig().timeoutMs} ms) al descargar ${url}.`
      : `No se pudo descargar ${url}: ${error instanceof Error ? error.message : String(error)}`;
    return {
      output: `${message}\n(${Date.now() - started} ms)`,
      isError: true,
      truncated: false,
    };
  }
  finally {
    clearTimeout(timer);
  }
}
