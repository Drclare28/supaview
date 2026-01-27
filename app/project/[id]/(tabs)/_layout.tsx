import { Tabs, useRouter } from 'expo-router';
import { Colors } from '../../../../constants/Theme';
import { LayoutDashboard, Database, Users, HardDrive, Home } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function ProjectTabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      {/* Tab 1: Home (Navigates back to Projects) */}
      <Tabs.Screen
        name="projects_redirect"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace('/platform/projects');
          },
        }}
      />
      
      {/* Tab 2: Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />

      {/* Tab 3: Database */}
      <Tabs.Screen
        name="database_tab"
        options={{
          title: 'Database',
          tabBarIcon: ({ color, size }) => <Database size={size} color={color} />,
        }}
      />

      {/* Tab 4: Auth */}
      <Tabs.Screen
        name="auth_tab"
        options={{
          title: 'Auth',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />

      {/* Tab 5: Storage */}
      <Tabs.Screen
        name="storage_tab"
        options={{
          title: 'Storage',
          tabBarIcon: ({ color, size }) => <HardDrive size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
