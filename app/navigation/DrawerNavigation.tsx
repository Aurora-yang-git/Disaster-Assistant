import { View, StyleSheet, useWindowDimensions } from 'react-native';
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


type DrawerParamList = {
    Whisper: undefined;
    ApiKeyPage: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const CustomDrawerContent = (props: DrawerContentComponentProps) => {

    const openUsagePage = () => {
        WebBrowser.openBrowserAsync('https://platform.openai.com/account/usage');
    };

    return (
        <View style={styles.container}>
            <DrawerContentScrollView {...props}>
                <DrawerItem
                    label='Voice Assistant'
                    labelStyle={styles.drawerItemLabel}
                    icon={() => <Ionicons name='mic' size={24} color='white' />}
                    onPress={() => props.navigation.navigate('Whisper')}
                />
            </DrawerContentScrollView>

            <View style={styles.footerContainer}>
                <DrawerItem
                    label='API Settings'
                    labelStyle={styles.drawerItemLabel}
                    icon={() => <Ionicons name='key-outline' size={24} color='white' />}
                    onPress={() => props.navigation.navigate('ApiKeyPage')}
                />
                <DrawerItem
                    label='Usage Stats'
                    labelStyle={styles.drawerItemLabel}
                    icon={() => <Ionicons name='podium-outline' size={24} color='white' />}
                    onPress={openUsagePage}
                />
            </View>
        </View>
    );
};

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
            <Drawer.Screen name='Whisper' component={Whisper} options={{ headerTitle: "Voice Assistant" }} />
            <Drawer.Screen name='ApiKeyPage' component={ApiKeyPage} options={{ headerTitle: "API Settings" }} />
        </Drawer.Navigator >
    );
}
