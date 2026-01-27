import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Dimensions, Modal, ScrollView, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { Colors, Spacing } from '../../../../constants/Theme';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSupabase } from '../../../../hooks/useSupabase';
import { useState, useEffect } from 'react';
import { Search, Filter, Plus, ChevronRight, X, Edit3, Trash2 } from 'lucide-react-native';

const PAGE_SIZE = 20;

export default function TableRecordsScreen() {
  const { id, table } = useLocalSearchParams<{ id: string; table: string }>();
  const { client } = useSupabase(id);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (client && table) {
      handleRefresh();
    }
  }, [client, table]);

  const fetchRecords = async (pageIndex: number, clear: boolean = false) => {
    if (!client || !table) return;
    if (clear) setIsLoading(true);
    
    try {
      // Try fetching with ordering first
      let { data, error } = await client
        .from(table)
        .select('*')
        .range(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE - 1)
        .order('created_at', { ascending: false });

      // If ordering fails (e.g. column doesn't exist), retry without it
      if (error) {
        const retry = await client
          .from(table)
          .select('*')
          .range(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE - 1);
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      if (clear) {
        setRecords(data || []);
      } else {
        setRecords(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore((data || []).length === PAGE_SIZE);
      setPage(pageIndex);
    } catch (e) {
      console.error('Error fetching records:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRecords(0, true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchRecords(page + 1);
    }
  };

  const handleUpdate = async () => {
    if (!client || !table || !editedData || !selectedRecord) return;
    
    // Find a primary key for the update
    const pk = selectedRecord.id !== undefined ? 'id' : Object.keys(selectedRecord)[0];
    const pkValue = selectedRecord[pk];

    if (pkValue === undefined) {
      Alert.alert('Update Failed', 'Could not identify a primary key for this record.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await client
        .from(table)
        .update(editedData)
        .eq(pk, pkValue);

      if (error) throw error;

      Alert.alert('Success', 'Record updated successfully!');
      setIsEditing(false);
      setSelectedRecord({ ...selectedRecord, ...editedData });
      handleRefresh();
    } catch (e: any) {
      Alert.alert('Update Failed', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!client || !table || !selectedRecord) return;

    const pk = selectedRecord.id !== undefined ? 'id' : Object.keys(selectedRecord)[0];
    const pkValue = selectedRecord[pk];

    Alert.alert(
      'Delete Record',
      'Are you sure you want to permanently delete this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              const { error } = await client
                .from(table)
                .delete()
                .eq(pk, pkValue);

              if (error) throw error;

              Alert.alert('Deleted', 'Record removed successfully.');
              setSelectedRecord(null);
              handleRefresh();
            } catch (e: any) {
              Alert.alert('Delete Failed', e.message);
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  const startEditing = () => {
    const editable = { ...selectedRecord };
    // Remove metadata fields that shouldn't be edited directly for now
    delete (editable as any).created_at;
    delete (editable as any).updated_at;
    setEditedData(editable);
    setIsEditing(true);
  };

  const renderRecordItem = ({ item }: { item: any }) => {
    // Try to find a good display title
    const displayTitle = item.name || item.title || item.id || item.email || Object.values(item)[0]?.toString();
    const displaySubtitle = item.description || item.created_at || '';

    return (
      <TouchableOpacity 
        style={styles.recordCard}
        onPress={() => {
          setSelectedRecord(item);
          setIsEditing(false);
        }}
      >
        <View style={styles.recordContent}>
          <Text style={styles.recordTitle} numberOfLines={1}>{displayTitle}</Text>
          <Text style={styles.recordSubtitle} numberOfLines={1}>{displaySubtitle}</Text>
        </View>
        <ChevronRight size={16} color={Colors.textDim} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: table || 'Table View' }} />
      <FlatList
        data={records}
        renderItem={renderRecordItem}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
        ListFooterComponent={
          isLoading && !isRefreshing ? <ActivityIndicator style={styles.footerLoader} color={Colors.primary} /> : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No records found in "{table}".</Text>
            </View>
          ) : null
        }
      />

      {/* Record Detail Modal */}
      <Modal
        visible={!!selectedRecord}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedRecord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Record' : 'Record Details'}</Text>
              <TouchableOpacity onPress={() => setSelectedRecord(null)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              {selectedRecord && Object.entries(selectedRecord).map(([key, value]) => (
                <View key={key} style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>{key}</Text>
                  {isEditing && !['created_at', 'updated_at', 'id'].includes(key) ? (
                    <TextInput
                      style={styles.fieldInput}
                      value={typeof editedData[key] === 'object' ? JSON.stringify(editedData[key]) : String(editedData[key] ?? '')}
                      onChangeText={(text) => setEditedData({ ...editedData, [key]: text })}
                      multiline={typeof value === 'string' && value.length > 50}
                      placeholder={`Enter ${key}...`}
                      placeholderTextColor={Colors.textDim}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{JSON.stringify(value, null, 2)}</Text>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              {isEditing ? (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: Colors.surfaceHighlight }]} 
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: Colors.primary }]} 
                    onPress={handleUpdate}
                    disabled={isSaving}
                  >
                    {isSaving ? <ActivityIndicator size="small" color="#000" /> : <Text style={[styles.actionButtonText, { color: '#000' }]}>Save Changes</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.actionButton} onPress={startEditing}>
                    <Edit3 size={20} color={Colors.primary} />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
                    <Trash2 size={20} color={Colors.error} />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>


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
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordContent: {
    flex: 1,
  },
  recordTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  footerLoader: {
    marginVertical: Spacing.md,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    height: '80%',
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
  fieldContainer: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  fieldLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  fieldValue: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: 'System', // Use mono if available
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.md,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: Colors.error + '10',
  },
  deleteButtonText: {
    color: Colors.error,
  },
  fieldInput: {
    backgroundColor: Colors.surfaceHighlight,
    color: Colors.text,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
  },
});
