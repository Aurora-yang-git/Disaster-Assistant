import { View, StyleSheet, useWindowDimensions, Text } from 'react-native';
import {
    DrawerContentComponentProps,
    DrawerContentScrollView,
    DrawerItem,
    createDrawerNavigator,
} from '@react-navigation/drawer';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import ApiKeyPage from '../screens/ApiKey';
import Whisper from '../screens/Whisper';
import { COLORS } from '../colors';


type DrawerParamList = {
    Whisper: undefined;
    ApiKeyPage: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
    return (
        <View style={styles.container}>
            <DrawerContentScrollView {...props}>
                <DrawerItem
                    label='Mazu Emergency Chat'
                    labelStyle={styles.drawerItemLabel}
                    icon={() => <Ionicons name='mic' size={24} color='white' />}
                    onPress={() => props.navigation.navigate('Whisper')}
                />
            </DrawerContentScrollView>

            <View style={styles.footerContainer}>
                <DrawerItem
                    label='About Mazu'
                    labelStyle={styles.drawerItemLabel}
                    icon={() => <Ionicons name='information-circle-outline' size={24} color='white' />}
                    onPress={() => props.navigation.navigate('ApiKeyPage')}
                />
                <DrawerItem
                    label='GitHub'
                    labelStyle={styles.drawerItemLabel}
                    icon={() => <Ionicons name='logo-github' size={24} color='white' />}
                    onPress={() => WebBrowser.openBrowserAsync('https://github.com/Aurora-yang-git/Disaster-Assistant')}
                />
            </View>
        </View>
    );
};

// Custom header component with Gemma 3n badge
const WhisperHeaderTitle = () => {
    return (
        <View style={headerStyles.container}>
            <Text style={headerStyles.title}>Mazu</Text>
            <View style={headerStyles.badge}>
                <Text style={headerStyles.badgeText}>Powered by Gemma 3n</Text>
                <View style={headerStyles.dot} />
            </View>
        </View>
    );
};

const headerStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#fff',
        opacity: 0.9,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
        marginLeft: 6,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 3,
        elevation: 3,
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D',
    },
    footerContainer: {
        borderTopWidth: 1,
        borderTopColor: '#2F2F2F',
        paddingTop: 16,
    },
    drawerItemLabel: {
        color: '#fff',
        fontSize: 16,
    },
    menuIcon: {
        marginLeft: 16,
    },
});

export default function DrawerNavigation() {

    const navigation = useNavigation();
    const dimensions = useWindowDimensions();
    const isLargeScreen = dimensions.width >= 768;

    return (
        <Drawer.Navigator
            initialRouteName='Whisper'
            drawerContent={CustomDrawerContent}
            screenOptions={{
                headerTintColor: '#fff',
                headerStyle: {
                    backgroundColor: '#0D0D0D',
                },
                drawerType: isLargeScreen ? 'permanent' : 'front',
                headerLeft: isLargeScreen
                    ? () => null
                    : () => <Ionicons
                        name='menu'
                        size={24}
                        color='white'
                        style={styles.menuIcon}
                        onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                    />
            }}
        >
            <Drawer.Screen 
                name='Whisper' 
                component={Whisper} 
                options={{ 
                    headerTitle: () => <WhisperHeaderTitle />,
                }} 
            />
            <Drawer.Screen name='ApiKeyPage' component={ApiKeyPage} options={{ headerTitle: "About Mazu" }} />
        </Drawer.Navigator >
    );
}
