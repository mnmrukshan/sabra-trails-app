import React from 'react';
import { StyleSheet, View, Text, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { TRAILS } from '@/utils/trailData';
import { useTheme } from '@/hooks/use-theme';

const { width } = Dimensions.get('window');

const trailCoordinates: Record<string, { lat: number; lon: number }> = {
  hirikatuoya: { lat: 6.7158, lon: 80.7892 },
  'bakers-bend': { lat: 6.7806, lon: 80.8153 },
  hawagala: { lat: 6.7667, lon: 80.8167 },
  narangala: { lat: 6.9856, lon: 81.0183 },
  wangedigala: { lat: 6.7821, lon: 80.8130 },
  pahanthudawa: { lat: 6.7175, lon: 80.7936 },
  hunugalpokuna: { lat: 6.6433, lon: 80.7022 },
  gartmore: { lat: 6.8202, lon: 80.6052 },
  'adams-peak': { lat: 6.8092, lon: 80.4996 },
  'alien-rock': { lat: 6.7812, lon: 80.8248 },
  'alien-waterfall': { lat: 6.7845, lon: 80.8285 },
  'aadara-kanda': { lat: 6.7350, lon: 80.7990 },
  nonpareil: { lat: 6.7806, lon: 80.8153 },
  'lanka-ella': { lat: 6.7819, lon: 80.8139 },
  kalthota: { lat: 6.5411, lon: 80.8672 },
  'devils-staircase': { lat: 6.7903, lon: 80.8356 },
  thangamale: { lat: 6.7770, lon: 80.9380 },
  bambarakanda: { lat: 6.7725, lon: 80.8322 },
  'liptons-seat': { lat: 6.7844, lon: 81.0164 },
  'nine-arch': { lat: 6.8767, lon: 81.0608 },
  diyaluma: { lat: 6.7267, lon: 81.0306 },
  adisham: { lat: 6.7725, lon: 80.9348 },
  'ella-rock': { lat: 6.8583, lon: 81.0458 },
  'horton-plains': { lat: 6.8028, lon: 80.8028 },
  'ohiya-scenic': { lat: 6.8167, lon: 80.8500 },
  'worlds-end': { lat: 6.7833, lon: 80.7833 },
  'moon-plains': { lat: 6.9583, lon: 80.8083 },
  surathali: { lat: 6.7456, lon: 80.8519 },
  'samanala-wewa': { lat: 6.6908, lon: 80.7972 },
  'bopath-falls': { lat: 6.7628, lon: 80.3744 },
  'lake-gregory': { lat: 6.9634, lon: 80.7818 },
  'bakers-falls': { lat: 6.7972, lon: 80.7906 },
  'st-clairs-falls': { lat: 6.9372, lon: 80.6456 },
  'bomburu-ella': { lat: 6.9248, lon: 80.8653 },
  'lovers-leap': { lat: 6.9692, lon: 80.7936 },
  'dunhinda-falls': { lat: 7.0217, lon: 81.0628 },
  idalgashinna: { lat: 6.7844, lon: 80.8931 },
  pattipola: { lat: 6.8539, lon: 80.8358 },
  diyatalawa: { lat: 6.8189, lon: 80.9575 },
  'gerandigini-ella': { lat: 6.7881, lon: 80.8256 },
  'aberdeen-falls': { lat: 6.9458, lon: 80.5019 },
  'laxapana-falls': { lat: 6.9011, lon: 80.5303 },
  madulsima: { lat: 7.0867, lon: 81.1517 },
  'chariot-path': { lat: 7.0675, lon: 80.7028 },
};

const INITIAL_REGION = {
  latitude: 6.7900,
  longitude: 80.8200,
  latitudeDelta: 0.75,
  longitudeDelta: 0.75,
};

const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1c1c1e' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8e8e93' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1c1c1e' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#38383a' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#aeaeb2' }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d1d1d6' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2c2c2e' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8e8e93' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#3a3a3c' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#48484a' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#1d2a44' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#48484a' }],
  },
];

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const getDifficultyColor = (diff: string = '') => {
    const val = diff.toLowerCase();
    if (val.includes('easy')) return '#4ADE80';
    if (val.includes('moderate') || val.includes('medium')) return '#FBBF24';
    if (val.includes('hard')) return '#F87171';
    return '#4ADE80';
  };

  return (
    <View style={styles.container}>
      {/* Full-Screen Map */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={INITIAL_REGION}
        provider={PROVIDER_GOOGLE}
        mapType="standard"
        customMapStyle={darkMapStyle}
      >
        {TRAILS.map((trail) => {
          const coords = (trail as any).coordinates || trailCoordinates[trail.id];
          if (!coords) return null;

          return (
            <Marker
              key={trail.id}
              coordinate={{
                latitude: coords.lat,
                longitude: coords.lon,
              }}
              title={trail.name}
              description={trail.location}
            >
              {/* Glowing Compass Marker Pin */}
              <View style={styles.customMarkerContainer}>
                <View style={styles.markerPulse} />
                <View style={[styles.markerPin, { backgroundColor: theme.accent }]}>
                  <Ionicons name="compass" size={14} color="#fff" />
                </View>
              </View>

              {/* Interactive Glassmorphic Callout */}
              <Callout 
                tooltip 
                onPress={() => router.push(`/trail/${trail.id}`)}
              >
                <View style={styles.calloutWrapper}>
                  <View style={styles.calloutContainer}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.calloutContent}>
                      <Text style={styles.calloutTitle} numberOfLines={1}>{trail.name}</Text>
                      <Text style={styles.calloutLocation} numberOfLines={1}>📍 {trail.location}</Text>
                      <View style={styles.calloutBadgeRow}>
                        <View style={styles.calloutBadge}>
                          <Ionicons name="speedometer" size={10} color={getDifficultyColor(trail.difficulty)} />
                          <Text style={[styles.calloutBadgeText, { color: getDifficultyColor(trail.difficulty) }]}>
                            {trail.difficulty}
                          </Text>
                        </View>
                        <Text style={styles.calloutLinkText}>Tap for Details →</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.calloutArrow} />
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Floating Header Label */}
      <View style={[styles.floatingHeader, { top: insets.top + 10 }]}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <Ionicons name="map" size={18} color={theme.accent} />
          <Text style={styles.headerText}>Explore Trail Network</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 140, 50, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 50, 0.35)',
  },
  markerPin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  calloutWrapper: {
    alignItems: 'center',
    width: 220,
  },
  calloutContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(18, 18, 18, 0.75)',
  },
  calloutContent: {
    padding: 12,
    alignItems: 'flex-start',
    gap: 4,
  },
  calloutTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  calloutLocation: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  calloutBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 2,
  },
  calloutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  calloutBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  calloutLinkText: {
    color: '#FF8C32',
    fontSize: 10,
    fontWeight: '700',
  },
  calloutArrow: {
    width: 10,
    height: 10,
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    transform: [{ rotate: '45deg' }],
    marginTop: -5,
    zIndex: 99,
  },
  floatingHeader: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(18, 18, 18, 0.4)',
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  headerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
