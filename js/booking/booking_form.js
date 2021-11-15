import { setPickupMarker, setDropoffMarker, clearMarkers } from './booking_map.js';
import { POIselectCoords } from '../constants.js';

//Form Inputs
const BOOKING_name = document.getElementById('booking_name');
const BOOKING_email = document.getElementById('booking_email');
const BOOKING_pickUp = document.getElementById('booking_pickup');
const BOOKING_dropOff = document.getElementById('booking_dropoff');
const BOOKING_phoneNumber = document.getElementById('booking_phone_number');

const BOOKING_closeButton = document.getElementById('booking_close');
const BOOKING_submitButton = document.getElementById('booking_submit');

//Event Listeners
BOOKING_pickUp.addEventListener('change', setPickupMarker);
BOOKING_dropOff.addEventListener('change', setDropoffMarker);

BOOKING_closeButton.addEventListener('click', clearBookingForm);
BOOKING_submitButton.addEventListener('click', processBookingForm);

let processingModal;

//let dateOfOperation = getCurrentDate();
let dateOfOperation = '10/29/2021';

function processBookingForm() {
    try {
        validateBookingInputs();
    }
    catch(e) {
        M.toast({ 
            html: '<b class="red-text text-lighten-1">Error:&nbsp;</b>' + e.message, 
            classes: 'rounded toast-styles' 
        });
        return;
    }

    let tripObj = {
        'pu-lat': String(POIselectCoords[BOOKING_pickUp.selectedIndex - 1].lat),
        'pu-long': String(POIselectCoords[BOOKING_pickUp.selectedIndex - 1].lng),
        'do-lat': String(POIselectCoords[BOOKING_dropOff.selectedIndex - 1].lat),
        'do-long': String(POIselectCoords[BOOKING_dropOff.selectedIndex - 1].lng),
        'name': '!&' + BOOKING_name.value,
        'number': BOOKING_phoneNumber.value,
        'email': BOOKING_email.value,
        'pickdatetime': dateOfOperation + ' ' + incrementHour(window.opener.clockTimeString),
        'date': dateOfOperation,
    }

    window.opener.bookingAPI(tripObj);
    openProcessingModal();
}

function clearBookingForm() {
    BOOKING_name.value = '';
    BOOKING_email.value = '';
    BOOKING_phoneNumber.value = '';
    BOOKING_pickUp.selectedIndex = 0;
    BOOKING_dropOff.selectedIndex = 0;

    if (BOOKING_email.classList.contains('valid'))
        BOOKING_email.classList.toggle('valid');
    if (BOOKING_email.classList.contains('invalid'))
        BOOKING_email.classList.toggle('invalid');

    clearMarkers();
    $("select").formSelect();
}

function validateBookingInputs() {
    if (!BOOKING_name.value)
        throw new Error('Enter a name for the trip.');
    if (!BOOKING_phoneNumber.value)
        throw new Error('Enter a phone number for the trip.');
    if (!BOOKING_email.value)
        throw new Error('Enter an email address for the trip.');
    if (!BOOKING_pickUp.value)
        throw new Error('Select a pick-up location.');
    if (!BOOKING_dropOff.value)
        throw new Error('Select a drop-off location.');
    if (BOOKING_pickUp.value == BOOKING_dropOff.value)
        throw new Error('pick-up and drop-off points are the same.');
}

function incrementHour(timeString, increment=2) {
    let hms = timeString.split(/[ :]+/);

    hms[0] = +hms[0] + increment;

    if (hms[0] == 12)
        hms[2] = (hms[2] == 'AM') ? 'PM' : 'AM';

    else if (hms[0] < 10)
        hms[0] = '0' + hms[0];

    else if (hms[0] > 12)
        hms[0] -= 12;

    return hms[0] + ':' + hms[1] + ':00 ' + hms[2];
}

function getCurrentDate() {
    let today = new Date();

    return (today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear();
}

function openProcessingModal() {
    window.processing = true;

    processingModal = M.Modal.init(document.getElementById('processing_modal'), {
        dismissible: false,
        inDuration: 0,
        outDuration: 0
    });

    processingModal.open();

    let procInterval = setInterval(() => {
        if(!window.processing) {
            processingModal.close();
            clearBookingForm();
            clearInterval(procInterval);
        }
    }, 500);
}

export { BOOKING_submitButton };