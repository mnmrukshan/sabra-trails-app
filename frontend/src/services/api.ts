import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Change this to your computer's local IP address if running on a physical phone/device via Expo Go.
export const BASE_URL = 'http://192.168.8.113:5000';
export const API_BASE_URL = `${BASE_URL}/api`;

// Resolve trail images (local require vs remote URL)
export const resolveTrailImage = (image: any) => {
  if (typeof image === 'string') {
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return { uri: image };
    }
    if (image.startsWith('/images') || image.startsWith('/uploads')) {
      return { uri: `${BASE_URL}${image}` };
    }
  }
  return image;
};

// Helper to make authenticated/unauthenticated fetch requests
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const accessToken = await SecureStore.getItemAsync('access_token');
    
    const headers = new Headers(options.headers || {});
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    
    // Set default Content-Type to JSON if sending body, unless it's FormData
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      if (response.status === 401) {
        try {
          await SecureStore.deleteItemAsync('auth_code');
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('user_name');
          await SecureStore.deleteItemAsync('user_email');
        } catch (e) {
          console.error('Failed to clear credentials on 401:', e);
        }
        const { router } = require('expo-router');
        router.replace('/login');
      }

      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {}
      
      const errorMessage = errorJson?.error || errorJson?.message || `HTTP error ${response.status}: ${errorText}`;
      throw new Error(errorMessage);
    }

    // Check if response is empty
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error: any) {
    console.error(`API Request failed for endpoint ${endpoint}:`, error.message);
    throw error;
  }
};

// Sync profile with backend after login (handles automatic DB registration)
export const syncUserProfile = async () => {
  return await apiRequest('/users/profile');
};

// Fetch all trails with optional search & filters
export const fetchTrails = async (filters: { search?: string; difficulty?: string; category?: string } = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.difficulty) params.append('difficulty', filters.difficulty);
  if (filters.category) params.append('category', filters.category);
  
  const queryStr = params.toString();
  const endpoint = `/trails${queryStr ? `?${queryStr}` : ''}`;
  return await apiRequest(endpoint);
};

// Fetch single trail by slug id
export const fetchTrailById = async (id: string) => {
  return await apiRequest(`/trails/${id}`);
};

// Toggle trail bookmark
export const toggleBookmark = async (trailId: string) => {
  return await apiRequest('/users/bookmarks/toggle', {
    method: 'POST',
    body: JSON.stringify({ trailId })
  });
};

// Delete user account
export const deleteUserAccount = async () => {
  return await apiRequest('/users/account', {
    method: 'DELETE'
  });
};

// Fetch gallery photos
export const fetchGalleryPhotos = async () => {
  return await apiRequest('/gallery');
};

// Upload photo to gallery
export const uploadGalleryPhoto = async (formData: FormData) => {
  return await apiRequest('/gallery', {
    method: 'POST',
    body: formData // Content-Type is automatically handled by fetch for FormData
  });
};

// Delete gallery photo
export const deleteGalleryPhoto = async (id: string) => {
  return await apiRequest(`/gallery/${id}`, {
    method: 'DELETE'
  });
};

// Send chatbot prompt to Gemini
export const sendChatMessage = async (message: string, history: any[]) => {
  return await apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history })
  });
};

// Fetch active adventure session
export const fetchActiveAdventure = async () => {
  return await apiRequest('/adventures/active');
};

// Start a new adventure
export const startAdventure = async (trailId: string, initialLocation?: { latitude: number; longitude: number }) => {
  return await apiRequest('/adventures/start', {
    method: 'POST',
    body: JSON.stringify({ trailId, initialLocation })
  });
};

// Send coordinate tracking breadcrumb
export const trackAdventureLocation = async (latitude: number, longitude: number, elevation?: number) => {
  return await apiRequest('/adventures/track', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude, elevation })
  });
};

// End adventure session
export const endAdventure = async (finalStats?: { distance?: number; duration?: number; avgSpeed?: number; maxElevation?: number }) => {
  return await apiRequest('/adventures/end', {
    method: 'POST',
    body: JSON.stringify({ finalStats })
  });
};

// Fetch completed adventure history list
export const fetchAdventureHistory = async () => {
  return await apiRequest('/adventures/history');
};
