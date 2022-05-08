import React, { useState, useRef, useEffect } from "react"
import { StyleSheet, Dimensions, StatusBar, ActivityIndicator, SafeAreaView, View, FlatList, TouchableOpacity, Text, Image, Modal, Alert } from "react-native";
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/FontAwesome';
import Toast from 'react-native-toast-message';
import { store, api } from "../service";

var { height, width } = Dimensions.get('window');
const Favorites = ({ dispatch, navigation }) => {

    const [FirstTime, setFirstTime] = useState(true)
    const [FavoritesId, setFavoritesId] = useState(store.getFavorites() ? JSON.parse(store.getFavorites()) : [])
    const [Favorites, setFavorites] = useState([])

    useEffect(() => {
        Promise.all(JSON.parse(store.getFavorites()).map(id =>
            api.get_restaurant(id).then(res => res.data).catch(err => console.log(err))
        )).then(res => {
            setFavorites(res)
            console.log(res)
            setFirstTime(false)
        }).catch(err => console.log(err))
    }, [])

    function RemoveFromFavoritesId(item) {
        store.setFavorites(JSON.stringify(FavoritesId.filter(id => id !== item._id)))
        api.edit({ favorites: JSON.parse(store.getFavorites()) }).catch(err => console.log(err))
        setFavoritesId(JSON.parse(store.getFavorites()))
        setFavorites(Favorites.filter(restaurant => restaurant._id !== item._id))

        Toast.show({
            type: "success",
            visibilityTime: 1500,
            position: "bottom",
            text1: item.name + " a été retirée des favoris",
        })

        if (Favorites.filter(restaurant => restaurant._id !== item._id).length === 0)
            navigation.goBack()
    }

    return <View style={{ flex: 1, backgroundColor: "white" }}>
        <SafeAreaView style={styles.container}>
            <View style={{ height: 50, justifyContent: "flex-start", marginLeft: 25 }}>
                <Text style={{ fontWeight: "bold", fontSize: 30 }} onPress={() => navigation.goBack()}>←</Text>
            </View>
            <Text style={{ marginLeft: 25, fontWeight: "bold", fontSize: 30, marginBottom: 10 }}>Mes Favoris</Text>

            {FirstTime && <ActivityIndicator size="large" color="#ffc107" />}
            <FlatList
                data={Favorites}
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
                                onPress={() => RemoveFromFavoritesId(item)}>
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
        </SafeAreaView>
    </View>
}
export default Favorites

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