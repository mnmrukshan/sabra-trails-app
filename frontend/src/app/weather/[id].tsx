import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TRAILS } from '@/utils/trailData';
import { useTheme } from '@/hooks/use-theme';

const { width } = Dimensions.get('window');

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

interface WeatherInfo {
  temp: number;
  apparentTemp: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
  icon: keyof typeof Ionicons.glyphMap;
  recommendation: string;
}

export default function WeatherScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();

  const trail = TRAILS.find((t) => t.id === id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  const fetchWeatherDetails = async () => {
    if (!trail) return;
    setLoading(true);
    setError(false);
    try {
      const coords = trailCoordinates[trail.id] || { lat: 6.7146, lon: 80.7872 };
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m`
      );
      const data = await response.json();
      
      if (data && data.current) {
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code;
        const apparentTemp = Math.round(data.current.apparent_temperature);
        const humidity = data.current.relative_humidity_2m;
        const windSpeed = data.current.wind_speed_10m;
        const precipitation = data.current.precipitation;

        const details = getWeatherDetails(code);

        setWeather({
          temp,
          apparentTemp,
          humidity,
          windSpeed,
          precipitation,
          ...details,
        });
      } else {
        setError(true);
      }
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherDetails();
  }, [trail?.id]);

  const getWeatherDetails = (code: number) => {
    let condition = 'Sunny';
    let icon: keyof typeof Ionicons.glyphMap = 'sunny-outline';
    let recommendation = 'Perfect conditions for hiking! Bring sunscreen and enjoy the trail.';

    if (code === 0) {
      condition = 'Clear Sky';
      icon = 'sunny-outline';
      recommendation = 'Perfect clear sky! Excellent conditions for hiking. Don\'t forget sunscreen and hydration.';
    } else if (code >= 1 && code <= 3) {
      condition = 'Partly Cloudy';
      icon = 'cloudy-outline';
      recommendation = 'Partly cloudy. Comfortable temperature and low solar intensity make this a great day to explore.';
    } else if (code === 45 || code === 48) {
      condition = 'Foggy Mist';
      icon = 'eye-off-outline';
      recommendation = 'Foggy and misty. Visibility may be reduced. Please stay on marked paths and walk with caution.';
    } else if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
      condition = 'Rain Showers';
      icon = 'rainy-outline';
      recommendation = 'Rain active on the trail. Slippery rocks and muddy paths ahead. Waterproof gear and anti-slip shoes recommended.';
    } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
      condition = 'Snow Fall';
      icon = 'snow-outline';
      recommendation = 'Cold snow falling. Ensure heavy thermal clothing and microspikes if appropriate.';
    } else if (code >= 95) {
      condition = 'Thunderstorm';
      icon = 'thunderstorm-outline';
      recommendation = 'Thunderstorm active! High hazard of lightning strikes. It is strongly advised to reschedule your hike.';
    }

    return { condition, icon, recommendation };
  };

  if (!trail) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Trail not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Blurred Trail Backdrop */}
      {trail.image && (
        <Image 
          source={trail.image} 
          style={StyleSheet.absoluteFillObject} 
          contentFit="cover"
        />
      )}
      <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFillObject} />
      <LinearGradient 
        colors={['transparent', 'rgba(18,18,18,0.95)']} 
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={[styles.header, { marginTop: insets.top }]}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Weather Report</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Location Title info */}
        <View style={styles.locationContainer}>
          <Text style={styles.locationSub}>CURRENTLY AT</Text>
          <Text style={styles.locationTitle}>{trail.name}</Text>
          <Text style={styles.locationRegion}>{trail.location}</Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={styles.loadingText}>Fetching live climate metrics...</Text>
          </View>
        ) : error || !weather ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
            <Text style={styles.errorText}>Unable to retrieve weather data.</Text>
            <Pressable style={styles.retryButton} onPress={fetchWeatherDetails}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.weatherContent}>
            {/* Prominent Temp and Icon */}
            <View style={styles.mainWeather}>
              <View style={styles.iconGlowContainer}>
                <Ionicons name={weather.icon} size={54} color={theme.accent} />
              </View>
              <View style={styles.tempContainer}>
                <Text style={styles.tempText}>{weather.temp}</Text>
                <Text style={styles.degreeSymbol}>°</Text>
              </View>
              <Text style={styles.conditionText}>{weather.condition}</Text>
            </View>

            {/* AI Recommendation Box */}
            <GlassCard intensity={15} style={styles.recommendationCard}>
              <View style={styles.recommendationHeader}>
                <Ionicons name="sparkles" size={18} color={theme.accent} />
                <Text style={styles.recommendationTitle}>HIKER INTELLIGENCE</Text>
              </View>
              <Text style={styles.recommendationBody}>{weather.recommendation}</Text>
            </GlassCard>

            {/* Secondary Stats Grid */}
            <View style={styles.gridContainer}>
              <GlassCard intensity={10} style={styles.gridCell}>
                <Ionicons name="thermometer-outline" size={24} color={theme.accent} />
                <Text style={styles.cellLabel}>FEELS LIKE</Text>
                <Text style={styles.cellValue}>{weather.apparentTemp}°</Text>
              </GlassCard>

              <GlassCard intensity={10} style={styles.gridCell}>
                <Ionicons name="water-outline" size={24} color={theme.accent} />
                <Text style={styles.cellLabel}>HUMIDITY</Text>
                <Text style={styles.cellValue}>{weather.humidity}%</Text>
              </GlassCard>

              <GlassCard intensity={10} style={styles.gridCell}>
                <Ionicons name="swap-horizontal-outline" size={24} color={theme.accent} />
                <Text style={styles.cellLabel}>WIND SPEED</Text>
                <Text style={styles.cellValue}>{weather.windSpeed} km/h</Text>
              </GlassCard>

              <GlassCard intensity={10} style={styles.gridCell}>
                <Ionicons name="rainy-outline" size={24} color={theme.accent} />
                <Text style={styles.cellLabel}>PRECIPITATION</Text>
                <Text style={styles.cellValue}>{weather.precipitation} mm</Text>
              </GlassCard>
            </View>

            {/* Refresh Button */}
            <Pressable 
              style={({ pressed }) => [
                styles.refreshButton,
                { opacity: pressed ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }
              ]} 
              onPress={fetchWeatherDetails}
            >
              <Ionicons name="sync" size={16} color={theme.textSecondary} />
              <Text style={styles.refreshText}>Refresh Climate Data</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 56,
    zIndex: 99,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  locationContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  locationSub: {
    fontSize: 10,
    color: '#888',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  locationTitle: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
  },
  locationRegion: {
    fontSize: 16,
    color: '#A0A0A0',
    marginTop: 4,
  },
  loaderContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  errorContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  errorText: {
    color: '#E0E0E0',
    fontSize: 15,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FF8C32',
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  weatherContent: {
    gap: 24,
  },
  mainWeather: {
    alignItems: 'center',
    marginVertical: 15,
  },
  iconGlowContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 140, 50, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 140, 50, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#FF8C32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 10,
  },
  tempText: {
    fontSize: 84,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 96,
  },
  degreeSymbol: {
    fontSize: 30,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginLeft: -2,
  },
  conditionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#A0A0A0',
    marginTop: 4,
  },
  recommendationCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  recommendationTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF8C32',
    letterSpacing: 1.5,
  },
  recommendationBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#E0E0E0',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  gridCell: {
    width: (width - 56) / 2,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 10,
  },
  cellLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
  },
  cellValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  refreshButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 10,
  },
  refreshText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
});
