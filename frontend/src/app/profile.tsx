import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  Dimensions, 
  StatusBar,
  ActivityIndicator,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as SecureStore from 'expo-secure-store';

import { useTheme } from '@/hooks/use-theme';
import { syncUserProfile } from '@/services/api';

const { width } = Dimensions.get('window');

interface ProfileData {
  name: string;
  email: string;
  stats?: {
    totalBookmarked: number;
    totalPhotos: number;
  };
}

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const [profile, setProfile] = useState<ProfileData>({ name: 'Explorer', email: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const storedName = await SecureStore.getItemAsync('user_name');
        const storedEmail = await SecureStore.getItemAsync('user_email');
        if (storedName || storedEmail) {
          setProfile({
            name: storedName || 'Explorer',
            email: storedEmail || '',
            stats: { totalBookmarked: 0, totalPhotos: 0 }
          });
        }
      } catch (err) {
        console.error('Failed to read SecureStore data:', err);
      }
    }

    async function fetchFullProfile() {
      try {
        const data = await syncUserProfile();
        if (data) {
          setProfile({
            name: data.name || 'Explorer',
            email: data.email || '',
            stats: data.stats || {
              totalBookmarked: data.savedTrails?.length || 0,
              totalPhotos: 0
            }
          });
        }
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch full profile details:', err);
        setError('Could not refresh dashboard statistics.');
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialData().then(fetchFullProfile);
  }, []);

  const initials = profile.name ? profile.name.charAt(0).toUpperCase() : 'E';

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient overlay */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={['#0F0F15', '#161920', '#090A0E']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255, 255, 255, 0.05)' }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Profile Details Container */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar and Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarOuterRing}>
            <LinearGradient
              colors={['#FF8C32', '#FF5F00']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
          </View>
          <Text style={styles.userName}>{profile.name}</Text>
          {profile.email ? <Text style={styles.userEmail}>{profile.email}</Text> : null}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* User Statistics Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>User Statistics</Text>
          
          {isLoading && !profile.stats ? (
            <ActivityIndicator size="small" color="#FF8C32" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.statsGrid}>
              {/* Stat Card 1: Bookmarks */}
              <View style={styles.glassCardWrapper}>
                <BlurView intensity={25} tint="dark" style={styles.glassCard}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="bookmark-outline" size={22} color="#FF8C32" />
                  </View>
                  <Text style={styles.statNumber}>
                    {profile.stats?.totalBookmarked ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>Saved Trails</Text>
                </BlurView>
              </View>

              {/* Stat Card 2: Shared Photos */}
              <View style={styles.glassCardWrapper}>
                <BlurView intensity={25} tint="dark" style={styles.glassCard}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="images-outline" size={22} color="#FF8C32" />
                  </View>
                  <Text style={styles.statNumber}>
                    {profile.stats?.totalPhotos ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>Shared Photos</Text>
                </BlurView>
              </View>
            </View>
          )}

          {error && (
            <Text style={styles.errorText}>
              <Ionicons name="alert-circle-outline" size={14} color="#F87171" /> {error}
            </Text>
          )}
        </View>

        {/* Call to action card */}
        <View style={styles.actionCardWrapper}>
          <BlurView intensity={15} tint="dark" style={styles.actionCard}>
            <View style={styles.actionCardHeader}>
              <Ionicons name="compass" size={20} color="#FF8C32" />
              <Text style={styles.actionCardTitle}>Sabaragamuwa Region Explorer</Text>
            </View>
            <Text style={styles.actionCardText}>
              Inform someone about your hiking route before starting an adventure, carry enough hydration, and keep the wilderness pristine. Safety always comes first!
            </Text>
          </BlurView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    zIndex: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarOuterRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 50, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF8C32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarGradient: {
    width: 98,
    height: 98,
    borderRadius: 49,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: '#A0A0A0',
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    marginVertical: 20,
  },
  statsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  glassCardWrapper: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  glassCard: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 140, 50, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 50, 0.25)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF8C32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#F87171',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionCardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 10,
  },
  actionCard: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionCardText: {
    fontSize: 13,
    color: '#98989F',
    lineHeight: 22,
    fontWeight: '500',
    textAlign: Platform.select({ ios: 'justify', android: 'center', default: 'justify' }),
  },
});
