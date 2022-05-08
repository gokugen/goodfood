import React, { useState, useRef, useEffect } from "react"
import { StyleSheet, Platform, Dimensions, Animated, ScrollView, View, TouchableOpacity, Text, Image, Alert } from "react-native";
import CheckBox from '@react-native-community/checkbox';
import SlidingUpPanel from 'rn-sliding-up-panel';
import uuid from 'react-native-uuid';
import FastImage from 'react-native-fast-image';
import _ from 'lodash';
import { store } from "../service";

var { height, width } = Dimensions.get('window');
const animatedValue = new Animated.Value(0)
const FoodInfos = (props) => {
    var previousValue = 0
    const panel = useRef()

    const [ShowBasketButton, setShowBasketButton] = useState(false)
    const [LsCheckBox, setLsCheckBox] = useState()
    const [LsDisabledCheckBox, setLsDisabledCheckBox] = useState()
    const [Price, setPrice] = useState(0)
    const [Number, setNumber] = useState(0)

    useEffect(() => {
        animatedValue.addListener(({ value }) => {
            if (previousValue !== value) {
                if (value < previousValue) // to Bottom
                    setShowBasketButton(false)
                previousValue = value
            }
        });
    }, [])

    useEffect(() => {
        if (props.food) {
            setPrice(props.food.price)
            setShowBasketButton(true)
            setNumber(0)
            var basket = JSON.parse(store.getBasket())

            if (props.food.content) {
                setLsCheckBox(props.food.content.map(c => new Array(c.content.length).fill(false)))
                setLsDisabledCheckBox(props.food.content.map(c => new Array(c.content.length).fill(false)))
            }
            else if (basket.order) {
                var basket = basket.order
                var previousObj = basket.filter(obj => obj.id === props.food.id)[0]
                previousObj && setNumber(previousObj.number)
            }
            panel.current.show()
        }
    }, [props.food])

    function countNumberOfChecked(array) {
        var nb = 0
        array.forEach(val => {
            if (val)
                nb++
        })
        return nb
    }

    function canBeChecked(parentIndex, index, price, maximum) {
        var tmpLsCheckBox = [...LsCheckBox]
        tmpLsCheckBox[parentIndex][index] = !tmpLsCheckBox[parentIndex][index]
        setLsCheckBox([...tmpLsCheckBox])
        setPrice(tmpLsCheckBox[parentIndex][index] ? Price + price : Price - price)
        if (maximum) {
            if (countNumberOfChecked(tmpLsCheckBox[parentIndex]) === maximum) {
                var tmpLsDisabledCheckBox = LsDisabledCheckBox
                tmpLsDisabledCheckBox[parentIndex] = tmpLsCheckBox[parentIndex].map(val => !val)
                setLsDisabledCheckBox([...tmpLsDisabledCheckBox])
            }
            else {
                var tmp_array = [...LsDisabledCheckBox]
                tmp_array[parentIndex] = new Array(LsDisabledCheckBox[parentIndex].length).fill(false)
                setLsDisabledCheckBox(tmp_array)
            }
        }
    }

    function alreadyInBasket(obj) {
        var basket = JSON.parse(store.getBasket())

        if (basket.order) {
            for (var i = 0; i < basket.order.length; i++) {
                if (_.isEqual(_.omit(basket.order[i], ["id", "price", "number", "date"]), _.omit(obj, ["id", "price", "number", "date"])))
                    return basket.order[i].id
            }
        }
        return null
    }

    function updateBasket(operation) {
        var basket = JSON.parse(store.getBasket())
        var previousObj = basket.order ? basket.order.filter(obj => obj.id === props.food.id)[0] : null

        if (operation === "-") {
            if (previousObj.number === 1) { // remove all the object
                basket.order.splice(basket.order.map(obj => obj.id).indexOf(props.food.id), 1)
                store.setBasket(JSON.stringify(basket))
            }
            else {
                previousObj.number = previousObj.number - 1
                previousObj.price = previousObj.price - props.food.price
                basket.order.splice(basket.order.map(obj => obj.id).indexOf(previousObj.id), 1)
                basket.order.push(previousObj)
                store.setBasket(JSON.stringify(basket))
            }
        }
        else {
            if (!previousObj) {
                if (!basket.order) { // first object in the basket
                    store.setBasket(JSON.stringify({
                        "restaurant_id": props.restaurant._id,
                        "order": []
                    }))
                    basket = JSON.parse(store.getBasket())
                    store.setRestaurant(JSON.stringify(props.restaurant))
                }

                var addToBasket = {
                    "name": props.food.name,
                    "icon": props.food.icon,
                    "number": 1,
                    "price": Price,
                    "initial_price": props.food.price,
                    "date": new Date()
                }

                if (props.food.content) {
                    var tmp_array = []
                    for (var i = 0; i < LsCheckBox.length; i++) {
                        if (LsCheckBox[i].includes(true)) {
                            var obj = {
                                "name": props.food.content[i].name,
                                "content": []
                            }

                            for (var y = 0; y < LsCheckBox[i].length; y++) {
                                if (LsCheckBox[i][y]) {
                                    var tmpObj = {
                                        "name": props.food.content[i].content[y].name
                                    }

                                    if (props.food.content[i].content[y].price > 0)
                                        tmpObj["price"] = props.food.content[i].content[y].price

                                    obj.content.push(tmpObj)
                                }
                            }
                            tmp_array.push(obj)
                        }
                    }
                    addToBasket["content"] = tmp_array
                }

                var id = alreadyInBasket(addToBasket)
                if (!id) {
                    addToBasket["id"] = props.food.content ? uuid.v4() : props.food.id
                    basket.order.push(addToBasket)
                    store.setBasket(JSON.stringify(basket))
                }
                else {
                    previousObj = basket.order.filter(obj => obj.id === id)[0]
                    previousObj.number = previousObj.number + 1
                    previousObj.price = previousObj.price + Price
                    var index = basket.order.map(obj => obj.id).indexOf(previousObj.id)
                    basket.order[index] = previousObj
                    store.setBasket(JSON.stringify(basket))
                }
            }
            else {
                previousObj.number = previousObj.number + 1
                previousObj.price = previousObj.price + Price
                var index = basket.order.map(obj => obj.id).indexOf(previousObj.id)
                basket.order[index] = previousObj
                store.setBasket(JSON.stringify(basket))
            }
        }
    }

    function addRemoveFood(operation) {
        if (JSON.parse(store.getBasket()).order && JSON.parse(store.getBasket()).restaurant_id !== props.restaurant._id)
            Alert.alert(
                "Un panier a déjà été crée chez " + props.restaurant.name,
                "Veuillez vider votre panier pour commander dans ce nouveau restaurant.",
                [
                    { text: "Vider le panier", onPress: () => store.setBasket(JSON.stringify({})) },
                    { text: "Ok", onPress: () => { } },
                ],
                { cancelable: false }
            )
        else {
            if (operation === "-")
                Number >= 1 ? (() => { setNumber(Number - 1); updateBasket("-") })() : setNumber(0)
            else {
                if (props.food.content) {
                    // verify all required fields are choosen
                    var error = false
                    for (var i = 0; i < LsCheckBox.length; i++) {
                        if (props.food.content[i].minimum > 0 && !LsCheckBox[i].includes(true)) {
                            error = true
                            Alert.alert(
                                "Section manquante",
                                "\"" + props.food.content[i].name + "\"",
                                [
                                    { text: "Ok", onPress: () => { }, style: "cancel" },
                                ],
                                { cancelable: false }
                            )
                            break
                        }
                    }
                    if (!error) {
                        updateBasket("+")
                        setNumber(Number + 1)
                    }
                }
                else {
                    updateBasket("+")
                    setNumber(Number + 1)
                }
            }
        }
    }

    return props.food ? <>
        <SlidingUpPanel ref={panel} animatedValue={animatedValue} allowDragging={false} draggableRange={{ top: props.food.content ? height * 0.7 : props.food.image ? height * 0.55 : height * 0.27, bottom: 0 }} containerStyle={styles.panel}
            onBottomReached={() => props.setFood()} >
            <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ padding: 25, paddingBottom: height * 0.41 }}>
                    {props.food.image && <FastImage style={{ borderRadius: 20, height: height * 0.2, width: width / 1.2, marginBottom: 30 }} source={{ uri: props.food.image }} />}
                    <Text style={{ fontWeight: "bold", fontSize: height * 0.03, marginBottom: 10 }}>{props.food.icon} {props.food.name}</Text>
                    {props.food.description && <Text style={{ fontWeight: "bold", fontSize: height * 0.02, color: "grey", marginBottom: 10 }}>{props.food.description}</Text>}

                    {props.food.content && LsDisabledCheckBox && props.food.content.map((c, firstIndex) =>
                        <View key={c.id} style={{ marginVertical: 20 }}>
                            <Text style={{ fontWeight: "bold", fontSize: height * 0.025 }}>{c.name} (max. {c.maximum})</Text>

                            {c.content.map((c2, secondIndex) => <View key={c2.id} style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                                <CheckBox boxType={c.maximum === 1 ? "circle" : "square"} onCheckColor={"#ffc107"} onTintColor={"#ffc107"} tintColors={{ true: "#ffc107", false: "#ffc107" }}
                                    animationDuration={0.3} onAnimationType={"bounce"} offAnimationType={"bounce"}
                                    disabled={!c2.isAvailable ? true : LsDisabledCheckBox[firstIndex] && LsDisabledCheckBox[firstIndex][secondIndex]}
                                    value={LsCheckBox[firstIndex] ? LsCheckBox[firstIndex][secondIndex] : false}
                                    onChange={() => { canBeChecked(firstIndex, secondIndex, c2.price, c.maximum) }} />

                                <Text style={{ fontWeight: "bold", color: c2.isAvailable ? "black" : "grey", fontSize: height * 0.023, marginLeft: 10 }}>{c2.name} {c2.price > 0 && "(" + c2.price + "€)"} {!c2.isAvailable && "(" + "épuisé" + ")"}</Text>
                            </View>)}
                        </View>)}
                    <View style={{ width: "100%", alignItems: "center" }}>
                        <Text style={{ fontWeight: "bold", fontSize: height * 0.04, color: "grey" }}>{Price}€</Text>
                    </View>
                </ScrollView>
            </View>
        </SlidingUpPanel>

        {ShowBasketButton && <View style={{ zIndex: 3, position: "absolute", bottom: Platform.OS === "ios" ? 30 : 20, height: 50, width: "100%", alignItems: "center" }}>
            <View style={{ flex: 1, width: "50%", flexDirection: "row", borderRadius: 30, backgroundColor: "#eeeeee" }}>
                <TouchableOpacity activeOpacity={0.7} style={{ flex: 1, borderTopLeftRadius: 30, borderBottomLeftRadius: 30, justifyContent: "center", alignItems: "center", backgroundColor: "#ffc107" }}
                    onPress={() => addRemoveFood("-")}>
                    <Text style={{ fontWeight: "bold", fontSize: 30 }}>-</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontWeight: "bold", fontSize: 30 }}>{Number}</Text>
                </View>
                <TouchableOpacity activeOpacity={0.7} style={{ flex: 1, borderTopRightRadius: 30, borderBottomRightRadius: 30, justifyContent: "center", alignItems: "center", backgroundColor: "#ffc107" }}
                    onPress={() => addRemoveFood("+")}>
                    <Text style={{ fontWeight: "bold", fontSize: 30 }}>+</Text>
                </TouchableOpacity>
            </View>
        </View>}
    </> : <></>
}
export default FoodInfos

const styles = StyleSheet.create({
    panel: {
        zIndex: 2,
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20
    }
})