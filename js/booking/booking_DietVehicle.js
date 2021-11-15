import { drawTripPath, map } from './booking_map.js';
import { vehStatus } from '../constants.js';

class DietVehicle {
    constructor(name = 'N/A', startTime = 0, stops = [], queue = []) {
        this.name = name;
        this.startTime = startTime;
        this.stops = stops;
        this.queue = queue;
        this.queueBackup = queue;

        this.status = vehStatus.starting;
        this.idling = false;
        this.pos = 0;
        this.mapOffset = 0;
        this.idleOffset = 0;
        this.symbol;
        this.path;

        this.mapInterval = undefined;
        this.dispatcher = undefined;
    }

    resetState() {
        this.status = vehStatus.starting;
        this.queue = this.queueBackup;
        this.pos = 0;

        this.stopDispatch();
        this.clearPath();
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
    }

    updateQueue(newQueue = this.queue) {
        this.queue = newQueue;

        if (this.queue.length == 0) {
            this.queue = this.stops;
        }
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

    clearPath() {
        if (this.path)
            this.path.setMap(null);
    }

    animate() {
        drawTripPath(this);
        this.path.setMap(map);

        let count = (this.mapOffset * this.queue[this.pos].travelTime);
        let icons = this.path.get("icons");

        this.mapInterval = setInterval(() => {
            if (!this.idling) {
                count = ++count;
                this.mapOffset = count / (this.queue[this.pos].travelTime);
                icons[1].offset = (this.mapOffset > 99) ? '100%' : this.mapOffset + '%';
                this.path.set("icons", icons);

                if (this.mapOffset > 99) {
                    this.mapInterval = clearInterval(this.mapInterval);

                    if (this.queue[this.pos].idleTime != 0) {
                        this.idling = true;
                    }
                }
            }
            else {
                this.mapInterval = clearInterval(this.mapInterval);
            }
            if (typeof this.mapInterval === 'undefined') {
                count = (this.idling) ? (this.idleOffset * this.queue[this.pos].idleTime) : 100;

                this.mapInterval = setInterval(() => {
                    if (this.idleOffset < 100) {
                        count = ++count;
                        this.idleOffset = count / (this.queue[this.pos].idleTime);
                    }
                    else {
                        this.mapInterval = clearInterval(this.mapInterval);
                        this.progInterval = clearInterval(this.progInterval);
                        this.idling = false;
                        this.mapOffset = 0;
                        this.idleOffset = 0;
                        this.clearPath();

                        if (this.pos == (this.queue.length - 1) && this.stops.length != 0) {
                            this.updateQueue([]);
                            this.updateStatus();
                            this.pos = 0;

                            this.animate();
                        }
                        else if (this.pos == (this.queue.length - 1) && this.stops.length == 0) {
                            this.updateQueue([]);
                            this.updateStatus();
                            this.clearIntervals();
                        }
                        else {
                            ++this.pos;
                            this.animate();
                        }
                    }
                }, 10);
            }
        }, 10);
    }

    correctPosition() {
        let target = 0;

        this.resetState();

        findTarget: {
            let lastTrip = this.queue[this.queue.length - 1];

            if (this.queue.length == 0) {
                return;
            }
            else if (this.startTime > window.opener.clockTimeValue) {
                this.autoDispatch();
                return;
            }
            else if ((lastTrip.startTime + lastTrip.travelTime + lastTrip.idleTime) < window.opener.clockTimeValue) {
                target = this.queue.length;
                break findTarget;
            }
            else {
                for (let i = 0; i < this.queue.length; i++) {
                    if ((this.queue[i].startTime + this.queue[i].travelTime + this.queue[i].idleTime) > window.opener.clockTimeValue) {
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
            let timeDiff = window.opener.clockTimeValue - this.queue[this.pos].startTime;
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

    autoDispatch() {
        if (this.status != vehStatus.starting)
            return;

        if (this.queue.length != 0 && this.startTime <= (window.opener.clockTimeValue + 1)) {
            this.updateStatus();
            this.animate();
            return;
        }

        if (typeof this.dispatcher === 'undefined') {
            this.dispatcher = setInterval(() => {
                if (this.queue.length != 0 && this.startTime <= (window.opener.clockTimeValue + 1)) {
                    this.dispatcher = clearInterval(this.dispatcher);
                    this.updateStatus();
                    this.animate();
                }
            }, 1000);
        }
    }

    forceDispatch() {
        if (this.status == vehStatus.route || this.status == vehStatus.loop)
            this.animate();
    }

    stopDispatch() {
        this.dispatcher = clearInterval(this.dispatcher);
    }

    clearIntervals() {
        this.progInterval = clearInterval(this.progInterval);
        this.mapInterval = clearInterval(this.mapInterval);
        this.dispatcher = clearInterval(this.dispatcher);
    }
}

export { DietVehicle };