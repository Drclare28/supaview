import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Modal, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../../../constants/Theme';
import { useLocalSearchParams, useGlobalSearchParams } from 'expo-router';
import { useSupabase } from '../../../../hooks/useSupabase';
import { useState, useEffect } from 'react';
import { User, Mail, Calendar, ShieldAlert, ChevronRight, Search, X } from 'lucide-react-native';

export default function AuthManagementScreen() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const { client, project, error: clientError } = useSupabase(id);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    if (client) {
      fetchUsers();
    }
  }, [client]);

  const fetchUsers = async () => {
    if (!client) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (!project?.serviceRoleKey) {
        throw new Error('Service Role key is required to list users.');
      }

      const { data: { users }, error: fetchError } = await client.auth.admin.listUsers();

      if (fetchError) throw fetchError;

      setUsers(users || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch users. Make sure you are using a Service Role key.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsers();
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => setSelectedUser(item)}
    >
      <View style={styles.userIcon}>
        <User size={20} color={Colors.text} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userEmail} numberOfLines={1}>{item.email || 'Anonymous'}</Text>
        <Text style={styles.userId} numberOfLines={1}>{item.id}</Text>
        <View style={styles.metaRow}>
          <Calendar size={12} color={Colors.textDim} />
          <Text style={styles.metaText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <View style={styles.divider} />
          <Text style={[styles.metaText, { color: item.last_sign_in_at ? Colors.success : Colors.textDim }]}>
            {item.last_sign_in_at ? 'Active' : 'Unconfirmed'}
          </Text>
        </View>
      </View>
      <ChevronRight size={16} color={Colors.textDim} />
    </TouchableOpacity>
  );

  const UserDetailsModal = () => (
    <Modal
      visible={!!selectedUser}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSelectedUser(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Details</Text>
            <TouchableOpacity onPress={() => setSelectedUser(null)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll}>
            {selectedUser && (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Identity</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{selectedUser.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>ID</Text>
                    <Text style={styles.value}>{selectedUser.id}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Provider</Text>
                    <Text style={styles.value}>{selectedUser.app_metadata.provider}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Activity</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Created</Text>
                    <Text style={styles.value}>{new Date(selectedUser.created_at).toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Last Sign In</Text>
                    <Text style={styles.value}>{selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleString() : 'Never'}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Metadata</Text>
                  <View style={styles.jsonBox}>
                    <Text style={styles.jsonText}>
                      {JSON.stringify(selectedUser.user_metadata, null, 2)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (clientError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{clientError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <UserDetailsModal />
        
        {error ? (
          <View style={styles.errorContainer}>
            <ShieldAlert size={48} color={Colors.warning} />
            <Text style={styles.errorTitle}>Permissions Required</Text>
            <Text style={styles.errorDescription}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
              <Text style={styles.retryButtonText}>Retry with Service Role Key</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
            }
            ListHeaderComponent={
              <View style={styles.header}>
                <Text style={styles.headerTitle}>{users.length} Users Found</Text>
              </View>
            }
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No users found in this project.</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
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
  errorText: {
    color: Colors.error,
    fontSize: 16,
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userId: {
    color: Colors.textDim,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 10,
    backgroundColor: Colors.textDim,
    marginHorizontal: 4,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: 50,
  },
  errorTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorDescription: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.warning,
    fontWeight: '600',
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScroll: {
    flex: 1,
  },
  detailSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  value: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  jsonBox: {
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.md,
    borderRadius: 8,
  },
  jsonText: {
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
});
