import type { ChatMessage } from '../llm/types';
import { NativeModules } from 'react-native';
import { historyToHtml } from './html';

type SavedFile = {
  name: string;
  path: string;
  uri: string;
  mime: string;
};

type ShellNativeModule = {
  saveText?: (
    fileName: string,
    content: string,
    mime: string,
  ) => Promise<SavedFile | string>;
  openFile?: (uri: string, mime: string) => Promise<boolean>;
};

function native(): ShellNativeModule | undefined {
  return NativeModules.ShellNative as ShellNativeModule | undefined;
}

export function exportFileName(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `chianative-chat-${day}-${time}.html`;
}

/** Historial completo -> Descargas/ChiaNative/*.html */
export async function exportHistory(messages: ChatMessage[]): Promise<SavedFile> {
  const module = native();
  if (!module?.saveText) {
    throw new Error('Modulo nativo no disponible (recompila la app).');
  }
  const name = exportFileName();
  const mime = 'text/html';
  const saved = await module.saveText(name, historyToHtml(messages), mime);
  if (typeof saved === 'string') {
    // APK vieja: saveText solo devolvia la ruta del .txt.
    return { name, path: saved, uri: '', mime };
  }
  return { ...saved, mime: saved.mime || mime };
}

/** Abre el HTML exportado con el navegador o el visor por defecto. */
export async function openExport(file: SavedFile): Promise<void> {
  const module = native();
  if (!module?.openFile) {
    throw new Error('Modulo nativo no disponible (recompila la app).');
  }
  if (!file.uri) {
    throw new Error(`Abre a mano el archivo: ${file.path}`);
  }
  const opened = await module.openFile(file.uri, file.mime);
  if (!opened) {
    throw new Error(`Sin app para abrir ${file.path}`);
  }
}
