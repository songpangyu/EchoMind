import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { TabNavigator } from './src/navigation/TabNavigator';
import { colors } from './src/theme';

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <TabNavigator />
    </NavigationContainer>
  );
};

export default App;
