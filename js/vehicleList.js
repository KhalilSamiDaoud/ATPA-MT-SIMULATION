import { vehicleIDletter, colors, fixedStopLoopsDC} from './constants.js';
import { Vehicle } from './vehicle.js';
import { Trip } from './trip.js';

var vehicles = [];

//for testing only 
function populateRandVehicles(fleetSize) {
    let names = [];
    clearVehicles();

    while (names.length < fleetSize) {
        let newName = (Math.floor(Math.random() * 3) + 1) + vehicleIDletter[Math.floor(Math.random() * vehicleIDletter.length)];

        if (!names.includes(newName))
            names.push(newName);
    }

    for (var i = 0; i < fleetSize; i++) {
        let capacity = Math.floor(Math.random() * (15 - 8)) + 8;

        vehicles.push(new Vehicle(names[i], capacity, colors[i], 5, convertToTrips(fixedStopLoopsDC[i])));
    }
}

//for testing only 
function convertToTrips(jsonList) {
    let tripList = [];

    if (jsonList != undefined) {
        jsonList.forEach(entry => {
            tripList.push(new Trip(entry.name, entry.type, entry.PUcoords, entry.DOcoords, entry.PUadr, entry.DOadr, entry.travelTime, entry.idleTime, 0, 0, 0, 0, entry.booked));
        });
    }

    return tripList
}

function createVehicle(VehID, VehCap, startTime) {
    let veh = new Vehicle(VehID, VehCap, colors[vehicles.length], startTime);
    vehicles.push(veh);
}

function clearVehicles() {
    vehicles.forEach( vehicle => {
        vehicle.stopDispatch();
    });
    vehicles = [];
}

function sortVehicleList() {
    vehicles.sort(vehicleStartTimeCompare);
}

function vehicleStartTimeCompare(a, b) {
    if (a.startTime < b.startTime)
        return -1;
    else if (a.startTime > b.startTime)
        return 1;
    else
        return 0;
}

function isAllDepot() {
    for (let i=0; i < vehicles.length; i++) {
        if(!vehicles[i].isFinished())
            return false;
    }
    return true;
}

export { populateRandVehicles, createVehicle, clearVehicles, sortVehicleList, isAllDepot, vehicles };