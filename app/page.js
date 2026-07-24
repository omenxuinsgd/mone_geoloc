'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Color palette for distinct devices
const DEVICE_COLORS = [
  { name: 'Indigo', hex: '#6366f1', bgClass: 'bg-indigo-500', textClass: 'text-indigo-400', borderClass: 'border-indigo-500' },
  { name: 'Emerald', hex: '#10b981', bgClass: 'bg-emerald-500', textClass: 'text-emerald-400', borderClass: 'border-emerald-500' },
  { name: 'Amber', hex: '#f59e0b', bgClass: 'bg-amber-500', textClass: 'text-amber-400', borderClass: 'border-amber-500' },
  { name: 'Rose', hex: '#f43f5e', bgClass: 'bg-rose-500', textClass: 'text-rose-400', borderClass: 'border-rose-500' },
  { name: 'Cyan', hex: '#06b6d4', bgClass: 'bg-cyan-500', textClass: 'text-cyan-400', borderClass: 'border-cyan-500' },
  { name: 'Purple', hex: '#a855f7', bgClass: 'bg-purple-500', textClass: 'text-purple-400', borderClass: 'border-purple-500' },
];

const loadExternalScripts = () => {
  return new Promise((resolve) => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const leafletPromise = new Promise((res) => {
      if (window.L) return res();
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => res();
      document.head.appendChild(script);
    });

    const pahoPromise = new Promise((res) => {
      if (window.Paho) return res();
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js';
      script.onload = () => res();
      document.head.appendChild(script);
    });

    Promise.all([leafletPromise, pahoPromise]).then(resolve);
  });
};

const Icons = {
  MapPin: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  Wifi: ({ connected }) => (
    <svg className={`w-5 h-5 ${connected ? 'text-emerald-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
    </svg>
  ),
  Play: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  Pause: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  Code: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>
  ),
  Layers: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
    </svg>
  ),
  Copy: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
    </svg>
  ),
  Devices: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Share: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  ),
  Folder: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
};

export default function App() {
  const [scriptsReady, setScriptsReady] = useState(false);
  
  // MQTT Config
  const [brokerHost, setBrokerHost] = useState('broker.hivemq.com');
  const [brokerPort, setBrokerPort] = useState(8884); // WebSocket WSS
  const [clientId] = useState(`web_dashboard_${Math.random().toString(16).substring(2, 8)}`);

  // TOPIC MANAGEMENT WITH CACHING (localStorage & URL Sync)
  const DEFAULT_TOPICS = [
    { id: '1', topic: 'device/+/location', label: 'Primary Multi-Device', active: true }
  ];

  const [topics, setTopics] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_TOPICS;
    try {
      // 1. Check URL parameters for cross-device topic sharing
      const urlParams = new URLSearchParams(window.location.search);
      const urlTopicsParam = urlParams.get('topics');
      if (urlTopicsParam) {
        const parsedUrlTopics = JSON.parse(decodeURIComponent(urlTopicsParam));
        if (Array.isArray(parsedUrlTopics) && parsedUrlTopics.length > 0) {
          return parsedUrlTopics;
        }
      }

      // 2. Fallback to LocalStorage Cache
      const cached = localStorage.getItem('mqtt_cached_topics');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading cached topics:', e);
    }
    return DEFAULT_TOPICS;
  });

  const [newTopicInput, setNewTopicInput] = useState('');
  const [newTopicLabel, setNewTopicLabel] = useState('');
  const [topicShareCopied, setTopicShareCopied] = useState(false);

  // Save topics to LocalStorage Cache
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mqtt_cached_topics', JSON.stringify(topics));
      } catch (e) {
        console.error('Failed to save topics to cache:', e);
      }
    }
  }, [topics]);

  // Active Subscription Topics Array
  const activeTopicStrings = topics.filter(t => t.active).map(t => t.topic);
  // Default primary topic for display/scripts
  const mqttTopic = activeTopicStrings[0] || 'device/+/location';
  
  // MQTT Status
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED');
  const [errorMsg, setErrorMsg] = useState('');

  // Multi-Device State: Dictionary of devices keyed by device ID
  const [devices, setDevices] = useState({});
  const [selectedDeviceId, setSelectedDeviceId] = useState('all'); // 'all' or specific device ID
  
  const [logs, setLogs] = useState([]);
  const [followDevice, setFollowDevice] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Map references
  const mqttClientRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  const markersRef = useRef({});
  const polylinesRef = useRef({});
  const simulationIntervalRef = useRef(null);

  useEffect(() => {
    loadExternalScripts().then(() => {
      setScriptsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!scriptsReady || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const initialLat = -6.317718;
    const initialLng = 106.687184;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [scriptsReady]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    Object.values(devices).forEach((dev) => {
      const { id, latitude, longitude, color, history } = dev;
      const isVisible = selectedDeviceId === 'all' || selectedDeviceId === id;

      // 1. Manage Marker
      if (!markersRef.current[id]) {
        const customIcon = L.divIcon({
          className: `custom-marker-${id}`,
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute w-8 h-8 rounded-full opacity-40 animate-ping" style="background-color: ${color.hex}"></span>
              <div class="w-6 h-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-[10px] font-bold text-white z-10" style="background-color: ${color.hex}">
                ${id.substring(0, 2).toUpperCase()}
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        markersRef.current[id] = marker;
      } else {
        markersRef.current[id].setLatLng([latitude, longitude]);
      }

      // Update Popup contents
      markersRef.current[id].bindPopup(`
        <div class="p-1 font-sans text-xs">
          <div class="font-bold flex items-center gap-1 text-slate-900">
            <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${color.hex}"></span>
            ${id}
          </div>
          <p class="text-slate-600 mt-1">Lat: ${latitude.toFixed(6)}</p>
          <p class="text-slate-600">Lng: ${longitude.toFixed(6)}</p>
          <p class="text-slate-400 text-[10px] mt-1">Updated: ${new Date(dev.timestamp).toLocaleTimeString()}</p>
        </div>
      `);

      if (isVisible) {
        markersRef.current[id].addTo(map);
      } else {
        map.removeLayer(markersRef.current[id]);
      }

      // 2. Manage Polyline (Path Trail)
      const latLngs = history.map((item) => [item.lat, item.lng]);
      if (!polylinesRef.current[id]) {
        const polyline = L.polyline(latLngs, {
          color: color.hex,
          weight: 4,
          opacity: 0.8,
          dashArray: '6, 6',
          lineJoin: 'round'
        }).addTo(map);
        polylinesRef.current[id] = polyline;
      } else {
        polylinesRef.current[id].setLatLngs(latLngs);
      }

      if (isVisible) {
        polylinesRef.current[id].addTo(map);
      } else {
        map.removeLayer(polylinesRef.current[id]);
      }
    });

    // Auto camera positioning
    if (followDevice) {
      if (selectedDeviceId !== 'all' && devices[selectedDeviceId]) {
        const dev = devices[selectedDeviceId];
        map.panTo([dev.latitude, dev.longitude], { animate: true, duration: 0.8 });
      } else if (Object.keys(devices).length > 0) {
        // Fit bounds to all devices
        const allCoords = Object.values(devices).map(d => [d.latitude, d.longitude]);
        if (allCoords.length > 1) {
          const bounds = L.latLngBounds(allCoords);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } else if (allCoords.length === 1) {
          map.panTo(allCoords[0], { animate: true });
        }
      }
    }
  }, [devices, selectedDeviceId, followDevice]);

  const handleIncomingMessage = useCallback((message) => {
    try {
      const payloadStr = message.payloadString;
      const topicName = message.destinationName;
      const parsed = JSON.parse(payloadStr);

      if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        // Extract device ID from topic (e.g. device/laptop-1/location) or payload client_id
        let devId = parsed.client_id;
        if (!devId) {
          const parts = topicName.split('/');
          devId = parts.length >= 2 ? parts[1] : 'Unknown-Device';
        }

        setDevices((prev) => {
          const existing = prev[devId];
          const color = existing ? existing.color : DEVICE_COLORS[Object.keys(prev).length % DEVICE_COLORS.length];
          const newHistory = existing ? [...existing.history, { lat: parsed.latitude, lng: parsed.longitude }] : [{ lat: parsed.latitude, lng: parsed.longitude }];

          return {
            ...prev,
            [devId]: {
              id: devId,
              latitude: parsed.latitude,
              longitude: parsed.longitude,
              timestamp: parsed.timestamp ? parsed.timestamp * 1000 : Date.now(),
              color,
              history: newHistory,
              topic: topicName
            }
          };
        });

        // Append log entry
        setLogs((prev) => [
          {
            id: Math.random().toString(36).substring(2, 9),
            time: new Date().toLocaleTimeString(),
            topic: topicName,
            deviceId: devId,
            payload: payloadStr,
            success: true
          },
          ...prev.slice(0, 49)
        ]);
      }
    } catch (e) {
      console.error('Error parsing MQTT payload:', e);
      setLogs((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          time: new Date().toLocaleTimeString(),
          topic: message.destinationName,
          deviceId: 'N/A',
          payload: message.payloadString,
          success: false
        },
        ...prev.slice(0, 49)
      ]);
    }
  }, []);

  const connectMqtt = useCallback(() => {
    if (!window.Paho) return;

    setConnectionStatus('CONNECTING');
    setErrorMsg('');

    try {
      const client = new window.Paho.MQTT.Client(brokerHost, Number(brokerPort), clientId);

      client.onConnectionLost = (responseObject) => {
        console.warn('MQTT Connection Lost:', responseObject.errorMessage);
        setConnectionStatus('DISCONNECTED');
        if (responseObject.errorCode !== 0) {
          setErrorMsg(responseObject.errorMessage || 'Koneksi terputus dari broker');
        }
      };

      client.onMessageArrived = (message) => {
        handleIncomingMessage(message);
      };

      client.connect({
        onSuccess: () => {
          setConnectionStatus('CONNECTED');
          setErrorMsg('');
          console.log(`Connected to MQTT broker! Subscribing to active topics:`, activeTopicStrings);
          
          // Subscribe to all active topics
          activeTopicStrings.forEach((top) => {
            if (top && top.trim().length > 0) {
              client.subscribe(top, { qos: 0 });
            }
          });
        },
        onFailure: (err) => {
          console.error('MQTT Connect Failed:', err);
          setConnectionStatus('ERROR');
          setErrorMsg(err.errorMessage || 'Gagal terhubung ke broker WebSocket MQTT.');
        },
        useSSL: brokerPort === 8884 || brokerPort === 443,
        timeout: 10,
        keepAliveInterval: 30
      });

      mqttClientRef.current = client;
    } catch (err) {
      setConnectionStatus('ERROR');
      setErrorMsg(err.message || 'Gagal menginisialisasi MQTT client');
    }
  }, [brokerHost, brokerPort, clientId, activeTopicStrings, handleIncomingMessage]);

  // Dynamically update MQTT Subscriptions when topics state changes
  useEffect(() => {
    if (mqttClientRef.current && connectionStatus === 'CONNECTED') {
      activeTopicStrings.forEach((top) => {
        if (top) mqttClientRef.current.subscribe(top, { qos: 0 });
      });
    }
  }, [topics, connectionStatus]);

  // Topic Helper Methods
  const addTopic = (e) => {
    e.preventDefault();
    if (!newTopicInput.trim()) return;

    const formattedTopic = newTopicInput.trim();
    if (topics.some((t) => t.topic === formattedTopic)) {
      setErrorMsg('Topik ini sudah ada dalam daftar.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const newEntry = {
      id: Math.random().toString(36).substring(2, 9),
      topic: formattedTopic,
      label: newTopicLabel.trim() || formattedTopic,
      active: true
    };

    setTopics((prev) => [...prev, newEntry]);
    setNewTopicInput('');
    setNewTopicLabel('');

    // If currently connected, subscribe immediately
    if (mqttClientRef.current && connectionStatus === 'CONNECTED') {
      mqttClientRef.current.subscribe(formattedTopic, { qos: 0 });
    }
  };

  const removeTopic = (topicId) => {
    const target = topics.find((t) => t.id === topicId);
    if (!target) return;

    if (mqttClientRef.current && connectionStatus === 'CONNECTED' && target.topic) {
      try {
        mqttClientRef.current.unsubscribe(target.topic);
      } catch (err) {
        console.warn('Unsubscribe error:', err);
      }
    }

    setTopics((prev) => prev.filter((t) => t.id !== topicId));
  };

  const toggleTopicActive = (topicId) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id === topicId) {
          const nextState = !t.active;
          if (mqttClientRef.current && connectionStatus === 'CONNECTED') {
            if (nextState) {
              mqttClientRef.current.subscribe(t.topic, { qos: 0 });
            } else {
              mqttClientRef.current.unsubscribe(t.topic);
            }
          }
          return { ...t, active: nextState };
        }
        return t;
      })
    );
  };

  const shareTopicsUrl = () => {
    const encoded = encodeURIComponent(JSON.stringify(topics));
    const url = `${window.location.origin}${window.location.pathname}?topics=${encoded}`;
    navigator.clipboard.writeText(url);
    setTopicShareCopied(true);
    setTimeout(() => setTopicShareCopied(false), 2500);
  };

  const exportTopicsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(topics, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "mqtt_topics_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importTopicsJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          setTopics(imported);
        }
      } catch (err) {
        setErrorMsg('Gagal membaca file JSON topik');
      }
    };
    reader.readAsText(file);
  };

  const disconnectMqtt = useCallback(() => {
    if (mqttClientRef.current && mqttClientRef.current.isConnected()) {
      mqttClientRef.current.disconnect();
    }
    setConnectionStatus('DISCONNECTED');
  }, []);

  useEffect(() => {
    if (scriptsReady && connectionStatus === 'DISCONNECTED') {
      connectMqtt();
    }
    return () => {
      if (mqttClientRef.current && mqttClientRef.current.isConnected()) {
        mqttClientRef.current.disconnect();
      }
    };
  }, [scriptsReady]);

  const toggleSimulation = () => {
    if (simulating) {
      clearInterval(simulationIntervalRef.current);
      setSimulating(false);
    } else {
      setSimulating(true);
      let step = 0;
      
      const simulatedDevices = [
        { id: 'Laptop-Alpha', baseLat: -6.317718, baseLng: 106.687184, radiusLat: 0.0015, radiusLng: 0.002, speed: 0.0002 },
        { id: 'Fleet-Car-01', baseLat: -6.315000, baseLng: 106.689000, radiusLat: 0.0025, radiusLng: 0.001, speed: 0.0003 },
        { id: 'Delivery-Drone-X', baseLat: -6.320000, baseLng: 106.685000, radiusLat: 0.0018, radiusLng: 0.0025, speed: 0.00015 }
      ];

      simulationIntervalRef.current = setInterval(() => {
        step += 1;
        simulatedDevices.forEach((dev) => {
          const angle = step * dev.speed * 10;
          const newLat = dev.baseLat + Math.sin(angle) * dev.radiusLat;
          const newLng = dev.baseLng + Math.cos(angle) * dev.radiusLng;

          const simPayload = {
            client_id: dev.id,
            latitude: newLat,
            longitude: newLng,
            timestamp: Math.floor(Date.now() / 1000)
          };

          handleIncomingMessage({
            destinationName: `device/${dev.id}/location`,
            payloadString: JSON.stringify(simPayload)
          });
        });
      }, 2000);
    }
  };

  const calculateTotalDistance = (history) => {
    if (!history || history.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < history.length; i++) {
      const p1 = history[i - 1];
      const p2 = history[i];
      const R = 6371;
      const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
      const dLng = (p2.lng - p1.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat * (Math.PI / 180)) *
          Math.cos(p2.lat * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    return total.toFixed(3);
  };

  const pythonCodeSnippet = `import asyncio
import json
import socket
import time
import paho.mqtt.client as mqtt
import winsdk.windows.devices.geolocation as wdg

# ==========================================
# KONFIGURASI MULTI-DEVICE PUBLISHER
# ==========================================
BROKER_ADDRESS = "${brokerHost}"
PORT = 1883

# Gunakan Nama Host Laptop sebagai Client ID Unik
DEVICE_NAME = socket.gethostname()  # e.g., "LAPTOP-WORK-01"
TOPIC_LOCATION = f"device/{DEVICE_NAME}/location"
CLIENT_ID = f"Publisher-{DEVICE_NAME}"
PUBLISH_INTERVAL = 10  # Detik


async def get_coords_async():
    locator = wdg.Geolocator()
    pos = await locator.get_geoposition_async()
    return pos.coordinate.latitude, pos.coordinate.longitude


def get_location():
    try:
        return asyncio.run(get_coords_async())
    except PermissionError:
        print("ERROR: Akses lokasi ditolak di Settings Windows")
        return None, None
    except Exception as e:
        print(f"Error lokasi: {e}")
        return None, None


def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f" Connected as device: {DEVICE_NAME}")
    else:
        print(f" Connection failed: {rc}")


def on_publish(client, userdata, mid, reason_code, properties=None):
    print(f" Data published to topic: {TOPIC_LOCATION}")


def main():
    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        client_id=CLIENT_ID,
    )
    client.on_connect = on_connect
    client.on_publish = on_publish

    print(f"Connecting to broker {BROKER_ADDRESS} as {CLIENT_ID}...")
    try:
        client.connect(BROKER_ADDRESS, PORT, keepalive=60)
    except Exception as e:
        print(f"Connection error: {e}")
        return

    client.loop_start()

    try:
        while True:
            lat, lon = get_location()
            if lat is not None and lon is not None:
                payload = {
                    "client_id": DEVICE_NAME,
                    "latitude": lat,
                    "longitude": lon,
                    "timestamp": int(time.time()),
                }
                json_payload = json.dumps(payload)
                client.publish(TOPIC_LOCATION, json_payload, qos=1, retain=True)
                print(f" Published: {json_payload}")

            time.sleep(PUBLISH_INTERVAL)

    except KeyboardInterrupt:
        print("Stopping...")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
`;

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(pythonCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const deviceList = Object.values(devices);
  const activeDeviceCount = deviceList.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* HEADER BAR */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Icons.MapPin />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              M-ONE IoT Tracker
            </h1>
            <p className="text-xs text-slate-400 mt-1">Real-time GPS Telemetry dengan Caching Topik Persistent</p>
          </div>
        </div>

        {/* TOP BUTTONS */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'CONNECTED'
                  ? 'bg-emerald-500 animate-pulse'
                  : connectionStatus === 'CONNECTING'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            ></span>
            <span className="font-medium text-slate-300 capitalize">{connectionStatus.toLowerCase()}</span>
          </div>

          <button
            onClick={() => setShowCodeModal(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95"
          >
            <Icons.Code />
            <span>Python Script</span>
          </button>

          <button
            onClick={toggleSimulation}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border shadow-sm active:scale-95 ${
              simulating
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white'
            }`}
          >
            {simulating ? <Icons.Pause /> : <Icons.Play />}
            <span>{simulating ? 'Stop Simulasi Multi' : 'Simulasi Multi-Device'}</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 max-w-[1920px] w-full mx-auto">
        
        {/* LEFT PANEL (4 COLS) - CONFIG, TOPICS, DEVICE LIST */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          
          {/* BROKER CONFIGURATION */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Icons.Wifi connected={connectionStatus === 'CONNECTED'} />
                <span>Pengaturan MQTT Broker</span>
              </h2>
              {connectionStatus === 'CONNECTED' ? (
                <button onClick={disconnectMqtt} className="text-xs text-rose-400 hover:text-rose-300 font-medium">
                  Disconnect
                </button>
              ) : (
                <button onClick={connectMqtt} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                  Connect
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">WebSocket Broker Host</label>
                <input
                  type="text"
                  value={brokerHost}
                  onChange={(e) => setBrokerHost(e.target.value)}
                  disabled={connectionStatus === 'CONNECTED'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Port WSS</label>
                <input
                  type="number"
                  value={brokerPort}
                  onChange={(e) => setBrokerPort(Number(e.target.value))}
                  disabled={connectionStatus === 'CONNECTED'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5 text-rose-400 text-[11px] leading-relaxed">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>

          {/* PERSISTENT TOPIC MANAGER CARD */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Icons.Folder />
                <h2 className="text-sm font-semibold text-slate-200">Manajemen Topik (Tersimpan)</h2>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Auto-Cached
              </span>
            </div>

            {/* ADD NEW TOPIC FORM */}
            <form onSubmit={addTopic} className="space-y-2 mb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Topic (e.g. device/+/location)"
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Label Opsional"
                  value={newTopicLabel}
                  onChange={(e) => setNewTopicLabel(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-medium py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
              >
                <Icons.Plus />
                <span>Tambah & Simpan Topik</span>
              </button>
            </form>

            {/* SAVED TOPICS LIST */}
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 mb-3 scrollbar-thin">
              {topics.length === 0 ? (
                <div className="text-center py-3 text-slate-500 text-xs">Belum ada topik tersimpan.</div>
              ) : (
                topics.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                      t.active
                        ? 'bg-slate-950/80 border-indigo-500/40 text-slate-200'
                        : 'bg-slate-950/30 border-slate-800/60 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <input
                        type="checkbox"
                        checked={t.active}
                        onChange={() => toggleTopicActive(t.id)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="truncate">
                        <span className="font-mono text-[11px] text-indigo-300 block truncate">{t.topic}</span>
                        {t.label && <span className="text-[10px] text-slate-400 block truncate">{t.label}</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => removeTopic(t.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Hapus Topik Ini"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* EXPORT / IMPORT / SHARE ACTION BUTTONS */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[11px]">
              <button
                onClick={shareTopicsUrl}
                className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all"
                title="Salin Link dengan Konfigurasi Topik"
              >
                {topicShareCopied ? <Icons.Check /> : <Icons.Share />}
                <span>{topicShareCopied ? 'Link Tersalin!' : 'Bagikan Link'}</span>
              </button>

              <button
                onClick={exportTopicsJson}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg transition-all"
                title="Export JSON Topik"
              >
                Export
              </button>

              <label className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer">
                Import
                <input type="file" accept=".json" onChange={importTopicsJson} className="hidden" />
              </label>
            </div>
          </div>

          {/* ACTIVE DEVICES SELECTOR & LIST */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex-1 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Icons.Devices />
                <span>Daftar Device Terdeteksi</span>
              </h2>
              <span className="text-xs bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                {deviceList.length} Active
              </span>
            </div>

            {/* DEVICE SELECTOR TABS */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-2 mb-2 scrollbar-none">
              <button
                onClick={() => setSelectedDeviceId('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  selectedDeviceId === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Semua Device ({deviceList.length})
              </button>

              {deviceList.map((dev) => (
                <button
                  key={dev.id}
                  onClick={() => setSelectedDeviceId(dev.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    selectedDeviceId === dev.id
                      ? 'bg-slate-800 text-white border-indigo-500/80 shadow-md'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dev.color.hex }}></span>
                  <span>{dev.id}</span>
                </button>
              ))}
            </div>

            {/* DEVICE LIST CARDS */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-1 max-h-[240px]">
              {deviceList.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-sans">
                  Belum ada paket data dari topik terdaftar.
                  <br />
                  Klik <span className="text-indigo-400 font-medium">"Simulasi Multi-Device"</span> di atas untuk uji coba!
                </div>
              ) : (
                deviceList
                  .filter((dev) => selectedDeviceId === 'all' || selectedDeviceId === dev.id)
                  .map((dev) => (
                    <div
                      key={dev.id}
                      onClick={() => setSelectedDeviceId(dev.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedDeviceId === dev.id
                          ? 'bg-slate-800/90 border-indigo-500 shadow-lg'
                          : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: dev.color.hex }}
                          ></span>
                          <span className="font-semibold text-xs text-slate-200">{dev.id}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(dev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-2">
                        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800/60">
                          <span className="text-[9px] text-slate-500 block">LAT</span>
                          <span className="text-slate-300">{dev.latitude.toFixed(6)}</span>
                        </div>
                        <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800/60">
                          <span className="text-[9px] text-slate-500 block">LNG</span>
                          <span className="text-slate-300">{dev.longitude.toFixed(6)}</span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/50">
                        <span className="truncate max-w-[120px] text-indigo-300 font-mono">{dev.topic}</span>
                        <span>Jarak: <span className="text-emerald-400">{calculateTotalDistance(dev.history)} km</span></span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL (8 COLS) - LEAFLET MAP & RECENT LOGS */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* MAP DISPLAY */}
          <div className="relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl h-[500px] lg:h-[560px]">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* FLOATING CONTROLS */}
            <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2">
              <button
                onClick={() => setFollowDevice(!followDevice)}
                className={`p-2.5 rounded-xl text-xs font-medium border shadow-lg backdrop-blur-md transition-all flex items-center gap-1.5 ${
                  followDevice
                    ? 'bg-indigo-600/90 text-white border-indigo-400/50'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                <Icons.MapPin />
                <span>{followDevice ? 'Lock Focus Camera' : 'Free Camera'}</span>
              </button>

              <button
                onClick={() => {
                  setDevices({});
                  markersRef.current = {};
                  polylinesRef.current = {};
                }}
                className="p-2.5 rounded-xl text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 shadow-lg backdrop-blur-md transition-all flex items-center justify-center"
                title="Reset Devices"
              >
                <Icons.Trash />
              </button>
            </div>

            {/* SIMULATION OVERLAY */}
            {simulating && (
              <div className="absolute bottom-4 left-4 z-20 bg-amber-500/90 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg backdrop-blur-md flex items-center space-x-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-slate-950"></span>
                <span>Simulasi Multi-Device Aktif</span>
              </div>
            )}
          </div>

          {/* MQTT MULTI LOG FEED */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex-1 flex flex-col max-h-[260px]">
            <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Live Data Stream (Semua Topik Aktif)
              </h3>
              <button onClick={() => setLogs([])} className="text-[11px] text-slate-500 hover:text-slate-300">
                Clear Logs
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-1.5 font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="text-center py-6 text-slate-600 text-xs font-sans">
                  Menunggu paket data dari topik terdaftar...
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between bg-slate-950/60 hover:bg-slate-950 px-3 py-2 rounded-lg border border-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="text-slate-500 text-[10px]">{log.time}</span>
                      <span className="text-indigo-400 font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                        {log.deviceId}
                      </span>
                      <span className="text-slate-400 text-[10px] truncate max-w-[140px]">{log.topic}</span>
                      <span className="text-slate-300 truncate max-w-xs">{log.payload}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                        log.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {log.success ? 'OK' : 'ERR'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* PYTHON SCRIPT MODAL */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Skrip Multi-Device Publisher (Python)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Topik otomatis dinamis sesuai nama device: <code className="text-indigo-400">device/&lt;HOSTNAME&gt;/location</code>
                </p>
              </div>
              <button onClick={() => setShowCodeModal(false)} className="text-slate-400 hover:text-white text-sm p-1">
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-950">
              <pre className="text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                {pythonCodeSnippet}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Jalankan di beberapa laptop secara bersamaan!
              </span>
              <button
                onClick={copyCodeToClipboard}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
              >
                {copiedCode ? <Icons.Check /> : <Icons.Copy />}
                <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}