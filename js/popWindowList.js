import { PopWindow } from './popWindow.js';

var windows = [];

function createPopWindow(type, title) {
    let pw = new PopWindow(type, title);
    windows.push(pw);

    return pw.win.document;
}

function removePopWindow(type) {
    for (var i = 0; i < windows.length; i++) {
        if (windows[i].type === type) {
            windows[i].win.close();
            windows.splice(i, 1);
        }
    }
    return document;
}

export { createPopWindow, removePopWindow };