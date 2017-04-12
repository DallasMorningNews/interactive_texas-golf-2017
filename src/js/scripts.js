/* global mapboxgl: true; GeoJSON: true */

import $ from 'jquery';
import pym from 'pym.js';

const pymChild = new pym.Child();

// our three different course lists
let top100 = [];
let pub50 = [];
let topPub = [];

// paths to our json data
const sourceArray = [
  '//interactives.dallasnews.com/data-store/2017/04-2017-texas-golf-public-test.json',
  '//interactives.dallasnews.com/data-store/2017/04-2017-texas-golf-top-100-test.json',
  '//interactives.dallasnews.com/data-store/2017/04-2017-texas-golf-pub-50-test.json',
];

/*
================================
== MAP SETUP
================================
*/


const map = new mapboxgl.Map({
  container: 'map',
  style: 'http://maps.dallasnews.com/styles.json',
  center: [-99.10238, 31.23492],
  zoom: 5,
});

map.scrollZoom.disable();
map.addControl(new mapboxgl.NavigationControl());


function drawMap() {
  map.addSource('top100', {
    type: 'geojson',
    data: top100,
  });

  map.addLayer({
    id: 'top100courses',
    source: 'top100',
    type: 'circle',
    paint: {
      'circle-radius': {
        stops: [[5, 4], [8, 6], [11, 8]],
      },
      'circle-color': {
        property: 'access',
        type: 'categorical',
        stops: [
          ['private', '#4575b4'],
          ['public', '#fec44f'],
        ],
      },
      'circle-opacity': 0.75,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#FFFFFF',
    },
  });

  map.addSource('pub50', {
    type: 'geojson',
    data: pub50,
  });

  map.addLayer({
    id: 'pub50courses',
    source: 'pub50',
    type: 'circle',
    paint: {
      'circle-radius': {
        stops: [[5, 4], [8, 11], [11, 16]],
      },
      'circle-color': '#52b033',
      'circle-opacity': 0.75,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#FFFFFF',
    },
    layout: {
      visibility: 'none',
    },
  });

  map.addSource('topPub', {
    type: 'geojson',
    data: topPub,
  });

  map.addLayer({
    id: 'topPubCources',
    source: 'topPub',
    type: 'circle',
    paint: {
      'circle-radius': {
        stops: [[5, 4], [8, 11], [11, 16]],
      },
      'circle-color': {
        property: 'classification',
        type: 'categorical',
        stops: [
          ['Expensive', '#800026'],
          ['High', '#fc4e2a'],
          ['Economy', '#fed976'],

        ],
      },
      'circle-opacity': 0.85,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#FFFFFF',
    },
    layout: {
      visibility: 'none',
    },
  });


  map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, {});

    if (!features.length) {
      return;
    }

    const feature = features[0];
    console.log(feature);
    let content = '';
    if (!feature.properties.access) {
      content += `<h6>${feature.properties.rank}. ${feature.properties.classifcation} courses</h6>`;
    }
    if (feature.properties.access) {
      content += `<h5>${feature.properties.rank}.  ${feature.properties.coursename}</h5>`;
    } else {
      content += `<h5>${feature.properties.coursename}</h5>`;
    }

    content += `<p><strong>Location: </strong>${feature.properties.city}</p>`;
    if (feature.properties.fee !== 'N/A') {
      content += `<p><strong>Fee: </strong>$${feature.properties.fee}</p>`;
    }
    if (feature.properties.url) {
      content += `<a href='${feature.properties.url}' targe='_blank'>${feature.properties.url}</a>`;
    }

    const popup = new mapboxgl.Popup()
      .setLngLat(feature.geometry.coordinates)
      .setHTML(content);


    popup.addTo(map);


    map.flyTo({ center: features[0].geometry.coordinates, zoom: 9 });
  });

  map.on('mousemove', (e) => {
    const features = map.queryRenderedFeatures(e.point, {});
    map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
  });


  $('#switcher').click(() => {
    console.log('switch');
    map.setLayoutProperty('top100courses', 'visibility', 'none');
    map.setLayoutProperty('pub50courses', 'visibility', 'visible');
  });
}

/*
================================
== DATA SETUP
================================
*/

// getting our data
function getData() {
  // i is a counter to see how much of our data has been retrieved
  let i = 0;
  // DATADRAWS is our total number of data files to retrieve
  const DATADRAWS = 3;

  // we're going to go out and get each of our data files, then as they are retrieved
  // itterate our counter by one, then check if we've retrieved all of the data files
  // if we have, we'll run our initial map drawing function
  $.getJSON(sourceArray[0], (data) => {
    topPub = GeoJSON.parse(data, { Point: ['latitude', 'longitude'] });
    i += 1;
    if (i >= DATADRAWS) { drawMap(); }
  });

  $.getJSON(sourceArray[1], (data) => {
    top100 = GeoJSON.parse(data, { Point: ['latitude', 'longitude'] });
    i += 1;
    if (i >= DATADRAWS) { drawMap(); }
  });

  $.getJSON(sourceArray[2], (data) => {
    pub50 = GeoJSON.parse(data, { Point: ['latitude', 'longitude'] });
    i += 1;
    if (i >= DATADRAWS) { drawMap(); }
  });
}

// when the map is loaded, we'll start gathering our data
map.on('load', () => getData());

// Call this every time you need to resize the iframe, after your
// graphic is drawn, etc.
pymChild.sendHeight();
