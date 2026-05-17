import React, { useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  Pressable,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export default function SafetyHubScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [offlineMaps, setOfflineMaps] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>Safety Hub</ThemedText>
          <ThemedText themeColor="textSecondary">Live environmental updates and emergency resources.</ThemedText>
        </View>

        {/* Active Alerts */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Active Alerts</ThemedText>
          
          <GlassCard intensity={15} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={styles.cautionBadge}>
                <Ionicons name="warning" size={14} color="#FFD700" />
                <Text style={styles.cautionText}>Caution</Text>
              </View>
              <Ionicons name="bug" size={20} color={theme.accent} />
            </View>
            <ThemedText style={styles.alertTitle}>Leech Alert</ThemedText>
            <ThemedText style={styles.alertBody} themeColor="textSecondary">
              High activity reported on damp trails in the lower valley sections.
            </ThemedText>
          </GlassCard>

          <GlassCard intensity={15} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={styles.cautionBadge}>
                <Ionicons name="warning" size={14} color="#FFD700" />
                <Text style={styles.cautionText}>Caution</Text>
              </View>
              <Ionicons name="mountain-outline" size={20} color={theme.accent} />
            </View>
            <ThemedText style={styles.alertTitle}>Slippery Rocks</ThemedText>
            <ThemedText style={styles.alertBody} themeColor="textSecondary">
              Recent rainfall has made riverbed crossings extremely hazardous.
            </ThemedText>
          </GlassCard>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Emergency Contacts</ThemedText>
          
          <GlassCard intensity={10} style={styles.contactsCard}>
            <View style={styles.contactItem}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="add-circle" size={24} color="#F87171" />
              </View>
              <View style={styles.contactText}>
                <ThemedText style={styles.contactName}>Nearest Hospital</ThemedText>
                <ThemedText style={styles.contactSub} themeColor="textSecondary">4.2 km away</ThemedText>
              </View>
              <Pressable style={styles.callButton}>
                <Ionicons name="call" size={20} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.contactItem}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="shield-checkmark" size={24} color="#60A5FA" />
              </View>
              <View style={styles.contactText}>
                <ThemedText style={styles.contactName}>Local Police</ThemedText>
                <ThemedText style={styles.contactSub} themeColor="textSecondary">Emergency Dispatch</ThemedText>
              </View>
              <Pressable style={styles.callButton}>
                <Ionicons name="call" size={20} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.contactItem}>
              <View style={styles.contactIconContainer}>
                <Ionicons name="business" size={24} color="#A0A0A0" />
              </View>
              <View style={styles.contactText}>
                <ThemedText style={styles.contactName}>University Security</ThemedText>
                <ThemedText style={styles.contactSub} themeColor="textSecondary">Campus Jurisdiction</ThemedText>
              </View>
              <Pressable style={styles.callButton}>
                <Ionicons name="call" size={20} color="#fff" />
              </Pressable>
            </View>
          </GlassCard>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Resources</ThemedText>
          <GlassCard intensity={15} style={styles.resourceCard}>
            <View style={styles.resourceLeft}>
               <View style={styles.resourceIcon}>
                 <Ionicons name="cloud-download-outline" size={24} color={theme.text} />
               </View>
               <View>
                 <ThemedText style={styles.resourceName}>Offline Maps</ThemedText>
                 <ThemedText style={styles.resourceSub} themeColor="textSecondary">Download region for no-signal areas</ThemedText>
               </View>
            </View>
            <Switch 
              value={offlineMaps} 
              onValueChange={setOfflineMaps}
              trackColor={{ false: '#3E3E3E', true: theme.primary }}
              thumbColor={offlineMaps ? '#fff' : '#f4f3f4'}
            />
          </GlassCard>
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
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF8C32',
    paddingHorizontal: 20,
    marginBottom: 15,
  },

  alertCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cautionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  cautionText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  alertBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactsCard: {
    marginHorizontal: 20,
    padding: 0,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactText: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactSub: {
    fontSize: 13,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 140, 50, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 15,
  },
  resourceCard: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  resourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  resourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  resourceSub: {
    fontSize: 12,
  },
});

