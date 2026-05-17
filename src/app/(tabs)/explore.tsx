import { Image } from 'expo-image';
import React from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Pressable,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const { width } = Dimensions.get('window');

export default function AIAnalysisScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Widget */}
        <View style={styles.weatherHeader}>
           <Image 
             source="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000" 
             style={styles.weatherBg} 
             blurRadius={5}
           />


           <View style={styles.weatherOverlay}>
              <View style={styles.locationTag}>
                <Ionicons name="location" size={16} color="#fff" />
                <Text style={styles.locationTagText}>BAMBARAKANDA, LK</Text>
              </View>
              <Text style={styles.tempText}>22°<Text style={styles.tempUnit}>C</Text></Text>
              <View style={styles.conditionRow}>
                <Ionicons name="rainy" size={20} color={theme.primary} />
                <Text style={styles.conditionText}>Mist & Light Showers</Text>
              </View>
           </View>
        </View>

        {/* User Question */}
        <View style={styles.userBubbleContainer}>
          <GlassCard intensity={15} style={styles.userBubble}>
            <Text style={styles.userQuestion}>Is it safe to hike Bambarakanda at 2 PM today?</Text>
          </GlassCard>
        </View>

        {/* AI Analysis Card */}
        <View style={styles.analysisContainer}>
          <GlassCard intensity={25} style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
               <Ionicons name="sparkles" size={20} color={theme.primary} />
               <Text style={styles.analysisTitle}>TRAIL AI ANALYSIS</Text>
            </View>
            
            <Text style={styles.analysisBody}>
              Current conditions show dense mist moving in around 1:30 PM, reducing visibility significantly near the upper falls. While the trail remains open, surface rocks are likely to be extremely slippery due to morning precipitation.
            </Text>

            <View style={styles.badgeRow}>
              <View style={[styles.statusBadge, { borderColor: '#EAB308' }]}>
                <Ionicons name="eye-off-outline" size={14} color="#EAB308" />
                <Text style={[styles.statusBadgeText, { color: '#EAB308' }]}>Low Visibility</Text>
              </View>
              <View style={[styles.statusBadge, { borderColor: '#4ADE80' }]}>
                <Ionicons name="walk-outline" size={14} color="#4ADE80" />
                <Text style={[styles.statusBadgeText, { color: '#4ADE80' }]}>Proceed with Caution</Text>
              </View>
            </View>

            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationText}>
                Recommendation: If you proceed, ensure you have robust anti-slip footwear and a high-lumen headlamp just in case.
              </Text>
            </View>
          </GlassCard>
        </View>
      </ScrollView>

      {/* Input Bar */}
      <View style={[styles.inputWrapper, { bottom: 110 }]}>
         <GlassCard intensity={30} style={styles.inputContainer}>
            <Ionicons name="mic" size={20} color={theme.textSecondary} />
            <TextInput 
              placeholder="Ask about conditions, gear, or sa..." 
              placeholderTextColor={theme.textSecondary}
              style={styles.textInput}
            />
            <Pressable style={styles.sendButton}>
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </Pressable>
         </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weatherHeader: {
    height: 250,
    marginHorizontal: 40,
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    elevation: 10,
  },
  weatherBg: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  weatherOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
    gap: 6,
  },
  locationTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tempText: {
    fontSize: 80,
    color: '#fff',
    fontWeight: '800',
  },
  tempUnit: {
    fontSize: 30,
    fontWeight: '400',
    color: '#FF8C32',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -10,
  },
  conditionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  userBubbleContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '80%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderBottomRightRadius: 5,
  },
  userQuestion: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  analysisContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  analysisCard: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  analysisTitle: {
    color: '#FF8C32',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  analysisBody: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    opacity: 0.9,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recommendationBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 15,
  },
  recommendationText: {
    color: '#A0A0A0',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  inputWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 0,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(30,30,30,0.8)',
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF8C32',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

