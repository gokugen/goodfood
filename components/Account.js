import React from "react"
import { StyleSheet, Dimensions, StatusBar, Linking, Share, ScrollView, SafeAreaView, TouchableOpacity, View, Text } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import { translate } from "../languages";
const strings = translate.strings
import { store } from "../service";

var { height } = Dimensions.get('window');
const Account = ({ navigation }) => {
    return <ScrollView style={{ flex: 1, backgroundColor: "white" }} contentContainerStyle={{ flexGrow: 1, marginTop: StatusBar.currentHeight || 70 }}>
        <SafeAreaView style={{ flexGrow: 1 }}>
            <View style={{ flexDirection: "row" }}>
                <Text style={{ marginLeft: 25, fontWeight: "bold", fontSize: 30, marginBottom: 10 }}>{store.getName() ? "Bonjour " + store.getName() : "Mon compte"}</Text>
                <TouchableOpacity activeOpacity={0.4} style={{ flex: 1, alignItems: "flex-end", marginRight: 20 }} onPress={() => { store.clear(); navigation.replace("SignIn") }}>
                    <Icon name={"sign-out"} size={height * 0.05} />
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginHorizontal: 25, marginVertical: 10 }}>
                <TouchableOpacity activeOpacity={0.7} style={styles.item} onPress={() => { }}>
                    <Text style={{ marginLeft: 10, fontSize: 18, fontWeight: "bold" }}>{strings.modify_info}</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={styles.item} onPress={() => JSON.parse(store.getFavorites()).length > 0 && navigation.push("Favorites")}>
                    <Text style={{ marginLeft: 10, fontSize: 18, fontWeight: "bold" }}>{strings.my_favorites}</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={styles.item} onPress={() => Linking.openSettings()}>
                    <Text style={{ marginLeft: 10, fontSize: 18, fontWeight: "bold" }}>{strings.notifications}</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={{ ...styles.item, marginBottom: 0 }} onPress={() => Linking.openURL("https://www.uber.com/legal/fr/document/?country=france&lang=fr&name=general-terms-of-use")}>
                    <Text style={{ marginLeft: 10, fontSize: 18, fontWeight: "bold" }}>{strings.about}</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
                <TouchableOpacity activeOpacity={0.7} style={styles.share_button} onPress={() => Share.share({ message: "Ne tardez plus, utilisez GoodFood pour commandez vos repas!" })}>
                    <Icon name={"share"} color={"#8da5ed"} size={30} />
                    <Text style={{ marginLeft: 10, fontSize: 18, fontWeight: "bold", color: "#8da5ed" }}>{strings.share}</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={styles.help_button} onPress={() => Linking.openURL(`tel:${"0000"}`)}>
                    <Icon name={"phone"} color={"#ffc107"} size={50} />
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: "#ffc107" }}>{strings.call}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView >
    </ScrollView>
}
export default Account

const styles = StyleSheet.create({
    item: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 20,
        backgroundColor: "#f5f4f0",
        elevation: 5,
        shadowOpacity: 0.2,
        shadowOffset: {
            width: 2,
            height: 4
        },
        shadowColor: "black"
    },
    share_button: {
        flex: 2,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 25,
        marginBottom: 10,
        borderRadius: 20,
        backgroundColor: "#ecf0fc",
        elevation: 5,
        shadowOpacity: 0.2,
        shadowOffset: {
            width: 2,
            height: 4
        },
        shadowColor: "black"
    },
    help_button: {
        flex: 3,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingHorizontal: 20,
        marginHorizontal: 25,
        marginBottom: 10,
        borderRadius: 20,
        backgroundColor: "#fff5e6",
        elevation: 5,
        shadowOpacity: 0.2,
        shadowOffset: {
            width: 2,
            height: 4
        },
        shadowColor: "black"
    }
})