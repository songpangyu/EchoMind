import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  Animated, Dimensions, StatusBar,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { JournalScreen } from '../screens/JournalScreen';
import { MeScreen } from '../screens/MeScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { RecordScreen } from '../screens/RecordScreen';
import { colors } from '../theme';
import { TabParamList } from './types';
import Icon, { IconName } from '../components/Icon';

const Tab = createBottomTabNavigator<TabParamList>();
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TAB_ICONS: Record<string, IconName> = {
  Home: 'home',
  Journal: 'journal',
  Community: 'globe',
  Me: 'user',
};

// ── Inner 4-tab navigator ─────────────────────────────────────────────────────
function InnerTabs({ onRecordPress }: { onRecordPress: () => void }) {
  function CustomTabBar({ state, descriptors, navigation }: any) {
    return (
      <Animated.View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
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

          // Insert the Record button between Journal (index 1) and Community (index 2)
          const isBeforeMid = index === 2;
          return (
            <React.Fragment key={route.key}>
              {isBeforeMid && (
                <TouchableOpacity
                  style={styles.recordTabWrapper}
                  onPress={onRecordPress}
                  activeOpacity={0.85}
                >
                  <View style={styles.recordBtn}>
                    <Icon name="mic" size={26} color={colors.mintGreen} />
                  </View>
                  <Text style={styles.tabLabel}>Record</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={[styles.tabIconWrap, !focused && styles.tabIconInactive]}>
                  <Icon
                    name={TAB_ICONS[route.name]}
                    size={22}
                    color={focused ? colors.mintGreen : colors.textTertiary}
                  />
                </View>
                <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                  {route.name}
                </Text>
                {focused && <View style={styles.activeDot} />}
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </Animated.View>
    );
  }

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Me" component={MeScreen} />
    </Tab.Navigator>
  );
}

// ── Root with slide-up Record modal ───────────────────────────────────────────
export const TabNavigator: React.FC = () => {
  const [recordOpen, setRecordOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openRecord = useCallback(() => {
    setRecordOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, backdropAnim]);

  const closeRecord = useCallback(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setRecordOpen(false));
  }, [slideAnim, backdropAnim]);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <InnerTabs onRecordPress={openRecord} />

      {/* Dim backdrop */}
      {recordOpen && (
        <Animated.View
          style={[styles.backdrop, { opacity: backdropAnim }]}
          pointerEvents="none"
        />
      )}

      {/* Slide-up Record modal */}
      <Animated.View
        style={[
          styles.recordModal,
          { transform: [{ translateY: slideAnim }] },
        ]}
        pointerEvents={recordOpen ? 'auto' : 'none'}
      >
        <RecordScreen onClose={closeRecord} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.deepTeal,
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
    overflow: 'visible',
  },
  tabBarHidden: {},

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
    position: 'relative',
  },
  tabIconWrap: { alignItems: 'center' as const, justifyContent: 'center' as const },
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

  recordTabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  recordBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0d2626',
    alignItems: 'center',
    justifyContent: 'center',
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

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 10,
  },

  recordModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
});
