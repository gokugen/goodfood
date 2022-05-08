import React, { useState, useRef, useEffect } from "react"
import { StyleSheet, Platform, StatusBar, Dimensions, TouchableOpacity, ScrollView, Image, View, Text } from "react-native";
import FastImage from 'react-native-fast-image';
import { Divider } from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import MapboxGL from "@react-native-mapbox-gl/maps";
import Logger from '@react-native-mapbox-gl/maps/javascript/utils/Logger';
import { MAPBOX_ACCESSTOKEN } from "@env"
import { translate } from "../languages";
const strings = translate.strings

import FoodInfos from "./FoodInfos"
import { store } from "../service";

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

const RestaurantInfos = ({ navigation, route }) => {
    const restaurantScrollerRef = useRef()
    const restaurant = route.params.item

    const [DataSourceCords, setDataSourceCords] = useState([]);
    const [ShowHeader, setShowHeader] = useState(false);

    const [Food, setFood] = useState()
    const [Basket, setBasket] = useState(JSON.parse(store.getBasket()))

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () =>
            setBasket(JSON.parse(store.getBasket()))
        );

        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        if (!Food)
            setBasket(JSON.parse(store.getBasket()))
    }, [Food]);

    return <View style={{ backgroundColor: "white" }}>
        {ShowHeader && <View style={{ zIndex: 1, position: "absolute", top: 0, justifyContent: "flex-end", alignItems: "center", backgroundColor: "white", borderBottomWidth: 1, borderColor: "#dddddd", height: height * 0.1, width: width, padding: 10 }}>
            <Text style={{ position: "absolute", left: 10, bottom: 10, fontWeight: "bold", fontSize: 25 }} onPress={() => navigation.goBack()}>←</Text>
            <Text style={{ fontWeight: "bold", fontSize: 20 }}>{restaurant.name}</Text>
        </View>}

        {/* Basket */}
        <View style={{ zIndex: 2, position: "absolute", bottom: Platform.OS === "ios" ? 60 : 30, height: 60, width: "100%", alignItems: "flex-end" }}>
            <TouchableOpacity activeOpacity={0.7} style={styles.basket} onPress={() => Basket.order && navigation.push("BasketInfos")}>
                <Text style={{ fontWeight: "bold", fontSize: 20 }}>{Basket.order
                    ? Basket.order.map(elem => elem.price).reduce((a, b) => a + b, 0)
                    : 0}€ </Text>
                <Icon name={"shopping-basket"} color="black" size={20} />
            </TouchableOpacity>
        </View>

        <ScrollView ref={restaurantScrollerRef} contentContainerStyle={{ paddingTop: StatusBar.currentHeight || 60, paddingBottom: 120 }}
            scrollEventThrottle={16} onScroll={(event) => event.nativeEvent.contentOffset.y >= height * 0.1 ? setShowHeader(true) : setShowHeader(false)} >
            <View style={{ height: 50, justifyContent: "flex-start", marginLeft: 25 }}>
                <Text style={{ fontWeight: "bold", fontSize: 30 }} onPress={() => navigation.goBack()}>←</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 25, paddingTop: 10, paddingBottom: 30 }}>
                <View style={{ flex: 2.4 }}>
                    <Text style={{ fontWeight: "bold", fontSize: 40 }}>{restaurant.name}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <FastImage style={{ height: 100, width: 100 }} source={require('../assets/cooking1.gif')} />
                </View>
            </View>

            {/* MapView */}
            <View style={{ height: 200 }}>
                <MapboxGL.MapView style={{ flex: 1 }} styleURL={"mapbox://styles/gokugen/ck87eb9uv07w81jtab4dlpsbj"}
                    localizeLabels
                    compassEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}>
                    <MapboxGL.Camera defaultSettings={{ centerCoordinate: restaurant.address.coordinates, pitch: 45, zoomLevel: 14 }} />
                    <MapboxGL.PointAnnotation id="location" coordinate={restaurant.address.coordinates} />
                </MapboxGL.MapView>
            </View>

            {restaurant.averageRating && <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", padding: 5, borderWidth: 1, borderColor: "#dddddd", borderRadius: 10, marginVertical: 10, marginLeft: 25 }}>
                <Icon name={"star"} color="black" size={10} />
                <Text style={{ fontWeight: "bold", fontSize: 12, marginLeft: 3 }}>{(restaurant.averageRating).toFixed(1)}</Text>
            </View>}

            {/* categories */}
            <View style={{ marginTop: 10, marginBottom: 30 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 25 }}>
                    {restaurant.food.map(category =>
                        <TouchableOpacity key={category.id} activeOpacity={0.5} style={{ padding: 10, borderWidth: 1, borderColor: "#dddddd", borderRadius: 10, marginRight: 10 }}
                            onPress={() => restaurantScrollerRef.current.scrollTo({ x: 0, y: DataSourceCords[restaurant.food.map(r => r.name).indexOf(category.name)] - 100 })}>
                            <Text style={{ fontWeight: "bold", fontSize: 16 }}>{category.name}</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            {/* Images */}
            <View style={{ height: 250, marginBottom: 30 }}>
                <Text style={{ fontWeight: "bold", fontSize: 20, marginLeft: 25, marginBottom: 20 }}>Images</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ height: "100%", paddingLeft: 25 }} >
                    {restaurant.images?.map(url =>
                        <View key={url} style={{ marginRight: 25 }} >
                            <FastImage style={{ borderRadius: 20, height: "100%", width: width / 1.3 }} source={{ uri: url }} />
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Content */}
            <Text style={{ fontWeight: "bold", fontSize: 20, marginLeft: 25, marginBottom: 20 }}>{strings.food}</Text>
            {restaurant.food.map(category => <View key={category.id} style={{ paddingHorizontal: 25 }} onLayout={(event) => {
                DataSourceCords[restaurant.food.map(r => r.name).indexOf(category.name)] = event.nativeEvent.layout.y;
                setDataSourceCords(DataSourceCords)
            }}>
                {category.content.map(child =>
                    <TouchableOpacity key={child.id} activeOpacity={0.7} style={styles.item} onPress={() => setFood(child)}>
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <Text style={{ fontSize: height * 0.06 }}>{child.icon}</Text>
                        </View>
                        <View style={{ flex: 3, paddingLeft: 10, justifyContent: "center" }}>
                            <Text style={{ fontWeight: "bold", fontSize: 17 }}>{child.name}</Text>
                            {child.description && <Text style={{ fontWeight: "bold", color: "grey", fontSize: 12, marginTop: 5 }}>{child.description}</Text>}
                        </View>
                        <View style={{ flex: 0.7, alignItems: "flex-end" }}>
                            <Text style={{ fontWeight: "bold", fontSize: height * 0.025 }}>{child.price}€</Text>
                        </View>
                    </TouchableOpacity>)}

                {restaurant.food.map(c => c.name).indexOf(category.name) < restaurant.food.length - 1 && <Divider style={{ marginVertical: 20 }} orientation="horizontal" inset insetType="middle" width={1} />}
            </View>
            )}
        </ScrollView>

        <FoodInfos restaurant={restaurant} food={Food} setFood={setFood} />
    </View>
}
export default RestaurantInfos

const styles = StyleSheet.create({
    basket: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 25,
        paddingHorizontal: 15,
        borderRadius: 30,
        backgroundColor: "#ffc107",
        elevation: 5,
        shadowOpacity: 0.2,
        shadowOffset: {
            width: 2,
            height: 4
        },
        shadowColor: "black"
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        height: height * 0.15,
        marginVertical: 10,
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
    }
})