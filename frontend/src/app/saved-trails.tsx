import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  Pressable, 
  Dimensions, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/use-theme';
import { syncUserProfile, toggleBookmark, resolveTrailImage } from '@/services/api';

const { width } = Dimensions.get('window');

interface Trail {
  id: string;
  _id: string;
  name: string;
  location: string;
  difficulty: string;
  image: string;
  elevation?: string;
  duration?: string;
  description?: string;
  hiddenGem?: boolean;
}

function getDifficultyColor(diff: string) {
  const d = diff.toLowerCase();
  if (d.includes('easy')) return '#4ADE80';
  if (d.includes('mod')) return '#FBBF24';
  return '#F87171';
}

export default function SavedTrailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const [savedTrails, setSavedTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSavedTrails() {
      try {
        const profile = await syncUserProfile();
        if (profile && profile.bookmarkedTrailsDetails) {
          setSavedTrails(profile.bookmarkedTrailsDetails);
        }
      } catch (err) {
        console.error('Failed to load saved trails:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSavedTrails();
  }, []);

  const handleUnsave = async (trailId: string) => {
    // Save previous state for rollback
    const previousTrails = [...savedTrails];
    const index = savedTrails.findIndex(t => t.id === trailId);
    if (index === -1) return;

    // Optimistically update UI by filtering out the unsaved item
    setSavedTrails(prev => prev.filter(t => t.id !== trailId));

    try {
      await toggleBookmark(trailId);
      console.log(`Successfully unsaved trail: ${trailId}`);
    } catch (err) {
      console.error('Failed to unsave trail, rolling back:', err);
      // Rollback optimistic state if backend sync fails
      setSavedTrails(previousTrails);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255, 255, 255, 0.05)' }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Saved Trails</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C32" />
        </View>
      ) : savedTrails.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bookmark-outline" size={48} color="#FF8C32" />
          </View>
          <Text style={styles.emptyTitle}>No saved trails yet</Text>
          <Text style={styles.emptySubtitle}>
            Browse our gorgeous trail catalog and tap the bookmark icon to save your favorites here.
          </Text>
          <Pressable 
            style={styles.exploreButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <LinearGradient
              colors={['#FF8C32', '#FF5F00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.exploreButtonGradient}
            >
              <Text style={styles.exploreButtonText}>Explore Trails</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={savedTrails}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <Pressable 
                onPress={() => router.push(`/trail/${item.id}`)}
                style={styles.card}
              >
                <Image source={resolveTrailImage(item.image)} style={styles.cardImage} />
                
                {/* Dynamic Difficulty Badge */}
                <View style={styles.difficultyBadge}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                    {item.difficulty}
                  </Text>
                </View>

                {/* High-Fidelity Linear Gradient Overlay */}
                <LinearGradient
                  colors={['transparent', 'rgba(0, 0, 0, 0.95)']}
                  style={styles.gradient}
                />
                
                {/* Trail Information */}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={12} color="#A0A0A0" />
                    <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
                  </View>
                </View>
              </Pressable>

              {/* Unsave/Trash Action Button */}
              <Pressable 
                onPress={() => handleUnsave(item.id)}
                style={styles.unsaveButton}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={15} color="#FF3B30" />
              </Pressable>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 140, 50, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 50, 0.25)',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 30,
  },
  exploreButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  exploreButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardContainer: {
    width: (width - 46) / 2,
    height: 230,
    position: 'relative',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: '#1C1C1E',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 2,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  unsaveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '500',
  },
});
