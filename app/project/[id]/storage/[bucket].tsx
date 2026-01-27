import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, ActionSheetIOS, Platform, Modal, Image, Dimensions } from 'react-native';
import { Colors, Spacing } from '../../../../constants/Theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSupabase } from '../../../../hooks/useSupabase';
import { useState, useEffect } from 'react';
import { Folder, ChevronRight, Download, Plus, FileText, FileImage, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { toByteArray } from 'base64-js';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FileBrowserScreen() {
  const { id, bucket } = useLocalSearchParams<{ id: string; bucket: string }>();
  const router = useRouter();
  const { client } = useSupabase(id);
  const [files, setFiles] = useState<any[]>([]);
  const [path, setPath] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Preview State
  const [previewImage, setPreviewImage] = useState<{ url: string, name: string } | null>(null);

  useEffect(() => {
    if (client && bucket) {
      fetchFiles();
    }
  }, [client, bucket, path]);

  const fetchFiles = async () => {
    if (!client || !bucket) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await client.storage.from(bucket).list(path, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (fetchError) throw fetchError;
      
      const sortedData = (data || []).sort((a, b) => {
        if (!!a.id === false && !!b.id === true) return -1;
        if (!!a.id === true && !!b.id === false) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setFiles(sortedData);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch files.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFiles();
  };

  const navigateToFolder = (folderName: string) => {
    setPath(path ? `${path}/${folderName}` : folderName);
  };

  const goBack = () => {
    if (!path) return;
    const parts = path.split('/');
    parts.pop();
    setPath(parts.join('/'));
  };

  const isImage = (name: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg|heic|bmp)$/i.test(name);
  };

  const ensureExtension = (name: string, mimeType?: string): string => {
    if (name.includes('.')) return name;
    const mime = (mimeType || '').toLowerCase();
    if (mime.includes('image/jpeg')) return `${name}.jpg`;
    if (mime.includes('image/png')) return `${name}.png`;
    if (mime.includes('image/gif')) return `${name}.gif`;
    if (mime.includes('image/heic')) return `${name}.heic`;
    if (mime.includes('video/mp4')) return `${name}.mp4`;
    return name;
  };

  const showUploadMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Upload File', 'Upload Photo'],
          cancelButtonIndex: 0,
          title: 'Upload to Storage',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleFileUpload();
          if (buttonIndex === 2) handleImageUpload();
        }
      );
    } else {
      Alert.alert(
        'Upload to Storage',
        'Choose a source',
        [
          { text: 'File', onPress: handleFileUpload },
          { text: 'Photo Library', onPress: handleImageUpload },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets[0];
      const name = ensureExtension(file.name, file.mimeType);
      await uploadFileUnified(file.uri, name, file.mimeType);
    } catch (e: any) {
      Alert.alert('Selection Failed', e.message);
    }
  };

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) return;
      const asset = result.assets[0];
      
      let fileName = asset.uri.split('/').pop() || `photo_${Date.now()}`;
      fileName = ensureExtension(fileName, (asset as any).mimeType || 'image/jpeg');
      
      await uploadFileUnified(asset.uri, fileName, (asset as any).mimeType || 'image/jpeg');
    } catch (e: any) {
      Alert.alert('Selection Failed', 'Check photo library permissions.');
    }
  };

  const uploadFileUnified = async (uri: string, name: string, mimeType?: string) => {
    if (!client || !bucket) return;
    
    setIsProcessing(true);
    try {
      const filePath = path ? `${path}/${name}` : name;
      
      // RELIABILITY UPGRADE:
      // 1. Use the official FileSystem to read as raw Base64 (legacy path for SDK 54 stability)
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });

      if (!base64Data || base64Data.length === 0) {
        throw new Error('File data is empty or inaccessible.');
      }

      // 2. Convert Base64 string to a proper binary Uint8Array
      // Supabase storage client handles Uint8Array perfectly on mobile.
      const binaryData = toByteArray(base64Data);

      // 3. Perform the upload
      const { data, error: uploadError } = await client.storage
        .from(bucket)
        .upload(filePath, binaryData, {
          contentType: mimeType || 'application/octet-stream',
          upsert: true,
        });

      if (uploadError) throw uploadError;
      if (!data) throw new Error('Server confirmed success but returned no file metadata.');

      const sizeKb = (binaryData.length / 1024).toFixed(1);
      Alert.alert('Success', `Uploaded ${name} (${sizeKb} KB)`);
      fetchFiles();
    } catch (e: any) {
      console.error('[Unified Upload Failed]', e);
      Alert.alert('Upload Failed', e.message || 'An unknown error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreview = async (fileName: string) => {
    if (!client || !bucket) return;
    
    setIsProcessing(true);
    try {
      const filePath = path ? `${path}/${fileName}` : fileName;
      const { data, error: signedError } = await client.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);

      if (signedError) throw signedError;

      if (isImage(fileName)) {
        setPreviewImage({ url: data.signedUrl, name: fileName });
      } else {
        await handleDownloadAction(fileName);
      }
    } catch (e: any) {
      Alert.alert('Preview Failed', 'This file type cannot be previewed right now.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAction = async (fileName: string) => {
    if (!client || !bucket) return;

    setIsProcessing(true);
    try {
      const filePath = path ? `${path}/${fileName}` : fileName;
      const { data: signedUrlData, error: signedUrlError } = await client.storage
        .from(bucket)
        .createSignedUrl(filePath, 300);

      if (signedUrlError) throw signedUrlError;

      const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
      const localUri = `${cacheDir.endsWith('/') ? cacheDir : `${cacheDir}/`}${fileName}`;

      const downloadResult = await FileSystem.downloadAsync(
        signedUrlData.signedUrl,
        localUri
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        Alert.alert('Download Ready', 'The file is ready for use.');
      }
    } catch (e: any) {
      Alert.alert('Download Failed', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isFolder = !!item.id === false;

    return (
      <TouchableOpacity
        style={styles.fileCard}
        onPress={() => isFolder ? navigateToFolder(item.name) : handlePreview(item.name)}
      >
        <View style={styles.iconContainer}>
          {isFolder ? (
            <Folder size={24} color={Colors.warning} />
          ) : (isImage(item.name) || item.metadata?.mimetype?.startsWith('image/')) ? (
            <FileImage size={24} color={Colors.info} />
          ) : (
            <FileText size={24} color={Colors.textSecondary} />
          )}
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
          {!isFolder && (
            <Text style={styles.fileDetails}>
              {(item.metadata?.size / 1024).toFixed(2)} KB • {new Date(item.created_at).toLocaleDateString()}
            </Text>
          )}
        </View>
        {isFolder ? (
          <ChevronRight size={18} color={Colors.textDim} />
        ) : (
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => handleDownloadAction(item.name)}
          >
            <Download size={18} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {isProcessing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.overlayText}>Processing file...</Text>
        </View>
      )}

      {/* Image Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.previewContainer}>
          <TouchableOpacity 
            style={styles.closePreview} 
            onPress={() => setPreviewImage(null)}
          >
            <X size={28} color="#fff" />
          </TouchableOpacity>
          
          {previewImage && (
            <View style={styles.previewImageWrapper}>
              <Image 
                source={{ uri: previewImage.url }} 
                style={styles.previewImage}
                resizeMode="contain"
              />
              <Text style={styles.previewName}>{previewImage.name}</Text>
              
              <View style={styles.previewActions}>
                <TouchableOpacity 
                  style={styles.previewDownloadBtn}
                  onPress={() => {
                    const name = previewImage.name;
                    setPreviewImage(null);
                    handleDownloadAction(name);
                  }}
                >
                  <Download size={20} color="#000" />
                  <Text style={styles.previewDownloadText}>Save or Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      <View style={styles.pathHeader}>
        <TouchableOpacity onPress={() => setPath('')}>
          <Text style={styles.bucketName}>{bucket}</Text>
        </TouchableOpacity>
        {path.split('/').filter(Boolean).map((part, i) => (
          <View key={i} style={styles.pathPart}>
            <Text style={styles.pathSeparator}>/</Text>
            <Text style={styles.pathText}>{part}</Text>
          </View>
        ))}
      </View>

      {path !== '' && (
        <TouchableOpacity style={styles.backItem} onPress={goBack}>
          <Folder size={20} color={Colors.warning} />
          <Text style={styles.backText}>.. (Go back)</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFiles}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={files}
          renderItem={renderItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No files in this folder.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={showUploadMenu}>
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
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceHighlight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bucketName: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  pathPart: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pathSeparator: {
    color: Colors.textDim,
    marginHorizontal: 4,
  },
  pathText: {
    color: Colors.text,
  },
  backItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  loader: {
    marginTop: 50,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  fileDetails: {
    color: Colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  actionBtn: {
    padding: 8,
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
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textDim,
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 2000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    color: Colors.text,
    marginTop: Spacing.md,
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePreview: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  previewImageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  previewName: {
    color: '#fff',
    fontSize: 16,
    marginTop: Spacing.xl,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  previewActions: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
  },
  previewDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 8,
  },
  previewDownloadText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
