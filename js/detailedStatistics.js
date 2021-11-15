import { calcTableBody, calcPercentDifference } from './simMath.js';
import { files, processAndFormatExcel } from './fileInput.js';
import { dstatsTableHeader } from './constants.js';
import { lineChart } from './lineChart.js';

const detailedStatsButton = document.getElementById('detailstats');
const detailedStatsChartDiv = document.getElementById('mstatscharts');
const detailedStatsTabDiv = document.getElementById('mstatstabs');
const detailedStatsTablesDiv = document.getElementById('mstatstables');
const detailedStatsPerfRankingDiv = document.getElementById('mstatsperfranking');
const detailedStatsPerfNotesDiv = document.getElementById('mstatsperfnotes');

detailedStatsButton.addEventListener('click', calcDetailedStats);

let parsedFiles = [];
let globStats = [];

let processingModal;
let detailedStatsModal;

async function calcDetailedStats() {
    if (files?.length) {
        startStatModals();

        await getFileInformation(files)
            .then(() => {
                clearDetailedStats();
                createLineCharts();
                createVehicleTables();
                createPerformanceStats();
            })
            .then(() => {
                finishStatModals();
            });
    }
}

//UI
function createLineCharts() {
    let tempChart
    let tempID

    parsedFiles.forEach(file => {
        tempID = file.name + parsedFiles.indexOf(file);
        tempChart = new lineChart(file, tempID);

        const containerDiv = document.createElement('div');
        containerDiv.classList.add('dstats-charts');

        const graphDiv = document.createElement('div');
        graphDiv.setAttribute('id', tempID);

        const outerBlockquote = document.createElement('blockquote');
        outerBlockquote.classList.add('dstats-charts-blockquote');

        const dividerDiv = document.createElement('div');
        dividerDiv.classList.add('divider');

        const highestPara = document.createElement('p');
        highestPara.innerHTML = '&nbsp- Highest Peak (' + tempChart.highestPeak.value + ')';
        const highestAncr = document.createElement('a');
        highestAncr.setAttribute('class', tempChart.highestPeak.color + ' left');
        highestAncr.innerHTML = tempChart.highestPeak.vehicle;
        highestPara.appendChild(highestAncr);

        const lowestPara = document.createElement('p');
        lowestPara.innerHTML = '&nbsp- Lowest Peak (' + tempChart.lowestPeak.value + ')';
        const lowestAncr = document.createElement('a');
        lowestAncr.setAttribute('class', tempChart.lowestPeak.color + ' left');
        lowestAncr.innerHTML = tempChart.lowestPeak.vehicle;
        lowestPara.appendChild(lowestAncr);

        const averagePara = document.createElement('p');
        averagePara.innerHTML = 'Average Peak Load: ' + tempChart.averagePeak;

        containerDiv.appendChild(graphDiv);
        outerBlockquote.appendChild(highestPara);
        outerBlockquote.appendChild(lowestPara);
        outerBlockquote.appendChild(dividerDiv);
        outerBlockquote.appendChild(averagePara);
        containerDiv.appendChild(outerBlockquote);
        detailedStatsChartDiv.appendChild(containerDiv);

        tempChart.drawMaterial();
    });
}

function createVehicleTables() {
    parsedFiles.forEach(file => {
        let formattedName = file.name.replace(/\s/g, '');

        const tabLi = document.createElement('li');
        tabLi.setAttribute('id', formattedName + 'tab');
        tabLi.classList.add('tab');
        const tabAncr = document.createElement('a');
        tabAncr.setAttribute('href', '#' + formattedName + 'table');
        tabAncr.innerHTML = file.name;
        if (!detailedStatsTabDiv.firstChild)
            tabAncr.classList.add('active');

        const tableDiv = document.createElement('div');
        tableDiv.setAttribute('id', formattedName + 'table');
        tableDiv.setAttribute('class', 'col s12');

        const table = document.createElement('table');
        table.classList.add('striped');

        const tableHead = document.createElement('thead');
        tableHead.innerHTML = dstatsTableHeader;

        const tableBody = document.createElement('tbody');
        tableBody.setAttribute('id', formattedName + 'tablebody')

        tabLi.appendChild(tabAncr);
        detailedStatsTabDiv.appendChild(tabLi);

        table.appendChild(tableHead);
        table.appendChild(tableBody);
        tableDiv.appendChild(table);
        detailedStatsTablesDiv.appendChild(tableDiv);

        globStats.push(calcTableBody(file, tableBody.id));
    });
}

function createPerformanceStats() {
    if (files.length <= 1) {
        const noRankingPara = document.createElement('p');
        noRankingPara.setAttribute('class', 'grey-text dstats-rank-none');
        noRankingPara.innerHTML = 'Nothing to compare (multi-file only)';

        detailedStatsPerfRankingDiv.appendChild(noRankingPara);
    }
    else {
        let count = 1;
        let top;
        let isTop;
        let currDiff;

        let perfCardType = [
            'avgWait',
            'avgTime',
            'avgIdle'
        ]
        let perfCardText = [
            'wait times',
            'trip times',
            'idle times'
        ]

        globStats.sort((a, b) => (a.avgWait > b.avgWait) ? 1 : -1);
        top = globStats[0];
        isTop = true;

        globStats.forEach(entry => {
            const rankingPara = document.createElement('p');
            rankingPara.setAttribute('class', 'dstats-rank-' + count);
            rankingPara.innerHTML = entry.name + ' - #' + count;

            detailedStatsPerfRankingDiv.appendChild(rankingPara);
            count++;
        });

        for(let i = 0; i < 3; i++) {
            switch(i) {
                case 1:
                    //trip time
                    globStats.sort((a, b) => (a.avgTime > b.avgTime) ? 1 : -1);
                    break;
                case 2:
                    //idle time
                    globStats.sort((a, b) => (a.avgIdle > b.avgIdle) ? 1 : -1);
                    break;
                default:
                    break;
            }
            isTop = (globStats[0].name === top.name);

            if (isTop)
                currDiff = calcPercentDifference(globStats[0][perfCardType[i]], globStats[1][perfCardType[i]], true);
            else
                currDiff = calcPercentDifference(globStats[globStats.indexOf(top)][perfCardType[i]], globStats[0][perfCardType[i]], true);

            const noteDiv = document.createElement('div');
            noteDiv.setAttribute('class', 'grey lighten-4 valign-wrapper dstats-perf-card');

            const notePercentPara = document.createElement('p');
            if (isTop)
                notePercentPara.setAttribute('class', 'green-text text-lighten-2 dstats-perf-card-percentage');
            else
                notePercentPara.setAttribute('class', 'red-text text-lighten-2 dstats-perf-card-percentage');
            notePercentPara.innerHTML = currDiff;

            const noteDescPara = document.createElement('p');
            noteDescPara.setAttribute('class', 'right black-text dstats-perf-card-desc');
            noteDescPara.innerHTML = ((isTop) ? 'lower' : 'higher') + ' <b>' + perfCardText[i] +'</b> on average than \'<em>' +
                ((isTop) ? globStats[1].name : globStats[0].name) + '</em>\'';

            notePercentPara.appendChild(noteDescPara);
            noteDiv.appendChild(notePercentPara);
            detailedStatsPerfNotesDiv.appendChild(noteDiv);
        }
    }
}

function clearDetailedStats() {
    globStats = [];

    while (detailedStatsChartDiv.firstChild) {
        detailedStatsChartDiv.removeChild(detailedStatsChartDiv.firstChild);
    }
    while (detailedStatsTabDiv.firstChild) {
        detailedStatsTabDiv.removeChild(detailedStatsTabDiv.firstChild);
    }
    while (detailedStatsTablesDiv.firstChild) {
        detailedStatsTablesDiv.removeChild(detailedStatsTablesDiv.firstChild);
    }
    while (detailedStatsPerfRankingDiv.firstChild) {
        detailedStatsPerfRankingDiv.removeChild(detailedStatsPerfRankingDiv.firstChild);
    }
    while (detailedStatsPerfNotesDiv.firstChild) {
        detailedStatsPerfNotesDiv.removeChild(detailedStatsPerfNotesDiv.firstChild);
    }
}

async function getFileInformation(files) {
    let tempFileInfo;

    if (files?.length) {
        parsedFiles = [];

        for (const file of files) {
            tempFileInfo = await processAndFormatExcel(file);
            parsedFiles.push({
                name: file.name,
                triplist: tempFileInfo[0],
                vehindexs: tempFileInfo[1],
                colindexs: tempFileInfo[2]
            });
        }
    }
}

function startStatModals() {
    processingModal = M.Modal.init(document.getElementById('modalprocessing'), {
        dismissible: false,
        inDuration: 0,
        outDuration: 0
    });
    detailedStatsModal = M.Modal.init(document.getElementById('modalstats'), {
        inDuration: 0,
        outDuration: 0
    });

    detailedStatsModal.open();
    processingModal.open();
    document.getElementById('modalstats').style.visibility = 'collapse';
}

function finishStatModals() {
    processingModal.close();
    document.getElementById('modalstats').style.visibility = 'visible';

    M.Tabs.init(detailedStatsTabDiv, {});
}

export { detailedStatsButton };