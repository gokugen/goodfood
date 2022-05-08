import React, { useState, useRef, useEffect } from "react"
import { StyleSheet, StatusBar, Dimensions, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, View, Text, TextInput, FlatList, Image, Modal } from "react-native";
import FastImage from 'react-native-fast-image';
import { MaterialIndicator } from 'react-native-indicators';
import { GooglePay } from 'react-native-google-pay';
import { useStripe, StripeProvider, CardField, ApplePayButton, useApplePay } from '@stripe/stripe-react-native';
import { Divider } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import MapboxGL from "@react-native-mapbox-gl/maps";
import Logger from '@react-native-mapbox-gl/maps/javascript/utils/Logger';
import { MAPBOX_ACCESSTOKEN, GEOCODEAPI_ACCESSTOKEN, PUBLISHABLEKEY } from "@env"
import uuid from 'react-native-uuid';
import { translate } from "../languages";
const strings = translate.strings

import { api, store } from "../service";

var { height, width } = Dimensions.get('window');
// Configure Mapbox access token
MapboxGL.setAccessToken(MAPBOX_ACCESSTOKEN);

// edit logging messages
Logger.setLogCallback(log => {
    const { message } = log;

    // expected warnings
    if (message.match('Request failed due to a permanent error: Canceled')
        || message.match('Request failed due to a permanent error: Socket Closed')
        || message.includes('MGLIdeographsRasterizedLocally')
        || message.includes('eglSwapBuffer')
        || message.includes('{Thread-8}[Style]'))
        return true;
    return false;
});

const allowedCardNetworks = ["VISA", "MASTERCARD"];
const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];
const BasketInfos = ({ navigation, route }) => {
    const { confirmPayment } = useStripe();
    const { presentApplePay, confirmApplePayPayment, isApplePaySupported } = useApplePay();

    var wsError = false
    var i = 0
    var previousTime
    var isTyping = false
    var waitForType

    const [Basket, setBasket] = useState(JSON.parse(store.getBasket()))

    const [Amount, setAmount] = useState()
    const [Comment, setComment] = useState()
    // const [Cards, setCards] = useState([])
    // const [CardPressed, setCardPressed] = useState()
    const [CardEnter, setCardEnter] = useState(false)
    const [ShowSearchBar, setShowSearchBar] = useState(false)
    const [Address, setAddress] = useState(store.getAddress() && JSON.parse(store.getAddress()))
    const [ModalLoadingVisible, setModalLoadingVisible] = useState(false)

    const [SearchResults, setSearchResults] = useState([])

    useEffect(() => {
        if (Basket)
            setAmount(Basket.order.map(elem => elem.price).reduce((a, b) => a + b, 0))
    }, [Basket])

    function wsConnection() {
        var ws = new WebSocket("ws://good-food.fr:4000")

        ws.onerror = (err) => {
            wsError = true
            console.log(err)
        };

        ws.onopen = () => {
            // send my database id
            wsError = false
            ws.send(JSON.stringify({ restaurant_id: Basket.restaurant_id }))
            store.setBasket(JSON.stringify({}))
            ws.close()
        };

        ws.onclose = () => {
            if (!wsError) {
                setModalLoadingVisible(false)
                if (!store.getAddress())
                    Alert.alert(
                        "Utiliser cette adresse par défaut?",
                        Address.label,
                        [
                            { text: "Non merci", onPress: () => navigation.replace("Tabs") },
                            {
                                text: "Ok", onPress: () => {
                                    api.edit({ address: Address })
                                        .then(() => store.setAddress(JSON.stringify(Address)))
                                        .catch(err => console.log(err));
                                    navigation.replace("Tabs")
                                }
                            },
                        ],
                        { cancelable: false }
                    )
                else
                    navigation.replace("Tabs")
            }
            else
                Alert.alert(
                    "Erreur lors de l'envoi de votre commande",
                    "Veuillez réessayer dans quelques instants",
                    [
                        { text: "Ok", onPress: () => setModalLoadingVisible(false), style: "cancel" },
                    ],
                    { cancelable: false }
                )
        };
    }

    function getOrderWithoutDate() {
        return Basket.order.map(item => {
            var tmpObj = { ...item }
            delete tmpObj.date
            return tmpObj
        })
    }

    function sendOrder() {
        setModalLoadingVisible(true)
        api.create_order(Basket.restaurant_id, {
            restaurant_id: Basket.restaurant_id,
            user_id: store.getId(),
            content: getOrderWithoutDate(),
            price: Amount,
            address: Address,
            comment: Comment
        }).then(() => {
            wsConnection()
        }).catch(err => console.log(err))
    }

    function verifyInfos(passCard) {
        // if ((CardPressed || CardEnter) && Address)
        if ((passCard || CardEnter) && Address) {
            return true
        }
        else {
            Alert.alert(
                "Erreur",
                "Veuillez choisir une adresse de livraison et un moyen de paiement.",
                [
                    { text: "Ok", onPress: () => { }, style: "cancel" },
                ],
                { cancelable: false }
            )
            setModalLoadingVisible(false)
            return false
        }
    }

    function updateBasket(operation, item) {
        var previousObj = Basket.order.filter(obj => obj.id === item.id)[0]

        if (operation === "-") {
            if (previousObj.number === 1) { // remove the object
                Basket.order.splice(Basket.order.map(obj => obj.id).indexOf(item.id), 1)
                store.setBasket(JSON.stringify(Basket))

                if (Basket.order.length === 0) {
                    store.setBasket(JSON.stringify("{}"))
                    navigation.goBack()
                }
            }
            else {
                previousObj.number = previousObj.number - 1
                previousObj.price = previousObj.price - item.initial_price
                Basket.order.splice(Basket.order.map(obj => obj.id).indexOf(previousObj.id), 1)
                Basket.order.push(previousObj)
                store.setBasket(JSON.stringify(Basket))
            }
        }
        else {
            previousObj.number = previousObj.number + 1
            previousObj.price = previousObj.price + item.initial_price
            Basket.order.splice(Basket.order.map(obj => obj.id).indexOf(previousObj.id), 1)
            Basket.order.push(previousObj)
            store.setBasket(JSON.stringify(Basket))
        }
        setBasket({ ...Basket })
    }

    async function searchByText(text) {
        // we get only the results in the same city as him
        var res = await fetch("https://app.geocodeapi.io/api/v1/autocomplete?apikey=" + GEOCODEAPI_ACCESSTOKEN + "&text=" + text)
        res = await res.json()
        if (res.features) {
            var results = []
            res.features.map(async (feature) =>
                results.push({ key: results.length + 1, label: feature.properties.label, coordinates: feature.geometry.coordinates })
            )
            setSearchResults(results)
        }
    }

    function typeOnKeyboard(text) {
        if (text.length >= 3) {
            isTyping = true
            clearTimeout(waitForType)

            if (previousTime) {
                if (Math.abs(new Date() - previousTime) < 500) {
                    waitForType = setTimeout(() => {
                        if (!isTyping)
                            searchByText(text)
                    }, 300);
                }
                else
                    searchByText(text)
            }
            previousTime = new Date()
            isTyping = false
        }
    }

    async function applePay() {
        if (verifyInfos(true) && isApplePaySupported) {
            try {
                await presentApplePay({
                    cartItems: [{ label: JSON.parse(store.getRestaurant()).name, amount: "" + Amount }],
                    country: "FR",
                    currency: "EUR"
                })

                const clientSecret = await api.payment_intent({ amount: Amount * 100 })
                await confirmApplePayPayment(clientSecret.data)
                sendOrder()
            } catch (err) {
                console.log(err)
                setModalLoadingVisible(false)
            }
        }
    }

    async function googlePay() {
        if (verifyInfos(true)) {
            const requestData = {
                cardPaymentMethod: {
                    tokenizationSpecification: {
                        type: "PAYMENT_GATEWAY",
                        // stripe (see Example):
                        gateway: "stripe",
                        gatewayMerchantId: "",
                        stripe: {
                            publishableKey: PUBLISHABLEKEY,
                            version: "2018-11-08",
                        },
                        // other:
                        // gateway: "example",
                        // gatewayMerchantId: "exampleGatewayMerchantId",
                    },
                    allowedCardNetworks,
                    allowedCardAuthMethods,
                },
                transaction: {
                    totalPrice: "" + Amount,
                    totalPriceStatus: "FINAL",
                    currencyCode: "EUR",
                },
                merchantName: JSON.parse(store.getRestaurant()).name,
            };

            // Set the environment before the payment request
            GooglePay.setEnvironment(GooglePay.ENVIRONMENT_TEST);

            // Check if Google Pay is available
            GooglePay.isReadyToPay(allowedCardNetworks, allowedCardAuthMethods)
                .then(ready => {
                    if (ready) {
                        // Request payment token
                        GooglePay.requestPayment(requestData)
                            .then(token => {
                                // Send a token to your payment gateway
                                console.log(token)
                                sendOrder()
                            })
                            .catch((err) => {
                                setModalLoadingVisible(false)
                                console.log(err)
                            });
                    }
                }).catch(err => console.log(err))
        }
    }

    async function makePayment() {
        if (verifyInfos()) {
            try {
                setModalLoadingVisible(true)
                const clientSecret = await api.payment_intent({ amount: Amount * 100 })

                // The rest will be done automatically using webhooks
                const { error, paymentIntent } = await confirmPayment(clientSecret.data, {
                    type: "Card"
                });

                if (error)
                    console.log(error)
                else if (paymentIntent)
                    sendOrder()
            } catch (err) {
                setModalLoadingVisible(false)
                console.log(err)
            }
        }
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.results} onPress={() => { setAddress(item); setShowSearchBar(false) }} >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>{item.label}</Text>
        </TouchableOpacity>
    );

    return Basket
        ? <View style={{ flex: 1, paddingTop: StatusBar.currentHeight || 60, backgroundColor: "white" }} >
            <Modal visible={ModalLoadingVisible} transparent>
                <MaterialIndicator size={100} color="#ffc107" />
            </Modal>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: "transparent" }}>
                <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
                    <View style={{ marginLeft: 25, height: 50, justifyContent: "flex-start" }}>
                        <Text style={{ fontWeight: "bold", fontSize: 30 }} onPress={() => navigation.goBack()}>←</Text>
                    </View>

                    <View style={{ marginLeft: 25, justifyContent: "center", marginRight: "30%", paddingTop: 10, paddingBottom: 30 }}>
                        <Text style={{ fontWeight: "bold", fontSize: 40 }}>{strings.basket}</Text>
                    </View>

                    {/* Basket Content */}
                    <Text style={{ marginLeft: 25, fontWeight: "bold", fontSize: 20 }}>{JSON.parse(store.getRestaurant()).name}</Text>
                    {Basket && Basket.order.sort((a, b) => new Date(b.date) - new Date(a.date)).map(elem =>
                        <View key={uuid.v4()} style={styles.child}>
                            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                <Text style={{ fontSize: height * 0.06 }}>{elem.icon}</Text>
                            </View>
                            <View style={{ flex: 2, paddingLeft: 10, justifyContent: "center" }}>
                                <Text style={{ fontWeight: "bold", fontSize: 17 }}>{elem.name}</Text>
                                {elem.content && elem.content.map(c => {
                                    i = 0
                                    return (<View key={uuid.v4()} style={{ flexWrap: "wrap", alignItems: "flex-start", flexDirection: "row" }}>
                                        <Text style={{ color: "grey", fontSize: 10 }}>{c.name}: </Text>
                                        {c.content.map(c2 => {
                                            i = i + 1
                                            return <Text key={uuid.v4()} style={{ color: "grey", fontSize: 10 }}>{c2.name} {c2.price && c2.price + "€"} {i < c.content.length && ","} </Text>
                                        })}
                                    </View>)
                                })}
                                <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                                    <Text style={{ fontWeight: "bold", fontSize: 20, marginTop: 5 }}>{elem.price}€ </Text>
                                    <Text style={{ fontWeight: "bold", fontSize: 20, marginLeft: 5, marginTop: 5, color: "grey" }}>{elem.price !== elem.initial_price && "(" + elem.initial_price + "€)"}</Text>
                                </View>
                            </View>
                            <View style={{ flex: 1.3, paddingLeft: 10, justifyContent: "center", alignItems: "center" }}>
                                <View style={{ flexDirection: "row", borderRadius: 30, backgroundColor: "#eeeeee" }}>
                                    <TouchableOpacity activeOpacity={0.7} style={{ flex: 1, borderTopLeftRadius: 30, borderBottomLeftRadius: 30, justifyContent: "center", alignItems: "center", backgroundColor: "#ffc107" }}
                                        onPress={() => updateBasket("-", elem)}>
                                        <Text style={{ fontWeight: "bold", fontSize: 25 }}>-</Text>
                                    </TouchableOpacity>
                                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                        <Text style={{ fontWeight: "bold", fontSize: 20 }}>{elem.number}</Text>
                                    </View>
                                    <TouchableOpacity activeOpacity={0.7} style={{ flex: 1, borderTopRightRadius: 30, borderBottomRightRadius: 30, justifyContent: "center", alignItems: "center", backgroundColor: "#ffc107" }}
                                        onPress={() => updateBasket("+", elem)}>
                                        <Text style={{ fontWeight: "bold", fontSize: 25 }}>+</Text>
                                    </TouchableOpacity>
                                </View>

                            </View>
                        </View>)
                    }

                    <TextInput style={{ height: 100, backgroundColor: "#eeeeee", marginHorizontal: 25, paddingTop: 15, paddingBottom: 15, paddingLeft: 15, paddingRight: 15, borderRadius: 25, fontSize: 17, fontWeight: "bold", color: "black" }} placeholder={strings.comment} placeholderTextColor={"grey"}
                        multiline onChangeText={text => setComment(text)} />
                    <View style={{ margin: 25, width: width, justifyContent: "center", alignItems: "flex-end", paddingRight: 50 }}>
                        <Text style={{ fontWeight: "bold", fontSize: 25 }}>Total: {Amount}€</Text>
                        <Text style={{ fontWeight: "bold", color: "grey", fontSize: 15 }}>(HT: {Amount - (Amount * 0.2).toFixed(1)}€)</Text>
                    </View>
                    <Divider style={{ marginTop: 10 }} orientation="horizontal" inset insetType="middle" width={1} />


                    {/* User Info */}
                    <View style={{ marginLeft: 25, justifyContent: "center", marginRight: "20%", paddingVertical: 30 }}>
                        <Text style={{ fontWeight: "bold", fontSize: 40 }}>{strings.your_infos}</Text>
                    </View>

                    {/* MapView */}
                    <Text style={{ marginLeft: 25, fontWeight: "bold", fontSize: 20 }}>{strings.addresse}</Text>
                    <View style={{ marginHorizontal: 25, overflow: "hidden", marginTop: 20, height: 200, borderRadius: 20 }}>
                        <MapboxGL.MapView style={{ flex: 1 }} styleURL={"mapbox://styles/gokugen/ck87eb9uv07w81jtab4dlpsbj"}
                            localizeLabels
                            compassEnabled={false}
                            rotateEnabled={false}
                            pitchEnabled={false}>
                            <MapboxGL.Camera pitch={Address ? 45 : 0} centerCoordinate={Address && Address.coordinates} zoomLevel={Address ? 14 : 0} />
                            {Address && <MapboxGL.PointAnnotation id="location" coordinate={Address.coordinates} />}
                        </MapboxGL.MapView>

                        <View style={{ flex: 1, flexDirection: "row", position: "absolute", top: 10, paddingHorizontal: 10 }}>
                            {ShowSearchBar
                                ? <View style={{ flex: 4, justifyContent: "center" }}>
                                    <View style={styles.search}>
                                        <TextInput style={styles.input} placeholderTextColor={"grey"} placeholder={"Votre adresse..."} onFocus={() => { }} onChangeText={typeOnKeyboard} />
                                    </View>
                                    {SearchResults.length > 0 && <View style={{ height: 100, width: 250, borderRadius: 20, backgroundColor: "grey", opacity: 0.8 }}>
                                        <FlatList
                                            data={SearchResults}
                                            renderItem={renderItem}
                                            keyExtractor={item => "" + item.key}
                                        />
                                    </View>}
                                </View>
                                : <View style={{ flex: 4, height: 50, justifyContent: "center" }}>
                                    <Text style={{ fontWeight: "bold", color: "white", fontSize: 17 }}>{Address ? Address.label : "Choisir une adresse"}</Text>
                                </View>
                            }

                            <View style={{ flex: 1, alignItems: "center" }} />
                            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowSearchBar(!ShowSearchBar)}
                                style={{ position: "absolute", top: 0, right: 10, height: 50, justifyContent: "center", alignItems: "center", backgroundColor: "#ffc107", width: 50, borderRadius: 25 }}>
                                <Icon name={"pencil"} color="black" size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Payment */}
                    <Text style={{ marginLeft: 25, marginTop: 50, fontWeight: "bold", fontSize: 20 }}>{strings.payment_method}</Text>
                    {/* <View style={{ marginTop: 20 }}> */}
                    {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 25 }}>
                        {Cards.map(card =>
                            <TouchableOpacity key={uuid.v4()} activeOpacity={0.5} onPress={() => setCardPressed(card.number)}
                                style={{ height: 150, width: 250, justifyContent: "flex-end", alignItems: "center", borderWidth: 3, borderColor: CardPressed === card.number ? "#ffc107" : "#eeeeee", borderRadius: 30, marginRight: 10, paddingBottom: 20 }} >
                                {CardPressed === card.number && <>
                                    <View style={{ position: "absolute", top: 20, left: 20 }}>
                                        {(card.number[0] === "4" || card.number[0] === "5") && <FastImage  style={{ height: 25, width: 45 }} source={{
                                            uri: card.number[0] === "4"
                                                ? "https://uploads-ssl.webflow.com/609acf33690f44a488af3497/609add1b4d3314d6d9ef7d07_Visa-Logo-2006-2014.png"
                                                : "https://logo-marque.com/wp-content/uploads/2020/09/Mastercard-Logo.png"
                                        }} />}
                                    </View>
                                    <View style={{ position: "absolute", top: 10, right: 10 }}>
                                        <Icon name={"check"} color="#ffc107" size={20} />
                                    </View>
                                </>}
                                <Text style={{ fontWeight: "bold", fontSize: 18 }}>**** **** **** {card.number.substr(card.number.length - 4)}</Text>
                            </TouchableOpacity>
                        )} */}

                    {/* add new card */}
                    {/* <TouchableOpacity key={"new"} activeOpacity={0.5} style={{ height: 150, width: 250, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#eeeeee", borderRadius: 30 }}
                            onPress={() => store.setCards(JSON.stringify([{
                                number: "4970437046425436",
                                expiration: "09/23",
                                name: "HADJADJI",
                                default: true
                            }]))}>
                            <Text style={{ fontWeight: "bold", fontSize: 16 }}>Ajouter une carte</Text>
                            <Text style={{ fontWeight: "bold", fontSize: 16 }}>+</Text>
                        </TouchableOpacity>
                    </ScrollView> */}
                    {/* </View> */}

                    <StripeProvider publishableKey={PUBLISHABLEKEY} merchantIdentifier="merchant.com.goodfood">
                        <View style={{ margin: 25 }}>
                            <CardField postalCodeEnabled={false}
                                placeholder={{
                                    number: "****",
                                }}
                                cardStyle={{
                                    backgroundColor: "#FFFFFF",
                                    textColor: "#000000",
                                }}
                                style={{
                                    width: width - 50,
                                    height: 50,
                                }}
                                onCardChange={() => setCardEnter(true)}
                            />
                        </View>

                        <View style={{ justifyContent: "center", alignItems: "center" }}>
                            <TouchableOpacity activeOpacity={0.7} style={styles.payment_button} onPress={() => makePayment()}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: "bold", fontSize: 18 }}>{strings.payment}</Text>
                                </View>
                                <View style={{ flex: 1, alignItems: "flex-end" }}>
                                    <Text style={{ fontWeight: "bold", fontSize: 18 }}>{Amount}€</Text>
                                </View>
                            </TouchableOpacity>

                            {Platform.OS === "android" && <TouchableOpacity activeOpacity={0.7} style={styles.payment_google_button} onPress={googlePay}>
                                <FastImage style={{ height: 30, width: 30, marginRight: 5 }} source={require('../assets/google-logo.png')} />
                                <Text style={{ fontSize: 30, color: "white" }}>Pay</Text>
                            </TouchableOpacity>}

                            {isApplePaySupported && (
                                <ApplePayButton
                                    onPress={applePay}
                                    type="plain"
                                    buttonStyle="black"
                                    borderRadius={30}
                                    style={{
                                        width: width - 50,
                                        height: 60,
                                    }}
                                />
                            )}
                        </View>
                    </StripeProvider>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
        : <></>
}
export default BasketInfos

const styles = StyleSheet.create({
    payment_google_button: {
        height: 60,
        width: width - 50,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 30,
        backgroundColor: "black"
    },
    payment_button: {
        height: 60,
        width: width - 50,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 25,
        marginBottom: 10,
        borderRadius: 30,
        backgroundColor: "#ffc107"
    },
    child: {
        flexDirection: "row",
        alignItems: "center",
        height: 120,
        marginVertical: 10,
        marginHorizontal: 25,
        borderRadius: 20
    },

    search: {
        height: 50,
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: "#353434",
        padding: 10,
    },
    input: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    results: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 5
    }
})