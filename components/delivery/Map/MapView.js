import React, { useState, useRef, useEffect } from "react"
import { StyleSheet, Dimensions, Linking, View, Alert, Platform, Keyboard, Modal, Image } from "react-native";
import { MAPBOX_ACCESSTOKEN } from "@env"
import MapboxGL from "@react-native-mapbox-gl/maps";
import Logger from '@react-native-mapbox-gl/maps/javascript/utils/Logger';
import MapboxDirectionsFactory from "@mapbox/mapbox-sdk/services/directions";
import * as turf from "@turf/turf";

// Configure Mapbox access token
MapboxGL.setAccessToken(MAPBOX_ACCESSTOKEN);
var directionsClient = MapboxDirectionsFactory({ accessToken: MAPBOX_ACCESSTOKEN });

// edit logging messages
Logger.setLogCallback(log => {
    const { message } = log;

    // expected warnings
    if (message.match('Request failed due to a permanent error: Canceled')
        || message.match('Request failed due to a permanent error: Socket Closed')
        || message.includes('MGLIdeographsRasterizedLocally')
        || message.includes('eglSwapBuffer')
        || message.includes('{Thread-8}[Style]'))
        return true;
    return false;
});

var firstTimeGotHisLoc = true
var userLocation = [0, 0]
var mapDragging = false

// current direction
var route
var mode = "driving-traffic"
var routeDirectionProperties //= { "coordinates": [[7.747157, 48.549998], [7.746996, 48.549881], [7.746987, 48.549817], [7.746878, 48.54974], [7.747444, 48.549472], [7.747632, 48.549383], [7.74781, 48.549298], [7.747888, 48.54926], [7.747994, 48.549208], [7.748519, 48.548955], [7.748988, 48.548729], [7.74914, 48.548659], [7.749025, 48.548585], [7.748333, 48.548096], [7.748263, 48.548044], [7.74806, 48.547896], [7.747884, 48.547767], [7.747823, 48.547723], [7.747539, 48.547515], [7.74732, 48.547395], [7.747221, 48.547345], [7.747168, 48.547348], [7.747116, 48.547339], [7.747073, 48.547319], [7.747042, 48.54729], [7.746903, 48.54729], [7.746639, 48.547328], [7.744307, 48.548052], [7.744219, 48.548079], [7.74425, 48.548121], [7.744273, 48.548153], [7.745051, 48.549277], [7.74629, 48.548942], [7.746469, 48.548895], [7.747036, 48.54875], [7.747169, 48.548715], [7.747183, 48.548713], [7.747232, 48.548712], [7.747277, 48.548725], [7.747338, 48.54876], [7.747399, 48.548815]], "distance": 1024.724, "duration": 198.977 }
var totalTime

const MapView = ({ navigation }) => {
    const map = useRef()

    const camera = useRef()
    const [FollowUser, setFollowUser] = useState(false)
    const [NavigationMode, setNavigationMode] = useState("normal")
    // const [Destination, setDestination] = useState()
    // const [TraveledRoute, setTraveledRoute] = useState()
    // const [RemainingRoute, setRemainingRoute] = useState()
    // const [RemainingTime, setRemainingTime] = useState()
    // const [RemainingDistance, setRemainingDistance] = useState()
    const [ContentInset, setContentInset] = useState([0, 0, 0, 0])
    const [ShowGoBackButton, setShowGoBackButton] = useState(false)
    const [WebsocketIsOpen, setWebsocketIsOpen] = useState(false)

    function wsConnection() {
        ws = new WebSocket("ws://192.168.0.15:4000")

        ws.onerror = () => {
            setWebsocketIsOpen(false)
            setTimeout(() => {
                wsConnection()
            }, 1000);
        };

        ws.onopen = () => {
            var waitForWebsocketsData = setInterval(() => {
                if (userLocation[0] !== 0 && userLocation[1] !== 0) {
                    // ws.send(JSON.stringify({})
                    setWebsocketIsOpen(true)
                    clearInterval(waitForWebsocketsData)
                }
            }, 100);
        };

        ws.onclose = () => {
            setWebsocketIsOpen(false)
        };

        ws.onmessage = (e) => {
            // manageOperation(JSON.parse(e.data))
        };
    }

    async function goBackToHisLoc() {
        if (userLocation) {
            setFollowUser(false)
            mapDragging = false

            camera.current.setCamera({
                centerCoordinate: userLocation,
                zoomLevel: NavigationMode === "course" ? 17 : 16,
                pitch: NavigationMode === "course" ? 50 : 1,
                heading: 0,
                animationDuration: 1000,
            })

            setTimeout(async () => {
                // if the user didn't drag the map in the meanwhile
                if (!mapDragging) {
                    NavigationMode === "course" ? setContentInset([400, 0, 0, 0]) : setContentInset([0, 0, 0, 0])
                    setFollowUser(true)
                }
            }, 1000);
        }
    }

    // Called every time the position changed by 10m
    function positionChanged(new_location) {
        userLocation = [new_location.coords.longitude, new_location.coords.latitude]

        if (route) {
            updateRouteInfos()

            // the user arrived at his destination
            if (turf.distance(turf.point(userLocation), turf.point(routeDirectionProperties.coordinates[routeDirectionProperties.coordinates.length - 1])) < 0.02)
                resetRouting()
            // the user leaves the itinerary by minimum 50m, we calcul a new itinerary
            else if (turf.pointToLineDistance(turf.point(userLocation), turf.lineString(routeDirectionProperties.coordinates)) >= 0.05)
                getRoute(Destination)
        }

        if (firstTimeGotHisLoc) {
            goBackToHisLoc()
            firstTimeGotHisLoc = false
        }

        if (WebsocketIsOpen)
            ws.send(JSON.stringify({ operation: "MODIFY", tag: "users", obj: { id: myId, coordinates: userLocation } }))
    }

    // When the map is dragging by our finger
    function onMapDragging() {
        setShowGoBackButton(true)
        setFollowUser(false)
        mapDragging = true
        return true
    }

    return <View style={{ flex: 1 }}>
        {/* onMoveShouldSetResponder => when we drag the map */}
        <View style={{ flex: 1 }} onMoveShouldSetResponder={() => onMapDragging()} >
            <MapboxGL.MapView ref={map} style={{ flex: 1 }} styleURL={"mapbox://styles/gokugen/ck87eb9uv07w81jtab4dlpsbj"}
                localizeLabels
                compassEnabled={false}
                onPress={() => { Keyboard.dismiss(); setShowParameters(true) }}
                contentInset={ContentInset}>

                {/* <MapboxGL.Images images={{ greenspot, yellowspot, orangespot, redspot }} /> */}

                <MapboxGL.Camera ref={camera} followUserLocation={FollowUser} followUserMode={NavigationMode}
                    followZoomLevel={NavigationMode === "course" ? 17 : 16}
                    followPitch={NavigationMode === "course" ? 50 : 1} />

                <MapboxGL.UserLocation showsUserHeadingIndicator renderMode={"native"} androidRenderMode={NavigationMode === "course" ? "gps" : "compass"}
                    onUpdate={(e) => positionChanged(e)} minDisplacement={0} />

                {/* <RenderUsers users={Users} selectedUser={SelectedUser} setSelectedUser={setSelectedUser} setShowUserModalCallout={setShowUserModalCallout} />
                <RenderParkings parkings={Parkings} selectedParking={SelectedParking} setSelectedParking={setSelectedParking}
                    setCameraDestination={setCameraDestination} onMapDragging={onMapDragging} setShowParkingModalCallout={setShowParkingModalCallout} />
                <RenderSpots spots={Spots} selectedSpot={SelectedSpot} setSelectedSpot={setSelectedSpot} myId={myId}
                    setShowSpotModalCallout={setShowSpotModalCallout} setCameraDestination={setCameraDestination} onMapDragging={onMapDragging}
                    choosenRemainingTime={ChoosenRemainingTime} destination={Destination} /> */}

                {/* {TraveledRoute && RemainingRoute && <RenderRoute mode={mode} traveledRoute={TraveledRoute} remainingRoute={RemainingRoute} />} */}

            </MapboxGL.MapView>
        </View>
    </View>
}
export default MapView

const styles = StyleSheet.create({

})