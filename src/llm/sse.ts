const PROCESS_MS = 50;
const IDLE_TIMEOUT_MS = 180000;

export type SseEvent = {
  event?: string;
  data: string;
};

type SseOptions = {
  url: string;
  headers: Record<string, string>;
  body: unknown;
  onEvent: (event: SseEvent) => void;
  onError: (message: string) => void;
  onDone: () => void;
  idleTimeoutMs?: number;
};

export type SseHandle = {
  abort: () => void;
};

/** Texto legible de un error del servidor: nunca el JSON crudo. */
export function chatErrorMessage(status: number, detail: string): string {
  const text = detail.trim();
  const quota = status === 429 || /cuota|credito|llamadas/i.test(text);
  if (quota) {
    const minutes = text.match(/(\d+)\s*h\s*(\d+)?\s*min/i);
    const rest = minutes ? ` en ${minutes[1]} h ${minutes[2] ?? '00'} min` : '';
    return `Se agotaron las llamadas de tu plan por hoy. Se renueva${rest} o cambia de plan.`;
  }
  if (status === 402) {
    return 'El Studio API esta sin creditos. Avisa a soporte.';
  }
  if (status === 401 || status === 403) {
    return 'Tu llave no es valida o fue regenerada. Volve a entrar con una llave nueva.';
  }
  if (status === 413) {
    return text
      ? `La conversacion es demasiado larga: ${text.slice(0, 200)}`
      : 'La conversacion es demasiado larga para el servidor.';
  }
  if (status === 422) {
    return text
      ? `El servidor rechazo el pedido: ${text.slice(0, 200)}`
      : 'El servidor rechazo el pedido: faltan mensajes.';
  }
  if (status >= 500) {
    return `El servidor fallo (HTTP ${status}). Intenta de nuevo en un momento.`;
  }
  if (text) {
    return `El servidor rechazo el mensaje: ${text.slice(0, 200)}`;
  }
  return status > 0
    ? `El servidor rechazo el mensaje (HTTP ${status}).`
    : 'El servidor corto el stream con un error.';
}

/** Extrae `status` y el detalle de un cuerpo JSON de error, con cualquier nombre. */
export function errorFromBody(body: unknown): { status: number; detail: string } {
  if (typeof body !== 'object' || body === null) {
    return { status: 0, detail: '' };
  }
  const raw = body as Record<string, unknown>;
  const nested = typeof raw.error === 'object' && raw.error !== null
    ? (raw.error as Record<string, unknown>)
    : raw;
  const status = typeof nested.status === 'number'
    ? nested.status
    : (typeof raw.status === 'number' ? raw.status : 0);
  for (const key of ['detalle', 'detail', 'message', 'error']) {
    const value = nested[key];
    if (typeof value === 'string' && value.trim()) {
      return { status, detail: value };
    }
  }
  return { status, detail: '' };
}

function httpMessage(status: number, body: string): string {
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(body);
  }
  catch {
    // respuesta en texto plano
  }
  const info = parsed ? errorFromBody(parsed) : { status: 0, detail: body.trim() };
  return chatErrorMessage(status, info.detail);
}

function parseBlock(block: string): SseEvent | null {
  let event: string | undefined;
  const data: string[] = [];

  for (const rawLine of block.split('\n')) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith(':')) {
      continue;
    }
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      data.push(line.slice(5).trimStart());
    }
  }

  if (data.length === 0) {
    return null;
  }
  return { event, data: data.join('\n') };
}

export function streamSse(options: SseOptions): SseHandle {
  const { url, headers, body, onEvent, onError, onDone } = options;
  const idleMs = options.idleTimeoutMs ?? IDLE_TIMEOUT_MS;
  const xhr = new XMLHttpRequest();
  let consumed = 0;
  let buffer = '';
  let finished = false;
  let lastProcess = 0;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const clearIdle = () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const finish = (error?: string) => {
    clearIdle();
    if (finished) {
      return;
    }
    finished = true;
    if (error) {
      onError(error);
    }
    else {
      onDone();
    }
  };

  const drain = (force: boolean) => {
    const blocks = buffer.split('\n\n');
    buffer = force ? '' : blocks.pop() ?? '';
    for (const block of blocks) {
      const event = parseBlock(block);
      if (event) {
        onEvent(event);
      }
    }
  };

  const process = (force = false) => {
    const now = Date.now();
    if (!force && now - lastProcess < PROCESS_MS) {
      return;
    }
    lastProcess = now;
    const text = xhr.responseText ?? '';
    if (text.length <= consumed) {
      return;
    }
    buffer += text.slice(consumed);
    consumed = text.length;
    buffer = buffer.replace(/\r\n/g, '\n');
    drain(false);
  };

  const armIdle = () => {
    clearIdle();
    idleTimer = setTimeout(() => {
      if (finished) {
        return;
      }
      const error = `El servidor dejo de responder (${Math.round(idleMs / 1000)} s sin datos). Intenta de nuevo.`;
      finish(error);
      xhr.abort();
    }, idleMs);
  };

  xhr.open('POST', url);
  for (const [key, value] of Object.entries(headers)) {
    xhr.setRequestHeader(key, value);
  }

  xhr.onprogress = () => {
    process();
    if (!finished) {
      armIdle();
    }
  };
  xhr.onload = () => {
    process(true);
    if (buffer.trim()) {
      drain(true);
    }
    if (finished) {
      return;
    }
    if (xhr.status >= 200 && xhr.status < 300) {
      finish();
      return;
    }
    finish(httpMessage(xhr.status, xhr.responseText ?? ''));
  };
  xhr.onerror = () => finish('Sin conexion con el servidor del chat.');
  xhr.onabort = () => finish();
  xhr.ontimeout = () => finish('Tiempo de espera agotado.');

  armIdle();
  xhr.send(JSON.stringify(body));

  return {
    abort: () => {
      clearIdle();
      if (!finished) {
        xhr.abort();
      }
    },
  };
}
