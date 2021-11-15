import * as simConst from '../constants.js';

const NOT_SET = new google.maps.LatLng(0, 0);

let map;
let busAnimation;

const pickupMarker = new google.maps.Marker({
    position: new google.maps.LatLng(0, 0),
    icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(simConst.pickupSVG.replace('{{ color }}', simConst.colors[9].hex)),
        scaledSize: new google.maps.Size(35, 35),
        anchor: new google.maps.Point(20, 20)
    },
    map
});

const dropoffMarker = new google.maps.Marker({
    position: new google.maps.LatLng(0, 0),
    icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(simConst.dropoffSVG.replace('{{ color }}', simConst.colors[9].hex)),
        scaledSize: new google.maps.Size(35, 35),
        anchor: new google.maps.Point(20, 20)
    },
    map
});

const tripPath = new google.maps.Polyline({
    path: [pickupMarker.position, dropoffMarker.position],
    geodesic: true,
    zIndex: 3,
    strokeOpacity: 0,
    strokeWeight: 1,
    strokeColor: '#ff9e80',
    icons: [
        {
            icon: simConst.dashedLineSymbol,
            offset: '50%',
            repeat: '20px'
        },
        {
            //place holder
        }
    ],
});

function initMap(center = simConst.initCoords[0]) {
    map = new google.maps.Map(document.getElementById("map"), {
        center: center,
        navigationControl: false,
        disableDefaultUI: true,
        draggableCursor: "default",
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

    const chipDiv = document.createElement("div");
    chipControl(chipDiv, map);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(chipDiv);
}

function chipControl(controlDiv) {
    const controlUI = document.createElement("div");
    controlUI.title = "Whats up?";

    controlDiv.appendChild(controlUI);

    const controlText = document.createElement("div");
    controlText.style.margin = "50px";
    controlText.style.marginRight = "125px";
    controlText.innerHTML =
        '<div class="chip white" style="position: absolute;"><i class="material-icons deep-orange-text" style="line-height:14px;">emoji_people</i>=  You</div>';
    controlUI.appendChild(controlText);
}

//event used by pick-up select in form
function setPickupMarker() {
    if(this.selectedIndex) {
        pickupMarker.setPosition(simConst.POIselectCoords[this.selectedIndex - 1]);
        pickupMarker.setMap(map);

        setMarkerPath();
    }
}

//event used by drop-up select in form
function setDropoffMarker() {
    if (this.selectedIndex) {
        dropoffMarker.setPosition(simConst.POIselectCoords[this.selectedIndex - 1]);
        dropoffMarker.setMap(map);

        setMarkerPath();
    }
}

function setMarkerPath() {
    if (!pickupMarker.getPosition().equals(NOT_SET) && !dropoffMarker.getPosition().equals(NOT_SET)) {
        tripPath.setPath([pickupMarker.getPosition(), dropoffMarker.getPosition()]);
        tripPath.setMap(map);
        animatePath();
    }
}

//event used by form
function clearMarkers() {
    pickupMarker.setMap(null);
    pickupMarker.setPosition(NOT_SET);
    dropoffMarker.setMap(null);
    dropoffMarker.setPosition(NOT_SET);
    tripPath.setMap(null);

    busAnimation = clearInterval(busAnimation);
}

function animatePath() {
    if(!busAnimation) {
        let count = 0;

        busAnimation = setInterval(() => {
            count = (count + 1) % 250;

            const icons = tripPath.get("icons");

            icons[0].offset = count / 2 + "%";
            tripPath.set("icons", icons);
        }, 20);
    }
}

function createVehicleIcon(vehicle) {
  let busSymbol = {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      strokeColor: '#424242',
      fillColor: '#424242',
    scale: 3.5,
    strokeWeight: 8,
    strokeOpacity: 1,
    anchor: new google.maps.Point(0, 0)
  }

  vehicle.symbol = busSymbol;
}

function drawTripPath(vehicle) {
    vehicle.path = new google.maps.Polyline({
      path: [vehicle.queue[vehicle.pos].PUcoords, vehicle.queue[vehicle.pos].DOcoords],
      geodesic: true,
      zIndex: 3,
      strokeOpacity: 0,
      icons: [
        {
          //PH
        },
        {
          icon: vehicle.symbol,
          offset: vehicle.mapOffset + '%'
        }],
    });
}

export { initMap, clearMarkers, setPickupMarker, setDropoffMarker, createVehicleIcon, drawTripPath, map };