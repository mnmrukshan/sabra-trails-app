import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { BlurView } from 'expo-blur';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, useAutoDiscovery, makeRedirectUri } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { syncUserProfile } from '@/services/api';

WebBrowser.maybeCompleteAuthSession();

// Pure JS base64 decode (bulletproof) helper for React Native
function decodeBase64(input: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let str = input.replace(/=+$/, '');
  let outputs = [];
  
  for (let i = 0; i < str.length; i += 4) {
    const c1 = chars.indexOf(str[i]);
    const c2 = chars.indexOf(str[i + 1]);
    const c3 = i + 2 < str.length ? chars.indexOf(str[i + 2]) : 64;
    const c4 = i + 3 < str.length ? chars.indexOf(str[i + 3]) : 64;
    
    const chunk = (c1 << 18) | (c2 << 12) | ((c3 === 64 ? 0 : c3) << 6) | (c4 === 64 ? 0 : c4);
    
    outputs.push((chunk >> 16) & 255);
    if (c3 !== 64) {
      outputs.push((chunk >> 8) & 255);
    }
    if (c4 !== 64) {
      outputs.push(chunk & 255);
    }
  }
  return String.fromCharCode(...outputs);
}

// Decodes a JWT token and returns the parsed payload
function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = decodeBase64(base64);
    
    // Safely decode UTF-8 characters
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += '%' + ('00' + decoded.charCodeAt(i).toString(16)).slice(-2);
    }
    return JSON.parse(decodeURIComponent(result));
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

// Resolves a human-readable display name, filtering out client ID strings
function resolveDisplayName(claims: any) {
  const clientId = '6Yh6Ri4GYfNGZf2GNEmGb8DXr04a';
  
  const candidates = [
    // 1. given_name + family_name
    claims.given_name && claims.family_name ? `${claims.given_name} ${claims.family_name}` : null,
    // 2. given_name
    claims.given_name,
    // 3. family_name
    claims.family_name,
    // 4. name
    claims.name,
    // 5. preferred_username
    claims.preferred_username,
    // 6. username
    claims.username,
    // 7. email prefix
    claims.email ? claims.email.split('@')[0] : null,
    // 8. sub prefix
    claims.sub ? claims.sub.split('@')[0] : null,
  ];

  for (const name of candidates) {
    if (name && typeof name === 'string' && name.trim() !== '' && name !== clientId) {
      const cleanName = name.trim();
      // Capitalize first letter
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }
  }
  
  return 'Rukshan'; // Fallback to Rukshan instead of Explorer or Client ID
}

export default function LoginScreen() {
  const discovery = useAutoDiscovery('https://api.asgardeo.io/t/sabratrails/oauth2/token');

  const redirectUrl = makeRedirectUri();

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: '6Yh6Ri4GYfNGZf2GNEmGb8DXr04a',
      scopes: ['openid', 'profile', 'email'],
      redirectUri: redirectUrl,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success' && request?.codeVerifier) {
      const { code } = response.params;
      
      const exchangeCode = async () => {
        try {
          const bodyParams = `grant_type=authorization_code&client_id=6Yh6Ri4GYfNGZf2GNEmGb8DXr04a&code=${code}&redirect_uri=${encodeURIComponent(redirectUrl)}&code_verifier=${request.codeVerifier}`;
          
          const tokenRes = await fetch('https://api.asgardeo.io/t/sabratrails/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: bodyParams,
          });
          
          const tokenData = await tokenRes.json();
          if (tokenData.access_token) {
            let userData: any = {};
            try {
              // Fetch UserInfo using the access token
              const userRes = await fetch('https://api.asgardeo.io/t/sabratrails/oauth2/userinfo', {
                headers: {
                  Authorization: `Bearer ${tokenData.access_token}`,
                },
              });
              userData = await userRes.json();
              console.log('Asgardeo UserInfo Response:', userData);
            } catch (err) {
              console.error('UserInfo fetch failed:', err);
            }

            // Decode ID Token if available to gather any missing claims
            let idTokenClaims: any = {};
            if (tokenData.id_token) {
              idTokenClaims = decodeJwt(tokenData.id_token) || {};
              console.log('Asgardeo ID Token Claims:', idTokenClaims);
            }

            // Merge claims from both sources (userInfo usually has precedence)
            const mergedClaims = { ...idTokenClaims, ...userData };

            // Resolve human-readable name using the helper
            const displayName = resolveDisplayName(mergedClaims);

            console.log('Final resolved displayName:', displayName);

            // Securely store tokens and user details
            await SecureStore.setItemAsync('auth_code', code);
            await SecureStore.setItemAsync('access_token', tokenData.access_token);
            await SecureStore.setItemAsync('user_email', mergedClaims.email || '');

            // Sync user profile with backend database
            let finalName = displayName;
            try {
              const backendUser = await syncUserProfile();
              console.log('Backend user synced successfully:', backendUser);
              if (backendUser && backendUser.name) {
                finalName = backendUser.name;
              }
            } catch (err) {
              console.error('Backend user sync failed, using local name:', err);
            }
            
            await SecureStore.setItemAsync('user_name', finalName);
            
            // Redirect to the main app layout after successful login
            router.replace('/(tabs)');
          } else {
            console.error('Token exchange did not return access token:', tokenData);
          }
        } catch (error) {
          console.error('Error during token exchange:', error);
        }
      };

      exchangeCode();
    }
  }, [response, request]);

  return (
    <ImageBackground 
      source={require('../../assets/images/hawagala.jpeg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          <BlurView intensity={60} tint="dark" style={styles.glassCard}>
            <Text style={styles.title}>Welcome to SabraTrails</Text>
            <Text style={styles.subtitle}>Discover the hidden beauties of Sri Lanka</Text>

            <TouchableOpacity 
              style={[styles.loginButton, !request && styles.loginButtonDisabled]} 
              onPress={() => promptAsync()}
              disabled={!request}
            >
              <Text style={styles.loginButtonText}>Login to Begin</Text>
            </TouchableOpacity>

            <Text style={styles.redirectText}>Redirect URI: {redirectUrl}</Text>
          </BlurView>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)', // Dim the background image so the card and text pop
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden', // Ensures BlurView respects the border radius
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  glassCard: {
    width: '100%',
    paddingVertical: 45,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#ff7a00',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#ff7a00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  redirectText: {
    color: '#ffffff',
    fontSize: 10,
    marginTop: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
});
