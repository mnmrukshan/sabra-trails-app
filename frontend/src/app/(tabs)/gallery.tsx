import React, { useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  Pressable,
  Dimensions,
  Alert,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { TRAILS } from '@/utils/trailData';
import * as SecureStore from 'expo-secure-store';
import { fetchGalleryPhotos, uploadGalleryPhoto, deleteGalleryPhoto, resolveTrailImage } from '@/services/api';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All Shots', 'Waterfalls & Rivers', 'Peaks & Viewpoints', 'Estates & Forests'];

// Map TRAILS to photo feed with alternate masonry card heights
const getCategoryForTrail = (trail: typeof TRAILS[0]) => {
  const name = trail.name.toLowerCase();
  const desc = trail.description.toLowerCase();

  // 1. Waterfalls & Rivers
  if (
    name.includes('falls') || 
    name.includes('waterfall') || 
    name.includes('ella') || 
    name.includes('lake') || 
    name.includes('pond') || 
    name.includes('pokuna') || 
    name.includes('reservoir') || 
    name.includes('wewa') ||
    name.includes('hirikatuoya') ||
    desc.includes('stream') ||
    desc.includes('cascade') ||
    desc.includes('plunge pool')
  ) {
    return 'Waterfalls & Rivers';
  }

  // 2. Estates & Forests (covers tea estates, rail walks, sanctuaries, forests, bridges, plains)
  if (
    name.includes('estate') ||
    name.includes('sanctuary') ||
    name.includes('forest') ||
    name.includes('bungalow') ||
    name.includes('bridge') ||
    name.includes('route') ||
    name.includes('park') ||
    name.includes('station') ||
    name.includes('path') ||
    name.includes('adisham') ||
    name.includes('plains') ||
    name.includes('plain') ||
    desc.includes('plantation') ||
    desc.includes('sanctuary') ||
    desc.includes('monastery') ||
    desc.includes('railway station')
  ) {
    return 'Estates & Forests';
  }

  // 3. Peaks & Viewpoints (default fallback, covers peaks, mountains, rocks, viewpoints)
  return 'Peaks & Viewpoints';
};

const PHOTO_FEED = TRAILS.map((trail, index) => {
  const heights = [220, 160, 260, 190, 230, 170];
  return {
    id: trail.id,
    source: trail.image,
    height: heights[index % heights.length],
    title: trail.name,
    location: trail.location,
    category: getCategoryForTrail(trail),
  };
});

export default function CommunityLensScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All Shots');
  const [photos, setPhotos] = useState<any[]>(PHOTO_FEED);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Modal States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [trailName, setTrailName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCustomImage, setSelectedCustomImage] = useState<any>(null);

  React.useEffect(() => {
    async function loadUser() {
      const email = await SecureStore.getItemAsync('user_email');
      if (email) setCurrentUserEmail(email);
    }
    async function loadGallery() {
      try {
        const dbPhotos = await fetchGalleryPhotos();
        if (dbPhotos && dbPhotos.length > 0) {
          const backendPhotos = dbPhotos.map((p: any) => ({
            id: p._id,
            source: p.image,
            height: Math.floor(Math.random() * 100) + 170,
            title: p.title,
            location: p.location,
            category: p.category,
            userEmail: p.userEmail,
            userName: p.userName
          }));
          setPhotos([...backendPhotos, ...PHOTO_FEED]);
        }
      } catch (err) {
        console.error('Failed to load gallery photos:', err);
      }
    }
    loadUser();
    loadGallery();
  }, []);

  const filteredPhotos = photos.filter(photo => {
    if (activeCategory === 'All Shots') return true;
    return photo.category === activeCategory;
  });

  const handleOpenGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Please enable photo library access in your device settings to share photos.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", style: "default", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
        setTrailName('');
        setLocation('');
        setIsModalVisible(true);
      }
    } catch (error) {
      console.error("Error picking image: ", error);
      Alert.alert("Error", "Something went wrong while choosing the photo.");
    }
  };

  const handleSharePost = async () => {
    if (!selectedImageUri) return;
    if (!trailName.trim() || !location.trim()) {
      Alert.alert("Required Fields", "Please fill in both the Trail Name and Location.");
      return;
    }

    const finalCategory = activeCategory === 'All Shots' ? 'Peaks & Viewpoints' : activeCategory;

    const formData = new FormData();
    formData.append('title', trailName.trim());
    formData.append('location', location.trim());
    formData.append('category', finalCategory);
    
    const uriParts = selectedImageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('image', {
      uri: selectedImageUri,
      name: `photo_${Date.now()}.${fileType}`,
      type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`
    } as any);

    try {
      const uploadedPhoto = await uploadGalleryPhoto(formData);
      
      const newPhoto = {
        id: uploadedPhoto._id,
        source: uploadedPhoto.image,
        height: Math.floor(Math.random() * 100) + 170,
        title: uploadedPhoto.title,
        location: uploadedPhoto.location,
        category: uploadedPhoto.category,
        userEmail: uploadedPhoto.userEmail,
        userName: uploadedPhoto.userName
      };

      setPhotos(prevPhotos => [newPhoto, ...prevPhotos]);
      setIsModalVisible(false);
      setSelectedImageUri(null);
      showToast("Photo shared!");
    } catch (err: any) {
      console.error("Upload failed: ", err);
      Alert.alert("Upload Failed", err.message || "Could not upload your photo.");
    }
  };

  const handleCancelPost = () => {
    setIsModalVisible(false);
    setSelectedImageUri(null);
  };

  const handleDeleteCustomImage = (id: string) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo from your community feed?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              if (id.startsWith('custom_') || !isNaN(Number(id))) {
                setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== id));
              } else {
                await deleteGalleryPhoto(id);
                setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== id));
              }
              setSelectedCustomImage(null);
              showToast("Photo deleted");
            } catch (err: any) {
              console.error('Delete failed:', err);
              Alert.alert('Delete Failed', err.message || 'Could not delete your photo.');
            }
          } 
        }
      ]
    );
  };

  // Height-aware masonry distribution
  const leftColumn: typeof PHOTO_FEED = [];
  const rightColumn: typeof PHOTO_FEED = [];
  let leftHeight = 0;
  let rightHeight = 0;

  filteredPhotos.forEach((photo) => {
    if (leftHeight <= rightHeight) {
      leftColumn.push(photo);
      leftHeight += photo.height;
    } else {
      rightColumn.push(photo);
      rightHeight += photo.height;
    }
  });

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

        {/* Categories Horizontal Scroll */}
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
          {/* Left Column */}
          <View style={styles.column}>
            {leftColumn.map((img) => (
              <Pressable 
                key={img.id} 
                onPress={() => {
                  const isStatic = TRAILS.some(t => t.id === img.id);
                  if (!isStatic) {
                    setSelectedCustomImage(img);
                  } else {
                    router.push(`/trail/${img.id}`);
                  }
                }}
                style={[styles.imageWrapper, { height: img.height }]}
              >
                <Image source={resolveTrailImage(img.source)} style={styles.image} contentFit="cover" />
                <View style={styles.imageOverlay}>
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.overlayTextContainer}>
                    <Text style={styles.overlayTitle} numberOfLines={1}>{img.title}</Text>
                    <Text style={styles.overlayLocation} numberOfLines={1}>
                      <Ionicons name="location-sharp" size={10} color={theme.accent} /> {img.location}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Right Column */}
          <View style={styles.column}>
            {rightColumn.map((img) => (
              <Pressable 
                key={img.id} 
                onPress={() => {
                  const isStatic = TRAILS.some(t => t.id === img.id);
                  if (!isStatic) {
                    setSelectedCustomImage(img);
                  } else {
                    router.push(`/trail/${img.id}`);
                  }
                }}
                style={[styles.imageWrapper, { height: img.height }]}
              >
                <Image source={resolveTrailImage(img.source)} style={styles.image} contentFit="cover" />
                <View style={styles.imageOverlay}>
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.overlayTextContainer}>
                    <Text style={styles.overlayTitle} numberOfLines={1}>{img.title}</Text>
                    <Text style={styles.overlayLocation} numberOfLines={1}>
                      <Ionicons name="location-sharp" size={10} color={theme.accent} /> {img.location}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Camera Action Button */}
      <View style={[styles.fabContainer, { bottom: 120 }]}>
        <Pressable style={styles.fab} onPress={handleOpenGallery}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255, 140, 50, 0.65)', 'rgba(255, 140, 50, 0.25)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="camera" size={28} color="#fff" />
        </Pressable>
      </View>

      {/* Share Photo Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelPost}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Share Your Adventure</Text>
            
            {selectedImageUri && (
              <Image 
                source={{ uri: selectedImageUri }} 
                style={styles.imagePreview} 
                contentFit="cover"
              />
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Trail Name</Text>
              <TextInput
                style={[styles.input, { color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }]}
                placeholder="e.g. Hawagala Summit"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={trailName}
                onChangeText={setTrailName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={[styles.input, { color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }]}
                placeholder="e.g. Belihuloya"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalButton, styles.buttonCancel]} 
                onPress={handleCancelPost}
              >
                <Text style={styles.buttonCancelText}>Cancel</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalButton, styles.buttonShare]} 
                onPress={handleSharePost}
              >
                <LinearGradient
                  colors={['#FF8C32', '#FF5F00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.buttonShareText}>Share</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Full-Screen Custom Image Viewer Modal */}
      <Modal
        visible={selectedCustomImage !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedCustomImage(null)}
      >
        <View style={styles.viewerContainer}>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />
          
          {/* Glassmorphic Header */}
          <View style={[styles.viewerHeader, { paddingTop: insets.top }]}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
            <Pressable 
              style={styles.viewerHeaderButton} 
              onPress={() => setSelectedCustomImage(null)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
            
            {selectedCustomImage && (selectedCustomImage.id?.startsWith('custom_') || selectedCustomImage.userEmail === currentUserEmail) && (
              <Pressable 
                style={styles.viewerHeaderButton} 
                onPress={() => handleDeleteCustomImage(selectedCustomImage.id)}
              >
                <Ionicons name="trash-outline" size={24} color="#F87171" />
              </Pressable>
            )}
          </View>

          {/* Full Screen Image */}
          {selectedCustomImage && (
            <View style={styles.viewerImageWrapper}>
              <Image 
                source={resolveTrailImage(selectedCustomImage.source)} 
                style={styles.viewerImage} 
                contentFit="contain"
              />
              {/* Info Overlay */}
              <View style={styles.viewerInfoOverlay}>
                <ThemedText type="subtitle" style={styles.viewerTitle}>{selectedCustomImage.title}</ThemedText>
                <Text style={styles.viewerLocation}>
                  <Ionicons name="location-sharp" size={14} color={theme.accent} /> {selectedCustomImage.location}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {toastMessage && (
        <View style={[styles.toastContainer, { top: insets.top + 70 }]}>
          <BlurView intensity={90} tint="dark" style={styles.toastBlur}>
            <Ionicons name="checkmark-circle" size={18} color="#FF8C32" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </BlurView>
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
    paddingLeft: 20,
    paddingRight: 24,
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
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  overlayTextContainer: {
    padding: 12,
    gap: 2,
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  overlayLocation: {
    color: '#ddd',
    fontSize: 10,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  fabContainer: {
    position: 'absolute',
    right: 25,
    elevation: 8,
    shadowColor: '#FF8C32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  fab: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'rgba(255, 140, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 50, 0.4)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 25,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#fff',
  },
  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8C32',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 25,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  buttonCancel: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonCancelText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonShare: {
    position: 'relative',
  },
  buttonShareText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 95 : 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 10,
    overflow: 'hidden',
  },
  viewerHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  viewerHeaderTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 15,
  },
  viewerImageWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '70%',
  },
  viewerInfoOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 20, 20, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  viewerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  viewerLocation: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '500',
  },
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 9999,
  },
  toastBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 50, 0.3)',
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    gap: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
