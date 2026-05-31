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
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as SecureStore from 'expo-secure-store';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { TRAILS } from '@/utils/trailData';
import { fetchTrails, resolveTrailImage } from '@/services/api';

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

  const [allTrails, setAllTrails] = React.useState<any[]>(TRAILS);
  const [hiddenGems, setHiddenGems] = React.useState<any[]>(TRAILS.filter(t => t.hiddenGem));
  const [popularTrails, setPopularTrails] = React.useState<any[]>(TRAILS.filter(t => !t.hiddenGem));

  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // State for dynamic user info
  const [userName, setUserName] = React.useState('Explorer');
  const [userEmail, setUserEmail] = React.useState('');

  // State and animation for Sidebar Menu
  const [isMenuVisible, setIsMenuVisible] = React.useState(false);
  const slideAnim = React.useRef(new Animated.Value(width)).current;

  React.useEffect(() => {
    async function loadUser() {
      try {
        const storedName = await SecureStore.getItemAsync('user_name');
        const storedEmail = await SecureStore.getItemAsync('user_email');
        if (storedName) setUserName(storedName);
        if (storedEmail) setUserEmail(storedEmail);
      } catch (e) {
        console.error('Failed to load user info:', e);
      }
    }
    async function loadTrails() {
      try {
        const dbTrails = await fetchTrails();
        if (dbTrails && dbTrails.length > 0) {
          setAllTrails(dbTrails);
          setHiddenGems(dbTrails.filter((t: any) => t.hiddenGem));
          setPopularTrails(dbTrails.filter((t: any) => !t.hiddenGem));
        }
      } catch (e) {
        console.error('Failed to fetch trails from backend, using fallbacks:', e);
      }
    }
    loadUser();
    loadTrails();
  }, []);

  const openMenu = () => {
    setIsMenuVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start((result) => {
      if (result.finished) {
        setIsMenuVisible(false);
      }
    });
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('auth_code');
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('user_name');
      await SecureStore.deleteItemAsync('user_email');
      closeMenu();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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

  const filteredTrails = allTrails.filter(trail => {
    const query = searchQuery.toLowerCase().trim();
    return (
      trail.name.toLowerCase().includes(query) ||
      trail.location.toLowerCase().includes(query)
    );
  });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.brandingRow}>
              <FontAwesome5 name="hiking" size={22} color="#FF8C32" />
              <Text style={styles.headerBranding}>SabraTrails</Text>
            </View>
            <Pressable style={styles.menuButton} onPress={openMenu}>
              <Ionicons name="menu-outline" size={28} color={theme.text} />
            </Pressable>
          </View>
          <Text style={styles.welcomeText}>Welcome, {userName.trim().split(/\s+/).pop() || 'Explorer'}</Text>
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
            <Pressable 
              onPress={() => setSearchQuery('')} 
              style={styles.clearButton}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
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
            style={styles.horizontalListFlatList}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => router.push(`/trail/${item.id}`)}
                style={styles.gemCard}
              >
                <Image source={resolveTrailImage(item.image)} style={styles.gemImage} />
                <View style={styles.difficultyBadge}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                    {item.difficulty}
                  </Text>
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
          <View style={[styles.sectionHeader, { marginTop: 16, paddingTop: 0 }]}>
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
            style={styles.horizontalListFlatList}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => router.push(`/trail/${item.id}`)}
                style={styles.popularCarouselCard}
              >
                <Image source={resolveTrailImage(item.image)} style={styles.popularImage} />
                <View style={styles.difficultyBadge}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                    {item.difficulty}
                  </Text>
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
                  <Image source={resolveTrailImage(item.image)} style={styles.cardImage} />
                  
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

      {/* Sidebar Drawer Menu */}
      {isMenuVisible && (
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={styles.modalBackdrop} onPress={closeMenu} />
          <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}>
            <BlurView intensity={95} tint="dark" style={styles.drawerBlur}>
              <View style={[styles.drawerHeader, { paddingTop: insets.top + 20 }]}>
                <View style={styles.drawerBrandingRow}>
                  <FontAwesome5 name="hiking" size={20} color="#FF8C32" />
                  <Text style={styles.drawerTitleBranding}>SABRATRAILS</Text>
                </View>
                <Pressable onPress={closeMenu} style={styles.drawerCloseButton}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </Pressable>
              </View>
              
              <View style={styles.drawerUserInfo}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.drawerUserName}>{userName}</Text>
                {userEmail ? <Text style={styles.drawerUserEmail}>{userEmail}</Text> : null}
              </View>

              <View style={styles.drawerDivider} />

              <View style={[styles.drawerItems, { paddingBottom: insets.bottom + 95 }]}>
                <Pressable 
                  style={styles.drawerItem} 
                  onPress={() => {
                    closeMenu();
                    router.push('/profile');
                  }}
                >
                  <Ionicons name="person-outline" size={22} color="#FFF" style={styles.drawerItemIcon} />
                  <Text style={styles.drawerItemText}>Profile</Text>
                </Pressable>
                <View style={styles.itemSeparator} />

                <Pressable 
                  style={styles.drawerItem} 
                  onPress={() => {
                    closeMenu();
                    router.push('/saved-trails');
                  }}
                >
                  <Ionicons name="bookmark-outline" size={22} color="#FFF" style={styles.drawerItemIcon} />
                  <Text style={styles.drawerItemText}>Saved Trails</Text>
                </Pressable>
                <View style={styles.itemSeparator} />

                <Pressable 
                  style={styles.drawerItem} 
                  onPress={() => {
                    closeMenu();
                    router.push('/settings');
                  }}
                >
                  <Ionicons name="settings-outline" size={22} color="#FFF" style={styles.drawerItemIcon} />
                  <Text style={styles.drawerItemText}>Settings</Text>
                </Pressable>

                <Pressable style={[styles.drawerItem, styles.logoutItem]} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={22} color="#FF3B30" style={styles.drawerItemIcon} />
                  <Text style={[styles.drawerItemText, styles.logoutText]}>Logout</Text>
                </Pressable>
              </View>
            </BlurView>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 25,
    flexDirection: 'column',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 0,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 0,
  },
  headerBranding: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8C32',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 0,
    lineHeight: 26,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -4,
    alignSelf: 'center',
    flexShrink: 0,
  },
  searchContainer: {
    marginHorizontal: 20,
    height: 55,
    marginBottom: 20,
    backgroundColor: 'rgba(20, 20, 20, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
    marginBottom: 0,
    paddingBottom: 0,
  },
  horizontalListFlatList: {
    marginBottom: 0,
    paddingBottom: 0,
  },
  gemCard: {
    width: width * 0.65,
    height: 230,
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
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
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
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Softer, premium backdrop
  },
  drawerContainer: {
    width: '75%',
    height: '100%',
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: -10, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(255, 255, 255, 0.12)',
  },
  drawerBlur: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 15, 20, 0.75)', // Luxury glass tint
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 35,
  },
  drawerBrandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerTitleBranding: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8C32',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  drawerCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  drawerUserInfo: {
    alignItems: 'center',
    marginBottom: 35,
    paddingVertical: 10,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 140, 50, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#FF8C32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
  },
  drawerUserName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  drawerUserEmail: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 25,
  },
  drawerItems: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  drawerItemIcon: {
    marginRight: 16,
  },
  drawerItemText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  itemSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginHorizontal: 8,
  },
  logoutItem: {
    marginTop: 'auto',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '700',
  },
});



