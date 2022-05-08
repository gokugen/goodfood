import React, { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import SyncStorage from "sync-storage";
import * as Notifications from "expo-notifications";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/FontAwesome";

import FlashMessage from "react-native-flash-message";
import Toast from 'react-native-toast-message';
import { showMessage } from "react-native-flash-message";

import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import DrawerMenu from "./components/delivery/DrawerMenu";
import Edit from "./components/Edit";
import Tabs from "./components/Tabs";
import Home from "./components/Home";
import RestaurantInfos from "./components/RestaurantInfos"
import BasketInfos from "./components/BasketInfos";
import Invoice from "./components/Invoice";
import Favorites from "./components/Favorites";

import { store } from "./service";
import { connect } from "react-redux"

import { getLocales } from "react-native-localize";
import { translate } from "./languages";

const Stack = createStackNavigator();

Icon.loadFont()
const App = ({ dispatch }) => {
    const navigationRef = useRef()
    const [StorageLoaded, setStorageLoaded] = useState(false)

    useEffect(() => {
        (async () => {
            try {
                await SyncStorage.init()

                var countryCode = getLocales()[0].languageTag.split("-")[0] //ex: en, fr...
                store.setCountryCode(countryCode)
                translate.changeLanguage(store.getCountryCode())

                setStorageLoaded(true)
                dispatch({ type: "SET_NOTIF", value: store.getNbNotifications() })
            }
            catch (err) {
                console.log(err)
            }
        })()

        // in the app
        Notifications.addNotificationReceivedListener(handleOnReceivedNotification);
        // outside the app
        Notifications.addNotificationResponseReceivedListener(handleOnPressNotifications);
    }, []);

    // When the user recieved a notification inside the app
    const handleOnReceivedNotification = notification => {
        store.setNbNotifications(store.getNbNotifications() + 1)
        dispatch({ type: "SET_NOTIF", value: store.getNbNotifications() })

        var notif = notification.request.content
        showMessage({
            backgroundColor: "#ffc107",
            floating: true,
            duration: 6000,
            message: notif.title,
            description: notif.body,
            onPress: () => navigationRef.current.navigate("Tabs", { screen: "Orders" })
        });
    };

    // When the user press on the notification outside the app
    const handleOnPressNotifications = async (response) => {
        navigationRef.current.navigate("Tabs")
    }

    return (
        StorageLoaded
            ? <NavigationContainer ref={navigationRef}>
                <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={store.isLogged() ? "DrawerMenu" : "SignIn"}>
                    <Stack.Screen name="SignIn" component={SignIn} />
                    <Stack.Screen name="SignUp" component={SignUp} />
                    <Stack.Screen name="DrawerMenu" component={DrawerMenu} />
                    <Stack.Screen name="Edit" component={Edit} />
                    <Stack.Screen name="Tabs" component={Tabs} />
                    <Stack.Screen name="Home" component={Home} />
                    <Stack.Screen name="RestaurantInfos" component={RestaurantInfos} />
                    <Stack.Screen name="BasketInfos" component={BasketInfos} />
                    <Stack.Screen name="Invoice" component={Invoice} />
                    <Stack.Screen name="Favorites" component={Favorites} />
                </Stack.Navigator>
                <FlashMessage position="top" />
                <Toast ref={(ref) => Toast.setRef(ref)} />
            </NavigationContainer>
            : <View style={{ flex: 1, justifyContent: "center" }}>
                <ActivityIndicator />
            </View>
    );
}
export default connect()(App)