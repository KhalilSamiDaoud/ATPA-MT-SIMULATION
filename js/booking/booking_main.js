import { updateTripList } from './booking_parse.js';
import { initMap } from './booking_map.js';
import './booking_form.js';

//Always redirect to SIM main page if not opened from SIM
if (!window.opener) {
    window.location.replace("http://localhost:8000/index.html");
}

//Refs and functions for opener window (Sim)
window.processing = false;

window.updateTripList = updateTripList;

function startSequence() {
    initMap();
    materializeInit();
    updateTripList();
}

function materializeInit() {
    $("#preloader").fadeOut("slow");
    $("select").formSelect();
    $(".modal").modal();
    $("#tabs").tabs();
    $('.sidenav').sidenav();
    $('.tap-target').tapTarget();
    $('.tap-target').tapTarget('open');

    window.setInterval(() => {
        $('.tap-target').tapTarget('open');
    }, 180000);
}

function main() {
    startSequence();
}

main();