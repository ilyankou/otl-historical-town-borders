var imageContainerMargin = 70;  // Margin + padding
var currentBox = 0;
var scrollPosition = 0;

// This watches for the scrollable container
$('div#contents').scroll(function() {
  scrollPosition = $(this).scrollTop();
});

// Any values not listed in the ranges below displays as the last color (blank)
function getFillColor(d) {
  return  d == 1 ? 'red' :
          'white';
}

function style(feature) {
  return {
    color: 'blue',
    fillColor: getFillColor(feature.properties.Flag),
    weight: 2,
    fillOpacity: 0.2
  };
}


// This adds data as a new layer to the map
function refreshLayer(data, map, coord, zoom) {
  var dataLayer = L.geoJson(data, {
      style: style,
      //onEachFeature: onEachFeature
  });
  dataLayer.addTo(map);
  map.setView([coord[1], coord[0]], zoom);
}



function initMap() {
  // This creates the Leaflet map with a generic start point, because GeoJSON layer includes all coordinates
  var map = L.map('map', {
    center: [0, 0],
    zoom: 5,
    scrollWheelZoom: false
  });

  // This customizes link to view source code; add your own GitHub repository
  map.attributionControl
  .setPrefix('View <a href="http://github.com/jackdougherty/otl-historical-town-borders-wms-buttons" target="_blank">code on GitHub</a>, created with <a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>');

  // Legend control layers - global variable with (null, null) allows indiv layers to be added inside functions below
  var controlLayers = L.control.layers( null, null, {
    position: "bottomright", // suggested: bottomright for CT (in Long Island Sound); topleft for Hartford region
    collapsed: false // false = open by default
  }).addTo(map);

  // This displays the default tile layer
  var lightAll = new L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  }).addTo(map);
  controlLayers.addBaseLayer(lightAll, 'lightAll default');

  // tileLayer.WMS as a baselayer - see http://leafletjs.com/reference.html#tilelayer-wms
  // UConn MAGIC WMS settings - see http://geoserver.lib.uconn.edu:8080/geoserver/web/?wicket:bookmarkablePage=:org.geoserver.web.demo.MapPreviewPage
  var map1795 = new L.tileLayer.wms("http://geoserver.lib.uconn.edu:8080/geoserver/MAGIC/wms?", {
    layers: 'MAGIC:Connecticut_Doolittle_1795',
    format: 'image/png',
    version: '1.1.0',
    transparent: true,
    attribution: '1795 <a href="http://magic.library.uconn.edu">MAGIC UConn</a>'
  });
  controlLayers.addBaseLayer(map1795, 'map1795');

  var map1811 = new L.tileLayer.wms("http://geoserver.lib.uconn.edu:8080/geoserver/MAGIC/wms?", {
    layers: 'MAGIC:1811_Warren',
    format: 'image/png',
    version: '1.1.0',
    transparent: true,
    attribution: '1811 <a href="http://magic.library.uconn.edu">MAGIC UConn</a>'
  });
  controlLayers.addBaseLayer(map1811, 'map1811');

  var map1855 = new L.tileLayer.wms("http://geoserver.lib.uconn.edu:8080/geoserver/MAGIC/wms?", {
    layers: 'MAGIC:HartfordCounty_Woodford_1855',
    format: 'image/png',
    version: '1.1.0',
    transparent: true,
    attribution: '1855 <a href="http://magic.library.uconn.edu">MAGIC UConn</a>'
  });
  map1855.addTo(map);
  controlLayers.addBaseLayer(map1855, 'map1855');

  // This loads the GeoJSON map data file from a local folder
  $.getJSON('map.geojson', function(data) {
    var geojson = L.geoJson(data, {
      onEachFeature: function (feature, layer) {
        (function(layer, properties) {

          // This creates the contents of each chapter from the GeoJSON data. Unwanted items can be removed, and new ones can be added
          var chapter = $('<p></p>', {
            text: feature.properties['chapter'],
            class: 'chapter-header'
          });

          // var image = $('<img>', {
          //   src: feature.properties['image'],
          // });

          // var source = $('<a>', {
          //   text: feature.properties['source-credit'],
          //   href: feature.properties['source-link'],
          //   target: "_blank",
          //   class: 'source'
          // });

          var description = $('<p></p>', {
            text: feature.properties['description'],
            class: 'description'
          });

          var container = $('<div></div>', {
            id: 'container' + feature.properties['id'],
            class: 'image-container'
          });

          // var imgHolder = $('<div></div', {
          //   class: 'img-holder'
          // });
          //
          // imgHolder.append(image);

          container.append(chapter).append(description);
          $('#contents').append(container);

          var i;
          var areaTop = -100;
          var areaBottom = 0;

          // Calculating total height of blocks above active
          for (i = 1; i < feature.properties['id']; i++) {
            areaTop += $('div#container' + i).height() + imageContainerMargin;
          }

          areaBottom = areaTop + $('div#container' + feature.properties['id']).height();

          $('div#contents').scroll(function() {
            if ($(this).scrollTop() >= areaTop && $(this).scrollTop() < areaBottom) {
              if (feature.properties['id'] != currentBox) {
                currentBox = feature.properties['id'];

                $('.image-container').removeClass("inFocus").addClass("outFocus");
                $('div#container' + feature.properties['id']).addClass("inFocus").removeClass("outFocus");

                // This removes all layers besides the base layer
                map.eachLayer(function (layer) {
                  if (layer != lightAll) {
                    map.removeLayer(layer);
                  }
                });

                // This adds another data layer
                $.getJSON(feature.properties['layer'], function(data) {
                  var coord = feature.geometry['coordinates'];
                  var zoom = feature.properties['zoom'];
                  refreshLayer(data, map, coord, zoom);
                });

                // Loading an appropriate tile by imitating a click onto the control span
                var tile = feature.properties['tile'];
                $($('span:contains(" ' + tile + '")').get(0)).siblings("input").click();
              }
            }
          });

        })(layer, feature.properties);
      }
    });

    $('#contents').append("<div class='space-at-the-bottom'><a href='#space-at-the-top'><i class='fa fa-chevron-up'></i></br><small>Go to Top</small></a></div>");

  });
}


initMap();

$("div#contents").animate({ scrollTop: 5 });
