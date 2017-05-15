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
  '//interactives.dallasnews.com/data-store/2017/04-2017-texas-golf-public.json',
  '//interactives.dallasnews.com/data-store/2017/04-2017-texas-golf-top-100.json',
  '//interactives.dallasnews.com/data-store/2017/04-2017-texas-golf-pub-50.json',
];

/*
================================
== MAP SETUP
================================
*/


const map = new mapboxgl.Map({
  container: 'map',
  style: 'https://maps.dallasnews.com/styles.json',
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
          ['Economy', '#fec633'],
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
  $('#map__nav li.view__selector').click(function () {
    // get the id
    const view = $(this).attr('id');

    // set the proper li to the active state
    $('#map__nav li').removeClass('nav--active');
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
    const stops = ['any'];
    const filters = $(this).parent('ul').children('.select__option');

    // iterate through the filters
    $.each(filters, function () {
      // if the filter has a select--active class, create a filter array for the
      // appropriate set of courses
      if ($(this).hasClass('select--active') === true) {
        const text = $(this).text();
        const key = 'access';
        const filter = ['==', key, text];
        // push that stop to the stops array
        stops.push(filter);
      }
    });

    // apply tghat filter set to the top100courses layer
    map.setFilter('top100courses', stops);
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
      const stops = ['any'];
      const filters = $(this).parent('ul').children('.select__sub-filter');

      // iterate through the filters
      $.each(filters, function () {
        // create a new filter array for corresponding set of courses
        if ($(this).hasClass('select--active') === true) {
          const text = $(this).text();
          const key = 'classification';
          const filter = ['==', key, text];
          // push that stop to the stops array
          stops.push(filter);
        }
      });

      // apply the filter set to topPubCourses layer
      map.setFilter('topPubCourses', stops);

      // hide the pub50 layer and display the topPub layer
      map.setLayoutProperty('topPubCourses', 'visibility', 'visible');
      map.setLayoutProperty('pub50courses', 'visibility', 'none');
    }
  });
}

/*
================================
== BUILD TABLES
================================
*/

// pass our data set and the target id of the table we want to build
function drawTable(data, target) {
  // pull just the features from the geojson data set
  const courses = data.features;

  // iterate through those features, and build out the row for each course, then
  // append that row to the target table
  $.each(courses, (k, v) => {
    const properties = v.properties;
    if (target === 'top-100-table') {
      const row = `<tr><td>${properties.rank}</td><td>${properties.coursename}</td><td>${properties.city}</td><td>${properties.access}</td><td>${properties.fee}</td>`;
      $(`#${target}`).append(row);
    } else {
      const row = `<tr><td>${properties.rank}</td><td>${properties.coursename}</td><td>${properties.city}</td><td>${properties.fee}</td>`;
      $(`#${target}`).append(row);
    }
  });

  // lastly, resize the embed
  pymChild.sendHeight();
}

// clicking one of the table nav views
$('#table__nav ul li.view__selector').click(function () {
  // remove the active class from all view__selectors, then add the nav--active
  // class to the clicked view__selector
  $('#table__nav ul li').removeClass('nav--active');
  $(this).addClass('nav--active');

  // hide all tables
  $('.golf__table').addClass('noshow');

  // grab the data-target attribute of the view__selector clicked. This corresponds
  // to the table id
  const tarTable = $(this).attr('data-target');

  // show the corresponding table
  $(`#${tarTable}`).removeClass('noshow');

  // grab the new height and adjust the embed
  pymChild.sendHeight();
});


/*
================================
== CONTENT SWITCHER
================================
*/

$('#content-switcher').click(function () {
  if ($(this).children('i').hasClass('fa-list') === true) {
    $(this).children('i').removeClass('fa-list').addClass('fa-map');

    $('#map-view').addClass('noshow');
    $('#table-view').removeClass('noshow');
    $('.content__label').text('VIEW MAP');
  } else {
    $(this).children('i').removeClass('fa-map').addClass('fa-list');

    $('#table-view').addClass('noshow');
    $('#map-view').removeClass('noshow');
    $('.content__label').text('VIEW LIST');
  }

  pymChild.sendHeight();
});


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
    if (i >= DATADRAWS) {
      drawMap();
    }
  });

  $.getJSON(sourceArray[1], (data) => {
    top100 = GeoJSON.parse(data, { Point: ['latitude', 'longitude'] });
    drawTable(top100, 'top-100-table');
    i += 1;
    if (i >= DATADRAWS) { drawMap(); }
  });

  $.getJSON(sourceArray[2], (data) => {
    pub50 = GeoJSON.parse(data, { Point: ['latitude', 'longitude'] });
    drawTable(pub50, 'public-table');
    i += 1;
    if (i >= DATADRAWS) { drawMap(); }
  });
}

// when the map is loaded, we'll start gathering our data
map.on('load', () => getData());

// Call this every time you need to resize the iframe, after your
// graphic is drawn, etc.
pymChild.sendHeight();
