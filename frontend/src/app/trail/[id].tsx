import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, ScrollView, Pressable, Dimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TRAILS } from '@/utils/trailData';
import { useTheme } from '@/hooks/use-theme';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TrailDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();

  const trail = TRAILS.find((t) => t.id === id);

  if (!trail) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Trail not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Fixed Back Button (Absolute Overlay) */}
      <Pressable 
        style={[styles.backButton, { top: insets.top + 10 }]} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </Pressable>

      {/* Hero Image Section */}
      <View style={styles.heroContainer}>
        <Image 
          source={trail.image} 
          style={styles.heroImage} 
          contentFit="cover" 
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.imageGradient}
        />
        
        {/* Floating Title Info */}
        <View style={styles.headerInfo}>
          <ThemedText type="title" style={styles.trailName}>{trail.name}</ThemedText>
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={14} color={theme.accent} />
            <Text style={styles.locationText}>{trail.location}</Text>
          </View>
        </View>
      </View>

      {/* Content Sheet */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.spacer} />
        
        <GlassCard intensity={30} style={styles.contentSheet}>
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="speedometer-outline" size={20} color={theme.accent} />
              <Text style={styles.statLabel}>LEVEL</Text>
              <Text style={styles.statValue}>{trail.difficulty}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Ionicons name="landscape-outline" size={20} color={theme.accent} />
              <Text style={styles.statLabel}>ELEVATION</Text>
              <Text style={styles.statValue}>{trail.elevation}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Ionicons name="time-outline" size={20} color={theme.accent} />
              <Text style={styles.statLabel}>DURATION</Text>
              <Text style={styles.statValue}>{trail.duration}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Ionicons name="partly-sunny-outline" size={20} color={theme.accent} />
              <Text style={styles.statLabel}>CLIMATE</Text>
              <Text style={styles.statValue}>{trail.climate}</Text>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Trail Overview</ThemedText>
            <ThemedText style={styles.descriptionText}>
              {trail.description}
            </ThemedText>
          </View>

          {/* Safety Tips */}
          {trail.safetyTips && trail.safetyTips.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Safety & Tips</ThemedText>
              {trail.safetyTips.map((tip, index) => (
                <View key={index} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.accent} style={{ marginTop: 2 }} />
                  <ThemedText style={styles.tipText}>{tip}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Map Placeholder */}
          <View style={styles.mapSection}>
             <Image 
               source={trail.image} // Reusing image as placeholder
               style={styles.mapImage}
               blurRadius={15}
             />
             <View style={styles.mapOverlay}>
               <Ionicons name="map-outline" size={32} color="#fff" />
               <Text style={styles.mapText}>View Interactive Map</Text>
             </View>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Sticky Bottom Action Bar (Fixed Floating View) */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 15) }]}>
        <LinearGradient
          colors={['rgba(28, 28, 30, 0)', 'rgba(28, 28, 30, 0.95)', '#1C1C1E']}
          style={StyleSheet.absoluteFillObject}
        />
        <Pressable style={styles.bottomActionButton}>
          <LinearGradient
            colors={['#FF8C32', '#FF5F00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.buttonText}>Start Adventure</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    position: 'absolute',
    width: '100%',
    height: SCREEN_HEIGHT * 0.6,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20, 20, 20, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  headerInfo: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
  },
  trailName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    color: '#eee',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160, // Sizable padding so bottom elements are fully scrollable past sticky bar
  },
  spacer: {
    height: SCREEN_HEIGHT * 0.5,
  },
  contentSheet: {
    marginHorizontal: 0,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingTop: 30,
    paddingHorizontal: 20,
    minHeight: SCREEN_HEIGHT * 0.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: '#888',
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 30,
    zIndex: 90,
  },
  bottomActionButton: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF8C32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    marginBottom: 10,
  },
  buttonGradient: {
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 28, // increased for premium readability
    color: '#E0E0E0', // lighter grey for higher contrast
    textAlign: 'justify',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  tipText: {
    fontSize: 15,
    color: '#E0E0E0', // lighter grey for higher contrast
    flex: 1,
  },
  mapSection: {
    height: 180,
    borderRadius: 25,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    gap: 10,
  },
  mapText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
