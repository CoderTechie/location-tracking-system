import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Helper component to update the map's view programmatically
const MapUpdater = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), { animate: true }); // Re-center the map
    }
  }, [position, map]);

  return null;
};

const LocationTracker = () => {
  const [location, setLocation] = useState(null); // Initial state as null
  const [error, setError] = useState(null); // Error handling for WebSocket

  useEffect(() => {
    let socket;

    const connect = () => {
      socket = new WebSocket('ws://localhost:8080'); // Update with server address

      socket.onopen = () => {
        console.log('WebSocket connected');
        setError(null);
      };

      socket.onmessage = async (event) => {
        try {
          // Handle Blob data
          let data;
          if (event.data instanceof Blob) {
            const text = await event.data.text(); // Convert Blob to text
            data = JSON.parse(text); // Parse JSON from text
          } else {
            data = JSON.parse(event.data); // Parse JSON directly if it's not a Blob
          }
          setLocation({ lat: data.lat, lng: data.lng }); // Update map location
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      socket.onclose = (event) => {
        console.error('WebSocket closed. Attempting to reconnect in 5 seconds...', event);
        setError('WebSocket connection error. Reconnecting...');
        setTimeout(() => connect(), 5000); // Reconnect after 5 seconds
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error. Please try again later.');
      };
    };

    connect();

    return () => socket?.close(); // Clean up WebSocket connection on unmount
  }, []);

  return (
    <div style={{ padding: '1rem', textAlign: 'center' }}>
      <h1>Customer View - Live Delivery Tracking</h1>
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : location ? (
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={13}
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[location.lat, location.lng]}>
            <Popup>Delivery Location</Popup>
          </Marker>
          <MapUpdater position={[location.lat, location.lng]} /> {/* Update view */}
        </MapContainer>
      ) : (
        <p>Waiting for live location updates...</p>
      )}
    </div>
  );
};

export default LocationTracker;
