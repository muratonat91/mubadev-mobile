import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme';

export default function AppLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: { borderTopColor: colors.gray200 },
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
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}
