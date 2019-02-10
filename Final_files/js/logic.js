// Initialize all of the LayerGroups we'll be using
var layers = {
  faultlinesLayer: new L.LayerGroup(),
  earthquakesLayer: new L.LayerGroup()
};

// Perform an API call to the USGS Earthquake endpoint
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson", function(infoRes) {

    var earthquakes = infoRes.features;
    //console.log(infoRes);

    // Initialize radius and color variables, which will be used to pass the appropriate info
    // for each earthquake class
    var radius = []
    var color = []

    // Loop through the earthquake API for all earthquakes magnitude 2.5 and above for the last month
    for (var i = 0; i < earthquakes.length; i++) {

      // Create a new earthquake object with properties, to prepare to extract magnitude
      var earthquakesProp = Object.assign({}, earthquakes[i].properties);
      // Earthquake magnitude >= 2 and < 3.5, to catch some weird earthquakes below 2.5 :P
      if (earthquakesProp.mag >= 2 && earthquakesProp.mag < 3.5) {
        radius = 3;
        color = '#58f4ae'
      }
      // Earthquake magnitude >= 3.5 and < 4.5
      else if (earthquakesProp.mag >= 3.5 && earthquakesProp.mag < 4.5) {
        radius = 5;
        color = '#a0ed42'
      }
      // Earthquake magnitude >= 4.5 and < 5.5
      else if (earthquakesProp.mag >= 4.5 && earthquakesProp.mag < 5.5) {
        radius = 8;
        color = '#dddd33'
      }
      // Earthquake magnitude >= 5.5 and < 6.5
      else if (earthquakesProp.mag >= 5.5 && earthquakesProp.mag < 6.5) {
        radius = 13;
        color = '#db9e1a'
      }
      // Earthquake magnitude >= 6.5
      else {
        radius = 21;
        color = '#ce5408'
      }

      var earthquakeGeom = Object.assign({}, earthquakes[i].geometry);
        earthquakeCoords = L.circleMarker([earthquakeGeom.coordinates[1], earthquakeGeom.coordinates[0]], {
          radius: radius,
          color: color
        });
      
      var dateTime = new Date(earthquakesProp.time);
      var earthquakesTime = dateTime.toISOString();

      var earthquakePlace = earthquakesProp.place

      // Add the new marker to the appropriate layer
      earthquakeCoords.addTo(layers.earthquakesLayer);

      // Bind a popup to the marker that will  display on click. This will be rendered as HTML
      earthquakeCoords.bindPopup("Earthquake Magnitude: " + earthquakesProp.mag + "<br>\
      Coords: " + [earthquakeGeom.coordinates[1], earthquakeGeom.coordinates[0]] + "<br>\
      Location: " + earthquakePlace + "<br> Datetime: " + earthquakesTime);
}});

// Load data for faultlines (I had a ton of other code here to try and deal with the lat/long 
// being switched using D3; definitely a great example of using the proper library functions 
//if they exist, in this case from Leaflet and Leaftlet-ajax!!)
var faultlinesData = new L.GeoJSON.AJAX("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json");  
faultlinesData.addTo(layers.faultlinesLayer);     

// Create the tile layer that will be the background of our map
var darkMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
  maxZoom: 18,
  id: "mapbox.dark",
  accessToken: API_KEY
});

var outdoorsMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
  maxZoom: 18,
  id: "mapbox.outdoors",
  accessToken: API_KEY
});

var satelliteMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
  maxZoom: 18,
  id: "mapbox.satellite",
  accessToken: API_KEY
});

// Create object to hold base layers
var baseMaps = {
  "Satellite": satelliteMap,
  "Dark": darkMap,
  "Outdoors": outdoorsMap
};

// Create overlays object for toggling
var overlayMaps = {
  "Earthquakes": layers.earthquakesLayer,
  "Faultlines": layers.faultlinesLayer,
};

// Create the map with our layers
var map = L.map("map-id", {
  center: [45.82, -110.5795],
  zoom: 3,
  worldCopyJump: true,
  layers: [
    satelliteMap,
    layers.earthquakesLayer,
    layers.faultlinesLayer
  ]
});

// Create a control for our layers, add our overlay layers to it
L.control.layers(baseMaps, overlayMaps).addTo(map);

      // Create a legend to display information about our map
      var legend = L.control({
        position: "bottomright"
      });
  
      // When the layer control is added, insert a div with the class of "legend"
      function getColor(d) {
        return d >= 2.5 && d < 3.5 ? '#58f4ae' :
        d >= 3.5 && d < 4.5 ? '#a0ed42' :
        d >= 4.5 && d < 5.5 ? '#dddd33' :
        d >= 5.5 && d < 6.5 ? '#db9e1a' :
        d > 6.5 ? '#ce5408' :
              '#FFEDA0';
      };
  
      legend.onAdd = function() {
        var div = L.DomUtil.create("div", "legend"),
          values = [3, 4, 5, 6, 7]
          labels = ["2.5-3.5", "3.5-4.5", "4.5-5.5", "5.5-6.5", "6.5+"];
  
          for (var i = 0; i < values.length; i++) {
            div.innerHTML +=
              '<i style="background:' + getColor(values[i]) + '"></i> ' + labels[i] + "<br>"
          };
        return div;
  
      };
      // Add the info legend to the map
      legend.addTo(map);