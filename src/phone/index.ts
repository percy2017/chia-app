import type { PhoneArgs } from './args';

import Clipboard from '@react-native-clipboard/clipboard';

import { getToolsConfig } from '../settings/store';
import { phoneNative } from './native';

export type PhoneOutcome = {
  output: string;
  exitCode: number;
  durationMs: number;
  isError: boolean;
};

export function phoneCommand(args: PhoneArgs): string {
  return `android_phone ${args.action}`;
}

function truncate(text: string, maxChars: number): string {
  if (maxChars > 0 && text.length > maxChars) {
    return `${text.slice(0, maxChars)}\n[truncated]`;
  }
  return text;
}

function pretty(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 1);
  }
  catch {
    return raw;
  }
}

async function dispatch(args: PhoneArgs): Promise<string> {
  const native = phoneNative();
  const a = args.args;

  switch (args.action) {
    case 'specs':
      return pretty(await native.specs(String(a.section ?? 'all')));

    case 'sensors.read':
      return pretty(await native.sensorsRead(String(a.sensor), Number(a.seconds ?? 2)));

    case 'location.once':
      return pretty(await native.locationOnce(Number(a.timeoutSec ?? 15)));

    case 'torch': {
      const on = await native.torch(Boolean(a.on));
      return JSON.stringify({ torch: on ? 'encendida' : 'apagada', ok: on });
    }

    case 'clipboard.get': {
      // Android 10+ devuelve vacio si la app no esta en primer plano.
      const text = await Clipboard.getString();
      const maxChars = getToolsConfig().maxChars;
      return JSON.stringify({ chars: text.length, text: text.slice(0, maxChars) });
    }
    case 'clipboard.set': {
      Clipboard.setString(String(a.text ?? ''));
      return JSON.stringify({ ok: true, chars: String(a.text ?? '').length });
    }

    case 'apps.list':
      return pretty(await native.listApps(Number(a.limit ?? 120)));

    case 'apps.open': {
      const pkg = String(a.package);
      await native.openApp(pkg);
      return JSON.stringify({ ok: true, package: pkg });
    }

    case 'apps.info':
      return pretty(await native.appInfo(String(a.package)));

    case 'apps.settings': {
      const pkg = String(a.package);
      await native.appSettings(pkg);
      return JSON.stringify({
        ok: true,
        package: pkg,
        pantalla: 'Ajustes de la app (forzar detencion, borrar datos, permisos, desinstalar)',
      });
    }

    case 'apps.uninstall': {
      const pkg = String(a.package);
      await native.uninstallApp(pkg);
      return JSON.stringify({
        ok: true,
        package: pkg,
        nota: 'se abrio el dialogo del sistema: el usuario tiene que confirmar',
      });
    }

    case 'apps.store': {
      const target = await native.openStore(String(a.package));
      return JSON.stringify({ ok: true, package: String(a.package), abierto: target });
    }

    case 'apps.usage':
      return pretty(await native.appsUsage(
        Number(a.days ?? 1),
        Number(a.limit ?? 40),
      ));

    case 'apps.usageSettings': {
      await native.usageSettings();
      return JSON.stringify({
        ok: true,
        pantalla: 'Ajustes > Acceso a datos de uso > ChiaNative',
        nota: 'el usuario debe activar el acceso; despues reintentar apps.usage',
      });
    }

    case 'url.open': {
      const url = String(a.url);
      await native.openUrl(url);
      return JSON.stringify({ ok: true, url });
    }

    case 'vibrate': {
      const ms = Number(a.ms ?? 200);
      await native.vibrate(ms);
      return JSON.stringify({ ok: true, ms });
    }

    case 'perm.request': {
      const asked = await native.requestPermission(String(a.permission));
      return JSON.stringify({
        dialog: asked,
        permission: String(a.permission),
        nota: asked
          ? 'se abrio el dialogo del sistema; el usuario debe aceptar y hay que reintentar la accion'
          : 'no hay actividad en primer plano para pedir el permiso',
      });
    }

    case 'notifications.list':
      return pretty(await native.notificationsList(
        Number(a.limit ?? 50),
        String(a.filter ?? ''),
        Boolean(a.includeRemoved),
      ));

    case 'notifications.settings': {
      await native.notificationsSettings();
      return JSON.stringify({
        ok: true,
        pantalla: 'Ajustes > Acceso a notificaciones > ChiaNative',
        nota: 'el usuario debe activar el acceso; despues reintentar notifications.list',
      });
    }

    case 'media.sessions':
      return pretty(await native.mediaSessions());

    case 'media.state':
      return pretty(await native.mediaState(String(a.package ?? '')));

    case 'media.control': {
      const pkg = String(a.package ?? '');
      const result = await native.mediaControl(
        String(a.command),
        pkg,
        Number(a.positionMs ?? 0),
      );
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 250);
      });
      const state = await native.mediaState(pkg);
      return pretty(JSON.stringify({
        ...JSON.parse(result),
        ahora: JSON.parse(state),
      }));
    }

    case 'media.volume':
      return pretty(await native.mediaVolume(String(a.command), Number(a.percent ?? 50)));

    case 'files.list':
      return pretty(await native.filesList(
        String(a.path),
        Number(a.limit ?? 200),
        Boolean(a.showHidden),
      ));

    case 'files.stat':
      return pretty(await native.filesStat(String(a.path)));

    case 'files.mkdir':
      return pretty(await native.filesMkdir(String(a.path)));

    case 'files.delete':
      return pretty(await native.filesDelete(String(a.path), Boolean(a.recursive)));

    case 'files.move':
      return pretty(await native.filesMove(
        String(a.from),
        String(a.to),
        Boolean(a.overwrite),
        Boolean(a.copy),
      ));

    case 'files.search':
      return pretty(await native.filesSearch(
        String(a.path),
        String(a.query),
        Number(a.limit ?? 80),
        Number(a.maxDepth ?? 6),
        Boolean(a.showHidden),
      ));

    case 'files.settings': {
      await native.filesSettings();
      return JSON.stringify({
        ok: true,
        pantalla: 'Ajustes > ChiaNative > Permisos > Acceso a todos los archivos',
        nota: 'el usuario debe activar el acceso; despues reintentar la accion de archivos',
      });
    }

    case 'net.scan':
      return pretty(await native.netScan(
        String(a.subnet ?? ''),
        String(a.ports ?? ''),
        Number(a.timeoutMs ?? 400),
        Number(a.seconds ?? 0),
        Number(a.threads ?? 0),
      ));

    case 'net.probe':
      return pretty(await native.netProbe(
        String(a.host),
        Number(a.port ?? 5555),
        Number(a.timeoutMs ?? 1500),
      ));

    case 'net.dns':
      return pretty(await native.netDns(String(a.host)));

    case 'net.http':
      return pretty(await native.netHttp(
        String(a.url),
        String(a.method ?? 'GET'),
        (a.headers ?? {}) as Record<string, string>,
        String(a.body ?? ''),
        Number(a.timeoutSec ?? 10),
      ));

    case 'net.wifi.scan':
      return pretty(await native.netWifiScan());

    case 'bt.status':
      return pretty(await native.btStatus());

    case 'bt.list':
      return pretty(await native.btList());

    case 'bt.scan':
      return pretty(await native.btScan(Number(a.seconds ?? 10)));

    case 'bt.pair':
      return pretty(await native.btPair(String(a.address)));

    case 'bt.connect':
      return pretty(await native.btConnect(String(a.address), true));

    case 'bt.disconnect':
      return pretty(await native.btConnect(String(a.address), false));

    case 'bt.enable':
      return pretty(await native.btSetEnabled(Boolean(a.on)));

    case 'bt.settings': {
      await native.btSettings();
      return JSON.stringify({
        ok: true,
        pantalla: 'Ajustes > Bluetooth',
        nota: 'Android 12+ exige "Dispositivos cercanos" para escanear y conectar; en Android 13+ apagar el bluetooth no es silencioso.',
      });
    }

    default:
      throw new Error(`accion desconocida: ${args.action}`);
  }
}

export async function runPhoneTool(args: PhoneArgs): Promise<PhoneOutcome> {
  const started = Date.now();
  const maxChars = getToolsConfig().maxChars;
  try {
    const output = await dispatch(args);
    return {
      output: truncate(output, maxChars),
      exitCode: 0,
      durationMs: Date.now() - started,
      isError: false,
    };
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      output: truncate(`phone ${args.action}: ${message}`, maxChars),
      exitCode: 1,
      durationMs: Date.now() - started,
      isError: true,
    };
  }
}
