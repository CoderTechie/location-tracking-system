import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const LocationSender = () => {
  const [location, setLocation] = useState(null); // Initially null to avoid rendering at 0,0
  const [error, setError] = useState(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080'); // Connect to WebSocket server

    if (navigator.geolocation) {
      // Get current position initially
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const initialLocation = { lat: latitude, lng: longitude };
          setLocation(initialLocation);
         
          // Send initial location to WebSocket server
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(initialLocation));
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to fetch location. Please enable location permissions.');
        },
        { enableHighAccuracy: true }
      );

      // Start watching position changes
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const updatedLocation = { lat: latitude, lng: longitude };
          setLocation(updatedLocation);
          // Send updated location to WebSocket server
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(updatedLocation));
          }
        },
        (error) => {
          console.error('Error watching position:', error);
          setError('Unable to track location.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setError('Geolocation is not supported by this browser.');
    }

    return () => socket.close(); // Clean up WebSocket connection on unmount
  }, []);

  return (
    <div style={{ padding: '1rem', textAlign: 'center' }}>
      <h1>Delivery App - Sending Live Location</h1>
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
            <Popup>Your Current Location</Popup>
          </Marker>
        </MapContainer>
      ) : (
        <p>Fetching your location...</p>
      )}
    </div>
  );
};

export default LocationSender;
