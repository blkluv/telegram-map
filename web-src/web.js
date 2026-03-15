import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Geocoder from 'ol-geocoder';
import Popup from 'ol-popup';
import axios from 'axios';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Circle as CircleStyle, Stroke, Style, Fill, Text } from 'ol/style';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';

import { trilaterate, fromLonLat_epsg4978, toLonLat_epsg4978 } from './trilaterate.js';
import SnailShellMatrix from './SnailShellMatrix.js';
import { flashFeature } from './utils.js';

var searchDistance = 500;
var searchInterval = 25 * 1000;
var flashDuration = 3000;
var cancel = false;
var users = {};
var userIdIndex = 0;
var usersIndex = {};
var usersIgnored = [];
var ssm, flashInterval, currentMarker;

// OSM base layer
var layer = new TileLayer({
  source: new OSM(),
});

// map init
var map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

// marker styles
var stylePositions = new Style({
  image: new CircleStyle({
    fill: new Fill({
      color: 'rgba(55,200,150,0.5)',
    }),
    stroke: new Stroke({
      width: 2,
      color: 'rgba(255,5,5,1)',
    }),
    radius: 7,
  }),
});

let styleUsers = new Style({
  image: new CircleStyle({
    fill: new Fill({ color: '#fff' }),
    stroke: new Stroke({
      width: 2,
      color: 'rgba(0,0,0,1)',
    }),
    radius: 15,
  }),
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({ color: '#000' }),
    stroke: new Stroke({
      color: '#fff',
      width: 3,
    }),
  }),
});

// position markers
var source = new VectorSource({ wrapX: false });

var vector = new VectorLayer({
  source: source,
  style: stylePositions,
});

map.addLayer(vector);

// user markers
var sourceUsers = new VectorSource({ wrapX: false });

var vectorUsers = new VectorLayer({
  source: sourceUsers,
  style: function (feature) {
    styleUsers.getText().setText(feature.get('name'));
    return styleUsers;
  },
});

map.addLayer(vectorUsers);

// geocoder
var geocoder = new Geocoder('nominatim', {
  provider: 'osm',
  targetType: 'glass-button',
  lang: 'en',
  placeholder: 'Map search ...',
  limit: 5,
  keepOpen: false,
  autoComplete: true,
});

map.addControl(geocoder);

// flash animation
source.on('addfeature', function (e) {
  currentMarker = e.feature;

  flashFeature(map, layer, currentMarker, flashDuration);

  flashInterval = window.setInterval(
    () => flashFeature(map, layer, currentMarker, flashDuration),
    2000
  );
});

// add position marker
function addPositionMarker(c) {
  var geom = new Point(c);
  var feature = new Feature(geom);
  source.addFeature(feature);
}

// add user marker
function addUserMarker(c, text) {
  var geom = new Point([
    c[0] + Math.floor(Math.random()) * 20,
    c[1] - Math.floor(Math.random()) * 20,
  ]);

  var feature = new Feature(geom);
  feature.set('name', text);
  sourceUsers.addFeature(feature);
}

// nearby search
function searchNearby(searchCoordinates) {
  if (cancel) return;

  addPositionMarker(searchCoordinates);

  let c = toLonLat(searchCoordinates);

  axios
    .post('/getNearby', { lon: c[0], lat: c[1] })
    .then((res) => {
      clearInterval(flashInterval);

      let nextPoint = ssm.getNext()[1];

      setTimeout(() => searchNearby(nextPoint), searchInterval);

      refreshNearby(searchCoordinates, res.data);
    })
    .catch((error) => {
      alert(error);
      console.error(error);
    });
}

// refresh user list
function refreshNearby(coordinates, nearbyUsers) {
  let now = new Date().getTime();

  for (let i in nearbyUsers) {
    let d = {
      time: now,
      coordinates: coordinates,
      distance: nearbyUsers[i].distance,
    };

    if (users[i] === undefined) {
      users[i] = {};

      users[i].relId = ++userIdIndex;
      usersIndex[users[i].relId] = i;

      users[i].userId = nearbyUsers[i].userId;
      users[i].name = nearbyUsers[i].name;

      users[i].photo =
        nearbyUsers[i].photo === undefined
          ? `/no_photo.png`
          : `/photos/${nearbyUsers[i].photo}`;

      users[i].distances = [d];
      users[i].locations = [];
    } else {
      users[i].distances.push(d);

      if (usersIgnored.includes(users[i].relId)) continue;

      if (users[i].distances.length % 3 === 0) {
        let lastDistances = users[i].distances.slice(
          users[i].distances.length - 3
        );

        let c1 = toLonLat(lastDistances[0].coordinates);
        let c2 = toLonLat(lastDistances[1].coordinates);
        let c3 = toLonLat(lastDistances[2].coordinates);

        let p1 = fromLonLat_epsg4978({ lon: c1[0], lat: c1[1] });
        let p2 = fromLonLat_epsg4978({ lon: c2[0], lat: c2[1] });
        let p3 = fromLonLat_epsg4978({ lon: c3[0], lat: c3[1] });

        p1.r = lastDistances[0].distance;
        p2.r = lastDistances[1].distance;
        p3.r = lastDistances[2].distance;

        let triP = trilaterate(p1, p2, p3, true);

        if (triP !== null) {
          let triLonLat = toLonLat_epsg4978(triP);

          let triC = fromLonLat([triLonLat.lon, triLonLat.lat]);

          users[i].locations.push({
            time: now,
            coordinates: triC,
          });

          addUserMarker(triC, users[i].relId.toString());
        }
      }
    }
  }
}
