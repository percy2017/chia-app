import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from 'react-native';

import { speak } from '../audio/player';

type Props = {
  /** Instrucciones del usuario (Configuracion > Agente > Instrucciones). */
  text: string;
  /** Asset del logo (require). */
  logo: number;
};

export function Welcome({ text, logo }: Props) {
  const saludo = text.trim();
  const [reduced, setReduced] = useState(false);

  const enter = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const spoken = useRef(false);

  // La voz sale de la configuracion guardada (voice.*) y el texto de las
  // instrucciones (llm.systemPrompt): nada hardcodeado. El MP3 queda en
  // filesDir/say/v2 y se reutiliza (no se vuelve a pedir al servidor salvo que
  // cambie el texto, la voz o el token); suena cada vez que aparece el welcome.
  useEffect(() => {
    if (spoken.current || !saludo) {
      return;
    }
    spoken.current = true;
    void speak(saludo).catch((error: unknown) => {
      console.warn('[welcome] no se pudo hablar:', error instanceof Error ? error.message : String(error));
    });
  }, [saludo]);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (alive) {
          setReduced(value);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (reduced) {
      enter.setValue(1);
      float.setValue(0);
      return;
    }
    enter.setValue(0);
    const entrada = Animated.spring(enter, {
      toValue: 1,
      damping: 12,
      stiffness: 120,
      mass: 0.9,
      useNativeDriver: true,
    });
    const flotar = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: -1,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    entrada.start();
    flotar.start();
    return () => {
      entrada.stop();
      flotar.stop();
    };
  }, [enter, float, reduced]);

  const entryStyle = {
    opacity: enter,
    transform: [
      { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1] }) },
    ],
  };
  const floatStyle = {
    transform: [
      { translateY: float.interpolate({ inputRange: [-1, 1], outputRange: [5, -5] }) },
    ],
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={entryStyle}>
        <Animated.View style={floatStyle}>
          <Image
            source={logo}
            style={styles.logo}
            accessibilityLabel={saludo || 'ChiaNative'}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 176,
    height: 176,
    borderRadius: 14,
  },
});
