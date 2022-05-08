import SyncStorage from "sync-storage";

export default {
    isLogged() {
        return SyncStorage.get("token") ? true : false;
    },

    setToken(str) {
        SyncStorage.set("token", str);
    },
    getToken() {
        return SyncStorage.get("token");
    },

    setId(str) {
        SyncStorage.set("id", str);
    },
    getId() {
        return SyncStorage.get("id");
    },

    setExpoToken(str) {
        SyncStorage.set("expo_token", str);
    },
    getExpoToken() {
        return SyncStorage.get("expo_token");
    },

    setEmail(str) {
        SyncStorage.set("email", str);
    },
    getEmail() {
        return SyncStorage.get("email");
    },

    setName(str) {
        SyncStorage.set("name", str);
    },
    getName() {
        return SyncStorage.get("name");
    },

    setAddress(str) {
        SyncStorage.set("address", str);
    },
    getAddress() {
        return SyncStorage.get("address");
    },

    setFavorites(str) {
        SyncStorage.set("favorites", str);
    },
    getFavorites() {
        return SyncStorage.get("favorites");
    },

    setNbNotifications(str) {
        SyncStorage.set("nb_notifications", str);
    },
    getNbNotifications() {
        return SyncStorage.get("nb_notifications") ? SyncStorage.get("nb_notifications") : 0;
    },

    setCountryCode(str) {
        SyncStorage.set("country_code", str);
    },
    getCountryCode() {
        return SyncStorage.get("country_code");
    },

    setBasket(str) {
        SyncStorage.set("basket", str);
    },
    getBasket() {
        return SyncStorage.get("basket");
    },

    setRestaurant(str) {
        SyncStorage.set("restaurant", str);
    },
    getRestaurant() {
        return SyncStorage.get("restaurant");
    },

    clear() {
        SyncStorage.getAllKeys().map(k => SyncStorage.remove(k))
    }
}