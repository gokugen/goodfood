import React from "react"
import { StyleSheet, Dimensions, View } from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Badge } from 'react-native-elements'
import { connect } from "react-redux"

import Home from "./Home";
import Orders from "./Orders";
import Account from "./Account";

var { height } = Dimensions.get('window');
const Tab = createBottomTabNavigator();
const Tabs = (props) => {
    return <Tab.Navigator screenOptions={{ tabBarStyle: { height: Platform.OS === "ios" ? height * 0.11 : height * 0.1 } }}>
        <Tab.Screen name="Home" options={{
            headerShown: false,
            tabBarLabel: "",
            tabBarIcon: (param = { focused: boolean, color: string, size: number }) =>
                <Icon name={"home"} color={param.focused ? "#ffc107" : "#dddddd"} size={height * 0.047} style={{ marginTop: 10 }} />
        }} component={Home} />
        <Tab.Screen name="Orders" options={{
            headerShown: false,
            tabBarLabel: "",
            tabBarIcon: (param = { focused: boolean, color: string, size: number }) =>
                <>
                    <View>
                        <Icon name={"ticket"} color={param.focused ? "#ffc107" : "#dddddd"} size={height * 0.047} style={{ marginTop: 10 }} />
                        {props.nbNotifications > 0 && <Badge badgeStyle={{ height: 15, width: 15, borderRadius: 10 }} containerStyle={{ position: 'absolute', top: 10, right: -7 }} status="error" />}
                    </View>
                </>
        }} component={Orders} />
        <Tab.Screen name="Account" options={{
            headerShown: false,
            tabBarLabel: "",
            tabBarIcon: (param = { focused: boolean, color: string, size: number }) =>
                <Icon name={"user"} color={param.focused ? "#ffc107" : "#dddddd"} size={height * 0.047} style={{ marginTop: 10 }} />
        }} component={Account} />
    </Tab.Navigator>
}
const mapStateToProps = state => ({ nbNotifications: state.notifications })
export default connect(mapStateToProps)(Tabs)

const styles = StyleSheet.create({

})