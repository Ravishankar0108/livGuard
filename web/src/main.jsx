import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { io } from 'socket.io-client';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const markerIcon = new L.Icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });

function Recenter({ locations }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length) map.setView([locations[0].lat, locations[0].lng], 14);
  }, [locations, map]);
  return null;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [familyId, setFamilyId] = useState(localStorage.getItem('familyId') || '');
  const [locations, setLocations] = useState([]);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState('');

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  async function sendOtp() {
    const res = await axios.post(`${API}/api/auth/send-otp`, { phone });
    setMessage(res.data.otp ? `Dev OTP: ${res.data.otp}` : 'OTP sent.');
  }

  async function verifyOtp() {
    const res = await axios.post(`${API}/api/auth/verify-otp`, { phone, otp, name });
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    const fid = res.data.user.familyId || '';
    setFamilyId(fid);
    localStorage.setItem('familyId', fid);
    setMessage('Login successful.');
  }

  async function createFamily() {
    const res = await axios.post(`${API}/api/auth/create-family`, { name: name || 'My Family' }, { headers: authHeaders });
    setFamilyId(res.data.family._id);
    localStorage.setItem('familyId', res.data.family._id);
    setInviteCode(res.data.inviteCode);
    setMessage(`Family created. Invite code: ${res.data.inviteCode}`);
  }

  async function joinFamily() {
    const res = await axios.post(`${API}/api/auth/join-family`, { inviteCode }, { headers: authHeaders });
    setFamilyId(res.data.family._id);
    localStorage.setItem('familyId', res.data.family._id);
    setMessage('Joined family.');
  }

  async function shareMyLocation() {
    if (!navigator.geolocation) return setMessage('Geolocation not supported.');
    navigator.geolocation.watchPosition(async (pos) => {
      const body = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, speed: pos.coords.speed || 0, battery: 80, network: 'web' };
      await axios.post(`${API}/api/location/ping`, body, { headers: authHeaders });
      setMessage('Live location sharing is active.');
    }, err => setMessage(err.message), { enableHighAccuracy: true });
  }

  useEffect(() => {
    if (!token || !familyId) return;
    axios.get(`${API}/api/location/live/${familyId}`, { headers: authHeaders }).then(res => setLocations(res.data.locations || [])).catch(() => {});
    const socket = io(API, { auth: { token } });
    socket.on('location_update', loc => setLocations(prev => [loc, ...prev.filter(x => String(x.userId) !== String(loc.userId))]));
    socket.emit('join_family', familyId);
    return () => socket.disconnect();
  }, [token, familyId, authHeaders]);

  return <div className="app">
    <aside>
      <h1>livGuard</h1><p>Consent-based family safety location dashboard</p>
      {!token ? <div className="card">
        <input placeholder="Name for new user" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Phone e.g. +919999999999" value={phone} onChange={e=>setPhone(e.target.value)} />
        <button onClick={sendOtp}>Send OTP</button>
        <input placeholder="OTP" value={otp} onChange={e=>setOtp(e.target.value)} />
        <button onClick={verifyOtp}>Login / Register</button>
      </div> : <div className="card">
        <button onClick={createFamily}>Create Family</button>
        <input placeholder="Invite code" value={inviteCode} onChange={e=>setInviteCode(e.target.value)} />
        <button onClick={joinFamily}>Join Family</button>
        <button className="primary" onClick={shareMyLocation}>Start Sharing My Location</button>
        <button onClick={()=>{localStorage.clear(); location.reload();}}>Logout</button>
      </div>}
      <p className="msg">{message}</p>
      <div className="card"><b>Members Live:</b>{locations.map((l,i)=><p key={i}>📍 {l.user?.name || l.userId}: {Number(l.lat).toFixed(5)}, {Number(l.lng).toFixed(5)}</p>)}</div>
    </aside>
    <main><MapContainer center={[23.2599,77.4126]} zoom={12} className="map"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /> <Recenter locations={locations}/>{locations.map((l,i)=><Marker key={i} position={[l.lat,l.lng]} icon={markerIcon}><Popup>{l.user?.name || 'Member'}<br />{l.address || 'Live location'}</Popup></Marker>)}</MapContainer></main>
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
