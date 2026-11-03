
export const PHONE_ACTIONS = [
  'specs',
  'sensors.read',
  'location.once',
  'torch',
  'clipboard.get',
  'clipboard.set',
  'apps.list',
  'apps.open',
  'apps.info',
  'apps.settings',
  'apps.uninstall',
  'apps.store',
  'apps.usage',
  'apps.usageSettings',
  'url.open',
  'vibrate',
  'perm.request',
  'notifications.list',
  'notifications.settings',
  'media.sessions',
  'media.state',
  'media.control',
  'media.volume',
  'files.list',
  'files.stat',
  'files.mkdir',
  'files.delete',
  'files.move',
  'files.search',
  'files.settings',
  'net.scan',
  'net.probe',
  'net.dns',
  'net.http',
  'net.wifi.scan',
  'bt.status',
  'bt.list',
  'bt.scan',
  'bt.pair',
  'bt.connect',
  'bt.disconnect',
  'bt.enable',
  'bt.settings',
] as const;

export type PhoneAction = (typeof PHONE_ACTIONS)[number];

export type PhoneArgs = {
  action: PhoneAction;
  args: Record<string, unknown>;
};

function stringArg(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  return typeof value === 'string' ? value.trim() : '';
}

function numberArg(
  args: Record<string, unknown>,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = args[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function booleanArg(args: Record<string, unknown>, key: string): boolean {
  const value = args[key];
  if (typeof value === 'boolean') {
    return value;
  }
  return value === 'true' || value === 1;
}

/** `package` con alias: los modelos mandan package, pkg o app. */
function packageArg(args: Record<string, unknown>): string {
  return stringArg(args, 'package') || stringArg(args, 'pkg') || stringArg(args, 'app');
}

const MEDIA_COMMANDS: Record<string, string> = {
  play: 'play',
  resume: 'play',
  pause: 'pause',
  stop: 'stop',
  toggle: 'toggle',
  playpause: 'toggle',
  next: 'next',
  skip: 'next',
  prev: 'prev',
  previous: 'prev',
  backward: 'prev',
  seek: 'seek',
  seekto: 'seek',
};

function mediaCommand(raw: string): string {
  return MEDIA_COMMANDS[raw.toLowerCase()] ?? '';
}

export function parsePhoneArgs(raw: string): PhoneArgs | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || '{}');
  }
  catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const action = typeof record.action === 'string' ? record.action.trim() : '';
  if (!(PHONE_ACTIONS as readonly string[]).includes(action)) {
    return null;
  }
  const inner = record.args;
  let args: Record<string, unknown>;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    args = inner as Record<string, unknown>;
  }
  else if (typeof inner === 'string') {
    // Algunos modelos doble-codifican el objeto de argumentos.
    try {
      const decoded = JSON.parse(inner);
      args = decoded && typeof decoded === 'object'
        ? (decoded as Record<string, unknown>)
        : {};
    }
    catch {
      args = {};
    }
  }
  else {
    // Tambien se aceptan los campos planos: {"action":"torch","on":true}.
    args = { ...record };
    delete args.action;
  }
  // Se normalizan aqui para que el despacho (index.ts) no repita validacion.
  switch (action) {
    case 'specs': {
      const section = stringArg(args, 'section').toLowerCase();
      return {
        action,
        args: { section: section || 'all' },
      };
    }
    case 'sensors.read': {
      const sensor = stringArg(args, 'sensor').toLowerCase();
      if (!sensor) {
        return null;
      }
      return {
        action,
        args: {
          sensor,
          seconds: numberArg(args, 'seconds', 2, 1, 10),
        },
      };
    }
    case 'location.once':
      return {
        action,
        args: { timeoutSec: numberArg(args, 'timeoutSec', 15, 3, 30) },
      };
    case 'torch':
      return { action, args: { on: booleanArg(args, 'on') } };
    case 'clipboard.get':
      return { action, args: {} };
    case 'clipboard.set': {
      const text = stringArg(args, 'text');
      if (!text) {
        return null;
      }
      return { action, args: { text } };
    }
    case 'apps.list':
      return {
        action,
        args: { limit: numberArg(args, 'limit', 120, 1, 500) },
      };
    case 'apps.open': {
      const pkg = packageArg(args);
      if (!pkg) {
        return null;
      }
      return { action, args: { package: pkg } };
    }
    case 'apps.info':
    case 'apps.settings':
    case 'apps.uninstall':
    case 'apps.store': {
      const pkg = packageArg(args);
      if (!pkg) {
        return null;
      }
      return { action, args: { package: pkg } };
    }
    case 'apps.usage':
      return {
        action,
        args: {
          days: numberArg(args, 'days', 1, 1, 30),
          limit: numberArg(args, 'limit', 40, 1, 200),
        },
      };
    case 'apps.usageSettings':
      return { action, args: {} };
    case 'url.open': {
      const url = stringArg(args, 'url');
      if (!/^https?:\/\//i.test(url)) {
        return null;
      }
      return { action, args: { url } };
    }
    case 'vibrate':
      return {
        action,
        args: { ms: numberArg(args, 'ms', 200, 10, 2000) },
      };
    case 'perm.request': {
      const permission = stringArg(args, 'permission').toLowerCase();
      if (
        permission !== 'location'
        && permission !== 'camera'
        && permission !== 'wifi'
        && permission !== 'bluetooth'
      ) {
        return null;
      }
      return { action, args: { permission } };
    }
    case 'notifications.list':
      return {
        action,
        args: {
          limit: numberArg(args, 'limit', 50, 1, 200),
          filter: stringArg(args, 'filter') || stringArg(args, 'query'),
          includeRemoved: booleanArg(args, 'includeRemoved'),
        },
      };
    case 'notifications.settings':
      return { action, args: {} };
    case 'media.sessions':
      return { action, args: {} };
    case 'media.state':
      return { action, args: { package: packageArg(args) } };
    case 'media.control': {
      const command = mediaCommand(stringArg(args, 'action') || stringArg(args, 'command'));
      if (!command) {
        return null;
      }
      return {
        action,
        args: {
          command,
          package: packageArg(args),
          positionMs: numberArg(args, 'positionMs', 0, 0, 24 * 3600 * 1000),
        },
      };
    }
    case 'media.volume': {
      const command = stringArg(args, 'action') || stringArg(args, 'command') || 'up';
      if (!['up', 'down', 'mute', 'unmute', 'set'].includes(command)) {
        return null;
      }
      return {
        action,
        args: { command, percent: numberArg(args, 'percent', 50, 0, 100) },
      };
    }
    case 'files.list': {
      const path = stringArg(args, 'path');
      if (!path) {
        return null;
      }
      return {
        action,
        args: {
          path,
          limit: numberArg(args, 'limit', 200, 1, 500),
          showHidden: booleanArg(args, 'showHidden'),
        },
      };
    }
    case 'files.stat': {
      const path = stringArg(args, 'path');
      if (!path) {
        return null;
      }
      return { action, args: { path } };
    }
    case 'files.mkdir': {
      const path = stringArg(args, 'path');
      if (!path) {
        return null;
      }
      return { action, args: { path } };
    }
    case 'files.delete': {
      const path = stringArg(args, 'path');
      if (!path) {
        return null;
      }
      return { action, args: { path, recursive: booleanArg(args, 'recursive') } };
    }
    case 'files.move': {
      const from = stringArg(args, 'from');
      const to = stringArg(args, 'to');
      if (!from || !to) {
        return null;
      }
      return {
        action,
        args: { from, to, overwrite: booleanArg(args, 'overwrite'), copy: booleanArg(args, 'copy') },
      };
    }
    case 'files.search': {
      const path = stringArg(args, 'path');
      const query = stringArg(args, 'query') || stringArg(args, 'name');
      if (!path || !query) {
        return null;
      }
      return {
        action,
        args: {
          path,
          query,
          limit: numberArg(args, 'limit', 80, 1, 500),
          maxDepth: numberArg(args, 'maxDepth', 6, 1, 12),
          showHidden: booleanArg(args, 'showHidden'),
        },
      };
    }
    case 'files.settings':
      return { action, args: {} };
    case 'net.scan': {
      const subnet = stringArg(args, 'subnet');
      if (subnet && !/^\d{1,3}(\.\d{1,3}){0,3}(\/\d{1,2})?$/.test(subnet)) {
        return null;
      }
      const ports = stringArg(args, 'ports');
      if (ports && !/^[\d,\s]+$/.test(ports)) {
        return null;
      }
      return {
        action,
        args: {
          subnet,
          ports,
          timeoutMs: numberArg(args, 'timeoutMs', 400, 120, 3000),
        },
      };
    }
    case 'net.probe': {
      const host = stringArg(args, 'host');
      if (!host || /[\s/]/.test(host)) {
        return null;
      }
      return {
        action,
        args: {
          host,
          port: numberArg(args, 'port', 5555, 1, 65535),
          timeoutMs: numberArg(args, 'timeoutMs', 1500, 200, 5000),
        },
      };
    }
    case 'net.dns': {
      const host = stringArg(args, 'host');
      if (!host || /\s/.test(host)) {
        return null;
      }
      return { action, args: { host } };
    }
    case 'net.http': {
      const url = stringArg(args, 'url');
      if (!/^https?:\/\//i.test(url)) {
        return null;
      }
      const method = (stringArg(args, 'method') || 'GET').toUpperCase();
      if (!['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH'].includes(method)) {
        return null;
      }
      const rawHeaders = args.headers;
      const headers: Record<string, string> = {};
      if (rawHeaders && typeof rawHeaders === 'object' && !Array.isArray(rawHeaders)) {
        for (const [key, value] of Object.entries(rawHeaders as Record<string, unknown>)) {
          if (typeof value === 'string') {
            headers[key] = value;
          }
        }
      }
      return {
        action,
        args: {
          url,
          method,
          headers,
          body: typeof args.body === 'string' ? args.body : '',
          timeoutSec: numberArg(args, 'timeoutSec', 10, 1, 60),
        },
      };
    }
    case 'net.wifi.scan':
      return { action, args: {} };
    case 'bt.status':
    case 'bt.list':
    case 'bt.settings':
      return { action, args: {} };
    case 'bt.scan':
      return {
        action,
        args: { seconds: numberArg(args, 'seconds', 10, 3, 30) },
      };
    case 'bt.pair':
    case 'bt.connect':
    case 'bt.disconnect': {
      const address = stringArg(args, 'address').toUpperCase();
      if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(address)) {
        return null;
      }
      return { action, args: { address } };
    }
    case 'bt.enable':
      return { action, args: { on: booleanArg(args, 'on') } };
    default:
      return null;
  }
}
