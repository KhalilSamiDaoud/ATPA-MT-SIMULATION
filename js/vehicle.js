import { assignNewQueue, updateTripTab, progressBar, setCurrTripIdle, clearCurrTrip, clearAllTrips } from './tripQueue.js';
import { calcVehiclePassengersServed, calcVehicleIdle, calcVehicleMileage, calcVehicleRevenue } from './simMath.js';
import { drawTripPath, drawNextNIcons, drawNextIcon, removeCurrIcon, createVehicleIcon, map } from './map.js';
import { updateGeneralStats, updateVehicleStats } from './statisticsList.js';
import { vehStatus, tripType, colors } from './constants.js';
import { simSpeedFactor, clockCurrTime } from './clock.js';
import { drawMaterial } from './barChart.js';
import { vehicleEvent } from './log.js';

class Vehicle {
    constructor(name = 'N/A', maxCapacity = 0, color = colors[colors.length - 1], startTime = 0, stops = [], queue = []) {
        this.name = name;
        this.maxCapacity = maxCapacity;
        this.startTime = startTime;
        this.color = color;
        this.stops = stops;
        this.queue = queue;
        this.queueBackup = queue;

        this.status = vehStatus.starting;
        this.stopsOnly = false;
        this.doneTrip = false;
        this.idling = false;
        this.pos = 0;
        this.mapOffset = 0;
        this.idleOffset = 0;
        this.MTpassengers = 0;
        this.FSpassengers = 0;
        this.markerCount = 3;
        this.markers = [];
        this.drawnTo;
        this.symbol;
        this.path;

        this.progBarID = 'prog' + this.name;
        this.dispatcher = undefined;

        //vehicle stats 
        this.stats = {
            served: 0,
            idleTime: 0,
            mileage: 0,
            revenue: 0
        };

        this.formattedStats = {
            served: this.stats.served,
            idleTime: '0 min',
            mileage: '0 mi',
            revenue: '$ 0'
        };


    }

    resetState() {
        this.status = vehStatus.starting;
        this.queue = this.queueBackup;
        this.mapOffset = 0;
        this.idleOffset = 0;
        this.drawnTo = 0;
        this.pos = 0;

        this.stopDispatch();
        this.resetPassengers();
        this.resetStats();
        this.clearPath()

        while (this.markers.length > 0) {
            removeCurrIcon(this);
        }

        clearAllTrips(this);
        assignNewQueue(this);
        updateTripTab(this);
    }

    updateColor(color) {
        this.color = color;
        createVehicleIcon(this);
    }

    updateCashe(casheList) {
        this.queueBackup = casheList;
    }

    updateStatus() {
        if (this.stops.length == 0 && this.queue.length == 0)
            this.status = vehStatus.depot;
        else if (this.queue.length <= this.stops.length)
            this.status = vehStatus.loop;
        else
            this.status = vehStatus.route;

        updateTripTab(this);
    }

    updateQueue(newQueue = this.queue) {
        this.queue = newQueue;

        if (this.queue.length == 0) {
            this.queue = this.stops;
            assignNewQueue(this);
        }
        else
            assignNewQueue(this);
    }

    updatePassengers(trip) {
        switch (trip.type) {
            case tripType.fixedstop:
                this.addRandPassengers();
                this.removeRandPassengers();
                break;
            case tripType.pickup:
                this.MTpassengers += trip.passengers;
                break;
            case tripType.dropoff:
                this.MTpassengers -= trip.passengers;
                break;
            default:
                break;
        }
    }

    totalPassengers() {
        return this.FSpassengers + this.MTpassengers;
    }

    addRandPassengers() {
        if (this.totalPassengers() < (this.maxCapacity * .7))
            this.FSpassengers += (Math.floor(Math.random() * (this.maxCapacity * .3)) + 2);
        else
            this.FSpassengers += (Math.floor(Math.random() * (this.maxCapacity * .1)));
    }

    removeRandPassengers() {
        if (this.totalPassengers() > (this.maxCapacity * .7))
            this.FSpassengers -= (Math.floor(Math.random() * (this.maxCapacity * .3)) + 2);
        else
            this.FSpassengers -= (Math.floor(Math.random() * (this.maxCapacity * .1)));
    }

    resetPassengers() {
        this.FSpassengers = 0;
        this.MTpassengers = 0;
    }

    getFixedStopCoordList() {
        let routeCoords = []

        if (this.stops.length != 0) {
            this.stops.forEach(stop => {
                routeCoords.push(stop.PUcoords);
            });

            if (!this.stopsOnly)
                routeCoords.push(this.stops[0].PUcoords);
        }

        return routeCoords;
    }

    clearPath() {
        if (this.path)
            this.path.setMap(null);
    }

    tripIsDepot(index) {
        return this.queue[index].type == tripType.depot;
    }

    tripIsFixedStop(index) {
        return this.queue[index].type == tripType.fixedstop;
    }

    tripIsPickup(index) {
        return this.queue[index].type == tripType.pickup;
    }

    tripIsDropoff(index) {
        return this.queue[index].type == tripType.dropoff;
    }

    tripIsBooked(index) {
        return this.queue[index].booked;
    }

    isFinished() {
        return this.status == vehStatus.depot || this.status == vehStatus.loop;
    }

    animate() {
        let count;

        if(!this.path?.getMap()) {
            drawTripPath(this);
            this.path.setMap(map);
        }

        if (this.markers.length == 0)
            drawNextNIcons(this, this.markerCount);

        if (!this.idling) {
            let icons = this.path.get("icons");
            count = (this.mapOffset * this.queue[this.pos].travelTime);

            count = ++count;
            this.mapOffset = count / (this.queue[this.pos].travelTime);
            icons[1].offset = (this.mapOffset > 99) ? '100%' : this.mapOffset + '%';
            this.path.set("icons", icons);
            progressBar(this, icons[1].offset);

            if (this.mapOffset > 99) {
                this.mapOffset = 100;
                drawNextIcon(this, this.markerCount);

                if (this.queue[this.pos].idleTime != 0) {
                    setCurrTripIdle(this);
                    this.idling = true;
                }
                else
                    this.doneTrip = true;
            }
            else
                return;
        }

        if (this.idling) {
            count = (this.idleOffset * this.queue[this.pos].idleTime);

            count = ++count;
            this.idleOffset = count / this.queue[this.pos].idleTime;

            if (this.idleOffset > 99) {
                this.idleOffset = 100;
                this.doneTrip = true;
            }
            else
                return;
        }

        if(this.doneTrip) {            
            this.doneTrip = false;
            this.idling = false;
            this.mapOffset = 0;
            this.idleOffset = 0;

            this.clearPath();

            clearCurrTrip(this);

            this.updatePassengers(this.queue[this.pos]);
            //!event
            vehicleEvent(this, this.pos);

            if (this.tripIsPickup(this.pos))
                updateGeneralStats(this.queue[this.pos]);

            this.updateStats(this.queue[this.pos]);
            drawMaterial();

            if (this.pos == (this.queue.length - 1) && this.stops.length != 0) {
                this.updateQueue([]);
                this.updateStatus();
                this.pos = 0;
            }
            else if (this.pos == (this.queue.length - 1) && this.stops.length == 0) {
                this.updateQueue([]);
                this.updateStatus();
            }
            else {
                ++this.pos;
            }
        }
    }

    correctPosition() {
        let target = 0;

        this.resetState();

        findTarget: {
            let lastTrip = this.queue[this.queue.length - 1];

            if (this.queue.length == 0) {
                return;
            }
            else if (this.startTime > clockCurrTime) {
                this.autoDispatch();
                return;
            }
            else if ((lastTrip.startTime + lastTrip.travelTime + lastTrip.idleTime) < clockCurrTime) {
                target = this.queue.length;
                break findTarget;
            }
            else {
                for (let i = 0; i < this.queue.length; i++) {
                    if ((this.queue[i].startTime + this.queue[i].travelTime + this.queue[i].idleTime) > clockCurrTime) {
                        ++target;
                        break;
                    }

                    ++target;
                }

                if (target != 0)
                    --target;
            }
        }

        compileData: {
            while (this.pos < target) {
                clearCurrTrip(this);

                this.updatePassengers(this.queue[this.pos]);

                if (this.tripIsPickup(this.pos))
                    updateGeneralStats(this.queue[this.pos]);

                this.updateStats(this.queue[this.pos], this.pos);

                ++this.pos;
            }

            if (target == this.queue.length) {
                this.pos = 0;
                this.updateQueue([]);
                this.updateStatus();
                this.forceDispatch();
                return;
            }

            this.drawnTo = this.pos + 2;

            break compileData;
        }
        
        calcOffset: {
            let timeDiff = clockCurrTime - this.queue[this.pos].startTime;
            let hasIdle = (this.queue[this.pos].idleTime != 0) ? true : false;
            let hasTrip = (this.queue[this.pos].travelTime != 0) ? true : false;

            if (hasTrip) {
                if (timeDiff - this.queue[this.pos].travelTime > 0 && timeDiff - this.queue[this.pos].travelTime <= 0.5) {
                    this.mapOffset = 100;
                    this.idleOffset = 0;
                    break calcOffset;
                }
                else if (timeDiff - this.queue[this.pos].travelTime < 0) {
                    this.mapOffset = (timeDiff / this.queue[this.pos].travelTime) * 100;
                    this.idleOffset = 0;
                    break calcOffset;
                }
                else if (timeDiff - this.queue[this.pos].travelTime > 0) {
                    this.mapOffset = 100;
                    this.idleOffset = 0;
                    timeDiff -= this.queue[this.pos].travelTime;
                }
            }

            if (hasIdle) {
                progressBar(this, '100%');
                setCurrTripIdle(this);

                if (timeDiff - this.queue[this.pos].idleTime > 0 && timeDiff - this.queue[this.pos].idleTime <= 0.5) {
                    this.mapOffset = 100;
                    this.idleOffset = 100;
                    break calcOffset;
                }
                else if (timeDiff - this.queue[this.pos].idleTime < 0) {
                    this.mapOffset = 100;
                    this.idleOffset = (timeDiff / this.queue[this.pos].idleTime) * 100;
                    break calcOffset;
                }
                else if (timeDiff - this.queue[this.pos].idleTime > 0) {
                    this.mapOffset = 100;
                    this.idleOffset = ((this.queue[this.pos].idleTime + (timeDiff - this.queue[this.pos].idleTime)) / this.queue[this.pos].idleTime) * 100;
                    this.queue[this.pos].idleTime += (timeDiff - this.queue[this.pos].idleTime);
                    break calcOffset;
                }
            }

            if (!hasTrip && !hasIdle) {
                this.mapOffset = 0;
                this.idleOffset = 0;
                break calcOffset;
            }
        }

        this.autoDispatch();
    }

    async updateStats(trip, pos = 0) {
        if(!pos)
            pos = this.pos;

        if (trip.type == tripType.pickup) {
            calcVehiclePassengersServed(this);
            calcVehicleRevenue(this, pos);
        }
        calcVehicleIdle(this, pos);
        calcVehicleMileage(this, pos);

        updateVehicleStats(this, pos);
    }

    resetStats() {
        this.stats = {
            served: 0,
            idleTime: 0,
            mileage: 0,
            revenue: 0
        };

        this.formattedStats = {
            served: this.stats.served,
            idleTime: '0 min',
            mileage: '0 mi',
            revenue: '$ 0'
        };
    }

    autoDispatch() {
        if(this.status != vehStatus.starting)
            return;

        if (this.queue.length != 0 && this.startTime <= (clockCurrTime + 1)) {
            this.updateStatus();
            this.animate();
            return;
        }

        if (!this.dispatcher) {
            this.dispatcher = setInterval(() => {
                if (this.queue.length != 0 && this.startTime <= (clockCurrTime + 1)) {
                    this.dispatcher = clearInterval(this.dispatcher);
                    this.updateStatus();
                    this.animate();
                }
            }, (1000 * simSpeedFactor));
        }
    }

    forceDispatch() {
        if (this.status == vehStatus.route || this.status == vehStatus.loop)
            this.animate();
    }

    stopDispatch() {
        this.dispatcher = clearInterval(this.dispatcher);
    }
}

export { Vehicle };