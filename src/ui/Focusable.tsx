import React, { useCallback, useState } from 'react';
import { Platform, Pressable } from 'react-native';
import type { PressableProps } from 'react-native';

import { useTheme } from './theme';

/**
 * Pressable con foco visible para control remoto (Android TV).
 * En telefono y tableta se comporta igual que Pressable: sin borde extra.
 */
export function Focusable({
  style,
  onFocus,
  onBlur,
  disabled,
  focusable,
  ...rest
}: PressableProps) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  const tv = Platform.isTV;

  const handleFocus = useCallback<NonNullable<PressableProps['onFocus']>>(
    (event) => {
      setFocused(true);
      onFocus?.(event);
    },
    [onFocus],
  );
  const handleBlur = useCallback<NonNullable<PressableProps['onBlur']>>(
    (event) => {
      setFocused(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  const focusStyle = tv && focused && !disabled
    ? {
      borderWidth: 2,
      borderRadius: 10,
      borderColor: c.accent,
      transform: [{ scale: 1.03 }],
    }
    : null;

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      focusable={tv ? (focusable ?? !disabled) : focusable}
      onFocus={tv ? handleFocus : onFocus}
      onBlur={tv ? handleBlur : onBlur}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        focusStyle,
      ]}
    />
  );
}
