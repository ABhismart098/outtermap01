"use client"

import Geocoder from 'ol-geocoder';

import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {getLength, getArea} from 'ol/sphere';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import { Draw } from 'ol/interaction';
import './map1.css'; // Import the CSS file

interface AddressChosenEvent {
  coordinate: [number, number];
  // Add other properties that you expect to use from the event
} 
interface CurrentZoomEvent{ 
  
}

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const vectorSource = new VectorSource();
  const vectorLayer = new VectorLayer({ source: vectorSource });
   
  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
      }),
    });

    const geocoder = new Geocoder('nominatim', {
      provider: 'osm',
      lang: 'en',
      placeholder: 'Search for a place',
      targetType: 'text-input',
      limit: 5,
      keepOpen: true,
    });

    geocoder.on('addresschosen', (evt: AddressChosenEvent)  => {
      const lonLat = evt.coordinate;
      map.getView().animate({ center: lonLat, zoom: 10 });
    });

    map.addControl(geocoder);

    const drawPoint = new Draw({
      source: vectorSource,
      type: 'Point',
    });

    const drawLine = new Draw({
      source: vectorSource,
      type: 'LineString',
    });

    const drawPolygon = new Draw({
      source: vectorSource,
      type: 'Polygon',
    });

    map.addInteraction(drawPoint);
    map.addInteraction(drawLine);
    map.addInteraction(drawPolygon);

    setMapInstance(map);

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  const toggleFullscreen = () => {
    const mapContainer = mapRef.current;
    if (mapContainer) {
      mapContainer.classList.toggle('fullscreen-map');
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleZoomIn = () => {
    if (mapInstance) {
      const view = mapInstance.getView();
      const currentZoom = view.getZoom();
      view.setZoom(currentZoom! + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      const view = mapInstance.getView();
      const currentZoom = view.getZoom();
      view.setZoom(currentZoom! - 1);
    }
  };

  const calculateMeasurement = () => {
    const features = vectorSource.getFeatures();
  
    if (features.length === 0) {
      alert('Please draw a feature to calculate measurements.');
      return;
    }
  
    let totalMeasurement = 0;
    let unit = '';
  
    features.forEach((feature) => {
      const geometry = feature.getGeometry();
      if (geometry) {
        if (geometry.getType() === 'Polygon') {
          // Calculate area for polygon features
          const area = getArea(geometry);
          totalMeasurement += area;
          unit = 'square meters';
        } else if (geometry.getType() === 'LineString') {
          // Calculate length for line features
          const length = getLength(geometry);
          totalMeasurement += length;
          unit = 'meters';
        }
      }
    });
  
    // Convert total measurement to appropriate unit
    const totalMeasurementFormatted = totalMeasurement.toLocaleString();
  
    // Update state with the total measurement
    setDistance(totalMeasurement);
  
    // Display the measurement in a pop-up message
    alert(`Total Measurement: ${totalMeasurementFormatted} ${unit}`);
  };
  return (
    <div>
      <div ref={mapRef} className={`map-container ${isFullscreen ? 'fullscreen-map' : ''}`} />
      <div className="fullscreen-button" onClick={toggleFullscreen}>
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </div>
      <div className="zoom-buttons">
        <button onClick={handleZoomIn}>+</button>
        <button onClick={handleZoomOut}>-</button>
      </div>
      <div>
        {distance !== null && <p>Measurement: {distance.toLocaleString()} meters</p>}
        <button onClick={calculateMeasurement}>Calculate Measurement</button>
      </div>
    </div>
  );
};

export default MapComponent;
