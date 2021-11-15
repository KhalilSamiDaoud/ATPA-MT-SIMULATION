class Trip {
    constructor(name = 'N/A', type = tripType.unknown, PUcoords = { lat: 0.0, lng: 0.0 }, DOcoords = { lat: 0.0, lng: 0.0 }, PUadr = 'N/A',
        DOadr = 'N/A', travelTime = 0, idleTime = 0, waitTime = 0, passengers = 0, distance = 0, startTime = 0, booked = false) {

        this.name = name;
        this.type = type;
        this.PUcoords = PUcoords;
        this.DOcoords = DOcoords;
        this.PUadr = PUadr;
        this.DOadr = DOadr;
        this.travelTime = travelTime;
        this.idleTime = idleTime;
        this.waitTime = waitTime;
        this.passengers = passengers;
        this.distance = distance;
        this.startTime = startTime;
        this.booked = booked;
    }
}

export { Trip };