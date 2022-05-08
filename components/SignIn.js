import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Dimensions, KeyboardAvoidingView, TouchableWithoutFeedback, SafeAreaView, View, Text, TouchableOpacity, TextInput, Modal, Alert } from "react-native";
import AndroidKeyboardAdjust from 'react-native-android-keyboard-adjust';
import Icon from "react-native-vector-icons/FontAwesome";
import { AppleButton, appleAuth } from "@invertase/react-native-apple-authentication";
import { GoogleSignin, GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { MaterialIndicator } from 'react-native-indicators';
import { showMessage } from "react-native-flash-message";
import { GOOGLE_CLIENT_ID } from "@env"
import { api, store } from "../service";
import { translate } from "../languages";
const strings = translate.strings

var { height, width } = Dimensions.get('window');

GoogleSignin.configure({
    scopes: ["email"], // what API you want to access on behalf of the user, default is email and profile
    webClientId: GOOGLE_CLIENT_ID, // client ID of type WEB for your server (needed to verify user ID and offline access)
    offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
});

const SignIn = ({ navigation }) => {
    const [Email, setEmail] = useState("")
    const [Password, setPassword] = useState("")
    const [Name, setName] = useState()

    const [ModalPasswordVisible, setModalPasswordVisible] = useState(false)
    const [ModalNameModalVisible, setModalNameModalVisible] = useState(false)
    const [ModalLoadingVisible, setModalLoadingVisible] = useState(false)

    useEffect(() => {
        if (Platform.OS === "android")
            AndroidKeyboardAdjust.setAdjustPan();
    }, [])


    async function loadInfos(data) {
        try {
            store.setToken(data.token)

            var res = await api.whoami()
            store.setId(res.data._id)
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

    async function signIn() {
        try {
            var user = {}

            if (Email?.length > 6 && Email?.includes("@") && Email?.includes("."))
                user["email"] = Email.toLowerCase().replace(" ", "")
            else
                throw strings.email_incorrect
            if (Password)
                user["password"] = Password
            else
                throw "Veuillez entrer un mot de passe"

            setModalLoadingVisible(true)
            var res = await api.signin(user)
            loadInfos(res.data)
        }
        catch (error) {
            console.log(error)
            setModalLoadingVisible(false)
            if (!error.message)
                Alert.alert(
                    error,
                    "",
                    [
                        { text: "Ok", onPress: () => { }, style: "cancel" },
                    ],
                    { cancelable: false }
                )
        }
    }

    async function onGoogleButtonPress() {
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            setModalLoadingVisible(true)
            var res = await api.signin_gmail({
                idToken: userInfo.idToken
            })

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

    function sendEmailCode() {
        api.reset_password({ email: Email.toLowerCase() }).catch(err => console.log(err))

        showMessage({
            type: "info",
            message: strings.see_your_spam,
            description: "",
            titleStyle: { fontWeight: "bold", textAlign: "center" },
            textStyle: { fontWeight: "bold", textAlign: "center" }
        })
    }

    function renderPaswordForgotModal() {
        return <Modal visible={ModalPasswordVisible} animationType="slide" transparent>
            <TouchableWithoutFeedback onPress={() => setModalPasswordVisible(false)} accessible={false}>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <TouchableWithoutFeedback accessible={false}>
                        <View style={styles.modalView}>
                            <Text style={{ fontSize: 20, fontWeight: "bold", textAlign: "center" }}>Email</Text>

                            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 }}>
                                <TextInput style={{ flex: 8, ...styles.input, marginTop: 0, height: 60, fontWeight: "bold" }} placeholder={"Email"} placeholderTextColor={"grey"} onChangeText={(text) => setEmail(text)} />
                                <TouchableOpacity activeOpacity={0.7} style={{ flex: 1, ...styles.bottomButton, padding: 15, margin: 0, marginTop: 0, marginLeft: 5, height: 60 }}
                                    onPress={() => {
                                        sendEmailCode()
                                        setModalPasswordVisible(false)
                                    }}>
                                    <Icon name={"send"} color="white" size={30} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    }

    function renderNameModal() {
        return <Modal visible={ModalNameModalVisible} animationType="slide" transparent>
            <TouchableWithoutFeedback accessible={false}>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <TouchableWithoutFeedback accessible={false}>
                        <View style={styles.modalNameView}>
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
        {renderPaswordForgotModal()}
        {renderNameModal()}
        <Modal visible={ModalLoadingVisible} transparent>
            <MaterialIndicator size={100} color="orange" />
        </Modal>
        <View style={{ flex: Platform.OS === "ios" ? 3 : 5, justifyContent: "flex-end", alignItems: "center", marginBottom: 50 }}>
            <View style={{ width: width - 100, alignItems: "center" }}>
                <Text style={{ fontSize: 30, fontWeight: "bold", color: "white" }}>{strings.signin}</Text>

                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ backgroundColor: "transparent" }} keyboardVerticalOffset={Platform.OS === "ios" ? 30 : -30}>
                    <TextInput style={styles.input} placeholderTextColor={"grey"} onChangeText={text => setEmail(text)} placeholder={"Email"} />
                    <TextInput secureTextEntry style={styles.input} placeholderTextColor={"grey"} onChangeText={text => setPassword(text)} placeholder={strings.password} />
                    <View style={{ width: width - 100, alignItems: "flex-end", marginTop: 5, marginRight: 10 }}>
                        <Text style={{ color: "white", textDecorationLine: "underline" }} onPress={() => setModalPasswordVisible(true)}>{strings.forgot_password}</Text>
                    </View>
                </KeyboardAvoidingView>

                <TouchableOpacity activeOpacity={0.7} style={{ ...styles.bottomButton }} onPress={() => signIn()}>
                    <Text style={styles.bottomButtonText}>{strings.signin}</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", marginTop: 10 }}>
                <Text style={{ color: "white" }}>{strings.not_registred}</Text>
                <Text style={{ color: "white", textDecorationLine: "underline", marginLeft: 5 }} onPress={() => navigation.replace("SignUp")}>{strings.signup}</Text>
            </View>
        </View>

        <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.02 }}>
            <View style={{ justifyContent: "center", alignItems: "center", borderRadius: 20, marginBottom: 10, overflow: "hidden", height: 60 }}>
                {Platform.OS === "ios"
                    ? <AppleButton
                        buttonStyle={AppleButton.Style.WHITE}
                        buttonType={AppleButton.Type.DEFAULT}
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
export default SignIn

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffc107"
    },
    input: {
        width: width - 100,
        height: height * 0.08,
        backgroundColor: "white",
        borderRadius: 20,
        marginTop: 20,
        padding: 10,
        fontSize: 17,
        fontWeight: "bold"
    },

    bottomButton: {
        marginTop: 50,
        width: width - 100,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "orange",
        borderRadius: 20,
        margin: 10,
        padding: 10
    },
    bottomButtonText: {
        textAlign: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: 20,
        padding: 10
    },

    otherSigninButton: {
        width: width - 100,
        height: height * 0.08,
    },

    modalView: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 20,
        margin: 20,
        paddingVertical: 20,
        paddingHorizontal: 10,
        elevation: 5,
        shadowOpacity: 0.2,
        shadowOffset: {
            width: 2,
            height: 4
        },
        shadowColor: "black"
    },
    modalNameView: {
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