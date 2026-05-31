import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  Dimensions, 
  StatusBar,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as SecureStore from 'expo-secure-store';

import { useTheme } from '@/hooks/use-theme';
import { deleteUserAccount } from '@/services/api';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const [userName, setUserName] = useState('Explorer');
  const [userEmail, setUserEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal support state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<'about' | 'terms' | 'privacy'>('about');

  // Toggle settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [offlineSync, setOfflineSync] = useState(false);

  useEffect(() => {
    async function loadSettingsAndUserData() {
      try {
        // Load User Details
        const storedName = await SecureStore.getItemAsync('user_name');
        const storedEmail = await SecureStore.getItemAsync('user_email');
        if (storedName) setUserName(storedName);
        if (storedEmail) setUserEmail(storedEmail);

        // Load Preferences
        const storedPush = await SecureStore.getItemAsync('pref_push_notifications');
        const storedLocation = await SecureStore.getItemAsync('pref_location_services');
        const storedOffline = await SecureStore.getItemAsync('pref_offline_sync');

        if (storedPush !== null) setPushNotifications(storedPush === 'true');
        if (storedLocation !== null) setLocationServices(storedLocation === 'true');
        if (storedOffline !== null) setOfflineSync(storedOffline === 'true');
      } catch (err) {
        console.error('Failed to load user info or preferences in settings:', err);
      }
    }
    loadSettingsAndUserData();
  }, []);

  const handlePushToggle = async (value: boolean) => {
    setPushNotifications(value);
    try {
      await SecureStore.setItemAsync('pref_push_notifications', value.toString());
      console.log(`[Preferences] Saved Push Notifications preference: ${value}`);
      
      if (value) {
        // TODO: Trigger Native Expo Notifications permission request
        // Example integration:
        // const { status } = await Notifications.requestPermissionsAsync();
        // if (status === 'granted') { registerForPushNotificationsAsync(); }
        console.log('[Native API] Trigger Expo Notifications permission request: GRANTED (Simulated)');
      } else {
        // TODO: Unregister push token or disable notification delivery rules
        console.log('[Native API] Disable/unregister push notifications token on backend...');
      }
    } catch (err) {
      console.error('Failed to save push notification setting:', err);
    }
  };

  const handleLocationToggle = async (value: boolean) => {
    setLocationServices(value);
    try {
      await SecureStore.setItemAsync('pref_location_services', value.toString());
      console.log(`[Preferences] Saved Location Services preference: ${value}`);
      
      if (value) {
        // TODO: Trigger Native Expo Location permission request
        // Example integration:
        // const { status } = await Location.requestForegroundPermissionsAsync();
        // if (status === 'granted') { startForegroundLocationTracking(); }
        console.log('[Native API] Trigger Expo Location foreground/background permission requests: GRANTED (Simulated)');
      } else {
        // TODO: Turn off any active background location trackers or breadcrumb syncs
        console.log('[Native API] Stop active location tracking telemetry feeds...');
      }
    } catch (err) {
      console.error('Failed to save location services setting:', err);
    }
  };

  const handleOfflineSyncToggle = async (value: boolean) => {
    setOfflineSync(value);
    try {
      await SecureStore.setItemAsync('pref_offline_sync', value.toString());
      console.log(`[Preferences] Saved Offline Storage Sync preference: ${value}`);
      
      if (value) {
        // TODO: Trigger offline database synchronization / download map region tiles
        console.log('[Native API] Trigger background synchronization of offline map tiles and trail catalogs...');
      } else {
        // TODO: Cancel active background download worker jobs or flush download caches
        console.log('[Native API] Cancel background sync tasks and release temporary caching files...');
      }
    } catch (err) {
      console.error('Failed to save offline storage sync setting:', err);
    }
  };

  const openSupportModal = (title: string, type: 'about' | 'terms' | 'privacy') => {
    setModalTitle(title);
    setModalType(type);
    setModalVisible(true);
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Permanently Delete Account",
      "Are you sure you want to delete your account? This will erase your saved bookmarks, live adventure history, and community gallery photos. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Account", 
          style: "destructive", 
          onPress: handleDeleteAccount 
        }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Call backend route to delete database profile
      await deleteUserAccount();
      console.log('User account deleted from backend successfully.');

      // Clear device secure store credentials
      await SecureStore.deleteItemAsync('auth_code');
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('user_name');
      await SecureStore.deleteItemAsync('user_email');
      
      // Clear preferences as well on account deletion
      await SecureStore.deleteItemAsync('pref_push_notifications');
      await SecureStore.deleteItemAsync('pref_location_services');
      await SecureStore.deleteItemAsync('pref_offline_sync');

      // Redirect to login page
      router.replace('/login');
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      Alert.alert('Error', err.message || 'Could not complete account deletion. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Ambient gradient overlay */}
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {isDeleting ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>Deleting your account securely...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Account info */}
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          <View style={styles.cardWrapper}>
            <BlurView intensity={20} tint="dark" style={styles.settingsCard}>
              <View style={styles.profileRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName} numberOfLines={1}>{userName}</Text>
                  {userEmail ? <Text style={styles.profileEmail} numberOfLines={1}>{userEmail}</Text> : null}
                </View>
              </View>
            </BlurView>
          </View>

          {/* Section 2: Preferences */}
          <Text style={styles.sectionHeader}>PREFERENCES</Text>
          <View style={styles.cardWrapper}>
            <BlurView intensity={20} tint="dark" style={styles.settingsCard}>
              {/* Push Notifications Row */}
              <View style={styles.settingRow}>
                <View style={styles.rowLabelGroup}>
                  <View style={[
                    styles.iconWrapper, 
                    { backgroundColor: pushNotifications ? 'rgba(255, 140, 50, 0.1)' : 'rgba(255, 255, 255, 0.05)' }
                  ]}>
                    <Ionicons 
                      name="notifications-outline" 
                      size={20} 
                      color={pushNotifications ? '#FF8C32' : '#8E8E93'} 
                    />
                  </View>
                  <Text style={styles.rowText}>Push Notifications</Text>
                </View>
                <Switch 
                  value={pushNotifications} 
                  onValueChange={handlePushToggle}
                  trackColor={{ false: 'rgba(255,255,255,0.08)', true: 'rgba(255, 140, 50, 0.4)' }}
                  thumbColor={pushNotifications ? '#FF8C32' : '#8E8E93'}
                />
              </View>
              <View style={styles.rowSeparator} />

              {/* Location Services Row */}
              <View style={styles.settingRow}>
                <View style={styles.rowLabelGroup}>
                  <View style={[
                    styles.iconWrapper, 
                    { backgroundColor: locationServices ? 'rgba(255, 140, 50, 0.1)' : 'rgba(255, 255, 255, 0.05)' }
                  ]}>
                    <Ionicons 
                      name="location-outline" 
                      size={20} 
                      color={locationServices ? '#FF8C32' : '#8E8E93'} 
                    />
                  </View>
                  <Text style={styles.rowText}>Location Services</Text>
                </View>
                <Switch 
                  value={locationServices} 
                  onValueChange={handleLocationToggle}
                  trackColor={{ false: 'rgba(255,255,255,0.08)', true: 'rgba(255, 140, 50, 0.4)' }}
                  thumbColor={locationServices ? '#FF8C32' : '#8E8E93'}
                />
              </View>
              <View style={styles.rowSeparator} />

              {/* Offline Map Sync Row */}
              <View style={styles.settingRow}>
                <View style={styles.rowLabelGroup}>
                  <View style={[
                    styles.iconWrapper, 
                    { backgroundColor: offlineSync ? 'rgba(255, 140, 50, 0.1)' : 'rgba(255, 255, 255, 0.05)' }
                  ]}>
                    <Ionicons 
                      name="cloud-download-outline" 
                      size={20} 
                      color={offlineSync ? '#FF8C32' : '#8E8E93'} 
                    />
                  </View>
                  <Text style={styles.rowText}>Offline Storage Sync</Text>
                </View>
                <Switch 
                  value={offlineSync} 
                  onValueChange={handleOfflineSyncToggle}
                  trackColor={{ false: 'rgba(255,255,255,0.08)', true: 'rgba(255, 140, 50, 0.4)' }}
                  thumbColor={offlineSync ? '#FF8C32' : '#8E8E93'}
                />
              </View>
            </BlurView>
          </View>

          {/* Section 3: Support */}
          <Text style={styles.sectionHeader}>SUPPORT</Text>
          <View style={styles.cardWrapper}>
            <BlurView intensity={20} tint="dark" style={styles.settingsCard}>
              {/* About Row */}
              <Pressable 
                style={styles.clickableRow}
                onPress={() => openSupportModal('About SabraTrails', 'about')}
              >
                <View style={styles.rowLabelGroup}>
                  <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                    <Ionicons name="information-circle-outline" size={20} color="#E5E5EA" />
                  </View>
                  <Text style={styles.rowText}>About SabraTrails</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
              </Pressable>
              <View style={styles.rowSeparator} />

              {/* Terms of Service Row */}
              <Pressable 
                style={styles.clickableRow}
                onPress={() => openSupportModal('Terms of Service', 'terms')}
              >
                <View style={styles.rowLabelGroup}>
                  <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                    <Ionicons name="document-text-outline" size={20} color="#E5E5EA" />
                  </View>
                  <Text style={styles.rowText}>Terms of Service</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
              </Pressable>
              <View style={styles.rowSeparator} />

              {/* Privacy Policy Row */}
              <Pressable 
                style={styles.clickableRow}
                onPress={() => openSupportModal('Privacy Policy', 'privacy')}
              >
                <View style={styles.rowLabelGroup}>
                  <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#E5E5EA" />
                  </View>
                  <Text style={styles.rowText}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
              </Pressable>
            </BlurView>
          </View>

          {/* Section 4: Account Actions */}
          <Text style={styles.sectionHeader}>ACCOUNT ACTIONS</Text>
          <View style={styles.cardWrapper}>
            <BlurView intensity={20} tint="dark" style={styles.settingsCard}>
              <Pressable style={styles.clickableRow} onPress={confirmDeleteAccount}>
                <View style={styles.rowLabelGroup}>
                  <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </View>
                  <Text style={[styles.rowText, styles.deleteAccountText]}>Delete Account</Text>
                </View>
              </Pressable>
            </BlurView>
          </View>
        </ScrollView>
      )}

      {/* Sleek Support Information Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setModalVisible(false)} />
          <View style={styles.modalSheetWrapper}>
            <BlurView intensity={35} tint="dark" style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
              {/* Drag indicator pill */}
              <View style={styles.dragIndicator} />
              
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modalTitle}</Text>
              </View>

              {/* Modal Body */}
              <ScrollView 
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {modalType === 'about' && (
                  <View style={styles.aboutContainer}>
                    <View style={styles.versionBadge}>
                      <Text style={styles.versionText}>Version 1.0.0</Text>
                    </View>
                    <Text style={styles.modalText}>
                      SabraTrails is your ultimate companion for exploring the beautiful, untouched wilderness of the Sabaragamuwa region in Sri Lanka. From the mist-shrouded peaks of Belihuloya to the roaring waterfalls of Bambarakanda, our app provides real-time tracking, detailed trail information, local weather updates, and safety recommendations.
                    </Text>
                    <Text style={[styles.modalText, { marginTop: 16 }]}>
                      Our mission is to promote eco-friendly tourism while ensuring hiker safety by providing accurate routes, live coordination tracking, and direct access to emergency guides. Please hike responsibly, respect nature, and carry out whatever you bring in. Happy exploring!
                    </Text>
                  </View>
                )}

                {modalType === 'terms' && (
                  <Text style={styles.modalText}>
                    {"Last updated: May 2026\n\nWelcome to SabraTrails. By using our application, you agree to comply with and be bound by the following terms of service:\n\n1. Use of the App: SabraTrails is designed to guide hikers and nature enthusiasts. The trail coordinates and descriptions are for general informational purposes only.\n\n2. Safety & Liability: Hiking and outdoor exploration are inherently risky activities. SabraTrails does not assume liability for any injury, accident, lost item, or damage incurred while using the app or traveling on the specified routes. Always check local weather forecasts, pack appropriate safety gear, and notify others of your plans.\n\n3. Account Security: You are responsible for maintaining the confidentiality of your credentials and account access.\n\n4. Respect the Environment: Users must practice the 'Leave No Trace' principles. Do not litter, disturb wildlife, or alter natural habitats."}
                  </Text>
                )}

                {modalType === 'privacy' && (
                  <Text style={styles.modalText}>
                    {"Last updated: May 2026\n\nAt SabraTrails, we respect your privacy and are committed to protecting your personal data:\n\n1. Data Collection: We collect location data dynamically when you initiate an active tracking session. This coordinates telemetry is used solely to generate your active map breadcrumbs and compute hiking statistics (duration, distance, speed). We do not track your location in the background when the app is idle.\n\n2. Third-Party Authentication: User sign-in authentication is securely managed by WSO2 Asgardeo. We store only your basic profile info (username, email) to link your bookmarks and photos.\n\n3. Data Sharing: Your personal data, GPS history logs, and gallery photos are never sold or shared with third-party advertisers.\n\n4. Data Control: You can permanently wipe all your account data, stored telemetry logs, and gallery uploads directly from the 'Danger Zone' at any time."}
                  </Text>
                )}
              </ScrollView>

              {/* Close Button */}
              <Pressable 
                style={styles.modalCloseButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </Pressable>
            </BlurView>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    color: '#A0A0A0',
    fontSize: 15,
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 10,
    marginTop: 24,
    paddingLeft: 4,
    letterSpacing: 0.5,
  },
  cardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF8C32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  profileEmail: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  clickableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteAccountText: {
    color: '#FF3B30',
  },
  rowSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheetWrapper: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxHeight: '75%',
    width: '100%',
  },
  modalSheet: {
    backgroundColor: 'rgba(22, 25, 32, 0.90)',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalScrollView: {
    maxHeight: 350,
    marginBottom: 10,
  },
  modalScrollContent: {
    paddingVertical: 4,
  },
  modalText: {
    fontSize: 14,
    color: '#D0D0D0',
    lineHeight: 22,
    textAlign: 'left',
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  modalCloseButton: {
    backgroundColor: 'rgba(255, 140, 50, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 50, 0.3)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  modalCloseButtonText: {
    color: '#FF8C32',
    fontSize: 16,
    fontWeight: '700',
  },
  aboutContainer: {
    alignItems: 'stretch',
  },
  versionBadge: {
    alignSelf: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A0A0A0',
  },
});
