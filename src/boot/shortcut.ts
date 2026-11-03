import { NativeModules } from 'react-native';

type ShortcutNativeModule = {
  ensure: () => Promise<boolean>;
};

const native = NativeModules.Shortcut as ShortcutNativeModule | undefined;

export function ensureHomeShortcut(delayMs = 1200): Promise<boolean> {
  if (!native) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      native.ensure().then(resolve).catch(() => resolve(false));
    }, delayMs);
  });
}
