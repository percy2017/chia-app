import { NativeModules } from 'react-native';
type BootNativeModule = {
  setEnabled: (enabled: boolean) => Promise<boolean>;
  enabled: () => Promise<boolean>;
};

const native = NativeModules.Boot as BootNativeModule | undefined;

export function configureStartOnBoot(enabled: boolean): Promise<boolean> {
  if (!native) {
    return Promise.resolve(false);
  }
  return native.setEnabled(enabled).catch(() => false);
}

export function readStartOnBoot(): Promise<boolean | null> {
  if (!native) {
    return Promise.resolve(null);
  }
  return native.enabled().catch(() => null);
}
