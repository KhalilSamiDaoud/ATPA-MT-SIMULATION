import { createPopWindow, removePopWindow } from './popWindowList.js';
import { tripType, windowType } from './constants.js';
import { timeToString } from './clock.js';
import { checkMapResize } from './map.js';

document.getElementById('clearlog').addEventListener('click', clearEvents);
document.getElementById('poplog').addEventListener('click', popLog);

var logWin = document;
let logBox = logWin.getElementById('logbox');

function addEvent(innerElems = [], colorClass = null) {
    let entry = logWin.createElement('div');
    entry.setAttribute('class', 'z-depth-1 slide ' + 
    ((logWin == document) ? 'logentry ' : 'logpanelentry ') + 
    ((colorClass) ? colorClass : 'white'));

    if (innerElems.length > 0)
        innerElems.forEach(elem => {
            entry.appendChild(elem);
        });

    let entryTime = logWin.createElement('a');
    entryTime.setAttribute('class', 'right cyan-text');
    entryTime.innerHTML = timeToString();

    entry.appendChild(entryTime);
    logBox.appendChild(entry);
    autoScroll();
}

function clearEvents() {
    while (logBox.firstChild) {
        logBox.removeChild(logBox.firstChild);
    }
}

function autoScroll() {
    if (logWin == document)
        logBox.scrollTop = (logBox.scrollTop + 300 >= logBox.scrollHeight) ? logBox.scrollHeight : logBox.scrollTop;
    else {
        logBox.scrollTop = (logBox.scrollTop + logWin.defaultView.outerHeight >= logBox.scrollHeight) ? logBox.scrollHeight : logBox.scrollTop;
    }
}

function initEvent(optMsg = undefined) {
    let innerText = (typeof fileName == undefined || optMsg == null) ? 'Initializing route from file' : optMsg;
    let stpElems = [];

    let entryIcon = logWin.createElement('i');
    entryIcon.setAttribute('class', 'material-icons grey-text left');
    entryIcon.innerHTML = 'info_outline';
    stpElems.push(entryIcon);

    let entryText = logWin.createElement('p');
    entryText.innerHTML = innerText;
    stpElems.push(entryText);

    addEvent(stpElems);
}

function fileEvent(fileName = undefined) {
    let innerText = (typeof fileName == undefined || fileName == null) ? 'Loaded user file' : 'Loaded file <em class="">\'' + fileName + '\'</em>';
    let stpElems = [];

    let entryIcon = logWin.createElement('i');
    entryIcon.setAttribute('class', 'material-icons grey-text left');
    entryIcon.innerHTML = 'feed';
    stpElems.push(entryIcon);

    let entryText = logWin.createElement('p');
    entryText.innerHTML = innerText;
    stpElems.push(entryText);

    addEvent(stpElems);
}

function vehicleEvent(vehicle, pos) {
    let tripRef = vehicle.queue[pos];
    let stpElems = [];
    let innerText;

    switch (tripRef.type) {
        case (tripType.pickup):
            innerText = 'pick-up @ ' + tripRef.DOadr;
            break;
        case (tripType.dropoff):
            innerText = 'drop-off @ ' + tripRef.DOadr;
            break;
        case (tripType.fixedstop):
            innerText = 'Arrived at station \'' + tripRef.name + '\'';
            break;
        case (tripType.depot):
            innerText = vehicle.name + ' is Depoting';
            break;
        default:
            innerText = 'Unexpected event';
            break;
    }

    let entryIcon = logWin.createElement('i');
    entryIcon.setAttribute('class', 'material-icons left ' + vehicle.color.class);
    if (tripRef.type == tripType.depot)
        entryIcon.innerHTML = 'departure_board';
    else
        entryIcon.innerHTML = (vehicle.stops.length > 0) ? 'directions_bus' : 'directions_car';
    stpElems.push(entryIcon);

    if (tripRef.type == tripType.pickup || tripRef.type == tripType.dropoff) {
        let psngrCount = logWin.createElement('span');
        psngrCount.setAttribute('class', 'badge left grey lighten-2 logpassengers');
        psngrCount.innerHTML = ((tripRef.type == tripType.pickup) ? '+' : '-') + tripRef.passengers;
        stpElems.push(psngrCount);
    }

    let entryText = logWin.createElement('p');
    entryText.innerHTML = innerText;
    stpElems.push(entryText);

    addEvent(stpElems);
}

function bookingEvent(success = false) {
    let innerText = (success) ? 'New trip successfully booked' : 'New trip could not be booked';
    let stpElems = [];

    let entryIcon = logWin.createElement('i');
    entryIcon.setAttribute('class', 'material-icons grey-text left');
    entryIcon.innerHTML = 'book';
    stpElems.push(entryIcon);

    let entryText = logWin.createElement('p');
    entryText.innerHTML = innerText;
    stpElems.push(entryText);

    addEvent(stpElems, 'purple lighten-5');
}

function popLog() {
    if (!isLogPoped()) {
        logWin = createPopWindow(windowType.log, 'ERSA - Log');

        document.getElementById('poplog').removeEventListener('click', popLog);
        logWin.body.appendChild(document.getElementById('logpanel'));
        logWin.getElementById('poplog').addEventListener('click', dockLog);
        logWin.getElementById('logpanel').classList.toggle('panelwind');
        logWin.getElementById('logpanel').children[1].classList.toggle('panelcontent');

        logWin.getElementById('poplog').firstChild.innerHTML = 'exit_to_app';
        logWin.getElementById('poplog').setAttribute('data-tooltip', 'Dock');
        document.getElementById('logplaceholder').style.display = 'block';

        let entries = Array.from(logWin.getElementById('logbox').children);
        entries.forEach(entry => {
            entry.classList.replace('logentry', 'logpanelentry');
            if (entry.classList.contains('slide'));
            entry.classList.remove('slide');
        });

        checkMapResize();
    }
}

function dockLog() {
    if (isLogPoped()) {
        logWin.defaultView.removeEventListener('beforeunload', dockLog);
        logWin.getElementById('poplog').removeEventListener('click', dockLog);
        document.getElementById('logplaceholder').before(logWin.getElementById('logpanel'));
        document.getElementById('poplog').addEventListener('click', popLog);
        document.getElementById('logpanel').classList.toggle('panelwind');
        document.getElementById('logpanel').children[1].classList.toggle('panelcontent');

        document.getElementById('poplog').firstChild.innerHTML = 'launch';
        document.getElementById('poplog').setAttribute('data-tooltip', 'Pop-out');
        document.getElementById('logplaceholder').style.display = 'none';

        let entries = Array.from(document.getElementById('logbox').children);
        entries.forEach(entry => {
            entry.classList.replace('logpanelentry', 'logentry');
            if (entry.classList.contains('slide'));
            entry.classList.remove('slide');
        });

        logWin = removePopWindow(windowType.log);
        logBox.scrollTop = logBox.scrollHeight;
        M.Tooltip.init(document.getElementById('poplog'));
        M.Tooltip.init(document.getElementById('clearlog'));
        checkMapResize();
    }
}

function isLogPoped() {
    return logWin != document;
}

export { fileEvent, vehicleEvent, initEvent, bookingEvent, isLogPoped, dockLog };