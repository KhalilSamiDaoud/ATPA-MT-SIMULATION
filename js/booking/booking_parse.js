import { APIColumns, tripType } from '../constants.js';
import { DietVehicle } from './booking_DietVehicle.js';
import { createVehicleIcon } from './booking_map.js';
import { Trip } from '../trip.js';

let vehicles = [];

function updateTripList() {
    getVehiclesFromJSON(window.opener.tripList, APIColumns);
    getQueueFromJSON(window.opener.tripList, APIColumns);

    vehicles.forEach(vehicle => {
      vehicle.updateQueue();
      createVehicleIcon(vehicle);
      vehicle.correctPosition();
    });
}

function createVehicle(VehID, startTime) {
  let veh = new DietVehicle(VehID, startTime);
  vehicles.push(veh);
}

function clearVehicles() {
  vehicles.forEach(vehicle => {
    vehicle.clearPath();
    vehicle.clearIntervals();
  });

  vehicles = [];
}

function parseTime(timeString, mode = 1) {
  let UDTfix = (timeString.length > 11) ? true : false
  let hms, minutes;

  if (UDTfix)
    timeString = new Date(timeString).toLocaleTimeString();

  hms = timeString.substring(0, 11).split(/:| /);

  switch (mode) {
    case 0:
      return hms;
    case 1:
    case 2:
      minutes = (+hms[0]) * 60 + (+hms[1]) + (+hms[2] / 60);

      if (hms[hms.length - 1] == 'PM')
        minutes = (+hms[0] != 12) ? minutes + 720 : minutes;
      else if (hms[hms.length - 1] == 'AM')
        minutes = (+hms[0] != 12) ? minutes : minutes - 720;

      if (mode == 1)
        return minutes;
      else
        return [minutes, [+hms[0], +hms[1], +hms[2]]];
    default:
      throw new Error('invalid mode (' + mode + ')');
  }
}

function getTripType(record, fileColumns) {
  switch (record[fileColumns.typeIndex]) {
    case 'PU':
      return tripType.pickup;
    case 'DO':
      return tripType.dropoff;
    case 'StartDepot':
    case 'EndDepot':
      return tripType.depot;
    default:
      return tripType.unknown;
  }
}

function getVehiclesFromJSON(records, fileColumns) {
  let uniqueVeh = [];
  clearVehicles();

  records.forEach(record => {
    if (!uniqueVeh.includes(record[fileColumns.vehNumIndex]) && record[fileColumns.vehNumIndex] != undefined) {
      let count = 0;

      for (var i = records.indexOf(record); i < records.length; i++) {
        if (records[i][fileColumns.vehNumIndex] == record[fileColumns.vehNumIndex]) {
          count++;
        }
        else { break; }
      }
      uniqueVeh.push(record[fileColumns.vehNumIndex]);
      createVehicle(record[fileColumns.vehNumIndex], parseTime(record[fileColumns.scheduleTimeIndex]));
    }
  });
}

function getQueueFromJSON(records, fileColumns, fromAPI) {
    vehicles.forEach(vehicle => {
        let vehFound = false;
        let lastStop;

        for (var i = 0; i < records.length - 1; i++) {
            let next = i + 1;

            if (records[i][fileColumns.vehNumIndex] == vehicle.name && records[next][fileColumns.vehNumIndex] == vehicle.name) {
                vehFound = true;

                if (records[next][fileColumns.typeIndex] == 'IdleTime') {
                    vehicle.queue[vehicle.queue.length - 1].idleTime = records[next][fileColumns.estTimeIndex];
                    next++;
                }

                if (records[i][fileColumns.typeIndex] == 'IdleTime')
                    continue;

                else if (records[next][fileColumns.splTrpIndex] == 1) {
                    if (records[next][fileColumns.nameIndex] != lastStop) {
                        lastStop = records[next][fileColumns.nameIndex];

                        vehicle.queue.push(new Trip(records[next][fileColumns.nameIndex], tripType.fixedstop, { lat: records[i][fileColumns.latIndex], lng: records[i][fileColumns.longIndex] },
                            { lat: records[next][fileColumns.latIndex], lng: records[next][fileColumns.longIndex] }, records[i][fileColumns.adrIndex], records[next][fileColumns.adrIndex],
                            records[next][fileColumns.estTimeIndex], records[next]?.[fileColumns?.estIdleIndex], 0, records[next][fileColumns.passengerIndex],
                            records[next][fileColumns.estDistanceIndex], parseTime(records[i][fileColumns.scheduleTimeIndex], 1), false));
                    }
                    else {
                        lastStop = undefined;
                        continue;
                    }
                }

                else {
                    let tName = (getTripType(records[next], fileColumns) == tripType.depot) ? 'End Depot' : records[next][fileColumns.nameIndex];
                    let booked = false;

                    if (fromAPI) {
                        booked = (records[next][fileColumns.nameIndex]?.includes('!&')) ? true : false;
                        tName = (booked) ? records[next][fileColumns.nameIndex].substring(2) : tName;
                    }

                    vehicle.queue.push(new Trip(tName, getTripType(records[next], fileColumns), { lat: records[i][fileColumns.latIndex], lng: records[i][fileColumns.longIndex] }, 
                        { lat: records[next][fileColumns.latIndex], lng: records[next][fileColumns.longIndex] }, records[i][fileColumns.adrIndex], records[next][fileColumns.adrIndex],
                        records[next][fileColumns.estTimeIndex], records[next]?.[fileColumns?.estIdleIndex], 0, records[next][fileColumns.passengerIndex],
                        records[next][fileColumns.estDistanceIndex], parseTime(records[i][fileColumns.scheduleTimeIndex], 1,), booked));
                }
            }
            else if (records[next][fileColumns.vehNumIndex] != vehicle.name && vehFound)
                break;
        }
    });
}

export { updateTripList };