import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Icon } from './icons';

const TONES = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0d9488', '#4d7c0f'];

function toneFor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973;
  }
  return TONES[hash % TONES.length];
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map(part => part.replace(/[^\p{L}]/gu, ''))
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
}

export function Avatar({
  name,
  seed,
  uri,
  size = 28,
}: {
  name: string;
  seed: string;
  uri?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const tone = toneFor(seed || name || 'chia');
  const circle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  } as const;

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={[styles.photo, circle, { borderColor: `${tone}66` }]}
        onError={() => setFailed(true)}
        accessibilityLabel={`Avatar de ${name}`}
      />
    );
  }

  const initials = initialsOf(name);
  return (
    <View
      style={[
        styles.circle,
        circle,
        { backgroundColor: `${tone}22`, borderColor: `${tone}66` },
      ]}
    >
      {initials ? (
        <Text style={[styles.initials, { color: tone, fontSize: size * 0.38 }]}>{initials}</Text>
      ) : (
        <Icon name="user" size={size * 0.5} color={tone} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 3,
  },
  photo: {
    borderWidth: StyleSheet.hairlineWidth * 3,
    backgroundColor: 'transparent',
  },
  initials: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
