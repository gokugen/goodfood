import http from "./http"

export default {
    // authentification
    signin: (user) => http.post("/signin", user),
    signup: (user) => http.post("/signup", user),
    signin_apple: (data) => http.post("/signin-apple", data),
    signin_gmail: (idToken) => http.post("/signin-gmail", idToken),

    // users
    whoami: () => http.get("/users/whoami"),
    edit: (data) => http.patch("/users", data),
    get_users: () => http.get("/users"),
    get_user: (id) => http.get(`/users/${id}`),
    send_notification: (id, data) => http.post(`/users/${id}/notify`, data),

    get_restaurants: () => http.get("/restaurants/", { params: { verified: true } }),
    get_restaurant: (id) => http.get(`/restaurants/${id}/`),

    payment_intent: (data) => http.post("/payment-intent", data),
    // orders
    create_order: (id, data) => http.post(`/restaurants/${id}/orders`, data),
    get_orders: () => http.get("/users/orders"),
    edit_order: (id, data) => http.patch(`/orders/${id}`, data),

    reset_password: (email) => http.post("/users/reset-password", email)
};