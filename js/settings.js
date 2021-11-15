import { defaultTitle } from './constants.js';
import { vehicles } from './vehicleList.js';
import { setHeaderTitle } from './main.js';

const ROOT = document.documentElement;

const SETTINGS_title = document.getElementById('settings_title');
const SETTINGS_primaryColor = document.getElementById('settings_primary_color');
const SETTINGS_secondaryColor = document.getElementById('settings_secondary_color');
const SETTINGS_autoFocus = document.getElementById('settings_autofocus');
const SETTINGS_drawPath = document.getElementById('settings_drawpath');

const SETTINGS_close = document.getElementById('settings_close');
const SETTINGS_save = document.getElementById('settings_save');

SETTINGS_close.addEventListener('click', resetSettings);
SETTINGS_save.addEventListener('click', handleSettingsSave);

let primaryTheme = '#fbc02d';
let secondaryTheme = '#757575';
let queueMode = false;
let drawPath = true;
let title;

function resetSettings() {
    SETTINGS_title.value = (title) ? title : defaultTitle;
    SETTINGS_autoFocus.checked = queueMode;
    SETTINGS_drawPath.checked = drawPath;
    SETTINGS_primaryColor.value = primaryTheme;
    SETTINGS_secondaryColor.value = secondaryTheme;
}

function handleSettingsSave() {
    if(SETTINGS_title.value && SETTINGS_title.value !== defaultTitle) {
        title = SETTINGS_title.value;
        setHeaderTitle(title);
    }
    else
        title = (title) ? title : defaultTitle;

    if(SETTINGS_primaryColor.value) {
        primaryTheme = SETTINGS_primaryColor.value;
        ROOT.style.setProperty('--primary-theme', primaryTheme);
    }

    if(SETTINGS_secondaryColor.value) {
        secondaryTheme = SETTINGS_secondaryColor.value;
        ROOT.style.setProperty('--secondary-theme', secondaryTheme);
    }

    if (SETTINGS_drawPath.checked !== drawPath) {
        drawPath = SETTINGS_drawPath.checked;

        vehicles.forEach(vehicle => {
            vehicle.stopDispatch();
            vehicle.clearPath();
            vehicle.autoDispatch();
            vehicle.forceDispatch();
        });
    }

    queueMode = SETTINGS_autoFocus.checked;
}

export { title, queueMode, drawPath };