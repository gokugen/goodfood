import React, { useState, useRef, useEffect } from "react"
import { StyleSheet, View, Modal } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { MaterialIndicator } from 'react-native-indicators';
import PDFView from 'react-native-view-pdf';

const Invoice = ({ navigation, route }) => {
    const [ModalLoadingVisible, setModalLoadingVisible] = useState(true)

    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: route.params.item.number,
            headerLeft: () => <Icon style={{ paddingLeft: 10 }} onPress={() => navigation.goBack()} name={"chevron-left"} color="black" size={30} />
        })
    }, [])

    return <View style={{ flex: 1 }}>
        <Modal visible={ModalLoadingVisible} transparent>
            <MaterialIndicator size={100} color="#ffc107" />
        </Modal>
        <PDFView style={{ flex: 1 }}
            fadeInDuration={250.0}
            resourceType={"url"}
            resource={route.params.item.invoice}
            onLoad={() => setModalLoadingVisible(false)}
            onError={(error) => { console.log(error); navigation.goBack() }}
        />
    </View>
}
export default Invoice

const styles = StyleSheet.create({

})