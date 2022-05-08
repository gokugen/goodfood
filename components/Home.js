import React, { useState, useEffect } from "react"
import { Linking, StyleSheet, Dimensions, StatusBar, ActivityIndicator, ScrollView, RefreshControl, FlatList, TouchableOpacity, View, Image, Text, TextInput, Alert } from "react-native";
import FastImage from 'react-native-fast-image';
import * as Notifications from "expo-notifications";
import Icon from 'react-native-vector-icons/FontAwesome';
import Toast from 'react-native-toast-message';
import * as turf from '@turf/turf';
import { api, store } from "../service";
import { translate } from "../languages";
const strings = translate.strings

var { height, width } = Dimensions.get('window');

const Home = ({ navigation }) => {

    const [FirstTime, setFirstTime] = useState(true)
    const [Refresh, setRefresh] = useState(false)
    const [FilteredRestaurants, setFilteredRestaurants] = useState([])
    const [Filter, setFilter] = useState()
    const [FavoritesId, setFavoritesId] = useState(store.getFavorites() ? JSON.parse(store.getFavorites()) : [])

    useEffect(() => {
        (async () => {
            if (!store.getExpoToken()) {
                var user = {}
                user["expo_token"] = (await registerForPushNotifications())?.data || null

                if (user.expo_token)
                    api.edit(user)
            }
        })()

        api.get_restaurants().then(res => {
            // keep only opened restaurants
            var actualHours = new Date().getHours()
            // restaurants = res.data.filter(r => (r.hours.map(interval => inRange(actualHours, interval[0], interval[1]))).includes(true))
            // setFilteredRestaurants(restaurants)
            setFilteredRestaurants(res.data)
            setFirstTime(false)
        }).catch(err => console.log(err))
    }, [])

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            setFavoritesId(store.getFavorites() ? JSON.parse(store.getFavorites()) : [])
        });

        return unsubscribe;
    }, [navigation]);

    // return true if in range, otherwise false
    function inRange(value, first, second) {
        if (first > second)
            return value > first || value < second
        else
            return value > first && value < second
    }

    async function registerForPushNotifications() {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== "granted") {
            Alert.alert(
                "Activez les notifications",
                "Vous pourrez être informé en temps réel de l'avancé de votre commande. Vous recevrez également des offres promotionnelles et d'autres bon plans!",
                [
                    { text: "Non merci" },
                    { text: "Ok", onPress: () => Linking.openSettings(), style: "default" },
                ],
                { cancelable: false }
            )
            return;
        }

        if (Platform.OS === "android") {
            Notifications.setNotificationChannelAsync("default", {
                name: "default",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#FF231F7C",
            });
        }

        return await Notifications.getExpoPushTokenAsync({ experienceId: "@gokugen/goodfood" })
    }

    function addRemoveFromFavoritesId(item) {
        // alredy in
        if (FavoritesId.includes(item._id)) {
            store.setFavorites(JSON.stringify(FavoritesId.filter(id => id !== item._id)))
            api.edit({ favorites: JSON.parse(store.getFavorites()) }).catch(err => console.log(err))
            setFavoritesId(JSON.parse(store.getFavorites()))

            Toast.show({
                type: "success",
                visibilityTime: 1500,
                position: "bottom",
                text1: item.name + " a été retirée des favoris",
            })
        }
        else {
            FavoritesId.push(item._id)
            store.setFavorites(JSON.stringify(FavoritesId))
            api.edit({ favorites: JSON.parse(store.getFavorites()) }).catch(err => console.log(err))
            setFavoritesId(JSON.parse(store.getFavorites()))

            Toast.show({
                type: "success",
                visibilityTime: 1500,
                position: "bottom",
                text1: item.name + " a été ajoutée aux favoris",
            })
        }
    }

    function filterRestaurants(filter) {
        setFilter(filter)
        if (filter === "favorites") {
            var filteredRestaurants = restaurants.filter(r => JSON.parse(store.getFavorites()).includes(r._id))
            filteredRestaurants.length > 0 && setFilteredRestaurants(filteredRestaurants)
        }
        else if (filter === "near") // verify geoloc authorization
        { }//setFilteredRestaurants(restaurants.sort((a, b) => turf.distance(turf.point(a.coordinates),) < turf.distance(turf.point(b.averageRating,))))
        else
            setFilteredRestaurants(restaurants.sort((a, b) => a.averageRating < b.averageRating))
    }

    return <ScrollView style={{ backgroundColor: "white" }} refreshControl={
        <RefreshControl refreshing={Refresh}
            onRefresh={() => {
                setRefresh(true);
                api.get_restaurants().then(res => {
                    // keep only opened restaurants
                    var actualHours = new Date().getHours()
                    // restaurants = res.data.filter(r => (r.hours.map(interval => inRange(actualHours, interval[0], interval[1]))).includes(true))
                    // setFilteredRestaurants(restaurants)
                    setFilteredRestaurants(res.data)
                    setRefresh(false)
                }).catch(err => console.log(err))
            }} />}>
        {FirstTime && <ActivityIndicator size="large" />}
        <FastImage style={{ height: 250, width: "100%" }} source={require("../assets/home.jpg")} />
        <View style={{ marginTop: 10 }}>
            <StatusBar barStyle="dark-content" />
            <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TextInput placeholder="Nom du restaurant" placeholderTextColor="grey"
                    style={{ height: 50, width: width - 100, marginHorizontal: 25, fontWeight: "bold", fontSize: 20 }}
                    onChangeText={(text) => setFilteredRestaurants(restaurants.filter(r => r.name.toLowerCase().includes(text.toLowerCase())))}>
                </TextInput>
                <Icon name={"search"} color={"black"} size={20} />
            </View>

            <View style={{ marginVertical: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 25 }}>
                    <TouchableOpacity activeOpacity={0.5} style={{ padding: 10, borderWidth: 1, borderColor: "#dddddd", borderRadius: 10, marginRight: 10 }}
                        onPress={() => filterRestaurants("favorites")}>
                        <Text style={{ fontWeight: Filter === "favorite" ? "bold" : "normal", fontWeight: "bold", fontSize: 16 }}>{strings.favorites}</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity activeOpacity={0.5} style={{ padding: 10, borderWidth: 1, borderColor: "#dddddd", borderRadius: 10, marginRight: 10 }}
                        onPress={() => filterRestaurants("near")}>
                        <Text style={{ fontWeight: Filter === "near" ? "bold" : "normal", fontWeight: "bold", fontSize: 16 }}>{strings.near}</Text>
                    </TouchableOpacity> */}
                    <TouchableOpacity activeOpacity={0.5} style={{ padding: 10, borderWidth: 1, borderColor: "#dddddd", borderRadius: 10, marginRight: 10 }}
                        onPress={() => filterRestaurants("rating")}>
                        <Text style={{ fontWeight: Filter === "rating" ? "bold" : "normal", fontWeight: "bold", fontSize: 16 }}>{strings.best_rate}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <Text style={{ margin: 10, marginLeft: 25, fontWeight: "bold", fontSize: 20 }}>{FilteredRestaurants.length} {FilteredRestaurants.length > 1 ? strings.results + "s" : strings.results}</Text>
            <FlatList style={{ height: "80%" }}
                data={FilteredRestaurants}
                renderItem={({ item }) =>
                    <TouchableOpacity style={styles.item} activeOpacity={0.7} onPress={() => navigation.push("RestaurantInfos", { item })}>
                        <View style={{ flex: 1, backgroundColor: "transparent" }}>
                            <FastImage style={{ flex: 1, borderRadius: 20 }} source={{ uri: item.images[0] }} />
                        </View>
                        <View style={{ flex: 3, paddingLeft: 10 }}>
                            <View>
                                <Text style={{ fontSize: height * 0.025, fontWeight: "bold" }}>{item.name}</Text>
                                <Text style={{ color: "grey", fontSize: height * 0.02, fontWeight: "bold" }}>{item.category}</Text>
                            </View>
                            <View style={{ flex: 1, justifyContent: "flex-end" }}>
                                {/* <Text style={{ color: "grey", marginBottom: 5 }}>Frais de livraison: {item.fees}€</Text> */}
                                <Text style={{ color: "grey", fontSize: height * 0.02, fontWeight: "bold" }}>{item.averageTime}-{item.averageTime + 10}min</Text>
                            </View>
                        </View>
                        <View style={{ flex: 0.5, alignItems: "center", justifyContent: "space-between" }}>
                            <TouchableOpacity style={{ flex: 0.7, backgroundColor: "transparent" }}
                                onPress={() => addRemoveFromFavoritesId(item)}>
                                <Icon name={"heart"} color={FavoritesId.includes(item._id) ? "#ffc107" : "black"} size={20} />
                            </TouchableOpacity>
                            {item.averageRating && <View style={{ alignSelf: "center" }}>
                                <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                                    <Icon name={"star"} color="black" size={height * 0.02} />
                                    <Text style={{ fontSize: height * 0.02, marginLeft: 3, fontWeight: "bold" }}>{(item.averageRating).toFixed(1)}</Text>
                                </View>
                            </View>}
                        </View>
                    </TouchableOpacity>
                }
                keyExtractor={item => item._id}
            />
        </View>
    </ScrollView>
}
export default Home

const styles = StyleSheet.create({
    item: {
        flexDirection: "row",
        height: height * 0.14,
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
    }
})