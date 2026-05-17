import React from 'react';
import { StyleSheet, View, ViewProps, Platform, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
  contentStyle?: StyleProp<ViewStyle>;
}

export function GlassCard({ 
  children, 
  style, 
  intensity = 20, 
  tint = 'dark', 
  borderRadius = 20, 
  contentStyle,
  ...props 
}: GlassCardProps) {
  return (
    <View style={[styles.container, { borderRadius }, style]} {...props}>
      <BlurView 
        intensity={intensity} 
        tint={tint} 
        style={[StyleSheet.absoluteFill, { borderRadius }]} 
      />
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
    }),
  },
  content: {
    padding: 16,
  },
});
