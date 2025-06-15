// Karte auf Kanton Uri zentrieren (Koordinaten von Altdorf)
const map = L.map('map').setView([46.87, 8.63], 10);

// Swisstopo WMTS Layer einbinden (Pixelkarte farbig)
const swisstopoLayer = L.tileLayer(
    'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg',
    {
        attribution: '© <a href="https://www.swisstopo.admin.ch">swisstopo</a>',
        maxZoom: 18,
        tileSize: 256,
        opacity: 0.7
    }
);

// Swisstopo Höhenlinien Layer
const contourLines = L.tileLayer(
    'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.fixpunkte-hfp3/default/current/3857/{z}/{x}/{y}.png',
    {
        attribution: '© swisstopo (Höhenschichten)',
        maxZoom: 18,
        opacity: 0.7
    }
);

swisstopoLayer.addTo(map);
contourLines.addTo(map);

// Koordinatenanzeige bei Klick (LV95)
map.on('click', function(e) {
    const wgs84 = [e.latlng.lng, e.latlng.lat]; // [lon, lat]
    const lv95 = proj4('EPSG:4326', 'EPSG:2056', wgs84); // → [Easting, Northing]
    const easting = Math.round(lv95[0]);
    const northing = Math.round(lv95[1]);
    document.getElementById('coords').innerText =
        `LV95: E ${easting}, N ${northing}`;
});


let tracks = [];    // globale tracks-Variable
const trackLayers = {}; // Leaflet-GPX-Layers pro Track (Objekt: trackId → GPX-Layer)

const filterDone = document.getElementById('filter-done');
const filterDifficulty = document.getElementById('filter-difficulty');
const listDiv = document.getElementById('track-list');

async function renderTrackList(trackArray) {
    listDiv.innerHTML = '';
    trackArray.forEach(track => {
        const div = document.createElement('div');
        div.className = 'track-item';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = track.done;
        cb.addEventListener('change', async () => {
            const done = cb.checked;
            track.done = done;
            // filterTracks(tracks);
            console.log(`Track "${track.title}" gewandert: ${track.done}`);
            dateInput.hidden = !done;
            const date = done ? new Date().toISOString().slice(0, 10) : null;
            dateInput.value = date || '';

            await updateTrack(track.id, done, date);
        });

        const title = document.createElement('a');
        title.href = track.link;
        title.textContent = `${track.title} (${track.difficulty})`;
        title.target = '_blank';
        title.onclick = e => {
            e.preventDefault();
            // loadTrack(track);
        };

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.value = track.date || '';
        dateInput.hidden = !track.done;
        dateInput.addEventListener('change', async() => {
            // track.date = dateInput.value;
            console.log(`Datum für "${track.title}" gesetzt auf ${track.date}`);
            await updateTrack(track.id, cb.checked, dateInput.value);
        });

        div.appendChild(cb);
        div.appendChild(title);
        div.appendChild(dateInput);

        listDiv.appendChild(div);
    });
}

async function updateTrack(id, done, date) {
    await fetch('/api/tracks/update', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id, done, date })
    });
}

function filterTracks(tracks) {
    // console.log('filterTracks aufgerufen');
    const doneVal = filterDone.value;
    const diffVal = filterDifficulty.value;

    const filtered = tracks.filter(t => {
        if(doneVal === 'done' && !t.done) return false;
        if(doneVal === 'notdone' && t.done) return false;
        return !(diffVal !== 'all' && t.difficulty !== diffVal);

    });

    renderTrackList(filtered);

    // Layer auf der Karte anpassen
    tracks.forEach(track => {
        const layer = trackLayers[track.id];
        if (!layer) return;

        if (filtered.includes(track)) {
            if (!map.hasLayer(layer)) {
                layer.addTo(map);
            }
        } else {
            // Track ausblenden
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        }
    })
}

// TODO GRK: remove?
function loadTrack(track) {
    if(trackLayers[track.file]){
        map.addLayer(trackLayers[track.file]);
        map.fitBounds(trackLayers[track.file].getBounds());
        return;
    }
    trackLayers[track.file] = new L.GPX(track.file, {async: true}).on('loaded', e => {
        map.fitBounds(e.target.getBounds());
    }).addTo(map);
}

// Icons definieren
const startIcon = new L.Icon({
    iconUrl: '../icons/pin-icon-start.svg',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    shadowUrl: null
});

const endIcon = new L.Icon({
    iconUrl: '../icons/pin-icon-end.svg',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    shadowUrl: null
});

const wptIcon = new L.Icon({
    iconUrl: '../icons/pin-icon-wpt.svg',
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    shadowUrl: null
});

// TODO GRK: not working yet...
const wptIcons = {
    'default': new L.Icon({ iconUrl: '../icons/pin-icon-wpt.svg', iconSize: [20, 20], iconAnchor: [10, 20] }),
    'Berghütte': new L.Icon({ iconUrl: '../icons/huette.svg', iconSize: [20, 20], iconAnchor: [10, 20] }),
    'Bergbahn Bergstation': new L.Icon({ iconUrl: '../icons/bergstation.svg', iconSize: [20, 20], iconAnchor: [10, 20] }),
    'Bergbahn Talstation': new L.Icon({ iconUrl: '../icons/talstation.svg', iconSize: [20, 20], iconAnchor: [10, 20] }),
    'Gasthof': new L.Icon({ iconUrl: '../icons/gasthof.svg', iconSize: [20, 20], iconAnchor: [10, 20] }),
    'Spielplatz': new L.Icon({ iconUrl: '../icons/spielplatz.svg', iconSize: [20, 20], iconAnchor: [10, 20] }),
    'Alpe': new L.Icon({ iconUrl: '../icons/alpe.svg', iconSize: [20, 20], iconAnchor: [10, 20] }),
    'Berufsschule': new L.Icon({ iconUrl: '../icons/berufsschule.svg', iconSize: [20, 20], iconAnchor: [10, 20] })
}

function getWaypointIcon(wpt) {
    console.log("Waypoint type:", wpt.type, "sym:", wpt.sym, "name:", wpt.name);
    const typeKey = wpt.type || wpt.sym || "";
    return icons[typeKey] || icons["default"];
}

function formatDistance(meters) {
    const km = meters / 1000;              // in Kilometer umrechnen
    return (Math.round(km * 10) / 10) + ' km';  // auf 1 Nachkommastelle runden und "km" anhängen
}

fetch('api/tracks')
    .then(res => res.json())
    .then(data => {
        tracks = data;

        tracks.forEach(track => {
            const color = track.done ? 'green' : 'red';

            const gpxLayer = new L.GPX(track.file, {
                async: true,
                marker_options: {
                    startIcon: startIcon,
                    endIcon: endIcon,
                    shadowUrl: null,
                    wptIconUrls: { '' : wptIcon },
                    wptIcons: { '' : wptIcons['default'] },
                },
                polyline_options: {
                    color: color,
                    weight: 4,
                    opacity: 0.75
                }
            });

            trackLayers[track.id] = gpxLayer;

            gpxLayer.on('loaded', function(e) {
                const gpx = e.target;
                gpx.bindPopup(`
                  <b>${track.title}</b><br/>
                  Schwierigkeit: ${track.difficulty}<br/>
                  Strecke: ${formatDistance(gpx._info.length)}<br/>
                  Aufstieg: ${Math.round(gpx._info.elevation.gain)} m<br/>
                  Abstieg: ${Math.round(gpx._info.elevation.loss)} m<br/>
                  <a href="${track.link}" target="_blank">Details</a><br/>
                  ${track.done ? '✅ Gewandert am ' + track.date : '🚶 Noch nicht gewandert'}
                `);
            });

            gpxLayer.addTo(map);
        });

        filterDone.onchange = function () {
            // console.log("filter done changed");
            filterTracks(tracks);
        }
        filterDifficulty.onchange = function () {
            filterTracks(tracks);
        }
        // initial
        filterTracks(tracks);
    })
    .catch(err => console.error('Fehler beim Laden der tracks.json:', err));