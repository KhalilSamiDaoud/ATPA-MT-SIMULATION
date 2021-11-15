import { simArea, colors } from './constants.js';
import { parseTime } from './parseInput.js';

let sumTime, sumPass, sumTrips, sumRevn;
sumTime = sumPass = sumTrips = sumRevn = 0;

let fareRate = [
    { base: 3.75, mile: 1.50 },
    { base: 5.50, mile: 2.75 },
    { base: 4.00, mile: 1.75 }
];

function resetGeneralVals(resetFare = false) {
    if (resetFare)
        fareRate[2] = { base: 4, mile: 1.75 };

    sumTime = sumPass = sumTrips = sumRevn = 0;
}

function incrementGeneralTrips() {
    sumTrips++;
}

function calcWaitTime(record, fileColumns) {
    if (record[fileColumns.requestTimeIndex] == null)
        return 0;

    let reqTimeMin, schdTimeMin;
    reqTimeMin = schdTimeMin = 0;

    reqTimeMin = parseTime(record[fileColumns.requestTimeIndex]);
    schdTimeMin = parseTime(record[fileColumns.scheduleTimeIndex]);

    return (reqTimeMin - schdTimeMin > 0 || Number.isNaN(reqTimeMin - schdTimeMin)) ? 0 : Math.abs(reqTimeMin - schdTimeMin);
}

async function calcAvgWait(trip, formatted = false) {
    sumTime += trip.waitTime;

    if (formatted)
        return '~' + parseFloat(sumTime / sumTrips).toFixed(2) + ' min';
    else
        return sumTime / sumTrips;
}

async function calcPassengersServed(trip) {
    sumPass += trip.passengers;
    return sumPass;
}

async function calcRevenueGenerated(trip, formatted = false) {
    let index;
    switch (document.title) {
        case simArea.DC:
            index = 0;
            break;
        case simArea.LA:
            index = 1;
            break;
        case simArea.Cust:
            index = 2;
            break;
        default:
            index = 0;
            break;
    }

    sumRevn += fareRate[index].base + (fareRate[index].mile * trip.distance);

    if (formatted)
        return '$' + parseFloat(sumRevn).toFixed(2);
    else
        return sumRevn;
}

async function calcVehiclePassengersServed(vehicle) {
    vehicle.stats.served++;
    vehicle.formattedStats.served++;
}

async function calcVehicleIdle(vehicle, pos = 0) {
    if(!pos)
        pos = vehicle.pos;

    vehicle.stats.idleTime += vehicle.queue[pos].idleTime;
    vehicle.formattedStats.idleTime = parseFloat(vehicle.stats.idleTime).toFixed(2) + ' min';
}

async function calcVehicleMileage(vehicle, pos = 0) {
    if (!pos)
        pos = vehicle.pos;

    vehicle.stats.mileage += vehicle.queue[pos].distance;
    vehicle.formattedStats.mileage = parseFloat(vehicle.stats.mileage).toFixed(2) + ' mi';
}

async function calcVehicleRevenue(vehicle, pos = 0) {
    if (!pos)
        pos = vehicle.pos;

    let index;
    switch (document.title) {
        case simArea.DC:
            index = 0;
            break;
        case simArea.LA:
            index = 1;
            break;
        case simArea.Cust:
            index = 2;
            break;
        default:
            index = 0;
            break;
    }

    vehicle.stats.revenue += fareRate[index].base + (fareRate[index].mile * vehicle.queue[pos].distance);
    vehicle.formattedStats.revenue = '$' + parseFloat(vehicle.stats.revenue).toFixed(2);
}

function calcTableBody(file, tableID) {
    let index = 0;
    let newRow;
    //for returning data
    let totalStats = {
        name: file.name,
        sumIdle: 0,
        sumMilage: 0,
        sumRevenue: 0,
        sumServed: 0,
        sumTrips: 0,
        sumTravelTime: 0,
        sumWaitTime: 0,
        avgIdle: 0,
        avgTime: 0,
        avgWait: 0
    }

    for (const vehicle in file.vehindexs) {
        newRow = document.getElementById(tableID).insertRow(index);

        for (let i = 0; i < 8; i++) {
            newRow.insertCell();
        }

        //col 0 --> icon
        const vehicleAncr = document.createElement('a');
        vehicleAncr.setAttribute('class', colors[index].class + ' center')
        vehicleAncr.innerHTML = vehicle;
        const vehicleIcon = document.createElement('i');
        vehicleIcon.setAttribute('class', 'material-icons left');
        vehicleIcon.innerHTML = 'directions_bus';

        vehicleAncr.appendChild(vehicleIcon);
        newRow.cells[0].appendChild(vehicleAncr);

        let currRecord;
        let currTripType;
        let offset = 0;

        let vehicleStats = {
            sumIdle: 0,
            sumMilage: 0,
            sumRevenue: 0,
            sumServed: 0,
            sumTrips: 0,
            sumTravelTime: 0,
            sumWaitTime: 0
        }

        while (file.triplist[file.vehindexs[vehicle] + offset]?.[file.colindexs.vehNumIndex] == vehicle) {
            currRecord = file.triplist[file.vehindexs[vehicle] + offset];
            currTripType = currRecord[file.colindexs.typeIndex];

            if (currTripType == 'StartDepot') {
                offset++;
                continue;
            }

            if (currTripType == 'IdleTime') {
                vehicleStats.sumIdle += currRecord[file.colindexs.estTimeIndex];
                offset++;
                continue;
            }

            vehicleStats.sumMilage += currRecord[file.colindexs.estDistanceIndex];
            vehicleStats.sumTravelTime += currRecord[file.colindexs.estTimeIndex];
            vehicleStats.sumTrips++;

            if (currTripType == 'PU' && file.triplist[file.vehindexs[vehicle] + offset][file.colindexs.splTrpIndex] != 1) {
                let fareType;

                switch (document.title) {
                    case simArea.DC:
                        fareType = 0;
                        break;
                    case simArea.LA:
                        fareType = 1;
                        break;
                    case simArea.Cust:
                        fareType = 2;
                        break;
                    default:
                        fareType = 0;
                        break;
                }
                vehicleStats.sumWaitTime += calcWaitTime(currRecord, file.colindexs);
                vehicleStats.sumRevenue += fareRate[fareType].base + (fareRate[fareType].mile * currRecord[file.colindexs.estDistanceIndex]);
                vehicleStats.sumServed++;
            }
            offset++;
        }
        //col 1-7 --> idle, milage, revenue, passengers, averages
        newRow.cells[1].innerHTML = vehicleStats.sumServed;
        newRow.cells[2].innerHTML = parseFloat(vehicleStats.sumIdle).toFixed(2) + ' min';
        newRow.cells[3].innerHTML = parseFloat(vehicleStats.sumMilage).toFixed(2) + ' mi';
        newRow.cells[4].innerHTML = '$' + parseFloat(vehicleStats.sumRevenue).toFixed(2);
        newRow.cells[5].innerHTML = parseFloat(vehicleStats.sumMilage / vehicleStats.sumTrips).toFixed(2) + ' mi';
        newRow.cells[6].innerHTML = parseFloat(vehicleStats.sumTravelTime / vehicleStats.sumTrips).toFixed(2) + ' min';
        newRow.cells[7].innerHTML = parseFloat(vehicleStats.sumWaitTime / vehicleStats.sumServed).toFixed(2) + ' min';

        totalStats.sumIdle += vehicleStats.sumIdle;
        totalStats.sumMilage += vehicleStats.sumMilage;
        totalStats.sumRevenue += vehicleStats.sumRevenue;
        totalStats.sumServed += vehicleStats.sumServed;
        totalStats.sumTrips += vehicleStats.sumTrips;
        totalStats.sumTravelTime += vehicleStats.sumTravelTime;
        totalStats.sumWaitTime += vehicleStats.sumWaitTime;

        index++;
    }
    // avg idle is calculated as --total idle time (ie. veh1.idletime + veh2.idletime...) / number of trips performed for the day (ie. 340)
    totalStats.avgIdle = (totalStats.sumIdle / totalStats.sumTrips);
    // avg travel time is calculated as --total wait time (ie. veh1.traveltime + veh2.traveltime...) / number of trips performed for the day (ie. 340)
    totalStats.avgTime = (totalStats.sumTravelTime / totalStats.sumTrips);
    // avg wait time is calculated as --total wait time (ie. veh1.waittime + veh2.waittime...) / number of people served (ie. 78 pick-ups)
    totalStats.avgWait = (totalStats.sumWaitTime / totalStats.sumServed);

    return totalStats;
}

function calcPercentDifference(a, b, formatted = false) {
    if (formatted)
        return ~~(100 * Math.abs((a - b) / ((a + b) / 2))) + '%';

    return ~~(100 * Math.abs((a - b) / ((a + b) / 2)));
}

export {
    calcAvgWait, calcPassengersServed, calcRevenueGenerated, calcWaitTime, resetGeneralVals, incrementGeneralTrips, calcPercentDifference,
    calcVehiclePassengersServed, calcVehicleIdle, calcVehicleMileage, calcVehicleRevenue, calcTableBody, fareRate
};