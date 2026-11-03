import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Icon } from './icons';


export function ImageViewer({
  uri,
  caption,
  onClose,
}: {
  uri: string | null;
  caption?: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);

  const handleLoad = useCallback(() => setLoading(false), []);

  return (
    <Modal
      visible={uri !== null}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={() => setLoading(true)}
    >
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar imagen"
        />

        {uri
          ? Platform.OS === 'ios'
            ? (
                <ScrollView
                  style={StyleSheet.absoluteFill}
                  contentContainerStyle={styles.zoomBox}
                  maximumZoomScale={4}
                  minimumZoomScale={1}
                  centerContent
                  bouncesZoom
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                >
                  <Image
                    source={{ uri }}
                    style={styles.image}
                    resizeMode="contain"
                    onLoadEnd={handleLoad}
                  />
                </ScrollView>
              )
            : (
                <Image
                  source={{ uri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="contain"
                  onLoadEnd={handleLoad}
                  accessibilityIgnoresInvertColors
                />
              )
          : null}

        {loading
          ? (
              <View style={styles.center} pointerEvents="none">
                <ActivityIndicator color="#ffffff" />
              </View>
            )
          : null}

        <Pressable
          onPress={onClose}
          hitSlop={14}
          style={styles.close}
          accessibilityRole="button"
          accessibilityLabel="Cerrar imagen"
        >
          <Icon name="close" size={18} color="#ffffff" />
        </Pressable>

        {caption
          ? (
              <View style={styles.captionBar} pointerEvents="none">
                <Text style={styles.caption} numberOfLines={1}>{caption}</Text>
              </View>
            )
          : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBox: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  close: {
    position: 'absolute',
    top: 44,
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  captionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: 'center',
  },
  caption: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    letterSpacing: 0.3,
    paddingHorizontal: 20,
  },
});
