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
  zoom: 4.5,
});

map.scrollZoom.disable();
map.addControl(new mapboxgl.NavigationControl());


function drawMap() {
  console.log(top100);
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
          ['Private', '#4575b4'],
          ['Public', '#fec44f'],
        ],
      },
      'circle-opacity': {
        property: 'access',
        type: 'categorical',
        stops: [
          ['Private', 0.75],
          ['Public', 0.75],
        ],
      },
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
    id: 'topPubCourses',
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
      'circle-opacity': {
        property: 'classification',
        type: 'categorical',
        stops: [
          ['Expensive', 0.85],
          ['High', 0.85],
          ['Economy', 0.85],
        ],
      },
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
      content += `<h6>${feature.properties.rank}. ${feature.properties.classification} courses</h6>`;
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


  // SWAPPING VIEWS ////////////////////////////////////////////////////////

  function swapViews(view) {
    // hide both filter groups
    $('.select--filter-group').addClass('noshow');
    if (view === 'top-100') {
      // if top-100, display it's filter group and display only it's map layer

      $('#select__top100').removeClass('noshow');
      map.setLayoutProperty('top100courses', 'visibility', 'visible');
      map.setLayoutProperty('topPubCourses', 'visibility', 'none');
      map.setLayoutProperty('pub50courses', 'visibility', 'none');
    } else {
      // if it's public, display it's filter group, then determine if the top50
      // layer is set to be active, and display it. if not, display the topPubCourses layer
      $('#select__public').removeClass('noshow');
      if ($('#select__top50').hasClass('select--active') === true) {
        console.log('true');
        map.setLayoutProperty('top100courses', 'visibility', 'none');
        map.setLayoutProperty('topPubCourses', 'visibility', 'none');
        map.setLayoutProperty('pub50courses', 'visibility', 'visible');
      } else {
        map.setLayoutProperty('top100courses', 'visibility', 'none');
        map.setLayoutProperty('topPubCourses', 'visibility', 'visible');
        map.setLayoutProperty('pub50courses', 'visibility', 'none');
      }
    }
  }

  // when the top 100/public nav li is clicked ...
  $('#golf-nav li').click(function () {
    // get the id
    const view = $(this).attr('id');

    // set the proper li to the active state
    $('#golf-nav li').removeClass('nav--active');
    $(this).addClass('nav--active');

    // and pass the id to the swapViews function, which displays the right filter box
    // and map layers
    swapViews(view);
  });


  // if one of the filters for the top 100 is clicked ...
  $('#select__top100 .select__option').click(function () {
    // toggle it's active class
    $(this).toggleClass('select--active');

    // set up variables for stops and what li elements to filter through
    const stops = [];
    const filters = $(this).parent('ul').children('.select__option');

    // iterate through the filters
    $.each(filters, function () {
      // create an array for that filter's stop
      const stop = [];
      // set the first position to the text of the filter
      stop[0] = $(this).text();
      // check if that filter is activated, and if so, set the second position to 0.75
      // if not, set to 0
      stop[1] = $(this).hasClass('select--active') === true ? 0.75 : 0;

      // push that stop to the stops array
      stops.push(stop);
    });

    // create a new paint object using the stops array
    const paint = {
      property: 'access',
      type: 'categorical',
      stops,
    };

    // update the layer's circle-opacity paint property with the new paint object
    map.setPaintProperty('top100courses', 'circle-opacity', paint);
  });

  // if one of the public course filters is clicked ...
  $('#select__public .select__option').click(function () {
    // check if it's the top50 filter
    if ($(this).attr('id') === 'select__top50') {
      // if it is, set only that filter to the active state
      $('#select__public .select__option').removeClass('select--active');
      $(this).addClass('select--active');

      // hide the other pubcourses layers and show the pub50 layer
      map.setLayoutProperty('topPubCourses', 'visibility', 'none');
      map.setLayoutProperty('pub50courses', 'visibility', 'visible');
    } else {
      // if it's not the pub50 filter, toggle the active class
      $(this).toggleClass('select--active');

      // turn off the top50 filter active class
      $('#select__top50').removeClass('select--active');

      // create new variables for stops and the filters to iterate through
      const stops = [];
      const filters = $(this).parent('ul').children('.select__sub-filter');

      // iterate through the filters
      $.each(filters, function () {
        // create a new stop for each filter
        const stop = [];
        // set the stop's first position to the string of the filter selected
        // and the second position to an opacity value that reflects whether the filter
        // was selected or not
        stop[0] = $(this).text();
        stop[1] = $(this).hasClass('select--active') === true ? 0.85 : 0;

        // push that stop to the stops array
        stops.push(stop);
      });

      // create a new paint object using the stops array
      const paint = {
        property: 'classification',
        type: 'categorical',
        stops,
      };

      // update the pubCourses circle-opacity paint property
      map.setPaintProperty('topPubCourses', 'circle-opacity', paint);

      // hide the pub50 layer and display the topPub layer
      map.setLayoutProperty('topPubCourses', 'visibility', 'visible');
      map.setLayoutProperty('pub50courses', 'visibility', 'none');
    }
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
