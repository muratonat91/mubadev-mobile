import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { colors } from '../../theme';

export default function AppLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('nav.home'), tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="projects"
        options={{ title: t('nav.projects'), tabBarIcon: ({ color }) => <TabIcon emoji="📁" color={color} /> }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: t('nav.products'), tabBarIcon: ({ color }) => <TabIcon emoji="📦" color={color} /> }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: t('nav.notifications'), tabBarIcon: ({ color }) => <TabIcon emoji="🔔" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('nav.profile'), tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }}
      />
      <Tabs.Screen name="product-form" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}
