import React, { useState, useRef, useEffect } from "react"
import { StyleSheet, Dimensions, StatusBar, SafeAreaView, TouchableWithoutFeedback, View, FlatList, TouchableOpacity, Text, Image, Alert, Modal } from "react-native";
import FastImage from 'react-native-fast-image';
import { hideMessage } from "react-native-flash-message";
import Icon from 'react-native-vector-icons/FontAwesome';
import CircularSlider from 'rn-circular-slider'
import { store, api } from "../service";
import { connect } from "react-redux"
import { translate } from "../languages";
const strings = translate.strings

var { height, width } = Dimensions.get('window');
const Orders = ({ dispatch, navigation }) => {

    const [Orders, setOrders] = useState([])
    const [Refresh, setRefresh] = useState(false)
    const [CurrentOrder, setCurrentOrder] = useState()
    const [ModalRatingVisible, setModalRatingVisible] = useState(false)
    const [Rating, setRating] = useState(5)

    useEffect(() => {
        api.get_orders().then(res => setOrders(res.data)).catch(err => console.log(err))
    }, [])

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            hideMessage()
            store.setNbNotifications(0)
            dispatch({ type: "SET_NOTIF", value: 0 })
            // api.get_orders().then(res => setOrders(res.data)).catch(err => console.error(err))
        });

        return unsubscribe;
    }, [navigation]);

    function showModal() {
        return <Modal visible={ModalRatingVisible} animationType={Platform.OS === "ios" ? "slide" : null} transparent>
            <TouchableWithoutFeedback onPress={() => setModalRatingVisible(false)} accessible={false}>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <TouchableWithoutFeedback accessible={false}>
                        <View style={styles.modal}>
                            <Text style={{ fontWeight: "bold", fontSize: 20 }}>Notez votre commande!</Text>
                            <CircularSlider min={0} max={5} value={Rating} onChange={value => setRating(value)}
                                contentContainerStyle={{ justifyContent: "center", alignItems: "center" }}
                                strokeWidth={15}
                                buttonBorderColor="#ffc107"
                                buttonFillColor="#fff"
                                buttonStrokeWidth={10}
                                openingRadian={Math.PI / 4}
                                buttonRadius={10}
                                linearGradient={[{ stop: "0%", color: "red" }, { stop: "50%", color: "#ffc107" }]}>
                                <View style={{ flexDirection: "row" }}>
                                    <Text style={{ fontWeight: "500", fontSize: 32, color: "#ffc107" }}>{Rating}</Text>
                                </View>
                            </CircularSlider>
                            <TouchableOpacity style={styles.validate_button} onPress={() => {
                                api.edit_order(CurrentOrder._id, { rating: Rating })
                                setModalRatingVisible(false)
                            }}>
                                <Text style={{ fontSize: 18, fontWeight: "bold" }}>Envoyer!</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal >
    }

    return <View style={{ flex: 1, backgroundColor: "white" }}>
        <SafeAreaView style={styles.container}>
            <Text style={{ marginLeft: 25, fontWeight: "bold", fontSize: 30, marginBottom: 10 }}>Mes commandes</Text>
            {Orders.length > 0
                ? <FlatList
                    data={Orders}
                    refreshing={Refresh}
                    onRefresh={() => {
                        setRefresh(true);
                        api.get_orders().then(res => {
                            setOrders(res.data);
                            setRefresh(false)
                        }).catch(err => console.error(err))
                    }}
                    renderItem={({ item }) =>
                        <TouchableOpacity style={styles.item} activeOpacity={0.7}
                            onPress={() => {
                                if (item.status === "refused")
                                    Alert.alert(
                                        item.restaurant.name,
                                        "Motif du refus: " + item.reason,
                                        [
                                            { text: "Ok", onPress: () => { }, style: "cancel" },
                                        ],
                                        { cancelable: false }
                                    )
                                else if (item.status === "inDelivery") {
                                    Alert.alert(
                                        "Avez-vous reçu votre commande?",
                                        "",
                                        [
                                            { text: "Pas encore", onPress: () => { } },
                                            { text: "Oui!", onPress: () => api.edit_order(item._id, { status: "delivered" }) },
                                        ],
                                        { cancelable: false }
                                    )
                                }
                                else if (item.status !== "waiting") {
                                    if (item.status === "delivered" && !item.rating) {
                                        setCurrentOrder(item)
                                        setModalRatingVisible(true)
                                    }
                                    else
                                        navigation.push("Invoice", { item })
                                }
                            }} >
                            {showModal()}
                            <View style={{ flex: 1, backgroundColor: "transparent" }}>
                                <FastImage style={{ flex: 1, borderRadius: 20 }} source={{ uri: item.restaurant.images[0] }} />
                            </View>
                            <View style={{ flex: 2, paddingHorizontal: 10 }}>
                                <View style={{ justifyContent: "space-around" }}>
                                    <Text style={{ fontSize: height * 0.022, fontWeight: "bold" }}>{item.restaurant.name}</Text>
                                    <Text style={{ fontWeight: "bold", color: "grey" }}>{item.number}</Text>
                                    <Text style={{ fontWeight: "bold", color: "grey" }}>{item.price}€ • {new Date(item.date).toLocaleDateString()}</Text>
                                </View>
                                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                                    <Text style={{ color: "grey", fontSize: height * 0.017, fontWeight: "bold" }}>{strings[item.status]}</Text>
                                    {item.rating && <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <Icon name={"star"} color="black" size={height * 0.02} />
                                        <Text style={{ marginLeft: 2, fontSize: height * 0.02, fontWeight: "bold" }}>{item.rating}</Text>
                                    </View>}
                                </View>
                            </View>
                            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                {(() => {
                                    switch (item.status) {
                                        case "waiting":
                                        case "inPreparation":
                                            return <FastImage style={{ height: "70%", width: "100%", borderRadius: 20 }} source={require("../assets/inPreparation.gif")} />
                                        case "refused":
                                            return <Icon name={"times-circle"} color={"red"} size={height * 0.05} />
                                        case "inDelivery":
                                            return <FastImage style={{ height: "70%", width: "100%", borderRadius: 20 }} source={require("../assets/inDelivery.gif")} />
                                        case "delivered":
                                            return <FastImage style={{ height: "70%", width: "100%", borderRadius: 20 }} source={require("../assets/delivered.gif")} />
                                    }
                                })()}
                            </View>
                        </TouchableOpacity>
                    }
                    keyExtractor={item => item._id}
                />
                : <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <FastImage style={{ height: height / 2, width: width }} source={require('../assets/cooking2.gif')} />
                    <Text style={{ textAlign: "center", fontWeight: "bold", fontSize: 15 }}>Encore aucune commande :(</Text>
                </View>}
        </SafeAreaView>
    </View>
}
export default connect()(Orders)

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: StatusBar.currentHeight || 70,
        backgroundColor: "white"
    },
    item: {
        flexDirection: "row",
        height: height * 0.15,
        marginVertical: 10,
        marginHorizontal: 25,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 15,
        backgroundColor: "#f5f4f0",
        elevation: 5,
        shadowOpacity: 0.2,
        shadowOffset: {
            width: 2,
            height: 4
        },
        shadowColor: "black"
    },
    modal: {
        width: width - 50,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 25,
        padding: 20,
        backgroundColor: "#eeeeee",
        elevation: 2,
        shadowOpacity: 0.2,
        shadowColor: "black"
    },
    validate_button: {
        height: 60,
        width: "70%",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 30,
        backgroundColor: "#ffc107"
    }
})