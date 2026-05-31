import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';

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

function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = decodeBase64(base64);
    
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += '%' + ('00' + decoded.charCodeAt(i).toString(16)).slice(-2);
    }
    const claims = JSON.parse(decodeURIComponent(result));
    return claims.exp ? claims.exp < Math.floor(Date.now() / 1000) : true;
  } catch (error) {
    return true; // Default to expired if parse fails
  }
}

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        if (token && !isTokenExpired(token)) {
          setIsAuthenticated(true);
        } else {
          // Clear expired/missing token credentials
          await SecureStore.deleteItemAsync('auth_code');
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('user_name');
          await SecureStore.deleteItemAsync('user_email');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth token:', error);
      } finally {
        setIsReady(true);
      }
    }
    checkAuth();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#ff7a00" />
      </View>
    );
  }

  // If already authenticated, go directly to the main app layout
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise, force them to login
  return <Redirect href="/login" />;
}
