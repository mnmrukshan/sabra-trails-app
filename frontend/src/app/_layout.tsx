import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trail/[id]" />
        <Stack.Screen name="weather/[id]" />
        <Stack.Screen name="map/[id]" />
        <Stack.Screen name="category/[type]" />
        <Stack.Screen name="active-adventure" options={{ presentation: 'modal', gestureEnabled: false }} />
        <Stack.Screen name="adventure-summary" options={{ presentation: 'modal', gestureEnabled: false }} />
      </Stack>

    </ThemeProvider>
  );
}

