import { NativeModules } from 'react-native';

type KeepAliveNativeModule = {
  start: () => void;
  stop: () => void;
};

const native = NativeModules.KeepAlive as KeepAliveNativeModule | undefined;

let active = false;

export function startKeepAlive(): void {
  if (active) {
    return;
  }
  active = true;
  try {
    native?.start();
  }
  catch {
    // Sin modulo nativo el turno funciona igual, solo pierde el background.
  }
}

export function stopKeepAlive(): void {
  if (!active) {
    return;
  }
  active = false;
  try {
    native?.stop();
  }
  catch {
    // idem
  }
}
