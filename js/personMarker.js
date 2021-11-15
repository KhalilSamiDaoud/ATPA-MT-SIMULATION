import { colors, dropoffSVG, pickupSVG, bookedSVG } from './constants.js';
import { map } from './map.js';

class PersonMarker {
    constructor(name = 'APTA Booking Marker', color = colors[0], PUcoords = null, 
                DOcoords = null, PUtime = '12:00:00', DOtime = '12:00:00') {
        this.name = name;
        this.color = color;
        this.PUcoords = PUcoords;
        this.DOcoords = DOcoords;
        this.PUtime = PUtime;
        this.DOtime = DOtime;

        this.PUsymbol;
        this.DOsymbol;
        this.PUBKsymbol;
        this.DOBKsymbol;

        this.createPersonMarkers();
    }

    createPersonMarkers() {
        if(this.PUcoords) {
            this.PUsymbol = new google.maps.Marker({
                position: this.PUcoords,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + 
                        encodeURIComponent(pickupSVG.replace('{{ color }}', this.color.hex)),
                    scaledSize: new google.maps.Size(35, 35),
                    labelOrigin: new google.maps.Point(15, 0),
                    fixedRotation: false,
                },
                label: {
                    text: this.name + '\'s Pick-up [' + this.PUtime + ']',
                    color: '#ffffff',
                    className: 'APTA-pickup'
                },
                map: map
            });

            this.PUBKsymbol = new google.maps.Marker({
                position: this.PUsymbol.getPosition(),
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(bookedSVG),
                    scaledSize: new google.maps.Size(25, 25),
                    anchor: new google.maps.Point(-12, 33),
                    fixedRotation: false,
                },
                map: this.PUsymbol.getMap()
            });

            this.PUBKsymbol.bindTo("position", this.PUsymbol);
            this.PUBKsymbol.bindTo("map", this.PUsymbol);
        }

        if(this.DOcoords) {
            this.DOsymbol = new google.maps.Marker({
                position: this.DOcoords,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + 
                        encodeURIComponent(dropoffSVG.replace('{{ color }}', this.color.hex)),
                    scaledSize: new google.maps.Size(35, 35),
                    labelOrigin: new google.maps.Point(15, 0),
                    fixedRotation: false
                },
                label: {
                    text: this.name + '\'s Drop-off [' + this.DOtime + ']',
                    color: '#ffffff',
                    className: 'APTA-dropoff',
                },
                map: map
            });

            this.DOBKsymbol = new google.maps.Marker({
                position: this.DOsymbol.getPosition(),
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(bookedSVG),
                    scaledSize: new google.maps.Size(25, 25),
                    anchor: new google.maps.Point(-10, 35),
                    fixedRotation: false
                },
                map: this.DOsymbol.getMap()
            });

            this.DOBKsymbol.bindTo("position", this.DOsymbol);
            this.DOBKsymbol.bindTo("map", this.DOsymbol);
        }
    }

    removePUMarker() {
        if(this.PUsymbol)
            this.PUsymbol.setMap(null);
    }

    removeDOMarker() {
        if(this.DOsymbol)
            this.DOsymbol.setMap(null);
    }

    removePersonMarkers() {
        this.removePUMarker();
        this.removeDOMarker();
    }


}

export { PersonMarker }