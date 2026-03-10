import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { TabNavigator } from './src/navigation/TabNavigator';
import { DreamDetailScreen } from './src/screens/DreamDetailScreen';
import { CommunityProfileScreen } from './src/screens/CommunityProfileScreen';
import { CommunityPostDetailScreen } from './src/screens/CommunityPostDetailScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { SavedDreamsScreen } from './src/screens/SavedDreamsScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { PrivacyScreen } from './src/screens/PrivacyScreen';
import { HelpSupportScreen } from './src/screens/HelpSupportScreen';
import { colors } from './src/theme';
import { RootStackParamList } from './src/navigation/types';

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
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
    </NavigationContainer>
  );
};

export default App;
