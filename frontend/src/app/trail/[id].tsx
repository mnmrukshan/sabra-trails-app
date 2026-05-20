import React from 'react';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, ScrollView, Pressable, Dimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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

  const trailCoordinates: Record<string, { lat: number; lon: number }> = {
    hirikatuoya: { lat: 6.7146, lon: 80.7872 },
    'bakers-bend': { lat: 6.7214, lon: 80.7865 },
    hawagala: { lat: 6.7410, lon: 80.7930 },
    narangala: { lat: 6.9856, lon: 81.0183 },
    wangedigala: { lat: 6.7328, lon: 80.8122 },
    pahanthudawa: { lat: 6.7166, lon: 80.7925 },
    hunugalpokuna: { lat: 6.6433, lon: 80.7022 },
    gartmore: { lat: 6.8122, lon: 80.6078 },
    'alien-rock': { lat: 7.7125, lon: 81.2144 },
    'aadara-kanda': { lat: 6.7350, lon: 80.7990 },
    nonpareil: { lat: 6.7214, lon: 80.7865 },
    'lanka-ella': { lat: 6.7794, lon: 80.8250 },
    kalthota: { lat: 6.5411, lon: 80.8672 },
    'devils-staircase': { lat: 6.7903, lon: 80.8356 },
    thangamale: { lat: 6.7825, lon: 80.9575 },
    bambarakanda: { lat: 6.7725, lon: 80.8322 },
    'liptons-seat': { lat: 6.7844, lon: 81.0164 },
    'nine-arch': { lat: 6.8767, lon: 81.0608 },
    diyaluma: { lat: 6.7267, lon: 81.0306 },
    adisham: { lat: 6.7778, lon: 80.9389 },
    'ella-rock': { lat: 6.8583, lon: 81.0458 },
    'horton-plains': { lat: 6.8028, lon: 80.8028 },
    'ohiya-scenic': { lat: 6.8167, lon: 80.8500 },
    'worlds-end': { lat: 6.7833, lon: 80.7833 },
    'moon-plains': { lat: 6.9583, lon: 80.8083 },
    surathali: { lat: 6.7456, lon: 80.8519 },
    'samanala-wewa': { lat: 6.6908, lon: 80.7972 },
    'bopath-falls': { lat: 6.7628, lon: 80.3744 },
  };

  const [climate, setClimate] = React.useState(trail ? trail.climate : '');

  React.useEffect(() => {
    if (!trail) return;
    async function fetchTrailWeather() {
      try {
        const coords = trailCoordinates[trail!.id] || { lat: 6.7146, lon: 80.7872 };
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code`
        );
        const data = await response.json();
        if (data && data.current) {
          const temp = Math.round(data.current.temperature_2m);
          const code = data.current.weather_code;
          
          let condition = 'Sunny';
          if (code === 0) condition = 'Sunny';
          else if (code >= 1 && code <= 3) condition = 'Cloudy';
          else if (code === 45 || code === 48) condition = 'Foggy';
          else if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) condition = 'Rainy';
          else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) condition = 'Snowy';
          else if (code >= 95) condition = 'Stormy';

          setClimate(`${temp}°C • ${condition}`);
        }
      } catch (error) {
        console.error('Failed to fetch trail weather:', error);
      }
    }
    fetchTrailWeather();
  }, [trail?.id]);

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
        
        <View style={styles.contentSheet}>
          <BlurView 
            intensity={80} 
            tint="dark" 
            style={StyleSheet.absoluteFill} 
          />
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="speedometer-outline" size={20} color={theme.accent} />
              <Text style={styles.statLabel}>LEVEL</Text>
              <Text style={styles.statValue}>{trail.difficulty}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Ionicons name="map-outline" size={20} color={theme.accent} />
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
            <Pressable 
              style={styles.statBox}
              onPress={() => router.push(`/weather/${trail.id}`)}
            >
              <Ionicons name="partly-sunny-outline" size={20} color={theme.accent} />
              <Text style={styles.statLabel}>CLIMATE</Text>
              <Text style={styles.statValue}>{climate}</Text>
            </Pressable>
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
          <Pressable onPress={() => router.push(`/map/${trail.id}`)} style={styles.mapSection}>
             <Image 
               source={trail.image} // Reusing image as placeholder
               style={styles.mapImage}
               blurRadius={15}
             />
             <View style={styles.mapOverlay}>
               <Ionicons name="map-outline" size={32} color="#fff" />
               <Text style={styles.mapText}>View Interactive Map</Text>
             </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar (Fixed Floating View) */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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
    height: SCREEN_HEIGHT * 0.5 + 24,
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
    backgroundColor: 'rgba(18, 18, 18, 0.3)',
    overflow: 'hidden',
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
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  statValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
    height: 56,
    borderRadius: 28,
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
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 28, // increased for premium readability
    color: '#E0E0E0', // lighter grey for higher contrast
    textAlign: 'justify',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
