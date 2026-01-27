import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '../../../../constants/Theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSupabase } from '../../../../hooks/useSupabase';
import { useState, useEffect } from 'react';
import { Box, Lock, Unlock, ChevronRight, HardDrive, Plus } from 'lucide-react-native';

export default function BucketListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { client } = useSupabase(id);
  const [buckets, setBuckets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      fetchBuckets();
    }
  }, [client]);

  const fetchBuckets = async () => {
    if (!client) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await client.storage.listBuckets();
      if (fetchError) throw fetchError;
      setBuckets(data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch buckets.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBuckets();
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.bucketCard}
      onPress={() => router.push(`/project/${id}/storage/${item.id}`)}
    >
      <View style={styles.iconContainer}>
        <Box size={24} color={Colors.primary} />
      </View>
      <View style={styles.bucketInfo}>
        <Text style={styles.bucketName}>{item.name}</Text>
        <View style={styles.detailRow}>
          {item.public ? (
            <>
              <Unlock size={12} color={Colors.success} />
              <Text style={[styles.detailText, { color: Colors.success }]}>Public</Text>
            </>
          ) : (
            <>
              <Lock size={12} color={Colors.warning} />
              <Text style={[styles.detailText, { color: Colors.warning }]}>Private</Text>
            </>
          )}
        </View>
      </View>
      <ChevronRight size={18} color={Colors.textDim} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBuckets}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={buckets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <HardDrive size={48} color={Colors.textDim} />
              <Text style={styles.emptyText}>No buckets found.</Text>
            </View>
          }
        />
      )}
      
      <TouchableOpacity style={styles.fab}>
        <Plus size={32} color="#000" />
      </TouchableOpacity>
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
  bucketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  bucketInfo: {
    flex: 1,
  },
  bucketName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.primary,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
});
