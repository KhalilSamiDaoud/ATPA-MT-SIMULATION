import { createPopWindow, removePopWindow } from './popWindowList.js';
import { vehStatus, windowType, tripType } from './constants.js';
import { vehicles } from './vehicleList.js';
import { materializeInit } from './main.js';
import { checkMapResize } from './map.js';
import { queueMode } from './settings.js';

document.getElementById('popqueue').addEventListener('click', popQueue);

var queueWin = document;

let autoQueueTimer;
let autoQueueLastChecked;

function createTripTabs() {
    let tabs = queueWin.getElementById('tabs');

    vehicles.forEach(vehicle => {
        //configure tab - List Item
        let newTab = queueWin.createElement('li');

        newTab.setAttribute('class', 'tab tooltipped');

        newTab.setAttribute('id', vehicle.name + 'tab')
        newTab.setAttribute('data-position', 'bottom');
        newTab.setAttribute('data-tooltip', 'Vehicle #' + vehicle.name);

        //configure tab - href
        let newTabhref = queueWin.createElement('a');

        if (vehicles.indexOf(vehicle) == 0)
            newTabhref.setAttribute('class', 'active');

        newTabhref.setAttribute('href', '#' + vehicle.name);

        //configure tab - icon

        let IDicon = queueWin.createElement('i');

        if (vehicle.status == vehStatus.route) {
            IDicon.innerHTML = (vehicle.stops.length > 0) ? 'directions_bus' : 'directions_car';
            IDicon.setAttribute('class', 'material-icons ' + vehicle.color.class);
        }
        else {
            IDicon.innerHTML = 'departure_board';
            IDicon.setAttribute('class', 'material-icons grey-text text-lighten-2');
        }

        IDicon.setAttribute('style', 'padding-top:12px');

        newTabhref.appendChild(IDicon);
        newTab.appendChild(newTabhref);
        tabs.appendChild(newTab);
    });

    //create 'unassigned' tab at the end
    let newTab = queueWin.createElement('li');
    newTab.setAttribute('class', 'tab');

    let newTabhref = queueWin.createElement('a');
    newTabhref.innerHTML = 'unassigned';
    newTabhref.setAttribute('href', '#unassigned');

    let IDicon = queueWin.createElement('i');
    IDicon.innerHTML = 'pending_actions';
    IDicon.setAttribute('class', 'material-icons yellow-text text-darken-2 right');
    IDicon.setAttribute('style', 'padding-top:12px');

    newTabhref.appendChild(IDicon);
    newTab.appendChild(newTabhref);
    tabs.appendChild(newTab);
}

function clearTripTabs() {
    M.Tabs.getInstance(queueWin.getElementById('tabs')).destroy();

    var tabs = queueWin.getElementById('tabs');

    while (tabs.firstChild) {
        tabs.removeChild(tabs.firstChild);
    }
}

function updateTripTab(vehicle) {
    let tab = queueWin.getElementById(vehicle.name + 'tab');
    let tabIcon = tab.getElementsByTagName('i')[0];

    tab.setAttribute('class', 'tab tooltipped');
    if (vehicle.status == vehStatus.route || vehicle.status == vehStatus.loop) {
        tabIcon.innerHTML = (vehicle.stops.length > 0) ? 'directions_bus' : 'directions_car';
        tabIcon.setAttribute('class', 'material-icons ' + vehicle.color.class);
    }
    else {
        tabIcon.innerHTML = 'departure_board';
        tabIcon.setAttribute('class', 'material-icons grey-text text-lighten-2');
    }
}

function createTripLists() {
    vehicles.forEach(vehicle => {
        //configure list - create ID div
        let listDiv = queueWin.createElement('div');
        listDiv.setAttribute('id', vehicle.name);

        //configure list - UL
        let listUL = queueWin.createElement('ul');
        listUL.setAttribute('class', 'collection white scrollbar-primary triplist');

        listDiv.appendChild(listUL);
        queueWin.getElementById('lists').appendChild(listDiv);
    });

    //create 'unassigned' list at the end
    let listDiv = queueWin.createElement('div');
    listDiv.setAttribute('id', 'unassigned');

    let listUL = queueWin.createElement('ul');
    listUL.setAttribute('class', 'collection white scrollbar-primary triplist');

    listDiv.appendChild(listUL);
    queueWin.getElementById('lists').appendChild(listDiv);
}

function clearTripLists() {
    let tripLists = queueWin.getElementById('lists');

    while (tripLists.firstChild) {
        tripLists.removeChild(tripLists.firstChild);
    }
}

function assignNewQueue(vehicle) {
    let tripList = queueWin.getElementById(vehicle.name).firstChild;
    let firstEntry = true;

    vehicle.queue.forEach(trip => {
        let tripLI = queueWin.createElement('li');
        if (firstEntry)
            tripLI.setAttribute('class', 'card-panel green lighten-5 collection-item avatar triplist-item');
        else if(trip.booked)
            tripLI.setAttribute('class', 'card-panel deep-purple lighten-5 collection-item avatar triplist-item');
        else
            tripLI.setAttribute('class', 'card-panel white collection-item avatar triplist-item');

        let tripIcon = queueWin.createElement('i');
        tripIcon.setAttribute('class', 'material-icons circle triplist-icon');
        switch (trip.type) {
            case tripType.pickup:
                tripIcon.classList.add('light-green-text');
                tripIcon.classList.add('text-lighten-3');
                break;
            case tripType.dropoff:
                tripIcon.classList.add('light-blue-text');
                tripIcon.classList.add('text-lighten-4');
                break;
            default:
                break;
        }
        tripIcon.innerHTML = trip.type;

        let tripTitle = queueWin.createElement('span');
        tripTitle.setAttribute('class', 'title');
        tripTitle.innerText = trip.name;

        let tripAdr = queueWin.createElement('p');
        tripAdr.setAttribute('class', 'truncate');
        tripAdr.innerHTML = trip.PUadr + '<i class="material-icons" style="padding-left:5px; padding-right:5px;">arrow_forward</i>' + trip.DOadr;

        tripLI.appendChild(tripIcon);
        tripLI.appendChild(tripTitle);
        tripLI.appendChild(tripAdr);

        if (firstEntry) {
            let progBar = queueWin.createElement('div');
            progBar.setAttribute('class', 'progress');
            progBar.innerHTML = '<div id="prog' + vehicle.name + '" class="determinate"></div>';
            tripLI.appendChild(progBar);
        }

        tripList.appendChild(tripLI);

        if (firstEntry)
            firstEntry = false;
    });
}

function clearCurrTrip(vehicle) {
    let tripList = queueWin.getElementById(vehicle.name).firstChild;
    tripList.removeChild(tripList.firstChild);

    if (vehicle != 'unassigned' && tripList.firstChild != null) {
        setCurrTripActive(vehicle);
    }
}

function clearAllTrips(vehicle) {
    let tripList = queueWin.getElementById(vehicle.name).firstChild;

    while(tripList.firstChild) {
        tripList.removeChild(tripList.firstChild);
    }
}

function setCurrTripActive(vehicle) {
    let tripList = queueWin.getElementById(vehicle.name).firstChild;

    let progBar = queueWin.createElement('div');
    progBar.setAttribute('class', 'progress');
    progBar.innerHTML = '<div id="prog' + vehicle.name + '" class="determinate"></div>';

    if (!isQueuePoped())
        tripList.firstChild.setAttribute('class', 'card-panel green lighten-5 collection-item avatar triplist-item');
    else
        tripList.firstChild.setAttribute('class', 'card-panel green lighten-5 collection-item avatar panel-triplist-item');

    tripList.firstChild.appendChild(progBar);

    if(queueMode)
        if(!autoQueueTimer) {
            if (vehicle.name == autoQueueLastChecked)
                return;

            var instance = M.Tabs.getInstance(queueWin.getElementById('tabs'));
            instance.select(vehicle.name);
            autoQueueLastChecked = vehicle.name;

            autoQueueTimer = setTimeout(() => {
                autoQueueTimer = clearInterval(autoQueueTimer);
            }, 7500);
        }
}

function setCurrTripIdle(vehicle) {
    let tripList = queueWin.getElementById(vehicle.name).firstChild;

    if (!isQueuePoped())
        tripList.firstChild.setAttribute('class', 'card-panel yellow lighten-4 collection-item avatar triplist-item');
    else
        tripList.firstChild.setAttribute('class', 'card-panel yellow lighten-4 collection-item avatar panel-triplist-item');
    tripList.firstChild.lastChild.firstChild.setAttribute('class', 'determinate yellow darken-1');

    let asgTrip = queueWin.createElement('p');
    asgTrip.setAttribute('class', 'right');
    asgTrip.innerHTML = 'waiting...';

    tripList.firstChild.childNodes[1].appendChild(asgTrip);
}

function progressBar(vehicle, offset) {
    queueWin.getElementById(vehicle.progBarID).style.width = offset;
}

function popQueue() {
    if (!isQueuePoped()) {
        queueWin = createPopWindow(windowType.queue, 'ERSA - Trip Queue');

        document.getElementById('popqueue').removeEventListener('click', popQueue);
        queueWin.body.appendChild(document.getElementById('queuepanel'));
        queueWin.getElementById('popqueue').addEventListener('click', dockQueue);
        queueWin.getElementById('queuepanel').classList.toggle('panelwind');

        let lists = Array.from(queueWin.getElementById('lists').children);
        lists.forEach(list => {
            list.firstChild.classList.replace('triplist', 'paneltriplist');

            let trips = Array.from(list.firstChild.childNodes);
            trips.forEach(trip => {
                trip.classList.replace('triplist-item', 'panel-triplist-item');
            });
        });

        queueWin.getElementById('popqueue').firstChild.innerText = 'exit_to_app';
        queueWin.getElementById('popqueue').setAttribute('data-tooltip', 'Dock');
        queueWin.getElementById('filebutton').style.display = 'none';
        document.getElementById('queueplaceholder').style.display = 'block';

        checkMapResize();
    }
}

function dockQueue() {
    if (isQueuePoped()) {
        queueWin.defaultView.removeEventListener('beforeunload', dockQueue);
        queueWin.getElementById('popqueue').removeEventListener('click', dockQueue);
        document.getElementById('queueplaceholder').before(queueWin.getElementById('queuepanel'));
        document.getElementById('popqueue').addEventListener('click', popQueue);
        document.getElementById('queuepanel').classList.toggle('panelwind');

        let lists = Array.from(document.getElementById('lists').children);
        lists.forEach(list => {
            list.firstChild.classList.replace('paneltriplist', 'triplist');

            let trips = Array.from(list.firstChild.childNodes);
            trips.forEach(trip => {
                trip.classList.replace('panel-triplist-item', 'triplist-item');
            });
        });

        document.getElementById('popqueue').firstChild.innerHTML = 'launch';
        document.getElementById('popqueue').setAttribute('data-tooltip', 'Pop-out');
        document.getElementById('filebutton').style.display = 'block';
        document.getElementById('queueplaceholder').style.display = 'none';

        queueWin = removePopWindow(windowType.queue);
        materializeInit();
        checkMapResize();
    }
}

function isQueuePoped() {
    return queueWin != document;
}

export { createTripTabs, createTripLists, assignNewQueue, updateTripTab, progressBar, setCurrTripIdle, 
    setCurrTripActive, clearCurrTrip, clearTripTabs, clearTripLists, isQueuePoped, dockQueue, clearAllTrips };