import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Linking, ScrollView } from 'react-native';
import { Colors, Spacing } from '../../constants/Theme';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Key, ExternalLink, ShieldCheck, Github } from 'lucide-react-native';

const PAT_KEY = 'supaview_platform_pat';
const SUPABASE_OAUTH_URL = 'https://api.supabase.com/v1/oauth/authorize';
const SUPABASE_TOKEN_URL = 'https://api.supabase.com/v1/oauth/token';

// IMPORTANT: User needs to provide this from their Supabase Dashboard
const CLIENT_ID = 'YOUR_SUPABASE_CLIENT_ID';

WebBrowser.maybeCompleteAuthSession();

export default function PlatformLoginScreen() {
  const router = useRouter();
  const [pat, setPat] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const discovery = {
    authorizationEndpoint: SUPABASE_OAUTH_URL,
    tokenEndpoint: SUPABASE_TOKEN_URL,
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'supaview',
        path: 'oauth'
      }),
      scopes: ['all'],
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleExchangeCode(code);
    }
  }, [response]);

  const handleExchangeCode = async (code: string) => {
    setIsLoading(true);
    try {
      // In a real OAuth flow with PKCE, we'd exchange the code here.
      // Note: Supabase OAuth for Management API usually requires a secret 
      // unless it's a public client. We will alert the user about the next step.
      Alert.alert('OAuth Success', 'Code received. Complete the exchange logic if you have a client secret.');
    } catch (e) {
      Alert.alert('Error', 'Failed to exchange OAuth code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async () => {
    if (CLIENT_ID === 'YOUR_SUPABASE_CLIENT_ID') {
      Alert.alert(
        'Manual Setup Required', 
        'To use "Login with Supabase", you first need to create an OAuth App in your Supabase Dashboard.\n\nFor now, please use the PAT (Personal Access Token) method below—it takes 30 seconds and doesn\'t require an OAuth App setup!',
        [
          { text: 'Get a PAT', onPress: () => Linking.openURL('https://supabase.com/dashboard/account/tokens') },
          { text: 'OK' }
        ]
      );
      return;
    }
    await promptAsync();
  };

  const handleLogin = async () => {
    if (!pat) {
      Alert.alert('Error', 'Please enter your Personal Access Token.');
      return;
    }

    setIsLoading(true);
    try {
      await SecureStore.setItemAsync(PAT_KEY, pat);
      router.push('/platform/projects');
    } catch (e) {
      Alert.alert('Error', 'Failed to save token securely.');
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
        <View style={styles.iconContainer}>
          <ShieldCheck size={48} color={Colors.primary} />
        </View>
        
        <Text style={styles.title}>Welcome to SupaView</Text>
        <Text style={styles.description}>
          The easiest way to manage your projects is by connecting your account.
        </Text>

        <TouchableOpacity 
          style={styles.oauthButton}
          onPress={handleOAuthLogin}
          disabled={isLoading}
        >
          <View style={styles.oauthIcon}>
            <ShieldCheck size={20} color="#000" />
          </View>
          <Text style={styles.oauthButtonText}>Login with Supabase</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR USE A TOKEN</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Key size={16} color={Colors.primary} />
            <Text style={styles.label}>Personal Access Token (PAT)</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="sbp_..."
            placeholderTextColor={Colors.textDim}
            value={pat}
            onChangeText={setPat}
            multiline
            numberOfLines={2}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            onPress={() => Linking.openURL('https://supabase.com/dashboard/account/tokens')}
          >
            <Text style={styles.hint}>Generate a PAT in your dashboard →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.loginButton, (isLoading || !pat) && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isLoading || !pat}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Connecting...' : 'Connect with Token'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.push('/project/add')}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Set up project manually instead</Text>
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
    flexGrow: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    gap: 12,
  },
  oauthIcon: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 6,
    borderRadius: 6,
  },
  oauthButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
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
    color: Colors.primary,
    fontSize: 12,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  loginButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.3,
  },
  cancelButton: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textDim,
    fontSize: 14,
  },
});
