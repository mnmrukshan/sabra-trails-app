import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, Platform, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { TRAILS } from '@/utils/trailData';
import { useTheme } from '@/hooks/use-theme';
import { startAdventure, endAdventure, resolveTrailImage } from '@/services/api';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ActiveAdventureScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const trail = TRAILS.find((t) => t.id === id);

  // Stopwatch state
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number | null>(null);

  // Animation states
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;

  // Ambient breathing background animation loop
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1.0,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0.0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  // Stopwatch effect using Timestamp Delta
  useEffect(() => {
    if (isActive) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        // Start backend session on mount
        startAdventure(id as string)
          .then(res => console.log('Backend adventure started/resumed:', res))
          .catch(err => console.error('Failed to start backend adventure session:', err));
      }
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  // Pulse animation loop effect
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isActive) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(0.3);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isActive]);

  const handleStopAdventure = async () => {
    // Premium Haptic feedback confirmation
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setIsActive(false);
    
    // End backend session
    const finalDurationMinutes = Math.max(1, Math.round(seconds / 60));
    try {
      await endAdventure({ duration: finalDurationMinutes });
      console.log('Backend adventure ended successfully.');
    } catch (err) {
      console.error('Failed to end backend adventure:', err);
    }
    
    // Navigate to summary screen passing seconds and trail ID
    router.replace({
      pathname: '/adventure-summary',
      params: { 
        id: id,
        seconds: seconds
      }
    });

    startTimeRef.current = null;
  };

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Ambient Breathing Gradient Background */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Base Dark Gradient */}
        <LinearGradient
          colors={['#121212', '#181A26', '#0D0E15']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Animated Overlay Gradient */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: gradientAnim }]}>
          <LinearGradient
            colors={['#1A1525', '#0A1822', '#121212']}
            style={StyleSheet.absoluteFill}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
        
        {/* Subtle trail image backdrop for theme context */}
        {trail && (
          <Image source={resolveTrailImage(trail.image)} style={styles.backgroundImage} contentFit="cover" />
        )}
        <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      {/* Main Content container */}
      <View style={[styles.contentContainer, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        
        {/* Top Header Card */}
        <View style={styles.glassHeaderCard}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.headerInner}>
            <View style={styles.pulseContainer}>
              <Animated.View style={[styles.greenPulseDot, { opacity: pulseAnim }]} />
              <Text style={styles.activeStatusText}>ADVENTURE IN PROGRESS</Text>
            </View>
            <Text style={styles.trailNameText}>{trail?.name || 'Active Adventure'}</Text>
            <Text style={styles.locationText}>
              <Ionicons name="location-sharp" size={12} color={theme.accent} /> {trail?.location || 'Unknown Location'}
            </Text>
          </View>
        </View>

        {/* Central Stopwatch Timer Card */}
        <View style={styles.timerWrapper}>
          <View style={styles.timerOuterRing}>
            <LinearGradient
              colors={['#FF8C32', 'rgba(255, 140, 50, 0.1)']}
              style={styles.timerInnerCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.timerLabelText}>ELAPSED TIME</Text>
              <Text style={styles.timerDigitsText}>{formatTime(seconds)}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.miniBadge}>
                  <Ionicons name="speedometer-outline" size={10} color="#FF8C32" />
                  <Text style={styles.miniBadgeText}>{trail?.difficulty || 'Moderate'}</Text>
                </View>
                <View style={styles.miniBadge}>
                  <Ionicons name="map-outline" size={10} color="#FF8C32" />
                  <Text style={styles.miniBadgeText}>{trail?.elevation || 'N/A'}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={styles.stopButton}
            onPress={handleStopAdventure}
          >
            <LinearGradient
              colors={['#E53E3E', '#C53030']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.stopGradient}
            >
              <Ionicons name="stop-circle" size={24} color="#fff" />
              <Text style={styles.stopButtonText}>Stop Adventure</Text>
            </LinearGradient>
          </Pressable>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glassHeaderCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(18, 18, 18, 0.35)',
  },
  headerInner: {
    padding: 20,
    alignItems: 'center',
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  activeStatusText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  trailNameText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  locationText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
  },
  timerWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  timerOuterRing: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 50, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 18, 0.4)',
    shadowColor: '#FF8C32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  timerInnerCircle: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  timerLabelText: {
    color: '#FF8C32',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 10,
  },
  timerDigitsText: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontVariant: ['tabular-nums'],
    marginBottom: 15,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 140, 50, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderColor: 'rgba(255, 140, 50, 0.2)',
    borderWidth: 1,
  },
  miniBadgeText: {
    color: '#eee',
    fontSize: 10,
    fontWeight: '600',
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  stopButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#C53030',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  stopGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
