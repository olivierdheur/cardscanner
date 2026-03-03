import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, Platform, View, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Contact, EMPTY_CONTACT } from '../types/Contact';

// Screens
import EditorScreen from '../screens/EditorScreen';
import QRScreen from '../screens/QRScreen';
import ScannerScreen from '../screens/ScannerScreen';

// Icons (using unicode emoji as built-in icons, no extra library needed)
import { Text } from 'react-native';

export type RootTabParamList = {
    Editor: undefined;
    QRCode: { contact: Contact };
    Scanner: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabIcon({ emoji, focused, color }: { emoji: string; focused: boolean; color: string }) {
    return (
        <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.7 }}>
            {emoji}
        </Text>
    );
}

export default function AppNavigator() {
    const scheme = useColorScheme() ?? 'light';
    const theme = Colors[scheme];

    return (
        <Tab.Navigator
            initialRouteName="Editor"
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.card,
                    shadowColor: theme.shadow,
                    elevation: 2,
                },
                headerTitleStyle: {
                    color: theme.text,
                    fontWeight: '700',
                    fontSize: 18,
                },
                tabBarStyle: {
                    backgroundColor: theme.tabBar,
                    borderTopColor: theme.tabBarBorder,
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 85 : 65,
                    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textMuted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 2,
                },
            }}
        >
            <Tab.Screen
                name="Editor"
                component={EditorScreen}
                options={{
                    title: 'My Card',
                    tabBarLabel: 'My Card',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon emoji="👤" focused={focused} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="QRCode"
                component={QRScreen}
                options={{
                    title: 'QR Code',
                    tabBarLabel: 'QR Code',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon emoji="⬛" focused={focused} color={color} />
                    ),
                }}
                initialParams={{ contact: EMPTY_CONTACT }}
            />
            <Tab.Screen
                name="Scanner"
                component={ScannerScreen}
                options={{
                    title: 'Scanner',
                    tabBarLabel: 'Scanner',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon emoji="📷" focused={focused} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
