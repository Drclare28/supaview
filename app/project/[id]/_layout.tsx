import { Stack } from 'expo-router';
import { Colors } from '../../../constants/Theme';

export default function ProjectLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false, title: 'Back', headerBackTitle: 'Back' }} />
      <Stack.Screen name="database/[table]" options={{ title: 'Table View' }} />
      <Stack.Screen name="storage/[bucket]" options={{ title: 'Files' }} />
    </Stack>
  );
}
