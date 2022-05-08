import React from "react";
import { StyleSheet, Dimensions, View, TouchableOpacity, SafeAreaView, Text, Image, Share } from "react-native";
import FastImage from 'react-native-fast-image';
import Icon from "react-native-vector-icons/FontAwesome";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { translate } from "../../languages";
const strings = translate.strings

// import About from "./About";
// import ContactUs from "./ContactUs";
import MapView from "./Map/MapView";
import { store } from "../../service";
import { connect } from "react-redux"

const Drawer = createDrawerNavigator();
var { width, height } = Dimensions.get('window');

const screenDrawerConfig = {
    headerShown: true,
    headerStyle: {
        backgroundColor: "#353434",
        height: 100
    },
    headerTintColor: "#fff",
    headerTitleStyle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white"
    },
    headerTitleAlign: "center"
}

const DrawerMenu = ({ dispatch, navigation, nbNotifications }) => {

    function logout() {
        store.clear()
        dispatch({ type: "SET_NOTIF", value: store.getNbNotifications() })
        navigation.replace("SignIn")
    }

    function getRightSize(size) {
        return height * size / 844
    }

    function getRightIcon() {
        // switch (store.getCar()) {
        //     case "2":
        //         return require("../../icons/car2.png")
        //     case "3":
        //         return require("../../icons/car3.png")
        //     default:
        //         return require("../../icons/car1.png")
        // }
    }

    const CustomDrawerContentComponent = props => (
        <>
            <SafeAreaView style={{ flex: 1.5, alignItems: "center" }}>
                <View style={{ flex: 2, justifyContent: "center", alignItems: "center" }}>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.push("Edit")} style={{ borderRadius: 100, padding: 10, backgroundColor: "white" }}>
                        {/* <FastImage  style={{ height: getRightSize(100), width: getRightSize(100) }} source={getRightIcon()} /> */}
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: "space-evenly" }}>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.push("Edit")} >
                        <Text style={{ color: "white", fontWeight: "bold", fontSize: height * 0.03, textAlign: "center" }}>{store.getName()} ➡️</Text>
                    </TouchableOpacity>
                    <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>1200 pts</Text>
                    <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>3 places données - 9 places recues</Text>
                </View>
            </SafeAreaView>

            <SafeAreaView style={{ flex: 4 }}>
                <DrawerContentScrollView contentContainerStyle={{ paddingTop: 0 }} {...props}>
                    <DrawerItemList {...props} />
                </DrawerContentScrollView>

                <View>
                    <TouchableOpacity activeOpacity={0.7} style={{ ...styles.bottomButton, backgroundColor: "#4510A8" }} onPress={() => Share.share({ message: strings.message_to_share })}>
                        <Icon name={"share-alt"} color="white" size={30} />
                        <Text style={styles.bottomButtonText}>{strings.share}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.7} style={{ ...styles.bottomButton, backgroundColor: "red" }} onPress={() => logout()}>
                        <Icon name={"sign-out"} color="white" size={30} />
                        <Text style={styles.bottomButtonText}>{strings.signout}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </>
    );

    function CustomDrawerItem(title, icon_name) {
        return (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1, alignItems: "center" }}>
                    <Icon name={icon_name} color="white" size={icon_name == "send" ? 25 : 30} />
                </View>
                <View style={{ flex: 6 }}>
                    <Text style={{ fontSize: 20, fontWeight: "bold", color: "white", marginLeft: 15, marginRight: 15 }}>
                        {title}
                    </Text>
                </View>
            </View>)
    }

    return <Drawer.Navigator initialRouteName={"MapView"} drawerStyle={{ backgroundColor: "#353434" }} drawerContent={CustomDrawerContentComponent} screenOptions={{ activeBackgroundColor: "grey" }}>
        <Drawer.Screen options={{ drawerLabel: () => CustomDrawerItem(strings.map, "map"), headerShown: false }} name={"Map"} component={MapView} />
        {/* <Drawer.Screen options={{ drawerLabel: () => CustomDrawerItem(strings.about, "info"), ...screenDrawerConfig }} name={strings.about} component={About} />
        <Drawer.Screen options={{ drawerLabel: () => CustomDrawerItem(strings.contact_us, "send"), ...screenDrawerConfig }} name={strings.contact_us} component={ContactUs} /> */}
    </Drawer.Navigator>
}
const mapStateToProps = state => ({ nbNotifications: state.notifications })
export default connect(mapStateToProps)(DrawerMenu)

const styles = StyleSheet.create({
    bottomButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "red",
        borderRadius: 20,
        margin: 10,
        padding: 10
    },
    bottomButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 20,
        marginLeft: 10
    }
})