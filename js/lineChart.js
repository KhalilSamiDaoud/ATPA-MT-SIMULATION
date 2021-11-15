import { colors } from './constants.js';
import { parseTime } from './parseInput.js';

class lineChart {
    constructor(file = null, chartID = 'body') {
        this.file = file;
        this.name = file.name;
        this.columns = file.colindexs;
        this.vehicles = file.vehindexs;
        this.chartID = chartID;
        this.lineChart = null;

        this.compiledData = this.compileData();
        this.highestPeak = { vehicle: 'n/a', color: 'brown-text', value: 0 };
        this.lowestPeak = { vehicle: 'n/a', color: 'brown-text', value: 0 };
        this.averagePeak = 0;

        this.options;
        this.data;

        this.findPeaks();
    }

    drawMaterial() {
        this.data = new google.visualization.DataTable();
        this.data.addColumn('timeofday', 'Time of Day');

        Object.keys(this.file.vehindexs).forEach(vehicle => {
            this.data.addColumn('number', vehicle);
        });

        this.data.addRows(this.compiledData);

        this.options = {
            titleTextStyle: {
                color: 'grey',
                bold: false,
                fontSize: 18,
            },
            title: this.name,
            hAxis: {
                title: 'Time (24hr)',
                titleTextStyle: {
                    italic: false,
                    color: 'grey',
                    fontSize: 16,
                },
                gridlines: {
                    count: 12
                },
                minorGridlines: {
                    count: 0
                }
            },
            vAxis: {
                title: 'Passenger Load',
                titleTextStyle: {
                    italic: false,
                    color: 'grey',
                    fontSize: 16,
                }
            },
            chartArea: {
                width: '80%',
            },
            series: {
                0: { color: '#ff0000' },
                1: { color: '#ab47bc' },
                2: { color: '#4caf50' },
                3: { color: '#2196f3' },
                4: { color: '#424242' },
                5: { color: '#009688' },
                6: { color: '#ff9800' },
                7: { color: '#f06292' },
                8: { color: '#8d6e63' },
                9: { color: '#ff5722' },
                10: { color: '#000000' },
            },
            theme: 'material',
            width: 1100,
            height: 275
        };

        if (this.lineChart == null)
            this.lineChart = new google.visualization.LineChart(document.getElementById(this.chartID));

        this.lineChart.draw(this.data, this.options);
    }

    compileData() {
        let dataMap = new Map();
        let offset = 0;

        let currRecord;
        let currRecordType;
        let currVeh;
        let currVehIndx;
        let currTime;

        for (const vehicle in this.vehicles) {
            currVeh = vehicle;
            currVehIndx = (Object.keys(this.vehicles).indexOf(vehicle) + 1);

            while (this.file.triplist[this.vehicles[vehicle] + offset]?.[this.columns.vehNumIndex] == currVeh) {
                currRecord = this.file.triplist[this.vehicles[vehicle] + offset];
                currRecordType = currRecord[this.columns.typeIndex];

                if (currRecordType == 'PU' || currRecordType == 'DO') {
                    currTime = parseTime(currRecord[this.columns.scheduleTimeIndex], 2);

                    if (dataMap.has(currTime[0])) {
                        dataMap.get(currTime[0])[currVehIndx] += (currRecordType == 'PU') ? 1 : -1;
                    }
                    else {
                        dataMap.set(currTime[0], this.createMapEntry(currTime[1]));
                        dataMap.get(currTime[0])[currVehIndx] += (currRecordType == 'PU') ? 1 : -1;
                    }
                }
                offset++;
            }
            offset = 0;
        }

        dataMap = new Map([...dataMap.entries()].sort((e1, e2) => e1[0] - e2[0]));
        console.log(dataMap);
        return this.map2CompiledArray(dataMap);
    }

    createMapEntry(timeArr) {
        let mapEntry = [timeArr];

        for (let i = 0; i < Object.keys(this.vehicles).length; i++) {
            mapEntry.push(0);
        }

        return mapEntry;
    }

    map2CompiledArray(map) {
        let compiledData = [];
        let prevValue;

        map.forEach(value => {
            if (prevValue) {
                for (let i = 1; i < value.length; i++) {
                    value[i] += prevValue[i];
                }
            }
            compiledData.push(value);
            prevValue = value;
        });

        return compiledData;
    }

    findPeaks() {
        let currPeak;
        let peaks = [];

        for (let col = 1; col < this.compiledData[0].length; col++) {
            currPeak = Number.MIN_SAFE_INTEGER;
            for (let row = 0; row < this.compiledData.length; row++) {
                if (this.compiledData[row][col] > currPeak) {
                    currPeak = this.compiledData[row][col];
                }
            }
            peaks.push(currPeak);
        }

        let max = peaks[0];
        let min = peaks[0];
        let maxIndex = 0;
        let minIndex = 0;

        for (let i = 1; i < peaks.length; i++) {
            if (peaks[i] > max) {
                maxIndex = i;
                max = peaks[i];
            }
        }

        for (let i = 1; i < peaks.length; i++) {
            if (peaks[i] < min) {
                minIndex = i;
                min = peaks[i];
            }
        }

        this.highestPeak.vehicle = Object.keys(this.file.vehindexs)[maxIndex];
        this.highestPeak.color = colors[maxIndex].class;
        this.highestPeak.value = max;

        this.lowestPeak.vehicle = Object.keys(this.file.vehindexs)[minIndex];
        this.lowestPeak.color = colors[minIndex].class;
        this.lowestPeak.value = min;

        this.averagePeak = Math.ceil(peaks.reduce((a, b) => a + b, 0) / peaks.length);
    }
}

export { lineChart };