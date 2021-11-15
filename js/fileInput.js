import {
  fullParse,
  findColIndex,
  findCenter,
  trimStreetNames,
  findVehicleIndex,
} from './parseInput.js';
import { initSimulation, stopSimulation, currMode } from './main.js';
import { detailedStatsButton } from './detailedStatistics.js';
import { getUserFare } from './statisticsList.js';
import { isAllDepot } from './vehicleList.js';
import { initMode } from './constants.js';
import { fileEvent } from './log.js';

const fileButton = document.getElementById('filebutton');
const filePicker = document.getElementById('filepicker');
filePicker.addEventListener('change', getUserFare);

let files = [];

let latestFile;
let firstSheet;
let tripListObjTrimed;
let fileColumns;
let newCenter;
let reloadClock;

fileButton.addEventListener(
  'click',
  function (e) {
    if (filePicker) {
      filePicker.click();
    }
  },
  false
);

function fileInit(file = null) {
  let inputFile = file ?? latestFile;
  let reader = new FileReader();

  reader.onload = (e) => {
    let contents = JSON.parse(processExcel(e.target.result));
    fileColumns = findColIndex(contents[firstSheet]);
    tripListObjTrimed = trimStreetNames(
      contents[firstSheet].slice(1),
      fileColumns
    );
    newCenter = findCenter(tripListObjTrimed, fileColumns);
    if (filePicker.value) {
      filePicker.value = '';
    }
    //!event
    fileEvent(inputFile.name);

    stopSimulation(true);
    fullParse(tripListObjTrimed, fileColumns);
    initSimulation(initMode.file, newCenter);

    detailedStatsButton.classList.remove('no-file-selected');
  };

  reader.readAsBinaryString(inputFile);
}

function importFile(evt) {
  let tempFiles = [];
  let tempLatest;
  clearFiles();

  tempLatest = evt.target.files[0];
  for (var i = 0; i < evt.target.files.length; i++) {
    tempFiles.push(evt.target.files[i]);
  }

  if (tempLatest) {
    files = tempFiles;
    latestFile = tempLatest;
    fileInit();
    startReloadClock();
  } else {
    console.log('Failed to load file');
  }
}

function reloadFile() {
  if (files.length > 1) {
    let index = files.indexOf(latestFile) + 1;
    latestFile = files[index >= files.length ? 0 : index];
    fileInit(latestFile);
    return;
  }
  if (latestFile) {
    fileInit();
  } else {
    console.log('Failed to reload file');
  }
}

function clearFiles() {
  files = [];
  latestFile = undefined;
}

function startReloadClock() {
  reloadClock = setInterval(() => {
    if (currMode != initMode.file) {
      reloadClock = clearInterval(reloadClock);
      return;
    }
    if (isAllDepot()) {
      reloadFile();
    }
  }, 5000);
}

function processExcel(data) {
  let workbook = XLSX.read(data, {
    type: 'binary',
    cellText: false,
    cellDates: true,
  });

  firstSheet = workbook.SheetNames[0];
  data = to_json(workbook);
  return data;
}

async function processAndFormatExcel(data) {
  let tempContents;
  let tempFirstSheet;
  let tempColIndxs;
  let tempVehIndxs;
  let tempTrimmedList;
  let tempReader = new FileReader();

  tempReader.readAsBinaryString(data);

  await (new Promise(resolve => {
    tempReader.onload = (e) => {
      let workbook = XLSX.read(e.target.result, {
        type: 'binary',
        cellText: false,
        cellDates: true,
      });

      tempFirstSheet = workbook.SheetNames[0];
      tempContents = JSON.parse(to_json(workbook));
      tempColIndxs = findColIndex(tempContents[tempFirstSheet]);
      tempTrimmedList = trimStreetNames(tempContents[tempFirstSheet].slice(1), tempColIndxs);
      tempVehIndxs = findVehicleIndex(tempTrimmedList, tempColIndxs);

      resolve();
    };
  }));

  return [
    tempTrimmedList,
    tempVehIndxs,
    tempColIndxs
  ];
}

function to_json(workbook) {
  let result = {};
  workbook.SheetNames.forEach(function (sheetName) {
    let roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
    });
    if (roa.length) result[sheetName] = roa;
  });
  return JSON.stringify(result, 2, 2);
}

export { files, importFile, processAndFormatExcel };
