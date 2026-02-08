import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Colors, Spacing } from '../../constants/Theme';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { SupabaseManagementService, SupabaseProject, SupabaseOrg } from '../../services/SupabaseManagement';
import { Database, Globe, Layers, LogOut, ChevronRight } from 'lucide-react-native';
import { ProjectStore } from '../../store/ProjectStore';

const PAT_KEY = 'baseview_platform_pat';

export default function PlatformProjectsScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [orgs, setOrgs] = useState<SupabaseOrg[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    loadPlatformData();
  }, []);

  const loadPlatformData = async () => {
    const pat = await SecureStore.getItemAsync(PAT_KEY);
    if (!pat) {
      router.replace('/platform/login');
      return;
    }

    setIsLoading(true);
    try {
      const service = new SupabaseManagementService(pat);
      const [fetchedProjects, fetchedOrgs] = await Promise.all([
        service.getProjects(),
        service.getOrganizations(),
      ]);
      setProjects(fetchedProjects);
      setOrgs(fetchedOrgs);
    } catch (e: any) {
      console.error('Failed to fetch platform data:', e);
      if (e.message?.includes('401')) {
        await SecureStore.deleteItemAsync(PAT_KEY);
        router.replace('/platform/login');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPlatformData();
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync(PAT_KEY);
    router.replace('/platform/login');
  };

  const handleOpenProject = async (supabaseProject: SupabaseProject) => {
    // Check if we already have it in store
    const localProjects = await ProjectStore.getProjects();
    const existing = localProjects.find(p => p.id === supabaseProject.id);

    if (existing) {
      router.push(`/project/${existing.id}`);
      return;
    }

    // Otherwise, fetch and add it silently
    const pat = await SecureStore.getItemAsync(PAT_KEY);
    if (!pat) return;

    setOpeningId(supabaseProject.id);
    try {
      const service = new SupabaseManagementService(pat);
      
      let anonKey = '';
      let serviceRoleKey = '';
      let url = service.getDefaultProjectUrl(supabaseProject.id);

      // Attempt automated credential discovery
      const [apiKeys, postgrest] = await Promise.allSettled([
        service.getProjectApiKeys(supabaseProject.id),
        service.getPostgrestConfig(supabaseProject.id),
      ]);

      if (apiKeys.status === 'fulfilled') {
        anonKey = apiKeys.value.find(k => k.name === 'anon')?.api_key || '';
        serviceRoleKey = apiKeys.value.find(k => k.name === 'service_role')?.api_key || '';
      }

      if (postgrest.status === 'fulfilled' && postgrest.value.endpoint) {
        url = postgrest.value.endpoint;
      }

      if (!anonKey) {
        // Fallback to manual entry if we can't get basic keys
        router.push({
          pathname: '/project/add',
          params: { 
            initialName: supabaseProject.name,
            initialUrl: url 
          }
        } as any);
        return;
      }

      // Save and open
      await ProjectStore.addProject({
        id: supabaseProject.id,
        name: supabaseProject.name,
        url: url,
        anonKey: anonKey,
        serviceRoleKey: serviceRoleKey || undefined,
      });

      router.push(`/project/${supabaseProject.id}`);
    } catch (e: any) {
      Alert.alert('Error', 'Could not open project automatically. Please try manual setup.');
    } finally {
      setOpeningId(null);
    }
  };

  const getOrgName = (orgId: string) => {
    return orgs.find(o => o.id === orgId)?.name || 'Loading...';
  };

  const renderProjectItem = ({ item }: { item: SupabaseProject }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => handleOpenProject(item)}
      disabled={!!openingId}
    >
      <View style={styles.projectIconContainer}>
        {openingId === item.id ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <Database size={24} color={Colors.primary} />
        )}
      </View>
      <View style={styles.projectDetails}>
        <Text style={styles.projectName}>{item.name}</Text>
        <Text style={styles.orgName}>{getOrgName(item.organization_id)}</Text>
        <View style={styles.metaRow}>
          <Globe size={11} color={Colors.textDim} />
          <Text style={styles.metaText}>{item.region}</Text>
        </View>
      </View>
      <ChevronRight size={18} color={Colors.textDim} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProjectItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerSubtitle}>{orgs.length} Organizations</Text>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut size={16} color={Colors.error} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loader: {
    marginTop: 50,
  },
  listContent: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: 4,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  projectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  orgName: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: Colors.textDim,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
