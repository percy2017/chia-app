import { Platform, useWindowDimensions } from 'react-native';

/** Familia de dispositivo donde corre la app. */
export type DeviceKind = 'tv' | 'tablet' | 'phone';

/** Banco de pruebas: el dp de una TV es ~1280x720 con densidad 1. */
export const TABLET_MIN_DP = 600;

export function deviceKind(width: number, height: number): DeviceKind {
  if (Platform.isTV) {
    return 'tv';
  }
  return Math.min(width, height) >= TABLET_MIN_DP ? 'tablet' : 'phone';
}

/** Factor de tipografia y espaciado: 10 pies en TV, dedos en telefono. */
export function uiScale(kind: DeviceKind): number {
  if (kind === 'tv') {
    return 1.6;
  }
  return kind === 'tablet' ? 1.2 : 1;
}

/** Ancho maximo de la columna de contenido (0 = todo el ancho). */
export function contentMaxWidth(kind: DeviceKind): number {
  if (kind === 'tv') {
    return 980;
  }
  return kind === 'tablet' ? 720 : 0;
}

export type Layout = {
  kind: DeviceKind;
  isTv: boolean;
  isTablet: boolean;
  /** Factor de escala (1 en telefono). */
  scale: number;
  /** Escala una medida en dp. */
  s: (value: number) => number;
  contentMaxWidth: number;
  /** Padding lateral de pantalla. */
  pad: number;
};

export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();
  const kind = deviceKind(width, height);
  const scale = uiScale(kind);
  return {
    kind,
    isTv: kind === 'tv',
    isTablet: kind === 'tablet',
    scale,
    s: (value: number) => Math.round(value * scale),
    contentMaxWidth: contentMaxWidth(kind),
    pad: Math.round((kind === 'tv' ? 28 : kind === 'tablet' ? 20 : 10)),
  };
}
