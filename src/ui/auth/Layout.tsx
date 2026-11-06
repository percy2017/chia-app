import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '../icons';
import { useTheme } from '../theme';
import { useKeyboardPad } from './useKeyboardPad';

import { Focusable } from '../Focusable';

/**
 * Marco comun de Register/Login: cabecera con volver opcional, scroll que
 * reserva el hueco del teclado y pie opcional.
 */
export function AuthLayout({
  title,
  subtitle,
  logo = false,
  onBack,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  logo?: boolean;
  onBack?: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { c } = useTheme();
  const { pad, onInputFocus } = useKeyboardPad();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: pad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.block}>
          {logo ? (
            <Image
              source={require('../../../assets/chia-logo.png')}
              style={styles.logo}
              resizeMode="cover"
              accessibilityLabel="ChiaNative"
            />
          ) : null}
          <View style={[styles.header, logo ? styles.headerTight : null]}>
            {onBack ? (
              <Focusable
                onPress={onBack}
                hitSlop={12}
                style={styles.back}
                accessibilityRole="button"
                accessibilityLabel="Volver"
              >
                <Icon name="arrowLeft" size={20} color={c.text} />
              </Focusable>
            ) : null}
            {title || subtitle ? (
              <View style={styles.headerText}>
                {title ? <Text style={[styles.title, { color: c.text }]}>{title}</Text> : null}
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: c.muted }]}>{subtitle}</Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <View onTouchStart={onInputFocus}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    // Formulario centrado en el alto; si el teclado lo empuja, hace scroll.
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  block: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  headerTight: {
    marginBottom: 4,
  },
  logo: {
    width: 132,
    height: 132,
    alignSelf: 'center',
    borderRadius: 30,
    marginBottom: 0,
  },
  back: {
    paddingTop: 2,
    paddingRight: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  footer: {
    marginTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
  },
});
