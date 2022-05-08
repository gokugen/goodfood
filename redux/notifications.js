function notifications(state = 0, action) {
    switch (action.type) {
        case "SET_NOTIF":
            state = action.value
        default:
            return state
    }
}
export default notifications