import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../../../constants/Theme';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { useSupabase } from '../../../../hooks/useSupabase';
import { useState, useEffect } from 'react';
import { Table, ChevronRight, Search, AlertCircle } from 'lucide-react-native';

export default function TableListScreen() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const router = useRouter();
  const { client, project, error: clientError } = useSupabase(id);
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      fetchTables();
    }
  }, [client]);

  const fetchTables = async () => {
    if (!project) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${project.url}/rest/v1/`, {
        headers: {
          'apikey': project.serviceRoleKey || project.anonKey,
          'Authorization': `Bearer ${project.serviceRoleKey || project.anonKey}`
        }
      });
      
      if (response.ok) {
        const spec = await response.json();
        if (spec.definitions) {
          const tableNames = Object.keys(spec.definitions);
          const formattedTables = tableNames.map(name => ({
            name,
            row_count: null
          }));
          setTables(formattedTables);
          return;
        }
      }

      const { data, error: rpcError } = await client
        .rpc('get_tables_list');

      if (!rpcError && data) {
        setTables(data);
      } else {
        setError('No tables could be discovered. Ensure you have tables in your "public" schema.');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred while fetching tables.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.tableCard}
      onPress={() => router.push(`/project/${id}/database/${item.name}`)}
    >
      <Table size={20} color={Colors.primary} />
      <View style={styles.tableInfo}>
        <Text style={styles.tableName}>{item.name}</Text>
        <Text style={styles.tableRows}>Table in public schema</Text>
      </View>
      <ChevronRight size={18} color={Colors.textDim} />
    </TouchableOpacity>
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
        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={48} color={Colors.error} />
            <Text style={styles.errorTitle}>Discovery Issues</Text>
            <Text style={styles.errorDescription}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTables}>
              <Text style={styles.retryButtonText}>Retry Discovery</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={tables}
            renderItem={renderItem}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={fetchTables} tintColor={Colors.primary} />
            }
            ListHeaderComponent={
              <View style={styles.header}>
                <Text style={styles.headerTitle}>{tables.length} Tables Discovered</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tables found in "public" schema.</Text>
              </View>
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
  loader: {
    marginTop: 50,
  },
  listContent: {
    padding: Spacing.md,
  },
  tableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tableInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  tableName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  tableRows: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  errorContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
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
    color: Colors.primary,
    fontWeight: '600',
  },
  header: {
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
