import { View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import { Colors } from '../../../../constants/Theme';

export default function ProjectsRedirectScreen() {
  const router = useRouter();

  useFocusEffect(() => {
    // Redundant safety check; logic is primarily in _layout listeners
    router.replace('/platform/projects');
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );
}
