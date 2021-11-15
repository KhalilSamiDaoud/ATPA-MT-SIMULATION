import { fullParse, findCenter, trimStreetNames, getQueueFromJSON, getStartTime } from './parseInput.js';
import { initMode, initEventEntry, APIColumns, APIURL, APIFunctions } from './constants.js';
import { initSimulation, stopSimulation, currMode, startSimulation } from './main.js';
import { vehicles, isAllDepot } from './vehicleList.js';
import { initEvent, bookingEvent } from './log.js';
import { rebuildStats } from './statisticsList.js';
import { drawMaterial } from './barChart.js';
import { initClock } from './clock.js';

let tripListObjTrimed;
let reloadClock;
let newCenter;

async function APIinit(date = '10/29/2021') {
        await fetch(APIURL + APIFunctions.getTrips + date)
            .then(response => response.json())
            .then(data => {
                if (data.triplist.length == 0) {
                    initEvent(initEventEntry.APIempty);
                    initSimulation(initMode.test);
                    return;
                }

                tripListObjTrimed = trimStreetNames(data.triplist, APIColumns);
                newCenter = findCenter(tripListObjTrimed, APIColumns);

                stopSimulation(true);
                fullParse(tripListObjTrimed, APIColumns, true);
                initSimulation(initMode.API, newCenter);
                startReloadClock();

                //update global vars & booking page
                window.tripList = tripListObjTrimed;

                if (window.bookingPageRef)
                    window.bookingPageRef.updateTripList;
        });
}

async function bookingAPI(trip) {
    try {
        await fetch(APIURL + APIFunctions.newTrip, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(trip)
        })
            .then(response => response.json())
            .then(data => {
                stopSimulation(true);

                vehicles.forEach(vehicle => {
                    vehicle.queue = [];
                });

                getQueueFromJSON(data.triplist, APIColumns, true);
                tripListObjTrimed = data.triplist;

                vehicles.forEach(vehicle => {
                    vehicle.updateQueue();
                    vehicle.updateCashe(vehicle.queue);
                    vehicle.correctPosition();
                });

                startSimulation(false);
                bookingEvent(true);

                //update global vars & booking page
                window.tripList = data.triplist;
                window.bookingPageRef.processing = false;

                if (window.bookingPageRef)
                    window.bookingPageRef.updateTripList();
            });
    }
    catch(error) {
        bookingEvent(false);
        console.log('BOOKING API ERROR: ' + error);
        
        window.bookingPageRef.processing = false;
    }
}

function startReloadClock() {
    reloadClock = setInterval(() => {
        if (currMode != initMode.API) {
            reloadClock = clearInterval(reloadClock);
            return;
        }

        if (isAllDepot()) {
            stopSimulation(true);
            initClock(getStartTime(tripListObjTrimed, APIColumns));

            vehicles.forEach(vehicle => {
                vehicle.correctPosition();
            });

            startSimulation(false);

            rebuildStats();
            drawMaterial();

            if (window.bookingPageRef)
                window.bookingPageRef.updateTripList();
        }
    }, 5000);
}

export { APIinit, bookingAPI };