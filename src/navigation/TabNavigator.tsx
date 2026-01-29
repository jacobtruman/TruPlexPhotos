import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PhotosScreen, AlbumsScreen } from '../screens';
import { colors } from '../theme';
import { RootTabParamList } from '../types';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator<RootTabParamList>();

export const TabNavigator: React.FC = () => {
  const { selectedTab, setSelectedTab } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName={selectedTab}
      screenListeners={{
        state: (e) => {
          // Detect tab changes from the navigation state
          const state = e.data.state;
          if (state) {
            const currentRoute = state.routes[state.index];
            const tabName = currentRoute?.name as keyof RootTabParamList;
            if (tabName && (tabName === 'Timeline' || tabName === 'Library')) {
              if (tabName !== selectedTab) {
                console.log(`Plex: Tab changed to "${tabName}"`);
                setSelectedTab(tabName);
              }
            }
          }
        },
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundDark,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Timeline':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Library':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Timeline" component={PhotosScreen} />
      <Tab.Screen name="Library" component={AlbumsScreen} />
    </Tab.Navigator>
  );
};

