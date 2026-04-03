import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, StatusBar, View, LogBox, Text } from 'react-native';

LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered'
]);
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TabNavigator } from './src/navigation/TabNavigator';
import { DreamDetailScreen } from './src/screens/DreamDetailScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { CommunityProfileScreen } from './src/screens/CommunityProfileScreen';
import { CommunityPostDetailScreen } from './src/screens/CommunityPostDetailScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { SavedDreamsScreen } from './src/screens/SavedDreamsScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { HelpSupportScreen } from './src/screens/HelpSupportScreen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { colors } from './src/theme';
import { RootStackParamList } from './src/navigation/types';

const Stack = createStackNavigator<RootStackParamList>();

// Auth navigator (unauthenticated)
const AuthStack = createStackNavigator();
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// Main app navigator
function AppNavigator() {
  const missing = [];
  if (!TabNavigator) missing.push("TabNavigator");
  if (!DreamDetailScreen) missing.push("DreamDetailScreen");
  if (!CommunityProfileScreen) missing.push("CommunityProfileScreen");
  if (!CommunityPostDetailScreen) missing.push("CommunityPostDetailScreen");
  if (!NotificationsScreen) missing.push("NotificationsScreen");
  if (!SavedDreamsScreen) missing.push("SavedDreamsScreen");
  if (!EditProfileScreen) missing.push("EditProfileScreen");
  if (!PrivacyScreen) missing.push("PrivacyScreen");
  if (!HelpSupportScreen) missing.push("HelpSupportScreen");

  if (missing.length > 0) {
    return (
      <View style={{ flex: 1, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 20 }}>Missing modules: {missing.join(', ')}</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="DreamDetail" component={DreamDetailScreen} />
      <Stack.Screen name="CommunityProfile" component={CommunityProfileScreen} />
      <Stack.Screen name="CommunityPostDetail" component={CommunityPostDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="SavedDreams" component={SavedDreamsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </Stack.Navigator>
  );
}

// Root renderer that gates on auth state
function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.mintGreen} size="large" />
      </View>
    );
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={{
          dark: true,
          colors: {
            primary: colors.mintGreen,
            background: colors.background,
            card: colors.surface,
            text: colors.textPrimary,
            border: colors.deepTeal,
            notification: colors.mintGreen,
          },
        }}>
          <StatusBar barStyle="light-content" backgroundColor={colors.background} />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
