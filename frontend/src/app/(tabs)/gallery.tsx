import React, { useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  Pressable,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';


const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 50) / 2;

const CATEGORIES = ['All Shots', 'Waterfalls', 'Peaks', 'Caves'];

const IMAGES = [
  { id: '1', source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Ella_Rock_-_Uva_Province.jpg/1024px-Ella_Rock_-_Uva_Province.jpg', height: 250 },
  { id: '2', source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Nine_Arch_Bridge.jpg/1024px-Nine_Arch_Bridge.jpg', height: 180 },
  { id: '3', source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Diyaluma_Falls_1.jpg/1024px-Diyaluma_Falls_1.jpg', height: 220 },
  { id: '4', source: 'https://images.unsplash.com/photo-1546412414-e1885261bc91?q=80&w=1000', height: 200 },
  { id: '5', source: 'https://images.unsplash.com/photo-1527489377706-5bf97e608852?q=80&w=1000', height: 280 },
  { id: '6', source: 'https://images.unsplash.com/photo-1588665042407-789069d30e5d?q=80&w=1000', height: 160 },
];



export default function CommunityLensScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [activeCategory, setActiveCategory] = useState('All Shots');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>Community Lens</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Discover the raw beauty of the wilderness captured by fellow explorers.
          </ThemedText>
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryList}
        >
          {CATEGORIES.map((cat) => (
            <Pressable 
              key={cat} 
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.categoryButton, 
                activeCategory === cat && styles.categoryButtonActive
              ]}
            >
              <Text style={[
                styles.categoryText,
                activeCategory === cat && styles.categoryTextActive
              ]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Masonry Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.column}>
            {IMAGES.filter((_, i) => i % 2 === 0).map((img) => (
              <View key={img.id} style={[styles.imageWrapper, { height: img.height }]}>
                <Image source={img.source} style={styles.image} />
              </View>
            ))}
          </View>
          <View style={styles.column}>
            {IMAGES.filter((_, i) => i % 2 !== 0).map((img) => (
              <View key={img.id} style={[styles.imageWrapper, { height: img.height }]}>
                <Image source={img.source} style={styles.image} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable style={[styles.fab, { bottom: 120 }]}>
        <Ionicons name="camera" size={28} color="#000" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  categoryList: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 25,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryButtonActive: {
    backgroundColor: '#FF8C32',
    borderColor: '#FF8C32',
  },
  categoryText: {
    color: '#A0A0A0',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#000',
  },
  gridContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 15,
  },
  column: {
    flex: 1,
    gap: 15,
  },
  imageWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fab: {
    position: 'absolute',
    right: 25,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#FFD7BA',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

