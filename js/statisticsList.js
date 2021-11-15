import { calcAvgWait, calcPassengersServed, calcRevenueGenerated, incrementGeneralTrips, resetGeneralVals, fareRate } from './simMath.js';
import { createPopWindow, removePopWindow } from './popWindowList.js';
import { windowType } from './constants.js';
import { importFile } from './fileInput.js';
import { checkMapResize } from './map.js';
import { drawMaterial } from './barChart.js';
import { vehicles } from './vehicleList.js';

document.getElementById('popstats').addEventListener('click', popStats);

var statsWin = document;
let generalTable = statsWin.getElementById('generalstats').getElementsByTagName('tbody');
let vehicleTable = statsWin.getElementById('vehiclestats').getElementsByTagName('tbody');

function createGeneralStats() {
    let newRow;

    newRow = generalTable[0].insertRow(0);
    newRow.insertCell().appendChild(statsWin.createTextNode('Average requested-to-pickup Time:'));
    newRow.insertCell().appendChild(statsWin.createTextNode('. . .'));

    newRow = generalTable[0].insertRow(1);
    newRow.insertCell().appendChild(statsWin.createTextNode('MT Passengers Served:'));
    newRow.insertCell().appendChild(statsWin.createTextNode('. . .'));

    newRow = generalTable[0].insertRow(2);
    newRow.insertCell().appendChild(statsWin.createTextNode('Revenue Generated:'));
    newRow.insertCell().appendChild(statsWin.createTextNode('. . .'));
}

function createVehicleStats() {
    let vehicleCell;
    let vehicleIcon
    let newRow;
    let index = 0;

    vehicles.forEach(vehicle => {
        vehicleCell = document.createElement('a');
        vehicleCell.setAttribute('class', vehicle.color.class);
        vehicleCell.innerHTML = vehicle.name;

        vehicleIcon = document.createElement('i');
        vehicleIcon.setAttribute('class', 'material-icons left');
        vehicleIcon.innerHTML = (vehicle.stops.length > 0) ? 'directions_bus' : 'directions_car';

        vehicleCell.appendChild(vehicleIcon);

        newRow = vehicleTable[0].insertRow(index);
        newRow.insertCell().appendChild(vehicleCell);
        newRow.insertCell().appendChild(statsWin.createTextNode('...'));
        newRow.insertCell().appendChild(statsWin.createTextNode('...'));
        newRow.insertCell().appendChild(statsWin.createTextNode('...'));
        newRow.insertCell().appendChild(statsWin.createTextNode('...'));

        index++;
    });
}

function clearGeneralStats() {
    let new_tbody = statsWin.createElement('tbody');
    statsWin.getElementById('generalstats').replaceChild(new_tbody, generalTable[0]);

    resetGeneralVals();
}

function clearVehicleStats() {
    let new_tbody = statsWin.createElement('tbody');
    statsWin.getElementById('vehiclestats').replaceChild(new_tbody, vehicleTable[0]);
}

function rebuildStats() {
    clearGeneralStats();
    clearVehicleStats();
    createGeneralStats();
    createVehicleStats();
}

async function updateStatsList(newStats) {
    let editRow;
    let index = 0;

    while (index < newStats.length) {
        editRow = generalTable[0].rows[index];
        editRow.cells[1].replaceChild(statsWin.createTextNode(newStats[index]), editRow.cells[1].firstChild);
        index++;
    }
}

async function updateVehicleStats(vehicle) {
    let editRow = vehicleTable[0].rows[vehicles.indexOf(vehicle)];
    let index = 1;

    for (var key in vehicle.formattedStats) {
        editRow.cells[index].replaceChild(statsWin.createTextNode(vehicle.formattedStats[key]), editRow.cells[index].firstChild);
        index++;
    }
}

async function updateGeneralStats(trip) {
    incrementGeneralTrips();

    const tempStats = [
        await calcAvgWait(trip, true),
        await calcPassengersServed(trip),
        await calcRevenueGenerated(trip, true)
    ]

    updateStatsList(tempStats);
}

function getUserFare(evt) {
    let baseFeeInput = document.getElementById("basefee");
    let mileFeeInput = document.getElementById("feepermile");

    baseFeeInput.value = fareRate[2].base;
    mileFeeInput.value = fareRate[2].mile;
    M.updateTextFields();

    const instance = M.Modal.init(document.getElementById('modalfare'), { dismissible: false });
    instance.open();

    var handler = function () {
        fareRate[2].base = (baseFeeInput.value < 0 || baseFeeInput.value == '') ? fareRate[2].base : parseFloat(baseFeeInput.value);
        fareRate[2].mile = (mileFeeInput.value < 0 || mileFeeInput.value == '') ? fareRate[2].mile : parseFloat(mileFeeInput.value);

        document.getElementById("farebutton").removeEventListener("click", handler);
        importFile(evt);
    };

    document.getElementById("farebutton").addEventListener("click", handler);
}

function popStats() {
    if (!isStatsPoped()) {
        statsWin = createPopWindow(windowType.statistics, 'ERSA - Statistics');

        M.Tooltip.getInstance(document.getElementById('popstats')).destroy();

        document.getElementById('popstats').removeEventListener('click', popStats);
        statsWin.body.appendChild(document.getElementById('statspanel'));
        statsWin.getElementById('popstats').addEventListener('click', dockStats);
        statsWin.getElementById('statspanel').classList.toggle('panelwind');
        statsWin.getElementById('statspanel').children[1].classList.toggle('panelcontent');
        statsWin.getElementById('statspanel').children[1].children[0].classList.toggle('statpanelgraph');
        statsWin.getElementById('statspanel').children[1].children[1].classList.toggle('statpaneltable');
        statsWin.getElementById('vehiclestats').classList.toggle('responsive-table-text');
        statsWin.getElementById('vehiclestats').classList.toggle('responsive-table');
        statsWin.getElementById('vehiclestats').classList.toggle('centered');


        statsWin.getElementById('popstats').firstChild.innerHTML = 'exit_to_app';
        statsWin.getElementById('popstats').removeAttribute('style');
        statsWin.getElementById('popstats').setAttribute('data-tooltip', 'Dock');
        statsWin.getElementById('detailstats').style.display = 'none';
        document.getElementById('statsplaceholder').style.display = 'block';

        checkMapResize();
    }
}

function dockStats() {
    if (isStatsPoped()) {
        statsWin.defaultView.removeEventListener('beforeunload', dockStats);
        statsWin.getElementById('popstats').removeEventListener('click', dockStats);
        document.getElementById('statsplaceholder').before(statsWin.getElementById('statspanel'));
        document.getElementById('popstats').addEventListener('click', popStats);
        document.getElementById('statspanel').classList.toggle('panelwind');
        document.getElementById('statspanel').children[1].classList.toggle('panelcontent');
        document.getElementById('statspanel').children[1].children[0].classList.toggle('statpanelgraph');
        document.getElementById('statspanel').children[1].children[1].classList.toggle('statpaneltable');
        document.getElementById('vehiclestats').classList.toggle('responsive-table-text');
        document.getElementById('vehiclestats').classList.toggle('responsive-table');
        document.getElementById('vehiclestats').classList.toggle('centered');

        document.getElementById('popstats').firstChild.innerHTML = 'launch';
        document.getElementById('popstats').setAttribute('style', 'margin-right:10px;');
        document.getElementById('popstats').setAttribute('data-tooltip', 'Pop-out');
        document.getElementById('detailstats').style.display = 'block';
        document.getElementById('statsplaceholder').style.display = 'none';

        statsWin = removePopWindow(windowType.statistics);
        M.Tooltip.init(document.getElementById('detailstats'));
        M.Tooltip.init(document.getElementById('popstats'));
        drawMaterial();
        checkMapResize();
    }
}

function isStatsPoped() {
    return statsWin != document;
}

export { createGeneralStats, clearGeneralStats, clearVehicleStats, updateGeneralStats, isStatsPoped, getUserFare, 
    dockStats, createVehicleStats, updateVehicleStats, rebuildStats, statsWin };

