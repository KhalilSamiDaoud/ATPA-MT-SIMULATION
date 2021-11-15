import { initCoords, initMode, initEventEntry, defaultTitle, testNotification, fileNotification, APINotification } from './constants.js';
import { createGeneralStats, createVehicleStats, clearGeneralStats, clearVehicleStats } from './statisticsList.js';
import { createTripTabs, createTripLists, clearTripTabs, clearTripLists } from './tripQueue.js';
import { initMap, createVehicleIcon, drawStaticIcons } from './map.js';
import { populateRandVehicles, vehicles } from './vehicleList.js';
import { APIinit, bookingAPI } from './APIinput.js';
import { startClock, stopClock } from './clock.js';
import { drawMaterial } from './barChart.js';
import { initEvent } from './log.js';
import { title } from './settings.js';

//window functions / vars for booking page
window.bookingPageRef = undefined;

window.bookingAPI = bookingAPI;

window.tripList = undefined;
window.clockTimeString = '';
window.clockTimeValue = 0;

const openBookingButton = document.getElementById('mockbooking');

openBookingButton.addEventListener('click', openBooking);

let currMode = initMode.none;
let prevInitalized = false;

function initSimulation(mode, coords = initCoords[0]) {
    currMode = mode;
    initMap(coords);

    if (prevInitalized) {
        clearTripTabs();
        clearTripLists();
        clearGeneralStats();
        clearVehicleStats()
        stopClock();
    }

    // !event
    switch (mode) {
        case initMode.test:
            populateRandVehicles(3);
            setHeaderTitle((title) ? title : defaultTitle);
            initEvent(initEventEntry.test);
            break;
        case initMode.file:
            setHeaderTitle((title) ? title : defaultTitle);
            initEvent(initEventEntry.file);
            break;
        case initMode.API:
            setHeaderTitle((title) ? title : defaultTitle);
            initEvent(initEventEntry.API);
            break;
        default:
            return;
    }
    createTripTabs();
    createTripLists();
    createGeneralStats();
    createVehicleStats();

    vehicles.forEach(vehicle => {
        vehicle.updateQueue();
        createVehicleIcon(vehicle);
        vehicle.autoDispatch();
    });

    drawStaticIcons();

    if (prevInitalized)
        materializeReload();
    else
        materializeInit();

    drawMaterial();
    startClock();

    if (!prevInitalized)
        prevInitalized = true;
}

async function startSequence() {
    try {
        await APIinit();
    }
    catch (err) {
        console.log(err);
        initEvent(initEventEntry.APIError);
        initSimulation(initMode.test);
    }
}

function stopSimulation(stopVehicles = false) {
    if(stopVehicles) {
        vehicles.forEach(vehicle => {
            vehicle.stopDispatch();
            vehicle.clearPath();
        });
    }

    stopClock();
}

function startSimulation(startVehicles = false) {
    if(startVehicles) {
        vehicles.forEach(vehicle => {
            vehicle.autoDispatch();
            vehicle.forceDispatch();
        });
    }

    startClock();
}

function materializeInit() {
    if (!prevInitalized) {
        $('.sidenav').sidenav();
        $('.preloader').fadeOut('slow');
        $('select').formSelect();
    }
    $('.modal').modal();
    $('.tooltipped').tooltip();
    $('#tabs').tabs();
}

function materializeReload() {
    materializeInit();
    $('#tabs').tabs().tabs('select', vehicles[0].name);
}

function setHeaderTitle(msg) {
    let specialMsg;

    switch(currMode) {
        case initMode.test:
            specialMsg = testNotification;
            break;
        case initMode.file:
            specialMsg = fileNotification;
            break;
        case initMode.API:
            specialMsg = APINotification;
            break;
    }

    document.getElementById('headertitle').firstChild.innerHTML = msg + specialMsg;
}

function openBooking() {
    window.bookingPageRef = window.open('http://localhost:8000/secret.html', 'Mock Booking Interface', '');
}

function main() {
    startSequence();
}

main();

export { stopSimulation, startSimulation, initSimulation, materializeInit, setHeaderTitle, currMode };