import '../i18n/config';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '../components/AuthProvider';
import { useAuthStore } from '../store/auth';

function RouteGuard() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuth) {
      if (user?.status === 'pending_approval') {
        router.replace('/(auth)/pending');
      } else {
        router.replace('/(app)');
      }
    }
  }, [isAuthenticated, isLoading, segments, user]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RouteGuard />
        <Stack screenOptions={{ headerShown: false }} />
        <Toast />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
