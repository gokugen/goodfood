/**
 * @format
 */

import React from "react";
import 'expo-asset';
import { AppRegistry } from "react-native";
import App from "./App";

import { createStore } from "redux"
import { Provider } from "react-redux"
import rootReducer from "./redux"
export const redux_store = createStore(rootReducer)

// set default FontFamilly
import { setCustomText } from 'react-native-global-props';
const customTextProps = {
    style: {
        fontFamily: "Montserrat-Bold",
    }
}
setCustomText(customTextProps);

const Root = () => (
    <Provider store={redux_store}>
        <App />
    </Provider>
)

AppRegistry.registerComponent("main", () => Root);