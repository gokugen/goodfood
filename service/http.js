import axios from "axios";
import store from './store';

const http = axios.create({
    baseURL: "https://good-food.fr:8083/api", // "http://10.167.128.132:8083/api", // "http://192.168.0.15:8083/api" api's link
    headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use(
    function (config) {
        const token = store.getToken();
        if (token)
            config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

http.interceptors.response.use(
    function (response) {
        // if (response.status == 403)
        //     localStorage.clear()
        return response;
    },
    function (error) {
        return Promise.reject(error);
    }
);

export default http;