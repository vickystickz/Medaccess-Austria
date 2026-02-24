// Configuration for Geoserver Urls layers
const wmsBaseUrl = "http://localhost:8080/geoserver/wms";
const wcsBaseUrl = "http://localhost:8080/geoserver/wcs";

const wfsBaseUrl = "https://geoserver22s.zgis.at/geoserver/ipsdi_wt25/wfs";

const austriaBoundaryLayerName = "ipsdi_wt25:at_boundary";
const austriaHospitalLayerName = "ipsdi_wt25:hospitals_AT";
const europePopulatedGridLayerName = "medaccess_austria:ESTAT_OBS-VALUE-T_2021_V2"

const layerStyles = {
    "estimated_population_grid": "ipsdi_wt25:pop_styles"
}

// Map Utilities
function createWmsLayer(layerName, visible) {
    return new ol.layer.Tile({
        visible: visible,
        source: new ol.source.TileWMS({
            url: wmsBaseUrl,
            params: { 'LAYERS': layerName, 'TILED': true },
            serverType: 'geoserver',
            crossOrigin: 'anonymous'
        })
    });
}

// creates WFS vector source layer required for Hospital and Boundary Layer
function createWfsSourceLayer(layerName, visible) {
    let source = new ol.source.Vector({
        visible: visible,
        format: new ol.format.GeoJSON(),
        url: function (extent) {
            return wfsBaseUrl + '?service=WFS&version=2.0.1&request=GetFeature&typeName=' +
                layerName + '&outputFormat=application/json&srsName=EPSG:3857';
        }
    })
    return source;
}


function createWCSLayerUrl(layerName, boundingBox) {
    const url = `${wcsBaseUrl}?service=WCS&version=2.0.1&request=GetCoverage&coverageId=${layerName}&subset=X(${boundingBox[0]},${boundingBox[2]})&subset=Y(${boundingBox[1]},${boundingBox[3]})&subsettingCrs=http://www.opengis.net/def/crs/EPSG/0/3857&format=image/tiff`
    return url
}



///    --------      Setup Buffer radius selection  --------   ///

// Radius button logic
let activeRadius = 5000;

// gets all radius buttons
document.querySelectorAll('.radius-btn').forEach(radiusButton => {
    radiusButton.addEventListener('click', () => {
        document.querySelectorAll('.radius-btn').forEach(button => button.classList.remove('active'));
        radiusButton.classList.add('active');
        activeRadius = parseInt(radiusButton.dataset.value);
        // set the active radius in meters for the buffer analysis
        document.getElementById('activeRadiusDisplay').textContent = activeRadius.toLocaleString();
    });
});




// Show loading overlay
window.showLoading = () => document.getElementById('loadingOverlay').classList.add('active');
window.hideLoading = () => document.getElementById('loadingOverlay').classList.remove('active');

// Show results panel
window.showResults = (html) => {
    document.getElementById('resultsBody').innerHTML = html;
    document.getElementById('resultsPanel').classList.add('visible');
};




///    --------      Setup Layers   --------   ///

// Europe Estimated Population Grid Layer (Raster) , Web Service - WMS
const europeEstimatedPopulationGridLayer = createWmsLayer(europePopulatedGridLayerName, layerStyles.estimated_population_grid, true)


// Austria Hospital (Vector Layer) , Web Service - WFS

const austriaHospitalsSource = createWfsSourceLayer(austriaHospitalLayerName, true);

const hospitalIconStyle = new ol.style.Style({
    image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({ color: '#4a7fb5' }), // Color inside
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 }) // White border
    })
});

const austriaHospitalLayer = new ol.layer.Vector({
    title: "Hospitals",
    source: austriaHospitalsSource,
    zIndex: 2000,
    style: hospitalIconStyle
});


// Austria Boundary (Vector Layer) , Web Service - WFS

const austriaBoundarySource = createWfsSourceLayer(austriaBoundaryLayerName, true);

const austriaBoundaryStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({ color: '#999', width: 3 }),
    fill: new ol.style.Fill({ color: 'rgba(0,0,0,0)' })
})

const austriaBoundaryLayer = new ol.layer.Vector({
    title: 'Boundary',
    source: austriaBoundarySource,
    style: austriaBoundaryStyle
});


// Generated Buffer Layer based on use click (Vector Layer)

const generatedBufferLayerSource = new ol.source.Vector()

const generatedBufferStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({ color: '#e8a020', width: 2.5 }),
    fill: new ol.style.Fill({ color: 'rgba(232,160,32,0.12)' })
})

const generatedBufferLayer = new ol.layer.Vector({
    source: generatedBufferLayerSource,
    style: generatedBufferStyle

})



///    --------      Initialize  OpenLayers Map   --------   ///

const mapDefaultCenter = ol.proj.fromLonLat([14.550, 47.51])
const osmLayer = new ol.layer.Tile({ source: new ol.source.OSM() });
const overlays = new ol.layer.Group({
    title: 'Layer Overlays',
    layers: []
});

overlays.getLayers().push(europeEstimatedPopulationGridLayer);
overlays.getLayers().push(austriaBoundaryLayer);
overlays.getLayers().push(austriaHospitalLayer);


const map = new ol.Map({
    target: 'map',
    layers: [osmLayer, europeEstimatedPopulationGridLayer, austriaBoundaryLayer, austriaHospitalLayer],
    controls: ol.control.defaults.defaults({
        zoom: false,
        attribution: true,
    }).extend([
        new ol.control.ScaleLine({
            units: 'metric',
            bar: false,
            steps: 2,
            text: true,
            minWidth: 60
        })
    ]),
    view: new ol.View({
        center: mapDefaultCenter,
        zoom: 8
    }),
});

// Add all layer overlays to the initializes map
map.addLayer(overlays);
map.addLayer(generatedBufferLayer);


const tooltipElement = document.getElementById('hospitalTooltip');
const tooltipOverlay = new ol.Overlay({
    element: tooltipElement,
    offset: [0, -5],
    positioning: 'bottom-center'
});

map.addOverlay(tooltipOverlay);

map.on('pointermove', function (event) {
    const pixel = event.pixel;

    const feature = map.forEachFeatureAtPixel(pixel, function (feature, layer) {
        if (layer === austriaHospitalLayer) {
            return feature;
        }
    });

    if (feature) {
        const geometry = feature.getGeometry();
        const coord = geometry.getCoordinates();

        const props = feature.getProperties();
        const name = props.name;

        tooltipElement.innerHTML = `Hospital Name: ${name} `;
        tooltipOverlay.setPosition(coord);
        tooltipElement.style.display = 'block';

        map.getTargetElement().style.cursor = 'pointer';
    } else {
        tooltipElement.style.display = 'none';
        map.getTargetElement().style.cursor = '';
    }
});



///    --------      Setup Map Custom Controls  --------   ///
const zoomInControl = document.getElementById('zoomIn');
const zoomOutControl = document.getElementById('zoomOut');
const resetMapViewControl = document.getElementById('resetView');

// listens to zoomIn event 
zoomInControl.addEventListener('click', () => {
    const view = map.getView()
    view.animate({
        zoom: view.getZoom()++,
        duration: 200
    })
})
// listens to zoomOut event 
zoomOutControl.addEventListener('click', () => {
    const view = map.getView()
    view.animate({
        zoom: view.getZoom()--,
        duration: 200
    })
})

// listens to resetMapEvent event 
resetMapViewControl.addEventListener('click', () => {
    map.getView().animate({
        center: mapDefaultCenter
    })
})

///    --------      Setup Map Layers Controls  --------   ///
const europeEstimatePopGridLayerControl = document.getElementById('togglePopGrid');
const austriaHospitalLayerControl = document.getElementById('toggleHospitals');
const austriaBoundaryLayerControl = document.getElementById('toggleBoundary');
const clearGeneratedBufferControl = document.getElementById('clearBuffer');

const PopGridLegend = document.getElementById("PopGrid-legend-item")
const HospitalLegend = document.getElementById("Hospitals-legend-item")
const BoundaryLegend = document.getElementById("Boundary-legend-item")

// listens to Estimated Population Grid Layer checkbox event 
europeEstimatePopGridLayerControl.addEventListener('change', event => {
    const isChecked = event.target.checked;
    europeEstimatedPopulationGridLayer.setVisible(isChecked);
    PopGridLegend.classList.toggle('active', isChecked);
});

// listens to Estimated Population Grid Layer checkbox event 
austriaHospitalLayerControl.addEventListener('change', event => {
    const isChecked = event.target.checked;
    austriaHospitalLayer.setVisible(isChecked);
    HospitalLegend.classList.toggle('active', isChecked);
});

// listens to Estimated Population Grid Layer checkbox event 
austriaBoundaryLayerControl.addEventListener('change', event => {
    const isChecked = event.target.checked
    austriaBoundaryLayer.setVisible(isChecked);
    BoundaryLegend.classList.toggle('active', isChecked);
});



///    --------   Buffer Analysis  --------   ///
function runPopulationStats(coord) {
    generatedBufferLayerSource.clear();
    window.showLoading();

    const radius = activeRadius;
    const lonLat = ol.proj.toLonLat(coord);
    const buffer = ol.geom.Polygon.circular(lonLat, radius, 64);
    // project buffer layer to 3857
    buffer.transform('EPSG:4326', 'EPSG:3857');
    generatedBufferLayerSource.addFeature(new ol.Feature(buffer));


    const bbox = buffer.getExtent();

    map.getView().fit(bbox, {
        padding: [250, 50, 250, 50],
        duration: 1000
    });

    const populationGridWcsUrl = createWCSLayerUrl(europePopulatedGridLayerName, bbox)

    // estimate the population raster grid on the client side
    fetch(populationGridWcsUrl)
        .then(res => {
            if (!res.ok) throw new Error(`WCS error: ${res.status}`);
            return res.arrayBuffer();
        })
        .then(ab => GeoTIFF.fromArrayBuffer(ab))
        .then(async tiff => {
            const image = await tiff.getImage();
            const data = await image.readRasters({ interleave: true });
            const width = image.getWidth();
            const height = image.getHeight();
            const [noDataValue] = image.getGDALNoData()
                ? [parseFloat(image.getGDALNoData())]
                : [null];

            const tiffBbox = image.getBoundingBox();
            const pixelWidth = (tiffBbox[2] - tiffBbox[0]) / width;
            const pixelHeight = (tiffBbox[3] - tiffBbox[1]) / height;
            const bufferCoords = buffer.getCoordinates()[0];

            function pointInPolygon(x, y, ring) {
                let inside = false;
                for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
                    const xi = ring[i][0], yi = ring[i][1];
                    const xj = ring[j][0], yj = ring[j][1];
                    if (((yi > y) !== (yj > y)) &&
                        (x < (xj - xi) * (y - yi) / (yj - yi) + xi))
                        inside = !inside;
                }
                return inside;
            }

            let min = Infinity, max = -Infinity, sum = 0, count = 0;

            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    const pixelVal = data[row * width + col];
                    if (noDataValue !== null && pixelVal === noDataValue) continue;
                    if (!isFinite(pixelVal)) continue;
                    const px = tiffBbox[0] + (col + 0.5) * pixelWidth;
                    const py = tiffBbox[3] - (row + 0.5) * pixelHeight;
                    if (!pointInPolygon(px, py, bufferCoords)) continue;
                    if (pixelVal < min) min = pixelVal;
                    if (pixelVal > max) max = pixelVal;
                    sum += pixelVal;
                    count++;
                }
            }

            const mean = count > 0 ? sum / count : 0;
            const radiusKm = (radius / 1000).toFixed(1);
            const displayLon = lonLat[0].toFixed(4);
            const displayLat = lonLat[1].toFixed(4);

            const html = `
                <div class="stat-location">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1a4 4 0 0 1 0 8C3 9 1 7 1 5a5 5 0 0 1 10 0" stroke="currentColor" stroke-width="1.2"/>
                        <circle cx="6" cy="5" r="1.5" fill="currentColor"/>
                    </svg>
                    ${displayLat}° N, ${displayLon}° E &nbsp;·&nbsp; ${radiusKm} km radius
                </div>

                <div class="stat-cards">
                    <div class="stat-card highlight">
                        <div class="stat-card-label">Total Population</div>
                        <div class="stat-card-value">${Math.round(sum).toLocaleString()}</div>
                        <div class="stat-card-sub">persons within ${radiusKm} km</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-label">Grid Cells Analysed</div>
                        <div class="stat-card-value">${count.toLocaleString()}</div>
                        <div class="stat-card-sub">1 km² pixels inside buffer</div>
                    </div>
                </div>
                <div class="results-meta">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/>
                        <path d="M6 5.5V8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                        <circle cx="6" cy="4" r="0.7" fill="currentColor"/>
                    </svg>
                    Source: ESTAT Population Grid 2021 · GeoServer WCS 2.0
                </div>
            `;

            window.hideLoading();
            window.showResults(html);
        })
        .catch(err => {
            console.error("WCS Error:", err);
            window.hideLoading();
            window.showResults(`
                <div class="results-empty">
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity="0.4">
                        <circle cx="18" cy="18" r="16" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M18 12v8M18 24v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <p>Analysis failed. Check GeoServer connection and try again.</p>
                </div>
            `);
        });
}

map.on('click', evt => runPopulationStats(evt.coordinate));

document.getElementById('closeResults').addEventListener('click', () => {
    generatedBufferLayerSource.clear();
    document.getElementById('resultsPanel').classList.remove('visible');

});



