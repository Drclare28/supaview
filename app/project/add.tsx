import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors, Spacing } from '../../constants/Theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ProjectStore } from '../../store/ProjectStore';
import { Shield, Globe, Type, Key, ChevronLeft } from 'lucide-react-native';

export default function AddProjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialName?: string; initialUrl?: string }>();
  
  const [name, setName] = useState(params.initialName || '');
  const [url, setUrl] = useState(params.initialUrl || '');
  const [anonKey, setAnonKey] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (params.initialName) setName(params.initialName);
    if (params.initialUrl) setUrl(params.initialUrl);
  }, [params]);

  const handleSave = async () => {
    if (!name || !url || !anonKey) {
      Alert.alert('Error', 'Please fill in all required fields (Name, URL, and Anon Key).');
      return;
    }

    setIsLoading(true);
    try {
      // Basic URL validation
      if (!url.startsWith('http')) {
        throw new Error('Project URL must start with http:// or https://');
      }

      await ProjectStore.addProject({
        id: Math.random().toString(36).substring(7),
        name,
        url,
        anonKey,
        serviceRoleKey: serviceRoleKey || undefined,
      });

      Alert.alert('Success', 'Project added successfully!', [
        { text: 'OK', onPress: () => router.push('/') }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add project.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity 
          style={styles.platformButton}
          onPress={() => router.push('/platform/login')}
        >
          <Shield size={20} color={Colors.primary} />
          <Text style={styles.platformButtonText}>Connect to Supabase Account</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR ENTER MANUALLY</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.description}>
          Enter your project details manually. Your keys are stored securely on your device.
        </Text>

        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Type size={16} color={Colors.primary} />
            <Text style={styles.label}>Display Name</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Technical Project"
            placeholderTextColor={Colors.textDim}
            value={name}
            onChangeText={setName}
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Globe size={16} color={Colors.primary} />
            <Text style={styles.label}>Supabase URL</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="https://xyz.supabase.co"
            placeholderTextColor={Colors.textDim}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Key size={16} color={Colors.primary} />
            <Text style={styles.label}>Anon Public Key</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="eyJ..."
            placeholderTextColor={Colors.textDim}
            value={anonKey}
            onChangeText={setAnonKey}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Key size={16} color={Colors.textSecondary} />
            <Text style={styles.label}>Service Role Key (Optional)</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="eyJ..."
            placeholderTextColor={Colors.textDim}
            value={serviceRoleKey}
            onChangeText={setServiceRoleKey}
            multiline
            numberOfLines={2}
          />
          <Text style={styles.hint}>Required for user management features.</Text>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.disabledButton]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Add Project'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    color: Colors.text,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  hint: {
    color: Colors.textDim,
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textDim,
    fontSize: 14,
  },
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    marginBottom: Spacing.xl,
    gap: 10,
  },
  platformButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textDim,
    fontSize: 10,
    fontWeight: 'bold',
    marginHorizontal: Spacing.md,
  },
});
