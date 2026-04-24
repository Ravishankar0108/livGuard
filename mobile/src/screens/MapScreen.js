// ─────────────────────────────────────────
//  FamTrack Mobile — Live Map Screen
//  File: mobile/src/screens/MapScreen.js
// ─────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, Text, TouchableOpacity,
  Image, Platform, Alert, StatusBar
} from 'react-native';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { getSocket } from '../services/LocationService';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [trails, setTrails] = useState({}); // userId => [{lat,lng}]

  // ── Load initial live positions ──────────
  useEffect(() => {
    loadLiveLocations();
    setupSocketListeners();
    const interval = setInterval(loadLiveLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadLiveLocations() {
    try {
      const familyId = await AsyncStorage.getItem('familyId');
      const { data } = await api.get(`/location/live/${familyId}`);
      setMembers(data.locations);
    } catch (err) {
      console.error('Load locations error:', err);
    }
  }

  function setupSocketListeners() {
    const socket = getSocket();
    if (!socket) return;

    socket.on('location_update', ({ userId, lat, lng, speed, battery, address }) => {
      setMembers(prev => prev.map(m =>
        m.userId._id === userId
          ? { ...m, lat, lng, speed, battery, address }
          : m
      ));

      // Update trail
      setTrails(prev => ({
        ...prev,
        [userId]: [...(prev[userId] || []).slice(-50), { latitude: lat, longitude: lng }]
      }));
    });

    socket.on('sos_alert', (data) => {
      Alert.alert('⚠️ SOS ALERT', `${data.name} needs help!\n${data.message}`, [
        { text: 'Call', onPress: () => {} },
        { text: 'View on Map', onPress: () => {
          mapRef.current?.animateToRegion({ latitude: data.lat, longitude: data.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        }}
      ]);
    });
  }

  function fitAll() {
    if (!members.length || !mapRef.current) return;
    const coords = members.map(m => ({ latitude: m.lat || m.doc?.lat, longitude: m.lng || m.doc?.lng })).filter(c => c.latitude);
    mapRef.current.fitToCoordinates(coords, { edgePadding: { top: 80, right: 40, bottom: 120, left: 40 }, animated: true });
  }

  function getColor(index) {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  }

  const batteryColor = (b) => b > 60 ? '#10b981' : b > 30 ? '#f59e0b' : '#ef4444';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e1a"/>

      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        mapType="standard"
        customMapStyle={darkMapStyle}
        showsUserLocation
        showsCompass={false}
        showsScale={false}
        initialRegion={{ latitude: 28.4595, longitude: 77.0266, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
        onPress={() => setSelected(null)}
      >
        {members.map((m, i) => {
          const lat = m.lat || m.doc?.lat;
          const lng = m.lng || m.doc?.lng;
          if (!lat || !lng) return null;
          const color = getColor(i);
          const name = m.user?.[0]?.name || 'Member';
          return (
            <React.Fragment key={m.userId?._id || i}>
              {/* Trail */}
              {trails[m.userId?._id]?.length > 1 && (
                <Polyline coordinates={trails[m.userId._id]} strokeColor={color} strokeWidth={2} lineDashPattern={[5, 5]}/>
              )}
              {/* Marker */}
              <Marker
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => setSelected(m)}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[styles.markerContainer, { borderColor: color }]}>
                  <Text style={styles.markerText}>{name[0]}</Text>
                </View>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FamTrack</Text>
        <View style={styles.liveBadge}><View style={styles.liveDot}/><Text style={styles.liveText}>LIVE</Text></View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('History')}>
          <Text style={styles.headerBtnText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Fit all button */}
      <TouchableOpacity style={styles.fitBtn} onPress={fitAll}>
        <Text style={styles.fitBtnText}>⊞ All</Text>
      </TouchableOpacity>

      {/* Member chips */}
      <View style={styles.chipsRow}>
        {members.map((m, i) => {
          const name = m.user?.[0]?.name || 'Member';
          const lat = m.lat || m.doc?.lat;
          const lng = m.lng || m.doc?.lng;
          const battery = m.battery ?? 0;
          return (
            <TouchableOpacity key={i} style={[styles.chip, { borderColor: getColor(i) }]}
              onPress={() => {
                setSelected(m);
                mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 600);
              }}>
              <Text style={[styles.chipName, { color: getColor(i) }]}>{name.split(' ')[0]}</Text>
              <Text style={[styles.chipBattery, { color: batteryColor(battery) }]}>{battery}%</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected member panel */}
      {selected && (
        <View style={styles.panel}>
          <Text style={styles.panelName}>{selected.user?.[0]?.name}</Text>
          <Text style={styles.panelAddr}>📍 {selected.address || 'Getting address...'}</Text>
          <View style={styles.panelRow}>
            <Text style={styles.panelStat}>🚗 {Math.round(selected.speed || 0)} km/h</Text>
            <Text style={styles.panelStat}>🔋 {selected.battery || 0}%</Text>
          </View>
          <TouchableOpacity style={styles.panelClose} onPress={() => setSelected(null)}>
            <Text style={{ color: '#888' }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1724' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e1a' },
  map: { flex: 1 },
  header: { position: 'absolute', top: 44, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(17,24,39,0.95)', borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: '#1e3a5f' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#60a5fa', flex: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 12 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981' },
  liveText: { fontSize: 11, color: '#10b981', fontWeight: '700' },
  headerBtn: { backgroundColor: '#1e3a5f', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  headerBtnText: { color: '#93c5fd', fontSize: 12, fontWeight: '600' },
  markerContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1e293b', borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  markerText: { color: 'white', fontWeight: '700', fontSize: 13 },
  fitBtn: { position: 'absolute', top: 108, right: 16, backgroundColor: 'rgba(17,24,39,0.95)', padding: 10, borderRadius: 10, borderWidth: 0.5, borderColor: '#1e3a5f' },
  fitBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  chipsRow: { position: 'absolute', bottom: 120, left: 12, right: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(17,24,39,0.95)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipName: { fontSize: 13, fontWeight: '600' },
  chipBattery: { fontSize: 11 },
  panel: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: '#111827', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#1e3a5f' },
  panelName: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  panelAddr: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  panelRow: { flexDirection: 'row', gap: 20 },
  panelStat: { fontSize: 13, color: '#64748b' },
  panelClose: { position: 'absolute', top: 12, right: 12, padding: 6 }
});
