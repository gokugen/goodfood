import React, { useState, useRef } from "react";
import { StyleSheet, StatusBar, Platform, Dimensions, KeyboardAvoidingView, ScrollView, SafeAreaView, TouchableWithoutFeedback, TouchableOpacity, View, Text, Alert, TextInput, Modal } from "react-native";
import { AppleButton, appleAuth } from "@invertase/react-native-apple-authentication";
import { GoogleSignin, GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { MaterialIndicator } from 'react-native-indicators';
import { translate } from "../languages";
const strings = translate.strings
import { api, store } from "../service"

var { height, width } = Dimensions.get('window');

const SingUp = ({ navigation }) => {
    const inputName = useRef()
    const inputEmail = useRef()
    const inputPassword = useRef()
    const inputPasswordVerify = useRef()

    const [Name, setName] = useState()
    const [Email, setEmail] = useState()
    const [Password, setPassword] = useState()
    const [PasswordVerify, setPasswordVerify] = useState("")

    const [ModalNameModalVisible, setModalNameModalVisible] = useState(false)
    const [ModalLoadingVisible, setModalLoadingVisible] = useState(false)

    async function loadInfos(data) {
        try {
            await store.setToken(data.token)

            var res = await api.whoami()
            await store.setId(res.data._id)
            store.setEmail(res.data.email)
            store.setFavorites(JSON.stringify(res.data.favorites))
            store.setBasket(JSON.stringify({}))
            res.data.name && store.setName(res.data.name)
            res.data.expo_token && store.setExpoToken(res.data.expo_token)
            res.data.address && store.setAddress(JSON.stringify(res.data.address))

            setModalLoadingVisible(false)
            if (!res.data.name)
                setModalNameModalVisible(true)
            else
                navigation.replace("Tabs")
        } catch (err) {
            console.log(err)
            setModalLoadingVisible(false)
        }
    }

    async function signUp() {
        try {
            setModalLoadingVisible(true)
            var user = {}

            if (Name)
                user["name"] = Name
            else
                throw "Veuillez renseigner votre prénom."

            if (Email?.length > 6 && Email?.includes("@") && Email?.includes("."))
                user["email"] = Email.toLowerCase().replace(" ", "")
            else
                throw strings.email_incorrect

            if (Password === PasswordVerify) {
                if (Password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/))
                    user["password"] = Password
                else
                    throw strings.password_must_contain
            }
            else
                throw strings.password_not_match

            await api.signup(user)
            var res = await api.signin({ email: user.email, password: user.password })
            loadInfos(res.data)
        }
        catch (error) {
            if (typeof error === "string")
                Alert.alert(
                    error,
                    [
                        { text: "Ok", onPress: () => { }, style: strings.cancel },
                    ],
                    { cancelable: false }
                )
            else
                console.log(error)
            setModalLoadingVisible(false)
        }
    }

    async function onGoogleButtonPress() {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            setModalLoadingVisible(true)
            var res = await api.signin_gmail({ idToken: userInfo.idToken })

            loadInfos(res.data)
        } catch (err) {
            console.log(err)
            setModalLoadingVisible(false)
        }
    }

    async function onAppleButtonPress() {
        try {
            // performs login request
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
            });
            const { identityToken } = appleAuthRequestResponse;

            if (identityToken) {
                setModalLoadingVisible(true)
                var res = await api.signin_apple(appleAuthRequestResponse)
                loadInfos(res.data)
            }
        }
        catch (error) {
            console.log(error)
            setModalLoadingVisible(false)
        }
    }

    function renderNameModal() {
        return <Modal visible={ModalNameModalVisible} animationType="slide" transparent>
            <TouchableWithoutFeedback accessible={false}>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <TouchableWithoutFeedback accessible={false}>
                        <View style={styles.modalView}>
                            <Text style={{ fontSize: height * 0.024, fontWeight: "bold", textAlign: "center" }}>Renseignez votre prénom pour vos commandes</Text>

                            <TextInput style={{ height: height * 0.12, ...styles.input, marginTop: 0, fontWeight: "bold" }} placeholder={"Nom"} placeholderTextColor={"grey"} onChangeText={(text) => setName(text)} />

                            <TouchableOpacity activeOpacity={0.7} style={{ justifyContent: "center", alignItems: "center", height: height * 0.08, width: "70%", backgroundColor: "orange", borderRadius: 20, }}
                                onPress={() => api.edit({ name: Name }).then(() => {
                                    store.setName(Name)
                                    navigation.replace("Tabs")
                                }).catch(err => console.log(err))} >
                                <Text style={{ fontWeight: "bold", fontSize: height * 0.03, color: "white" }}>Envoyer</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback >
        </Modal >
    }

    return <SafeAreaView style={styles.container}>
        <Modal visible={ModalLoadingVisible} transparent>
            <MaterialIndicator size={100} color="orange" />
        </Modal>
        {renderNameModal()}
        <View style={{ height: Platform.OS === "ios" ? height * 0.7 : height * 0.8, justifyContent: "flex-end", alignItems: "center", padding: 20 }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ backgroundColor: "transparent" }} keyboardVerticalOffset={Platform.OS === "ios" ? 30 : -30}>
                <Text style={{ fontSize: 30, fontWeight: "bold", color: "white" }}>{strings.signup}</Text>

                <TextInput ref={inputName} style={styles.input} placeholderTextColor={"grey"} placeholder="Name" onChangeText={text => setName(text)}
                    blurOnSubmit={false}
                    onsignUpEditing={() => inputPassword.current.focus()} />
                <TextInput ref={inputEmail} style={styles.input} placeholderTextColor={"grey"} placeholder="Email" onChangeText={text => setEmail(text)}
                    blurOnSubmit={false}
                    onsignUpEditing={() => inputPassword.current.focus()} />
                <TextInput ref={inputPassword} secureTextEntry style={styles.input} placeholderTextColor={"grey"} placeholder={strings.password}
                    onChangeText={text => setPassword(text)}
                    blurOnSubmit={false}
                    onsignUpEditing={() => inputPasswordVerify.current.focus()} />
                <TextInput ref={inputPasswordVerify} secureTextEntry style={styles.input} placeholderTextColor={"grey"} placeholder={strings.password} onChangeText={text => setPasswordVerify(text)} />
            </KeyboardAvoidingView>

            <TouchableOpacity activeOpacity={0.7} style={styles.bottomButton} onPress={() => signUp()}>
                <Text style={styles.bottomButtonText}>{strings.signup}</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", marginTop: 10 }}>
                <Text style={{ color: "white" }}>{strings.already_registred}</Text>
                <Text style={{ color: "white", textDecorationLine: "underline", marginLeft: 5 }} onPress={() => navigation.replace("SignIn")}>{strings.signin}</Text>
            </View>
        </View>

        <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.02 }}>
            <View style={{ justifyContent: "center", alignItems: "center", borderRadius: 20, marginBottom: 10, overflow: "hidden", height: 60 }}>
                {Platform.OS === "ios"
                    ? <AppleButton
                        buttonStyle={AppleButton.Style.WHITE}
                        buttonType={AppleButton.Type.SIGN_IN}
                        style={styles.otherSigninButton}
                        onPress={() => onAppleButtonPress()} />
                    : null}
            </View>

            {Platform.OS === "ios"
                ? <TouchableOpacity activeOpacity={0.7} style={{ justifyContent: "center", alignItems: "center", paddingLeft: width * 0.4, borderRadius: 20, overflow: "hidden", width: width - 100, backgroundColor: "white", height: height * 0.07 }} >
                    <GoogleSigninButton color={GoogleSigninButton.Color.Light} size={GoogleSigninButton.Size.Wide} style={{ margin: -5, borderRadius: 10, transform: [{ scale: 1.5 }], shadowOpacity: 0 }} onPress={() => onGoogleButtonPress()} />
                </TouchableOpacity>
                : <GoogleSigninButton color={GoogleSigninButton.Color.Light} size={GoogleSigninButton.Size.Wide} onPress={() => onGoogleButtonPress()} />}
        </View>
    </SafeAreaView>
}
export default SingUp

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "#ffc107"
    },
    text: {
        fontWeight: "bold",
        fontSize: 20,
        color: "white",
        marginBottom: 5,
        marginTop: 20
    },
    input: {
        width: width - 100,
        height: height * 0.08,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 10,
        fontSize: 17,
        fontWeight: "bold",
        marginTop: 20
    },

    otherSigninButton: {
        width: width - 100,
        height: height * 0.08,
    },

    bottomButton: {
        width: width - 100,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "orange",
        borderRadius: 20,
        marginTop: 20,
        padding: 10
    },
    bottomButtonText: {
        textAlign: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: 20,
        padding: 10
    },
    modalView: {
        width: width * 0.8,
        justifyContent: "center",
        alignItems: "center",
        padding: 15,
        backgroundColor: "white",
        borderRadius: 20,
        elevation: 5,
        shadowOpacity: 0.2,
        shadowOffset: {
            width: 2,
            height: 4
        },
        shadowColor: "black"
    }
});