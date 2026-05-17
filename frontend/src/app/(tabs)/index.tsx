import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  TextInput, 
  View, 
  Text, 
  FlatList, 
  Pressable,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { TRAILS } from '@/utils/trailData';

const { width } = Dimensions.get('window');

function getDifficultyColor(diff: string) {
  const d = diff.toLowerCase();
  if (d.includes('easy')) return '#4ADE80';
  if (d.includes('mod')) return '#FBBF24';
  return '#F87171';
}

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  message: string;
  messageColor: string;
}

function getWeatherDetails(code: number): Omit<WeatherData, 'temp'> {
  // WMO Weather interpretation codes (WW)
  if (code === 0) {
    return { 
      condition: 'Clear & Sunny', 
      icon: 'sunny-outline', 
      iconColor: '#FBBF24', 
      bgColor: 'rgba(251, 191, 36, 0.12)', 
      message: 'Perfect for a hike!', 
      messageColor: '#4ADE80' 
    };
  } else if (code >= 1 && code <= 3) {
    return { 
      condition: 'Partly Cloudy', 
      icon: 'partly-sunny-outline', 
      iconColor: '#FBBF24', 
      bgColor: 'rgba(251, 191, 36, 0.12)', 
      message: 'Great hiking weather!', 
      messageColor: '#4ADE80' 
    };
  } else if (code === 45 || code === 48) {
    return { 
      condition: 'Foggy Weather', 
      icon: 'cloudy-outline', 
      iconColor: '#A3A3A3', 
      bgColor: 'rgba(163, 163, 163, 0.12)', 
      message: 'Low visibility - hike with care!', 
      messageColor: '#FBBF24' 
    };
  } else if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { 
      condition: 'Rainy Day', 
      icon: 'rainy-outline', 
      iconColor: '#60A5FA', 
      bgColor: 'rgba(96, 165, 250, 0.12)', 
      message: 'Wet trails - pack rain gear!', 
      messageColor: '#60A5FA' 
    };
  } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return { 
      condition: 'Snowy Weather', 
      icon: 'snow-outline', 
      iconColor: '#E5E7EB', 
      bgColor: 'rgba(229, 231, 235, 0.12)', 
      message: 'Cold trail - layer up!', 
      messageColor: '#93C5FD' 
    };
  } else if (code >= 95) {
    return { 
      condition: 'Thunderstorm', 
      icon: 'thunderstorm-outline', 
      iconColor: '#F87171', 
      bgColor: 'rgba(248, 113, 113, 0.12)', 
      message: 'Storm alert - stay indoors!', 
      messageColor: '#F87171' 
    };
  }
  return { 
    condition: 'Clear & Sunny', 
    icon: 'partly-sunny-outline', 
    iconColor: '#FBBF24', 
    bgColor: 'rgba(251, 191, 36, 0.12)', 
    message: 'Perfect for a hike!', 
    messageColor: '#4ADE80' 
  };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();

  const hiddenGems = TRAILS.filter(t => t.hiddenGem);
  const popularTrails = TRAILS.filter(t => !t.hiddenGem);

  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    async function fetchWeather() {
      try {
        const response = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=6.7146&longitude=80.7872&current=temperature_2m,weather_code'
        );
        const data = await response.json();
        if (data && data.current) {
          const temp = Math.round(data.current.temperature_2m);
          const code = data.current.weather_code;
          const details = getWeatherDetails(code);
          setWeather({
            temp,
            ...details
          });
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      }
    }
    fetchWeather();
  }, []);

  const defaultWeather: WeatherData = {
    temp: 26,
    condition: 'Clear & Sunny',
    icon: 'partly-sunny-outline',
    iconColor: '#FBBF24',
    bgColor: 'rgba(251, 191, 36, 0.12)',
    message: 'Perfect for a hike!',
    messageColor: '#4ADE80'
  };

  const weatherDisplay = weather || defaultWeather;

  const filteredTrails = TRAILS.filter(trail => {
    const query = searchQuery.toLowerCase().trim();
    return (
      trail.name.toLowerCase().includes(query) ||
      trail.location.toLowerCase().includes(query)
    );
  });

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerBranding}>SabraTrails</Text>
          <Text style={styles.welcomeText}>Welcome, Explorer</Text>
        </View>
        <Pressable style={styles.menuButton}>
          <Ionicons name="menu-outline" size={28} color={theme.text} />
        </Pressable>
      </View>

      {/* Search Bar */}
      <GlassCard intensity={15} style={styles.searchContainer} contentStyle={styles.searchContent}>
        <View style={styles.searchInner}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput 
            placeholder="Search trails, locations..." 
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.trim() !== '' && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </GlassCard>

      {searchQuery.trim() === '' ? (
        <>
          {/* Weather Widget */}
          <GlassCard intensity={25} style={styles.weatherCard} contentStyle={styles.weatherContent}>
            <View style={styles.weatherRow}>
              <View style={[styles.weatherIconContainer, { backgroundColor: weatherDisplay.bgColor }]}>
                <Ionicons name={weatherDisplay.icon as any} size={32} color={weatherDisplay.iconColor} />
              </View>
              <View style={styles.weatherTextContainer}>
                <View style={styles.weatherLocationRow}>
                  <Ionicons name="location-sharp" size={12} color="#FF8C32" />
                  <Text style={styles.weatherLocation}>Weather in Belihuloya</Text>
                </View>
                <View style={styles.weatherInfoRow}>
                  <Text style={styles.weatherStatus}>{weatherDisplay.condition}</Text>
                  <Text style={styles.weatherDivider}>•</Text>
                  <Text style={styles.weatherTemp}>{weatherDisplay.temp}°C</Text>
                </View>
                <Text style={[styles.weatherMessage, { color: weatherDisplay.messageColor }]}>
                  {weatherDisplay.message}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Hidden Gems Section */}
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Hidden Gems</ThemedText>
            <Pressable onPress={() => router.push('/category/hidden')}>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </Pressable>
          </View>

          <FlatList 
            data={hiddenGems}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => router.push(`/trail/${item.id}`)}
                style={styles.gemCard}
              >
                <Image source={item.image} style={styles.gemImage} />
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{item.difficulty}</Text>
                </View>
                <View style={styles.gemInfo}>
                  <ThemedText style={styles.gemName} numberOfLines={1}>{item.name}</ThemedText>
                  <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                    <ThemedText style={styles.locationText} themeColor="textSecondary" numberOfLines={1}>{item.location}</ThemedText>
                  </View>
                </View>
              </Pressable>
            )}
          />

          {/* Popular Trails Section */}
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Popular Trails</ThemedText>
            <Pressable onPress={() => router.push('/category/popular')}>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </Pressable>
          </View>

          <FlatList 
            data={popularTrails}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => router.push(`/trail/${item.id}`)}
                style={styles.popularCarouselCard}
              >
                <Image source={item.image} style={styles.popularImage} />
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{item.difficulty}</Text>
                </View>
                <View style={styles.gemInfo}>
                  <ThemedText style={styles.gemName} numberOfLines={1}>{item.name}</ThemedText>
                  <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                    <ThemedText style={styles.locationText} themeColor="textSecondary" numberOfLines={1}>{item.location}</ThemedText>
                  </View>
                </View>
              </Pressable>
            )}
          />
        </>
      ) : (
        /* Search Results Grid */
        <View style={styles.searchResultsContainer}>
          <Text style={styles.searchResultsTitle}>Search Results</Text>
          {filteredTrails.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#FF8C32" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTextTitle}>No trails found</Text>
              <Text style={styles.emptyTextSub}>We couldn't find any results for "{searchQuery}".</Text>
            </View>
          ) : (
            <View style={styles.resultsGrid}>
              {filteredTrails.map((item) => (
                <Pressable 
                  key={item.id}
                  onPress={() => router.push(`/trail/${item.id}`)}
                  style={styles.searchCard}
                >
                  <Image source={item.image} style={styles.cardImage} />
                  
                  <View style={styles.difficultyBadge}>
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                      {item.difficulty}
                    </Text>
                  </View>
                  
                  <LinearGradient
                    colors={['transparent', 'rgba(0, 0, 0, 0.95)']}
                    style={styles.gradient}
                  />
                  
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.locationContainer}>
                      <Ionicons name="location-outline" size={12} color="#A0A0A0" />
                      <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  headerBranding: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8C32',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -4,
  },
  searchContainer: {
    marginHorizontal: 20,
    height: 55,
    marginBottom: 20,
    backgroundColor: 'rgba(20, 20, 20, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
  },
  searchContent: {
    padding: 0,
    height: '100%',
    justifyContent: 'center',
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
    fontSize: 16,
  },
  weatherCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    marginBottom: 30,
  },
  weatherContent: {
    padding: 16,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  weatherTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  weatherLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  weatherLocation: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A0A0A0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weatherInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  weatherStatus: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weatherDivider: {
    fontSize: 14,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  weatherTemp: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weatherMessage: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  seeAllText: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 40,
    marginBottom: 30,
  },
  gemCard: {
    width: width * 0.65,
    height: 220,
    marginRight: 15,
    borderRadius: 25,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
  },
  gemImage: {
    width: '100%',
    height: '65%',
  },
  gemInfo: {
    padding: 12,
    gap: 4,
  },
  gemName: {
    fontSize: 18,
    fontWeight: '700',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  difficultyText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '700',
  },
  popularGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  popularCard: {
    width: (width - 55) / 2,
    borderRadius: 25,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
    marginBottom: 10,
  },
  popularCarouselCard: {
    width: width * 0.45,
    marginRight: 15,
    borderRadius: 25,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
  },
  popularImage: {
    width: '100%',
    height: 120,
  },
  clearButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  searchResultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  searchCard: {
    width: (width - 55) / 2,
    height: 220,
    borderRadius: 22,
    backgroundColor: '#1C1C1E',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    zIndex: 1,
  },
  cardInfo: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    zIndex: 2,
    gap: 3,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTextTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptyTextSub: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});



