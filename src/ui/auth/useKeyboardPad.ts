import { useEffect, useState } from 'react';
import { AppState, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Hueco del teclado para las pantallas de acceso (mismo patron que ChatScreen:
 * Android edge-to-edge no redimensiona la ventana). Devuelve tambien el
 * padding inferior con el inset cuando el teclado esta cerrado.
 */
export function useKeyboardPad(): { keyboard: number; pad: number; onInputFocus: () => void } {
  const insets = useSafeAreaInsets();
  const [keyboard, setKeyboard] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboard(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Al volver del background Android se lleva el teclado sin emitir el hide.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      setKeyboard(next === 'active' ? (Keyboard.metrics()?.height ?? 0) : 0);
    });
    return () => subscription.remove();
  }, []);

  return {
    keyboard,
    pad: keyboard > 0 ? keyboard + insets.bottom : insets.bottom + 24,
    onInputFocus: () => setKeyboard(Keyboard.metrics()?.height ?? 0),
  };
}
