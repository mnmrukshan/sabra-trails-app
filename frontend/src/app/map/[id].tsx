import React from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function MapScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();

  const trail = TRAILS.find((t) => t.id === id);
  const coords = (trail && (trail as any).coordinates) || trailCoordinates[id as string] || { lat: 6.7146, lon: 80.7872 };

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lon}`;
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open directions:', err);
    });
  };

  if (!trail) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Trail map not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: coords.lat,
          longitude: coords.lon,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        }}
        provider={PROVIDER_GOOGLE}
        mapType="standard"
        customMapStyle={darkMapStyle}
      >
        <Marker
          coordinate={{
            latitude: coords.lat,
            longitude: coords.lon,
          }}
          title={trail.name}
          description={trail.location}
        >
          {/* Custom Pin Glow */}
          <View style={styles.customMarkerContainer}>
            <View style={styles.markerPulse} />
            <View style={[styles.markerPin, { backgroundColor: theme.accent }]}>
              <Ionicons name="compass" size={16} color="#fff" />
            </View>
          </View>

          {/* Custom Sleek Dark Callout */}
          <Callout tooltip>
            <View style={styles.calloutWrapper}>
              <View style={styles.calloutContainer}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.calloutContent}>
                  <Text style={styles.calloutTitle} numberOfLines={1}>{trail.name}</Text>
                  <Text style={styles.calloutLocation} numberOfLines={1}>{trail.location}</Text>
                  <View style={styles.calloutBadge}>
                    <Ionicons name="speedometer" size={10} color={theme.accent} />
                    <Text style={styles.calloutBadgeText}>{trail.difficulty}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.calloutArrow} />
            </View>
          </Callout>
        </Marker>
      </MapView>

      {/* Floating Back Button */}
      <Pressable
        style={[styles.backButton, { top: insets.top + 10 }]}
        onPress={() => router.back()}
      >
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.backButtonInner}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </View>
      </Pressable>

      {/* Floating Bottom Card */}
      <View style={[styles.floatingCard, { bottom: insets.bottom + 20 }]}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.cardContent}>
          <Text style={styles.trailName}>{trail.name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="location" size={12} color={theme.accent} />
              <Text style={styles.badgeText}>{trail.location}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="speedometer" size={12} color={theme.accent} />
              <Text style={styles.badgeText}>{trail.difficulty}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="map" size={12} color={theme.accent} />
              <Text style={styles.badgeText}>{trail.elevation}</Text>
            </View>
          </View>
          <View style={styles.cardBottomRow}>
            <Text style={styles.coordsText}>
              📍 Lat: {coords.lat.toFixed(4)} • Lon: {coords.lon.toFixed(4)}
            </Text>
            <Pressable
              onPress={handleGetDirections}
              style={({ pressed }) => [
                styles.directionsButton,
                { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
              ]}
            >
              <LinearGradient
                colors={['#FF8C32', '#FF5F00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.directionsGradient}
              >
                <Ionicons name="navigate-circle" size={16} color="#fff" />
                <Text style={styles.directionsText}>Directions</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 99,
  },
  backButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 90,
    backgroundColor: 'rgba(18, 18, 18, 0.25)',
  },
  cardContent: {
    padding: 20,
  },
  trailName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: '#ddd',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 15,
  },
  coordsText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  directionsButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#FF8C32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  directionsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  directionsText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  customMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 140, 50, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 50, 0.4)',
  },
  markerPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  calloutWrapper: {
    alignItems: 'center',
    width: 200,
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
    marginBottom: 2,
  },
  calloutLocation: {
    color: '#ccc',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 6,
  },
  calloutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  calloutBadgeText: {
    color: '#ddd',
    fontSize: 9,
    fontWeight: '600',
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
});
