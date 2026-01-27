import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Modal, ScrollView, Platform } from 'react-native';
import { Colors, Spacing } from '../../../../constants/Theme';
import { useLocalSearchParams } from 'expo-router';
import { useSupabase } from '../../../../hooks/useSupabase';
import { useState, useEffect } from 'react';
import { User, Mail, Calendar, ShieldAlert, ChevronRight, Search, X } from 'lucide-react-native';

export default function AuthManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { client, project } = useSupabase(id);
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

  const UserDetailsModal = () => (
    <Modal
      visible={!!selectedUser}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSelectedUser(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Details</Text>
            <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.closeButton}>
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {selectedUser && (
            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.profileSection}>
                <View style={styles.largeIconContainer}>
                  <User size={48} color={Colors.primary} />
                </View>
                <Text style={styles.profileEmail}>{selectedUser.email}</Text>
                <View style={[styles.modalStatusBadge, selectedUser.confirmed_at ? styles.statusConfirmed : styles.statusUnconfirmed]}>
                  <Text style={styles.statusText}>{selectedUser.confirmed_at ? 'Active' : 'Pending'}</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <DetailRow label="User ID" value={selectedUser.id} copyable />
                <DetailRow label="Provider" value={selectedUser.app_metadata?.provider || 'Email'} />
                <DetailRow label="Created At" value={new Date(selectedUser.created_at).toLocaleString()} />
                <DetailRow label="Last Sign In" value={selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleString() : 'Never'} />
                <DetailRow label="Confirmed At" value={selectedUser.confirmed_at ? new Date(selectedUser.confirmed_at).toLocaleString() : 'Not Confirmed'} />
                
                {selectedUser.user_metadata && Object.keys(selectedUser.user_metadata).length > 0 && (
                  <View style={styles.metadataContainer}>
                    <Text style={styles.sectionLabel}>User Metadata</Text>
                    <View style={styles.jsonBox}>
                      <Text style={styles.jsonText}>{JSON.stringify(selectedUser.user_metadata, null, 2)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const DetailRow = ({ label, value, copyable }: { label: string, value: string, copyable?: boolean }) => (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueContainer}>
        <Text style={styles.detailValue} selectable={copyable}>{value}</Text>
      </View>
    </View>
  );

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => setSelectedUser(item)}
    >
      <View style={styles.userIconContainer}>
        <User size={24} color={Colors.primary} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userEmail} numberOfLines={1}>{item.email || 'No email'}</Text>
        <View style={styles.userDetailRow}>
          <Calendar size={12} color={Colors.textDim} />
          <Text style={styles.userDetailText}>
            Last sign in: {item.last_sign_in_at ? new Date(item.last_sign_in_at).toLocaleDateString() : 'Never'}
          </Text>
        </View>
      </View>
      <View style={[styles.statusBadge, item.confirmed_at ? styles.statusConfirmed : styles.statusUnconfirmed]}>
        <Text style={styles.statusText}>{item.confirmed_at ? 'Active' : 'Pending'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userDetailText: {
    color: Colors.textDim,
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusConfirmed: {
    backgroundColor: Colors.success + '20',
  },
  statusUnconfirmed: {
    backgroundColor: Colors.warning + '20',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: Colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorDescription: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  retryButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  largeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  profileEmail: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  modalStatusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  infoSection: {
    marginTop: Spacing.md,
  },
  detailItem: {
    marginBottom: Spacing.lg,
  },
  detailLabel: {
    color: Colors.textDim,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValueContainer: {
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailValue: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metadataContainer: {
    marginTop: Spacing.md,
  },
  sectionLabel: {
    color: Colors.textDim,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  jsonBox: {
    backgroundColor: '#000',
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  jsonText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
