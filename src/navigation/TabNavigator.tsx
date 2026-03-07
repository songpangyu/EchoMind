import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { RecordScreen } from '../screens/RecordScreen';
import { JournalScreen } from '../screens/JournalScreen';
import { MeScreen } from '../screens/MeScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { colors } from '../theme';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  Journal: '📖',
  Record: '🎙️',
  Community: '🌍',
  Me: '👤',
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const isRecord = route.name === 'Record';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isRecord) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.recordTabWrapper}
              activeOpacity={0.85}
            >
              <View style={[styles.recordBtn, focused && styles.recordBtnActive]}>
                <Text style={styles.recordIcon}>🎙️</Text>
              </View>
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                Record
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, !focused && styles.tabIconInactive]}>
              {TAB_ICONS[route.name]}
            </Text>
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              {route.name}
            </Text>
            {focused && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Record" component={RecordScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Me" component={MeScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.deepTeal,
    // Fixed height, no absolute positioning — Navigator handles placement
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 0,
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 16,
    // Give room for the center button to overflow upward via overflow visible
    overflow: 'visible',
  },

  // Normal tabs
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
    position: 'relative',
  },
  tabIcon: { fontSize: 22 },
  tabIconInactive: { opacity: 0.45 },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.mintGreen,
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mintGreen,
  },

  // Record center button — floats above tab bar
  recordTabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    // Lift the button upward
    marginBottom: 0,
  },
  recordBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    // Deep dark background for strong contrast with the emoji
    backgroundColor: '#0d2626',
    alignItems: 'center',
    justifyContent: 'center',
    // Lifted above tab bar
    marginBottom: 4,
    marginTop: -24,
    borderWidth: 2.5,
    borderColor: colors.mintGreen,
    shadowColor: colors.mintGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 12,
  },
  recordBtnActive: {
    backgroundColor: '#0a1e1e',
    borderColor: colors.mintGreen,
    shadowOpacity: 0.9,
  },
  recordIcon: { fontSize: 26 },
});
