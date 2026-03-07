import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { TabNavigator } from './src/navigation/TabNavigator';
import { DreamDetailScreen } from './src/screens/DreamDetailScreen';
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
