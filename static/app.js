/*
 * ------------------------------------------------------------------------
 * MapsIndoors and Mapbox Setup
 * ------------------------------------------------------------------------
 */

const mapViewOptions = {
    accessToken: 'YOUR_ACCESS_TOKEN',
    element: document.getElementById('map'),
    center: {
        lat: 57.058123390918155,
        lng: 9.950799512392967
    },
    zoom: 20,
    maxZoom: 22,
};

const mapViewInstance = new mapsindoors.mapView.MapboxView(mapViewOptions);
const mapsIndoorsInstance = new mapsindoors.MapsIndoors({ mapView: mapViewInstance });
const mapInstance = mapViewInstance.getMap();

// Floor Selector
const floorSelectorElement = document.createElement('div');
new mapsindoors.FloorSelector(floorSelectorElement, mapsIndoorsInstance);
mapInstance.addControl({ onAdd: function () { return floorSelectorElement }, onRemove: function () { } });


mapsIndoorsInstance.addListener('ready', () => {

    mapsIndoorsInstance.addListener('click', (location) => {
    // Populate modal with location details
        console.log(location);
    document.getElementById('building').textContent = `Building: ${location.properties.building}`;
    document.getElementById('externalId').textContent = `External ID: ${location.properties.externalId}`;
    document.getElementById('floorName').textContent = `Floor Name: ${location.properties.floorName}`;
    document.getElementById('locationType').textContent = `Location Type: ${location.properties.locationType}`;
    document.getElementById('name').textContent = `Name: ${location.properties.name}`;
    document.getElementById('type').textContent = `Type: ${location.properties.type}`;
    document.getElementById('venue').textContent = `Venue: ${location.properties.venue}`;

    // Show the modal
    var modal = document.getElementById("locationModal");
    modal.style.display = "block";

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    };

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
});




    mapsIndoorsInstance.setFloor(10);

    mapInstance.setPitch(55.999999999);
    mapInstance.getBearing(8.2000);
    mapInstance.getZoom(20);


    // Delay the addition of the heatmap layer
    setTimeout(async () => {
        try {
            const heatmapFetchResponse = await fetch('/static/heatmap.json');
            const heatmapData = await heatmapFetchResponse.json();
            console.log('Heatmap data fetched:', heatmapData);

            // Get the ID of the last layer in the current map style
            const layers = mapInstance.getStyle().layers;
            const lastLayerId = layers[layers.length - 1].id;

            mapInstance.addSource('heatmapData', {
                'type': 'geojson',
                'data': heatmapData
            });

            mapInstance.addLayer({
                'id': 'heatmap',
                'type': 'heatmap',
                'source': 'heatmapData',
                'paint': {
                    // Adjust the following properties according to your data and preference
                    'heatmap-weight': {
                        property: 'intensity',
                        type: 'exponential',
                        stops: [
                            [0, 0],
                            [6, 1]
                        ]
                    },
                    'heatmap-intensity': {
                        stops: [
                            [11, 1],
                            [15, 3]
                        ]
                    },
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0, 'rgba(33,102,172,0)',
                        0.2, 'rgb(103,169,207)',
                        0.4, 'rgb(209,229,240)',
                        0.6, 'rgb(253,219,199)',
                        0.8, 'rgb(239,138,98)',
                        1, 'rgb(178,24,43)'
                    ],
                    'heatmap-radius': {
                        stops: [
                            [0, 15],
                            [22, 25]
                        ]
                    },
                    'heatmap-opacity': {
                        default: 1,
                        stops: [
                            [0, 1],
                            [22, 0]
                        ]
                    },
                }
            }, lastLayerId); // Add the heatmap layer on top




            // After adding the heatmap layer, update radius, opacity, and color scheme
            updateInitialValues();
        } catch (error) {
            console.error('Error fetching heatmap data:', error);
        }
                    // Set default heatmap properties
        mapInstance.setPaintProperty('heatmap', 'heatmap-radius', 40); // Default radius
        mapInstance.setPaintProperty('heatmap', 'heatmap-opacity', 0.5); // Default opacity

        // Update slider values and labels
        document.getElementById('radius-slider').value = 40;
        document.getElementById('radius-label').textContent = "40";
        document.getElementById('opacity-slider').value = 0.5;
        document.getElementById('opacity-label').textContent = "0.5";

    }, 1000);






});

// Function to set initial values and event listeners
function updateInitialValues() {
    // Set radius and opacity values and labels
    const currentRadius = mapInstance.getPaintProperty('heatmap', 'heatmap-radius');
    const currentOpacity = mapInstance.getPaintProperty('heatmap', 'heatmap-opacity');
    document.getElementById('radius-slider').value = currentRadius;
    document.getElementById('radius-label').textContent = currentRadius;
    document.getElementById('opacity-slider').value = currentOpacity;
    document.getElementById('opacity-label').textContent = currentOpacity;

    // Initialize the color scheme selector
    document.getElementById('color-scheme-selector').value = 'default';

    // Event listeners for sliders and color scheme selector
    document.getElementById('radius-slider').addEventListener('input', handleRadiusChange);
    document.getElementById('opacity-slider').addEventListener('input', handleOpacityChange);
    document.getElementById('color-scheme-selector').addEventListener('change', handleColorSchemeChange);
}

function handleRadiusChange(event) {
    const radiusValue = parseFloat(event.target.value);
    mapInstance.setPaintProperty('heatmap', 'heatmap-radius', radiusValue);
    document.getElementById('radius-label').textContent = radiusValue;
}

function handleOpacityChange(event) {
    const opacityValue = parseFloat(event.target.value);
    mapInstance.setPaintProperty('heatmap', 'heatmap-opacity', opacityValue);
    document.getElementById('opacity-label').textContent = opacityValue;
}

function handleColorSchemeChange(event) {
    updateHeatmapColor(event.target.value);
}

// Function to update heatmap color
function updateHeatmapColor(colorScheme) {
    console.log("Updating color scheme to:", colorScheme);
    let colorStops;

    switch (colorScheme) {
        case 'YlGn':
            colorStops = ['interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(255,255,229,0)',
                0.2, 'rgb(247,252,185)',
                0.4, 'rgb(217,240,163)',
                0.6, 'rgb(173,221,142)',
                0.8, 'rgb(120,198,121)',
                1, 'rgb(49,163,84)'
            ];
            break;
        case 'YlGnBu':
            colorStops = ['interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(255,255,217,0)',
                0.2, 'rgb(237,248,177)',
                0.4, 'rgb(199,233,180)',
                0.6, 'rgb(127,205,187)',
                0.8, 'rgb(65,182,196)',
                1, 'rgb(44,127,184)'
            ];
            break;
        default:
            // Keep the existing default color stops or modify as needed
            colorStops = ['interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(33,102,172,0)',
                0.2, 'rgb(103,169,207)',
                0.4, 'rgb(209,229,240)',
                0.6, 'rgb(253,219,199)',
                0.8, 'rgb(239,138,98)',
                1, 'rgb(178,24,43)'
            ];
    }

    mapInstance.setPaintProperty('heatmap', 'heatmap-color', colorStops);
}

function debounce(func, delay) {
    let inDebounce;
    return function() {
        const context = this;
        clearTimeout(inDebounce);
        inDebounce = setTimeout(() => func.apply(context, args), delay);
    }
}
