import { useState, useEffect } from 'react';
import TaskList from '../components/TaskList';
import PackingList from '../components/PackingList';
import MedicineList from '../components/MedicineList';
import TravelInfoModal from './TravelInfoModal';
import CopyChecklistModal from './CopyChecklistModal';
import FlightModal from './FlightModal';
import CurrencyModal from './CurrencyModal';

const API = '/api/trips';

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
}

function getNextFlight(flights) {
  if (!flights || flights.length === 0) return null;
  const now = new Date();
  const sorted = [...flights].sort((a, b) => {
    const da = new Date((a.flight_date || '1970-01-01') + 'T' + (a.departure_time || '00:00'));
    const db = new Date((b.flight_date || '1970-01-01') + 'T' + (b.departure_time || '00:00'));
    return da - db;
  });
  return sorted.find(f => {
    const d = new Date((f.flight_date || '1970-01-01') + 'T' + (f.departure_time || '23:59'));
    return d >= now;
  }) || sorted[sorted.length - 1];
}

const COUNTRY_TIMEZONE = {
  Thailand: 'Asia/Bangkok', Japan: 'Asia/Tokyo',
  USA: 'America/New_York', 'Vereinigte Staaten': 'America/New_York',
  Italy: 'Europe/Rome', Italien: 'Europe/Rome',
  Spain: 'Europe/Madrid', Spanien: 'Europe/Madrid',
  Greece: 'Europe/Athens', Griechenland: 'Europe/Athens',
  Turkey: 'Europe/Istanbul', Türkei: 'Europe/Istanbul',
  Morocco: 'Africa/Casablanca', Marokko: 'Africa/Casablanca',
  Mexico: 'America/Mexico_City', Mexiko: 'America/Mexico_City',
  Australia: 'Australia/Sydney', Australien: 'Australia/Sydney',
  Portugal: 'Europe/Lisbon',
  France: 'Europe/Paris', Frankreich: 'Europe/Paris',
  Vietnam: 'Asia/Ho_Chi_Minh',
  Indonesia: 'Asia/Jakarta', Indonesien: 'Asia/Jakarta',
  Iceland: 'Atlantic/Reykjavik', Island: 'Atlantic/Reykjavik',
  Croatia: 'Europe/Zagreb', Kroatien: 'Europe/Zagreb',
  Peru: 'America/Lima',
  Canada: 'America/Toronto', Kanada: 'America/Toronto',
  Egypt: 'Africa/Cairo', Ägypten: 'Africa/Cairo',
  India: 'Asia/Kolkata', Indien: 'Asia/Kolkata',
  'United Kingdom': 'Europe/London', Großbritannien: 'Europe/London',
  Switzerland: 'Europe/Zurich', Schweiz: 'Europe/Zurich',
  Norway: 'Europe/Oslo', Norwegen: 'Europe/Oslo',
  Sweden: 'Europe/Stockholm', Schweden: 'Europe/Stockholm',
  Denmark: 'Europe/Copenhagen', Dänemark: 'Europe/Copenhagen',
  'Czech Republic': 'Europe/Prague', Tschechien: 'Europe/Prague',
  Poland: 'Europe/Warsaw', Polen: 'Europe/Warsaw',
  Hungary: 'Europe/Budapest', Ungarn: 'Europe/Budapest',
  Romania: 'Europe/Bucharest', Rumänien: 'Europe/Bucharest',
  Bulgaria: 'Europe/Sofia', Bulgarien: 'Europe/Sofia',
  Austria: 'Europe/Vienna', Österreich: 'Europe/Vienna',
  Germany: 'Europe/Berlin', Deutschland: 'Europe/Berlin',
  Netherlands: 'Europe/Amsterdam', Niederlande: 'Europe/Amsterdam',
  Belgium: 'Europe/Brussels', Belgien: 'Europe/Brussels',
  Singapore: 'Asia/Singapore', Singapur: 'Asia/Singapore',
  Malaysia: 'Asia/Kuala_Lumpur',
  'South Korea': 'Asia/Seoul', Südkorea: 'Asia/Seoul',
  China: 'Asia/Shanghai',
  Philippines: 'Asia/Manila', Philippinen: 'Asia/Manila',
  'Sri Lanka': 'Asia/Colombo',
  Cambodia: 'Asia/Phnom_Penh', Kambodscha: 'Asia/Phnom_Penh',
  Nepal: 'Asia/Kathmandu',
  'Hong Kong': 'Asia/Hong_Kong', Hongkong: 'Asia/Hong_Kong',
  Taiwan: 'Asia/Taipei',
  'New Zealand': 'Pacific/Auckland', Neuseeland: 'Pacific/Auckland',
  Brazil: 'America/Sao_Paulo', Brasilien: 'America/Sao_Paulo',
  Argentina: 'America/Argentina/Buenos_Aires', Argentinien: 'America/Argentina/Buenos_Aires',
  Colombia: 'America/Bogota', Kolumbien: 'America/Bogota',
  Chile: 'America/Santiago',
  'Dominican Republic': 'America/Santo_Domingo', 'Dominikanische Republik': 'America/Santo_Domingo',
  Cuba: 'America/Havana', Kuba: 'America/Havana',
  UAE: 'Asia/Dubai', 'Vereinigte Arabische Emirate': 'Asia/Dubai', Dubai: 'Asia/Dubai',
  Israel: 'Asia/Jerusalem',
  Jordan: 'Asia/Amman', Jordanien: 'Asia/Amman',
  'South Africa': 'Africa/Johannesburg', Südafrika: 'Africa/Johannesburg',
  Kenya: 'Africa/Nairobi', Kenia: 'Africa/Nairobi',
  Tanzania: 'Africa/Dar_es_Salaam', Tansania: 'Africa/Dar_es_Salaam',
};

function fmtTime(date, tz) {
  return date.toLocaleTimeString('de-DE', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
}

function hourDiff(tz1, tz2, now) {
  const t1 = new Date(now.toLocaleString('en-US', { timeZone: tz1 }));
  const t2 = new Date(now.toLocaleString('en-US', { timeZone: tz2 }));
  return Math.round((t2 - t1) / 3600000);
}

function roundBtn(style) {
  return {
    borderRadius: '50%',
    width: 72,
    height: 72,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: 0,
    ...style,
  };
}

export default function Dashboard({ tripId, onBack }) {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showFlightModal,   setShowFlightModal]   = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const [geoData, setGeoData] = useState(null);
  const [flightStatus, setFlightStatus] = useState(null);
  const [flightStatusLoading, setFlightStatusLoading] = useState(false);
  const [flightStatusError, setFlightStatusError] = useState(null);

  useEffect(() => { loadTrip(); }, [tripId]);

  useEffect(() => {
    if (!trip) return;
    fetch(`/api/country-outline?destination=${encodeURIComponent(trip.destination)}&country=${encodeURIComponent(trip.country || '')}`)
      .then(r => r.json())
      .then(data => setGeoData(data))
      .catch(() => {});
  }, [trip?.destination, trip?.country]);

  const loadTrip = () => {
    fetch(`${API}/${tripId}`)
      .then(r => r.json())
      .then(setTrip)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchFlightStatus = async (flight) => {
    if (!flight || !flight.flight_number) return;
    setFlightStatusLoading(true);
    setFlightStatusError(null);
    try {
      const res = await fetch('/api/flight-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flightNumber: flight.flight_number, date: flight.flight_date }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFlightStatus(data);
    } catch (err) {
      setFlightStatusError(err.message);
    } finally {
      setFlightStatusLoading(false);
    }
  };

  if (loading) {
    return <div className="app" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner" /></div>;
  }
  if (!trip) {
    return (
      <div className="app" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <p>Reise nicht gefunden.</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onBack}>Zurück</button>
      </div>
    );
  }

  const upcomingTasks = (trip.tasks || []).filter(t => {
    if (t.completed || !t.due_date) return false;
    const d = getDaysUntil(t.due_date);
    return d !== null && d >= 0 && d <= 3;
  });
  const overdueTasks = (trip.tasks || []).filter(t => {
    if (t.completed || !t.due_date) return false;
    const d = getDaysUntil(t.due_date);
    return d !== null && d < 0;
  });

  const daysUntilTrip = getDaysUntil(trip.start_date);
  const nextFlight    = getNextFlight(trip.flights || []);
  const hasFlights    = (trip.flights || []).length > 0;

  return (
    <div className="app">
      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        padding: '16px 16px 20px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {geoData && (
          <svg viewBox={geoData.viewBox} preserveAspectRatio="xMidYMid meet"
            style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', height: '160%', width: '52%', pointerEvents: 'none' }}>
            <path d={geoData.svgPath} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.22)" strokeWidth={0.7} strokeLinejoin="round" />
            <circle cx={geoData.destX} cy={geoData.destY} r={12} fill="rgba(255,255,255,0.1)" />
            <circle cx={geoData.destX} cy={geoData.destY} r={5}  fill="rgba(255,255,255,0.75)" />
            <circle cx={geoData.destX} cy={geoData.destY} r={2}  fill="white" />
          </svg>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, position: 'relative' }}>
          <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'white', fontSize: '1.1rem', cursor: 'pointer' }} onClick={onBack}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reise nach</div>
            <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 0 }}>{trip.country || trip.destination}</h2>
            {trip.destination && trip.destination !== trip.country && (
              <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: 1 }}>📍 {trip.destination}</div>
            )}
          </div>
        </div>

        {trip.start_date && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: '0.85rem' }}>
              📅 {formatDate(trip.start_date)}{trip.end_date && ` → ${formatDate(trip.end_date)}`}
            </span>
            {daysUntilTrip !== null && daysUntilTrip >= 0 && (
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: '0.85rem' }}>✈️ Noch {daysUntilTrip} Tage</span>
            )}
            {daysUntilTrip !== null && daysUntilTrip < 0 && (
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: '0.85rem' }}>🏝️ Reise läuft</span>
            )}
          </div>
        )}

        {/* ── Live-Uhrzeiten ── */}
        {(() => {
          const destTz = COUNTRY_TIMEZONE[trip.country] || COUNTRY_TIMEZONE[trip.destination];
          const berlinTime = fmtTime(now, 'Europe/Berlin');
          const destTime   = destTz ? fmtTime(now, destTz) : null;
          const diff       = destTz ? hourDiff('Europe/Berlin', destTz, now) : null;
          const diffStr    = diff != null && diff !== 0 ? (diff > 0 ? `+${diff}h` : `${diff}h`) : null;
          const sameTime   = diff === 0;
          return (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, position: 'relative', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '4px 12px' }}>
                <span style={{ fontSize: '0.9rem' }}>🇩🇪</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>{berlinTime}</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.75 }}>Berlin</span>
              </div>
              {destTime && !sameTime && (
                <>
                  <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>→</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '4px 12px' }}>
                    <span style={{ fontSize: '0.9rem' }}>🌍</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>{destTime}</span>
                    <span style={{ fontSize: '0.72rem', opacity: 0.75 }}>{trip.country || trip.destination}</span>
                    {diffStr && (
                      <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '1px 6px', fontWeight: 700 }}>{diffStr}</span>
                    )}
                  </div>
                </>
              )}
              {destTime && sameTime && (
                <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>· gleiche Zeitzone</span>
              )}
            </div>
          );
        })()}
      </div>

      <div className="page" style={{ paddingTop: 16 }}>
        {/* ── Notifications ── */}
        {overdueTasks.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: 12 }}>
            <span>⚠️</span>
            <span><strong>{overdueTasks.length} überfällige Aufgabe{overdueTasks.length > 1 ? 'n' : ''}:</strong> {overdueTasks.map(t => t.text).join(', ')}</span>
          </div>
        )}
        {upcomingTasks.length > 0 && (
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            <span>⏰</span>
            <span><strong>{upcomingTasks.length} Aufgabe{upcomingTasks.length > 1 ? 'n' : ''} bald fällig:</strong> {upcomingTasks.map(t => t.text).join(', ')}</span>
          </div>
        )}

        {/* ── Next-Flight Banner ── */}
        {nextFlight && (
          <div
            onClick={() => setShowFlightModal(true)}
            style={{
              background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
              borderRadius: 16,
              padding: '14px 16px',
              marginBottom: 20,
              cursor: 'pointer',
              color: 'white',
            }}
          >
            {/* Airport row + refresh button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, minWidth: 48, letterSpacing: '0.05em' }}>
                {nextFlight.departure_airport || '–––'}
              </span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.3)' }} />
                <span style={{ fontSize: '1.1rem' }}>✈️</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.3)' }} />
              </div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, minWidth: 48, textAlign: 'right', letterSpacing: '0.05em' }}>
                {nextFlight.arrival_airport || '–––'}
              </span>
              {nextFlight.flight_number && (
                <button
                  onClick={e => { e.stopPropagation(); fetchFlightStatus(nextFlight); }}
                  disabled={flightStatusLoading}
                  title="Live-Status abrufen"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    color: 'white',
                    cursor: flightStatusLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  {flightStatusLoading
                    ? <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : '🔄'}
                </button>
              )}
            </div>

            {/* Details row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>
              {nextFlight.flight_number && <span>✈ {nextFlight.flight_number}</span>}
              {nextFlight.flight_date   && <span>📅 {formatShortDate(nextFlight.flight_date)}</span>}
              {(nextFlight.departure_time || nextFlight.arrival_time) && (
                <span>🕐 {nextFlight.departure_time || '?'}{nextFlight.arrival_time ? ` → ${nextFlight.arrival_time}` : ''}</span>
              )}
              {nextFlight.gate     && <span>🚪 Gate {nextFlight.gate}</span>}
              {nextFlight.terminal && <span>🏢 {nextFlight.terminal}</span>}
            </div>

            {/* Live status result */}
            {flightStatus && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    background: flightStatus.status === 'on_time' ? '#16a34a'
                      : flightStatus.status === 'delayed' ? '#d97706'
                      : flightStatus.status === 'cancelled' ? '#dc2626'
                      : 'rgba(255,255,255,0.2)',
                    color: 'white',
                    borderRadius: 99,
                    padding: '2px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                  }}>
                    {flightStatus.status === 'on_time' ? '✅ Pünktlich'
                      : flightStatus.status === 'delayed' ? `⚠️ Verspätet${flightStatus.delay_minutes ? ` +${flightStatus.delay_minutes} min` : ''}`
                      : flightStatus.status === 'cancelled' ? '❌ Annulliert'
                      : '❓ Unbekannt'}
                  </span>
                  {(flightStatus.actual_departure || flightStatus.actual_arrival) && (
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                      🕐 {flightStatus.actual_departure || '?'}{flightStatus.actual_arrival ? ` → ${flightStatus.actual_arrival}` : ''}
                    </span>
                  )}
                  {flightStatus.gate && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>🚪 Gate {flightStatus.gate}</span>}
                  {flightStatus.terminal && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>🏢 {flightStatus.terminal}</span>}
                </div>
                {flightStatus.note && (
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{flightStatus.note}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  {flightStatus.checked_at && (
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' }}>
                      Abgefragt: {new Date(flightStatus.checked_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                    </span>
                  )}
                  {flightStatus.source && (
                    <span style={{
                      fontSize: '0.65rem',
                      background: flightStatus.source === 'aerodatabox' ? 'rgba(59,130,246,0.25)' : 'rgba(234,179,8,0.25)',
                      color:      flightStatus.source === 'aerodatabox' ? '#93c5fd' : '#fde047',
                      borderRadius: 99,
                      padding: '1px 7px',
                      fontWeight: 600,
                    }}>
                      {flightStatus.source === 'aerodatabox' ? '📡 AeroDataBox' : '🔍 Websuche'}
                    </span>
                  )}
                </div>
              </div>
            )}
            {flightStatusError && (
              <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#fca5a5' }}>⚠️ {flightStatusError}</div>
            )}

            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
              {nextFlight.label}{hasFlights && (trip.flights || []).length > 1 ? ` · ${(trip.flights || []).length} Flüge gesamt` : ''}
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
          {/* Flugdaten */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <button
              className="btn"
              style={roundBtn({
                background: hasFlights
                  ? 'linear-gradient(135deg, #0f172a, #1e3a5f)'
                  : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                color: hasFlights ? 'white' : '#475569',
                border: hasFlights ? 'none' : '1px solid #cbd5e1',
                boxShadow: hasFlights ? '0 2px 10px rgba(15,23,42,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
              })}
              onClick={() => setShowFlightModal(true)}
            >
              <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>✈️</span>
            </button>
            <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#475569' }}>Flugdaten</span>
          </div>

          {/* Reiseinfos */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <button
              className="btn"
              style={roundBtn({
                background: 'linear-gradient(135deg, #f0f9ff, #dbeafe)',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
                boxShadow: '0 2px 8px rgba(59,130,246,0.15)',
              })}
              onClick={() => setShowInfoModal(true)}
            >
              <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>🌍</span>
            </button>
            <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#475569' }}>Reiseinfos</span>
          </div>

          {/* Liste kopieren */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <button
              className="btn"
              style={roundBtn({
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                boxShadow: '0 2px 8px rgba(16,185,129,0.15)',
              })}
              onClick={() => setShowCopyModal(true)}
            >
              <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>📋</span>
            </button>
            <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#475569' }}>Kopieren</span>
          </div>

          {/* Währungsrechner */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <button
              className="btn"
              style={roundBtn({
                background: 'linear-gradient(135deg, #fdf4ff, #ede9fe)',
                color: '#6d28d9',
                border: '1px solid #ddd6fe',
                boxShadow: '0 2px 8px rgba(139,92,246,0.15)',
              })}
              onClick={() => setShowCurrencyModal(true)}
            >
              <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>💱</span>
            </button>
            <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#475569' }}>Währung</span>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="tab-bar">
          <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            📋 Aufgaben
            {(trip.tasks || []).filter(t => !t.completed).length > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--primary)', color: 'white', borderRadius: 99, padding: '0 6px', fontSize: '0.75rem' }}>
                {(trip.tasks || []).filter(t => !t.completed).length}
              </span>
            )}
          </button>
          <button className={`tab ${activeTab === 'packing' ? 'active' : ''}`} onClick={() => setActiveTab('packing')}>
            🧳 Packliste
            {(trip.packingItems || []).filter(i => !i.checked).length > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--secondary)', color: 'white', borderRadius: 99, padding: '0 6px', fontSize: '0.75rem' }}>
                {(trip.packingItems || []).filter(i => !i.checked).length}
              </span>
            )}
          </button>
          <button className={`tab ${activeTab === 'medicine' ? 'active' : ''}`} onClick={() => setActiveTab('medicine')}>
            💊 Apotheke
            {(trip.medicineItems || []).filter(i => !i.checked).length > 0 && (
              <span style={{ marginLeft: 6, background: '#7e22ce', color: 'white', borderRadius: 99, padding: '0 6px', fontSize: '0.75rem' }}>
                {(trip.medicineItems || []).filter(i => !i.checked).length}
              </span>
            )}
          </button>
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'tasks' && (
          <TaskList tripId={tripId} tasks={trip.tasks || []} onChange={tasks => setTrip({ ...trip, tasks })} />
        )}
        {activeTab === 'packing' && (
          <PackingList tripId={tripId} items={trip.packingItems || []} onChange={packingItems => setTrip({ ...trip, packingItems })} />
        )}
        {activeTab === 'medicine' && (
          <MedicineList tripId={tripId} trip={trip} items={trip.medicineItems || []} onChange={medicineItems => setTrip({ ...trip, medicineItems })} />
        )}
      </div>

      {/* ── Modals ── */}
      {showInfoModal && <TravelInfoModal trip={trip} onClose={() => setShowInfoModal(false)} />}
      {showCopyModal && <CopyChecklistModal currentTripId={tripId} onClose={() => setShowCopyModal(false)} onCopied={loadTrip} />}
      {showFlightModal && (
        <FlightModal
          trip={trip}
          onClose={() => setShowFlightModal(false)}
          onSaved={flights => setTrip({ ...trip, flights })}
        />
      )}
      {showCurrencyModal && (
        <CurrencyModal trip={trip} onClose={() => setShowCurrencyModal(false)} />
      )}
    </div>
  );
}
