import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  Pressable, 
  Dimensions, 
  StatusBar 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/use-theme';
import { TRAILS } from '@/utils/trailData';

const { width } = Dimensions.get('window');

function getDifficultyColor(diff: string) {
  const d = diff.toLowerCase();
  if (d.includes('easy')) return '#4ADE80';
  if (d.includes('mod')) return '#FBBF24';
  return '#F87171';
}

export default function CategoryScreen() {
  const { type } = useLocalSearchParams<{ type: 'hidden' | 'popular' }>();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const isHidden = type === 'hidden';
  const categoryTitle = isHidden ? 'Hidden Gems' : 'Popular Trails';
  const filteredTrails = TRAILS.filter(t => isHidden ? t.hiddenGem : !t.hiddenGem);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: 'rgba(255, 255, 255, 0.05)' }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{categoryTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Grid List */}
      <FlatList
        data={filteredTrails}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <Pressable 
            onPress={() => router.push(`/trail/${item.id}`)}
            style={styles.card}
          >
            <Image source={item.image} style={styles.cardImage} />
            
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
        )}
        showsVerticalScrollIndicator={false}
      />
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
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: (width - 46) / 2,
    height: 230,
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
