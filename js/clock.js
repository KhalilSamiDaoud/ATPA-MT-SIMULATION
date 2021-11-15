import { stopSimulation, startSimulation } from './main.js';
import { rebuildStats } from './statisticsList.js';
import { vehicles } from './vehicleList.js';
import { parseTime } from './parseInput.js';
import { drawMaterial } from './barChart.js';
import { vehStatus } from './constants.js';

const btnNormal = document.getElementById('normalspeed');
const btnFast = document.getElementById('fastspeed');
const clock = document.getElementById('clock');

document.getElementById('normalspeed').addEventListener('click', setSpeedNormal);
document.getElementById('fastspeed').addEventListener('click', setSpeedFast);
document.getElementById('settimebutton').addEventListener('click', setUserTime);

var clockStartTime, clockCurrTime, clockPassCount;
var simSpeedFactor = 1; // 1 second = 1 minute  @ factor = 1
let clockInterval;

clockStartTime = clockCurrTime = clockPassCount = 0;
initClock();

function initClock(startTime = 0) {
    window.clockTimeValue = clockCurrTime = clockStartTime = startTime;

    clockPassCount = 0

    clock.innerHTML = timeToString(clockStartTime, false);

    //update window obj for child windows (booking interface)
    window.clockTimeValue = clockCurrTime;
    window.clockTimeString = clock.innerHTML;
}

function timeToString(time = clockCurrTime, round = true) {
    if (round)
        time = ((time % 1) > 0.5) ? Math.ceil(time) : Math.floor(time);

    let hours = Math.floor(time / 60);
    let minutes = time % 60;

    if (hours < 12)
        return (hours == 0) ? ('00' + hours + 12).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' AM' : 
        ('00' + hours).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' AM';
    else if (hours == 12)
        return ('00' + 12).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' PM';
    else
        return (hours == 24) ? ('00' + (hours - 12)).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' AM' : 
        ('00' + (hours - 12)).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' PM';
}

function startClock() {
    if(!clockInterval) {
        clockInterval = setInterval(() => {
            tickClock();
        }, (10 * simSpeedFactor));
    }
}

function stopClock() {
    if(clockInterval)
        clockInterval = clearInterval(clockInterval);
}

function tickClock() {
    vehicles.forEach(vehicle => {
        if (vehicle.status == vehStatus.route || vehicle.status == vehStatus.loop)
            vehicle.animate();
    });

    if(clockPassCount == 100) {
        if (clockCurrTime == 1440)
            clockCurrTime = 1;
        else
            clock.innerHTML = timeToString(++clockCurrTime, false);

        //update window obj for child windows (booking interface)
        window.clockTimeValue = clockCurrTime;
        window.clockTimeString = clock.innerHTML;

        clockPassCount = 0;
    }
    else
        ++clockPassCount;
}

function clearClock() {
    initClock(1440);
}

function updateSimSpeed() {
    stopSimulation(true);
    startSimulation(true);
}

function setSpeedFast() {
    btnNormal.classList.replace('light-green', 'grey');
    btnFast.classList.replace('grey', 'light-green');
    btnNormal.classList.toggle('interactable');
    btnFast.classList.toggle('interactable');

    simSpeedFactor = .2;
    updateSimSpeed();
}

function setSpeedNormal() {
    btnNormal.classList.replace('grey', 'light-green');
    btnFast.classList.replace('light-green', 'grey');
    btnNormal.classList.toggle('interactable');
    btnFast.classList.toggle('interactable');

    simSpeedFactor = 1;
    updateSimSpeed();
}

function setUserTime() {
    let timeInput = document.getElementById('settimeinput');
    let timeSelect = document.getElementById('settimedd');
    let userTimeString = timeInput.value + ':00 ' + timeSelect.value;

    stopSimulation(true);
    initClock(parseTime(userTimeString));

    vehicles.forEach(vehicle => {
         vehicle.correctPosition();
    });

    rebuildStats();
    drawMaterial();

    startSimulation(false);
}

export { initClock, startClock, stopClock, clearClock, timeToString, simSpeedFactor, clockCurrTime };