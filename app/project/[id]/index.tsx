import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Colors, Spacing } from '../../../constants/Theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSupabase } from '../../../hooks/useSupabase';
import { Database, Users, Box, ChevronRight, HardDrive, ShieldCheck, Globe } from 'lucide-react-native';
import { ProjectStore } from '../../../store/ProjectStore';

export default function ProjectDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { client, project, error } = useSupabase(id);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!project || !client) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const menuItems = [
    {
      title: 'Database',
      description: 'View and edit tables and records',
      icon: <Database size={24} color={Colors.primary} />,
      route: `/project/${id}/database`,
    },
    {
      title: 'Authentication',
      description: 'Manage users and platform settings',
      icon: <Users size={24} color="#3b82f6" />,
      route: `/project/${id}/auth`,
    },
    {
      title: 'Storage',
      description: 'Browse buckets and upload files',
      icon: <HardDrive size={24} color="#f59e0b" />,
      route: `/project/${id}/storage`,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.projectName}>{project.name}</Text>
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Globe size={12} color={Colors.textSecondary} />
            <Text style={styles.badgeText} numberOfLines={1}>{project.url}</Text>
          </View>
          {project.serviceRoleKey && (
            <View style={[styles.badge, styles.adminBadge]}>
              <ShieldCheck size={12} color={Colors.primary} />
              <Text style={[styles.badgeText, styles.adminBadgeText]}>Admin Access</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.menuIconContainer}>
              {item.icon}
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <ChevronRight size={20} color={Colors.textDim} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dangerZone}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Delete Project',
              `Are you sure you want to remove ${project.name}? This will only remove it from this app.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: async () => {
                    await ProjectStore.removeProject(id);
                    router.replace('/');
                  }
                },
              ]
            );
          }}
        >
          <Text style={styles.deleteButtonText}>Remove Project</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Client initialized with {project.serviceRoleKey ? 'Service Role' : 'Anon'} Key</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  projectName: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  adminBadge: {
    borderColor: Colors.primary + '40',
    borderWidth: 1,
  },
  adminBadgeText: {
    color: Colors.primary,
  },
  menuContainer: {
    padding: Spacing.md,
    paddingTop: Spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
  },
  footer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textDim,
    fontSize: 12,
    fontStyle: 'italic',
  },
  dangerZone: {
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  deleteButton: {
    backgroundColor: Colors.error + '15',
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  deleteButtonText: {
    color: Colors.error,
    fontWeight: '600',
  },
});
