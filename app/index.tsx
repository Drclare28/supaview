import { View, Text, StyleSheet, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { Colors, Spacing } from '../constants/Theme';
import { Plus, Database, ChevronRight, Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Project, ProjectStore } from '../store/ProjectStore';
import { useNavigation } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const pat = await SecureStore.getItemAsync('supaview_platform_pat');
      const p = await ProjectStore.getProjects();
      
      if (pat) {
        // If we have a platform account connected, that is our primary hub
        router.replace('/platform/projects');
      } else if (p.length === 0) {
        // If no account and no manual projects, go to login onboarding
        router.replace('/platform/login');
      } else {
        setProjects(p);
      }
    };

    const unsubscribe = navigation.addListener('focus', () => {
      checkAuthAndLoad();
    });
    
    checkAuthAndLoad();
    return unsubscribe;
  }, [navigation]);

  const loadProjects = async () => {
    // This is now handled by checkAuthAndLoad
  };

  const renderProjectItem = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => router.push(`/project/${item.id}`)}
    >
      <View style={styles.projectIconContainer}>
        <Database size={24} color={Colors.primary} />
      </View>
      <View style={styles.projectDetails}>
        <Text style={styles.projectName}>{item.name}</Text>
        <Text style={styles.projectUrl} numberOfLines={1}>{item.url}</Text>
      </View>
      <ChevronRight size={20} color={Colors.textDim} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        renderItem={renderProjectItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No projects added yet.</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add your first Supabase project.</Text>
          </View>
        }
      />
      
      <Pressable 
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed
        ]}
        onPress={() => router.push('/project/add')}
      >
        <Plus size={32} color="#000" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  projectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  projectDetails: {
    flex: 1,
  },
  projectName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  projectUrl: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'System', // Use mono if fonts configured
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
