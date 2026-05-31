import React from 'react';
import { StyleSheet, View, Text, Pressable, Share, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { TRAILS } from '@/utils/trailData';
import { useTheme } from '@/hooks/use-theme';
import { resolveTrailImage } from '@/services/api';

const { width } = Dimensions.get('window');

export default function AdventureSummaryScreen() {
  const { id, seconds } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const trail = TRAILS.find((t) => t.id === id);
  const elapsedSeconds = Number(seconds) || 0;
  const isCompleted = elapsedSeconds >= 60;

  const getDifficultyColor = (diff: string = '') => {
    const val = diff.toLowerCase();
    if (val.includes('easy')) return '#4ADE80';
    if (val.includes('moderate') || val.includes('medium')) return '#FBBF24';
    if (val.includes('hard')) return '#F87171';
    return '#4ADE80';
  };

  const headerTitle = isCompleted ? 'Adventure Recorded' : 'Adventure Stopped';
  const headerSubtitle = isCompleted 
    ? 'Great effort out there!' 
    : 'Just getting started?';
  const iconName = isCompleted ? 'checkmark-circle' : 'walk-outline';
  const iconColor = isCompleted ? '#ffffff' : '#F59E0B'; // Muted amber/yellow
  const ringColors: [string, string] = isCompleted ? ['#FF8C32', '#FF5F00'] : ['#8E8E93', '#636366'];
  const shadowColor = isCompleted ? '#FF8C32' : '#8E8E93';
  const ringBorderColor = isCompleted ? 'rgba(255, 140, 50, 0.4)' : 'rgba(142, 142, 147, 0.4)';

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just completed the ${trail?.name || 'Trail'} adventure in SabraTrails! 🥾⛰️\n\n⏱️ Duration: ${formatTime(elapsedSeconds)}\n📍 Location: ${trail?.location}\n🔥 Difficulty: ${trail?.difficulty}\n\nTrack your hikes in Sri Lanka with SabraTrails!`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleBackToHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background Image Blurred */}
      {trail && (
        <View style={StyleSheet.absoluteFillObject}>
          <Image source={resolveTrailImage(trail.image)} style={styles.backgroundImage} contentFit="cover" />
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
        </View>
      )}

      {/* Main Content Container */}
      <View style={[styles.contentContainer, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 20 }]}>
        
        {/* Summary Header */}
        <View style={styles.headerContainer}>
          <View style={[styles.trophyRing, { borderColor: ringBorderColor, shadowColor }]}>
            <LinearGradient
              colors={ringColors}
              style={styles.trophyInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={iconName as any} size={40} color={iconColor} />
            </LinearGradient>
          </View>
          <Text style={styles.congratsText}>{headerTitle}</Text>
          <Text style={styles.subCongratsText}>{headerSubtitle}</Text>
        </View>

        {/* Glassmorphic Stats Card */}
        <View style={styles.summaryCard}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardContent}>
            <Text style={styles.trailName}>{trail?.name || 'Completed Trail'}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color={theme.accent} />
              <Text style={styles.locationText}>{trail?.location || 'Sri Lanka'}</Text>
            </View>

            <View style={styles.divider} />

            {/* Stat Rows */}
            <View style={styles.statGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>TOTAL TIME</Text>
                <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>DIFFICULTY</Text>
                <Text style={[styles.statValue, { color: getDifficultyColor(trail?.difficulty) }]}>
                  {trail?.difficulty || 'Medium'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>ELEVATION</Text>
                <Text style={styles.statValue}>{trail?.elevation || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionsContainer}>
          <Pressable 
            style={[
              styles.shareButton, 
              isCompleted ? styles.shareButtonSolid : styles.shareButtonOutline
            ]} 
            onPress={handleShare}
          >
            {isCompleted ? (
              <LinearGradient
                colors={['#FF8C32', '#FF5F00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text style={styles.buttonText}>Share Adventure</Text>
              </LinearGradient>
            ) : (
              <View style={styles.outlineShareButtonInner}>
                <Ionicons name="share-social" size={20} color="#FF8C32" />
                <Text style={styles.outlineShareText}>Share Adventure</Text>
              </View>
            )}
          </Pressable>

          <Pressable style={styles.homeButton} onPress={handleBackToHome}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.outlineButtonInner}>
              <Text style={styles.outlineButtonText}>Back to Home</Text>
            </View>
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
    opacity: 0.25,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  trophyRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 50, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF8C32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  trophyInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  congratsText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  subCongratsText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
  },
  summaryCard: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(18, 18, 18, 0.4)',
    marginVertical: 30,
  },
  cardContent: {
    padding: 24,
  },
  trailName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#bbb',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 20,
  },
  statGrid: {
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  shareButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  shareButtonSolid: {
    shadowColor: '#FF8C32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shareButtonOutline: {
    borderWidth: 1.5,
    borderColor: '#FF8C32',
    backgroundColor: 'rgba(255, 140, 50, 0.03)',
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  outlineShareButtonInner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  outlineShareText: {
    color: '#FF8C32',
    fontSize: 18,
    fontWeight: '700',
  },
  homeButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  outlineButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
