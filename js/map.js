import { dashedLineSymbol, stopSVG, depotSVG, dropoffSVG, pickupSVG, carVehicleSymbol, busVehicleSymbol } from './constants.js';
import { isStatsPoped } from './statisticsList.js';
import { PersonMarker } from './personMarker.js';
import { isQueuePoped } from './tripQueue.js';
import { vehicles } from './vehicleList.js';
import { timeToString } from './clock.js';
import { drawPath } from './settings.js';
import { isLogPoped } from './log.js';

var map;
var mapCenter;

let depotIcon;

function initMap(area) {
    if (depotIcon)
        depotIcon = undefined;
        
    mapCenter = area;

    map = new google.maps.Map(document.getElementById('map'), {
        center: area,
        navigationControl: false,
        disableDefaultUI: true,
        draggableCursor: 'default',
        scrollwheel: true,
        draggable: true,
        focusable: false,
        zoom: 12,
        styles: [
            {
                "featureType": "all",
                "elementType": "all",
                "stylers": [
                    {
                        "hue": "#e7ecf0"
                    }
                ]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "saturation": "-66"
                    }
                ]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "saturation": "-53"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "all",
                "stylers": [
                    {
                        "saturation": -70
                    }
                ]
            },
            {
                "featureType": "transit",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "simplified"
                    },
                    {
                        "saturation": -60
                    }
                ]
            }
        ]
    });

    const centerControlDiv = document.createElement("div");
    CenterControl(centerControlDiv, map);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(centerControlDiv);
}

function createVehicleIcon(vehicle) {
    let isBus = (vehicle.stops.length > 0) ? true : false;

    let vehicleSymbol = new google.maps.Marker({
        path: (isBus) ? busVehicleSymbol : carVehicleSymbol,
        strokeColor: vehicle.color.hex,
        strokeOpacity: 1,
        fillColor: vehicle.color.hex,
        fillOpacity: 1,
        scale: (isBus) ? 0.075 : 0.2,
        strokeWeight: 1,
        rotation: (isBus) ? -90 : 0,
        anchor: (isBus) ? new google.maps.Point(170, 95) : new google.maps.Point(50, 50)
    });

    vehicle.symbol = vehicleSymbol;
}

function drawStaticIcons() {
    let stops;
    let isUnique = true;
    let uniqueStops = [];

    vehicles.forEach(vehicle => {
        stops = vehicle.getFixedStopCoordList();

        const busPath = new google.maps.Polyline({
            path: stops,
            geodesic: true,
            scale: 1,
            strokeColor: vehicle.color.hex,
            strokeWeight: 2
        });

        busPath.setMap(map);

        if (stops.length != 0)
            stops.forEach(stop => {
                isUnique = true;

                for (let i = 0; i < uniqueStops.length; i++) {
                    if (JSON.stringify(uniqueStops[i]) === JSON.stringify(stop)) {
                        isUnique = false;
                        break;
                    }
                }

                if(isUnique) {
                    new google.maps.Marker({
                        position: stop,
                        icon: {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(stopSVG),
                            scaledSize: new google.maps.Size(30, 30),
                            anchor: new google.maps.Point(15, 27)
                        },
                        map
                    });

                    uniqueStops.push(stop);
                }
            });

        if (vehicle.queue.length != 0)
            for (var i = 0; i < vehicle.queue.length; i++) {
                if (vehicle.tripIsDepot(i) && !depotIcon) {
                    depotIcon = new google.maps.Marker({
                        position: vehicle.queue[i].DOcoords,
                        icon: {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(depotSVG),
                            scaledSize: new google.maps.Size(40, 40)
                        },
                        map
                    });
                    break;
                }
            }
    });
}

function createIcon(vehicle, index, icon) {
    return new google.maps.Marker({
        position: vehicle.queue[index].DOcoords,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(icon.replace('{{ color }}', vehicle.color.hex)),
            scaledSize: new google.maps.Size(25, 25),
        },
        map
    });
}

function drawNextNIcons(vehicle, n) {
    let marker;
    let index = vehicle.pos;
    let currTrip;

    while (vehicle.markers.length < n) {
        currTrip = vehicle.queue[index];

        if (index >= vehicle.queue.length)
            break;

        if (vehicle.tripIsPickup(index)) {
            if(vehicle.tripIsBooked(index)) {
                marker = new PersonMarker(currTrip.name, vehicle.color, currTrip.DOcoords,
                    null, timeToString(currTrip.startTime), null);
            }
            else {
            marker = createIcon(vehicle, index, pickupSVG);
            marker.setMap(map);
            }

            vehicle.drawnTo = index;
            vehicle.markers.push(marker);
        }
        else if (vehicle.tripIsDropoff(index)) {
            if(vehicle.tripIsBooked(index)) {
                marker = new PersonMarker(currTrip.name, vehicle.color, null,
                    currTrip.DOcoords, null,  timeToString(currTrip.startTime));
            }
            else {
                marker = createIcon(vehicle, index, dropoffSVG);
                marker.setMap(map);
            }

            vehicle.drawnTo = index;
            vehicle.markers.push(marker);
        }
        index++;
    }
}

function drawNextIcon(vehicle, n) {
    if (!vehicle.tripIsFixedStop(vehicle.pos)) {
        let marker;
        let index = (vehicle.drawnTo + 1);
        let currTrip;

        removeCurrIcon(vehicle);

        while (vehicle.markers.length < n) {
            currTrip = vehicle.queue[index];

            if (index >= vehicle.queue.length)
                break;

            if (vehicle.tripIsPickup(index)) {
                if(vehicle.tripIsBooked(index)) {
                    marker = new PersonMarker(currTrip.name, vehicle.color, currTrip.DOcoords,
                        null, timeToString(currTrip.startTime), null);
                }
                else {
                marker = createIcon(vehicle, index, pickupSVG);
                marker.setMap(map);
                }

                vehicle.drawnTo = index;
                vehicle.markers.push(marker);
            }
            else if (vehicle.tripIsDropoff(index)) {
                if(vehicle.tripIsBooked(index)) {
                    marker = new PersonMarker(currTrip.name, vehicle.color, null,
                        currTrip.DOcoords, null,  timeToString(currTrip.startTime));
                }
                else {
                    marker = createIcon(vehicle, index, dropoffSVG);
                    marker.setMap(map);
                }

                vehicle.drawnTo = index;
                vehicle.markers.push(marker);
            }
            index++;
        }
    }
}

function removeCurrIcon(vehicle) {
    if (vehicle.markers.length != 0) {
        if (vehicle.markers[0] instanceof PersonMarker)
            vehicle.markers[0].removePersonMarkers();
        else 
            vehicle.markers[0].setMap(null);

        vehicle.markers.shift();
    }
}

function drawTripPath(vehicle) {
    if (vehicle.stops.includes(vehicle.queue[vehicle.pos])) {
        vehicle.path = new google.maps.Polyline({
            path: [vehicle.queue[vehicle.pos].PUcoords, vehicle.queue[vehicle.pos].DOcoords],
            geodesic: true,
            strokeColor: '#4285F4',
            strokeOpacity: 1.0,
            strokeWeight: 3,
            icons: [
                {
                    //draw nothing
                },
                {
                    icon: vehicle.symbol,
                    offset: vehicle.mapOffset + '%'
                },
            ]
        });
    }
    else {
        vehicle.path = new google.maps.Polyline({
            path: [vehicle.queue[vehicle.pos].PUcoords, vehicle.queue[vehicle.pos].DOcoords],
            geodesic: true,
            strokeOpacity: 0,
            icons: [
                (drawPath) ?
                {
                    icon: dashedLineSymbol,
                    offset: '0%',
                    repeat: '20px'
                } :
                {
                    //draw nothing
                },
                {
                    icon: vehicle.symbol,
                    offset: vehicle.mapOffset + '%'
                }
            ]
        });
    }
}

function checkMapResize() {
    let mapDiv = document.getElementById('map');

    if (isQueuePoped())
        mapDiv.classList.add('map-extend-left');
    else
        mapDiv.classList.remove('map-extend-left');

    if (isLogPoped() && isStatsPoped())
        mapDiv.classList.add('map-extend-right');
    else
        mapDiv.classList.remove('map-extend-right');

    if(isQueuePoped() && isLogPoped() && isStatsPoped()) {
        mapDiv.classList.add('map-extend-full');
        document.getElementById('centerbtn').classList.add('gmap-centerdiv-noradius');
        document.getElementById('clockbar').classList.add('clock-bar-full');
    }
    else {
        mapDiv.classList.remove('map-extend-full');
        document.getElementById('centerbtn').classList.remove('gmap-centerdiv-noradius');
        document.getElementById('clockbar').classList.remove('clock-bar-full');
    }
}


function CenterControl(controlDiv, map) {
    const controlUI = document.createElement("div");
    controlUI.classList.add('gmap-centerdiv');
    controlUI.classList.add('tooltipped');
    controlUI.title = "Click to recenter the map";

    controlUI.setAttribute('id', 'centerbtn');
    controlUI.setAttribute('data-position', 'bottom');
    controlUI.setAttribute('data-tooltip', 'Center map');
    controlDiv.appendChild(controlUI);

    const controlText = document.createElement("div");
    controlUI.classList.add('gmap-centericon');
    controlText.innerHTML = '<i class="material-icons white-text" style="font-size:42px;">filter_center_focus</i>';
    controlUI.appendChild(controlText);

    controlUI.addEventListener("click", () => {
        map.setCenter(mapCenter);
        map.setZoom(12);
    });
}

export { initMap, checkMapResize, drawTripPath, drawNextIcon, drawNextNIcons, drawStaticIcons, 
        createVehicleIcon, removeCurrIcon, map, mapCenter };