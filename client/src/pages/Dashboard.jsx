import { useState, useEffect } from 'react';
import TaskList from '../components/TaskList';
import PackingList from '../components/PackingList';
import MedicineList from '../components/MedicineList';
import TravelInfoModal from './TravelInfoModal';
import CopyChecklistModal from './CopyChecklistModal';

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

export default function Dashboard({ tripId, onBack }) {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  useEffect(() => {
    if (!trip) return;
    fetch(`/api/country-outline?destination=${encodeURIComponent(trip.destination)}&country=${encodeURIComponent(trip.country || '')}`)
      .then((r) => r.json())
      .then((data) => setGeoData(data))
      .catch(() => {});
  }, [trip?.destination, trip?.country]);

  const loadTrip = () => {
    fetch(`${API}/${tripId}`)
      .then((r) => r.json())
      .then(setTrip)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="app" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="app" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <p>Reise nicht gefunden.</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onBack}>Zurück</button>
      </div>
    );
  }

  // Check for approaching due dates
  const upcomingTasks = (trip.tasks || []).filter((t) => {
    if (t.completed || !t.due_date) return false;
    const days = getDaysUntil(t.due_date);
    return days !== null && days >= 0 && days <= 3;
  });
  const overdueTasks = (trip.tasks || []).filter((t) => {
    if (t.completed || !t.due_date) return false;
    const days = getDaysUntil(t.due_date);
    return days !== null && days < 0;
  });

  const daysUntilTrip = getDaysUntil(trip.start_date);

  return (
    <div className="app">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        padding: '16px 16px 20px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Country outline background */}
        {geoData && (
          <svg
            viewBox={geoData.viewBox}
            preserveAspectRatio="xMidYMid meet"
            style={{
              position: 'absolute',
              right: -10,
              top: '50%',
              transform: 'translateY(-50%)',
              height: '160%',
              width: '52%',
              pointerEvents: 'none',
            }}
          >
            <path
              d={geoData.svgPath}
              fill="rgba(255,255,255,0.08)"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={0.7}
              strokeLinejoin="round"
            />
            {/* destination glow */}
            <circle cx={geoData.destX} cy={geoData.destY} r={12} fill="rgba(255,255,255,0.1)" />
            <circle cx={geoData.destX} cy={geoData.destY} r={5}  fill="rgba(255,255,255,0.75)" />
            <circle cx={geoData.destX} cy={geoData.destY} r={2}  fill="white" />
          </svg>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, position: 'relative' }}>
          <button
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'white', fontSize: '1.1rem', cursor: 'pointer' }}
            onClick={onBack}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reise nach</div>
            <h2 style={{ color: 'white', fontSize: '1.5rem' }}>{trip.destination}</h2>
          </div>
        </div>

        {/* Trip dates */}
        {trip.start_date && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: '0.85rem' }}>
              📅 {formatDate(trip.start_date)}
              {trip.end_date && ` → ${formatDate(trip.end_date)}`}
            </span>
            {daysUntilTrip !== null && daysUntilTrip >= 0 && (
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: '0.85rem' }}>
                ✈️ Noch {daysUntilTrip} Tage
              </span>
            )}
            {daysUntilTrip !== null && daysUntilTrip < 0 && (
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '4px 12px', fontSize: '0.85rem' }}>
                🏝️ Reise läuft
              </span>
            )}
          </div>
        )}
      </div>

      <div className="page" style={{ paddingTop: 16 }}>
        {/* Notifications */}
        {overdueTasks.length > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: 12 }}>
            <span>⚠️</span>
            <span>
              <strong>{overdueTasks.length} überfällige Aufgabe{overdueTasks.length > 1 ? 'n' : ''}:</strong>{' '}
              {overdueTasks.map((t) => t.text).join(', ')}
            </span>
          </div>
        )}
        {upcomingTasks.length > 0 && (
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            <span>⏰</span>
            <span>
              <strong>{upcomingTasks.length} Aufgabe{upcomingTasks.length > 1 ? 'n' : ''} bald fällig:</strong>{' '}
              {upcomingTasks.map((t) => t.text).join(', ')}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <button
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #f0f9ff, #dbeafe)',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
              borderRadius: 14,
              padding: '14px 10px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => setShowInfoModal(true)}
          >
            <span style={{ fontSize: '1.8rem' }}>🌍</span>
            Reiseinfos
          </button>
          <button
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              borderRadius: 14,
              padding: '14px 10px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => setShowCopyModal(true)}
          >
            <span style={{ fontSize: '1.8rem' }}>📋</span>
            Liste kopieren
          </button>
        </div>

        {/* Tab Bar */}
        <div className="tab-bar">
          <button
            className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            📋 Aufgaben
            {(trip.tasks || []).filter((t) => !t.completed).length > 0 && (
              <span style={{
                marginLeft: 6,
                background: 'var(--primary)',
                color: 'white',
                borderRadius: 99,
                padding: '0 6px',
                fontSize: '0.75rem',
              }}>
                {(trip.tasks || []).filter((t) => !t.completed).length}
              </span>
            )}
          </button>
          <button
            className={`tab ${activeTab === 'packing' ? 'active' : ''}`}
            onClick={() => setActiveTab('packing')}
          >
            🧳 Packliste
            {(trip.packingItems || []).filter((i) => !i.checked).length > 0 && (
              <span style={{
                marginLeft: 6,
                background: 'var(--secondary)',
                color: 'white',
                borderRadius: 99,
                padding: '0 6px',
                fontSize: '0.75rem',
              }}>
                {(trip.packingItems || []).filter((i) => !i.checked).length}
              </span>
            )}
          </button>
          <button
            className={`tab ${activeTab === 'medicine' ? 'active' : ''}`}
            onClick={() => setActiveTab('medicine')}
          >
            💊 Apotheke
            {(trip.medicineItems || []).filter((i) => !i.checked).length > 0 && (
              <span style={{
                marginLeft: 6,
                background: '#7e22ce',
                color: 'white',
                borderRadius: 99,
                padding: '0 6px',
                fontSize: '0.75rem',
              }}>
                {(trip.medicineItems || []).filter((i) => !i.checked).length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'tasks' && (
          <TaskList
            tripId={tripId}
            tasks={trip.tasks || []}
            onChange={(tasks) => setTrip({ ...trip, tasks })}
          />
        )}

        {activeTab === 'packing' && (
          <PackingList
            tripId={tripId}
            items={trip.packingItems || []}
            onChange={(packingItems) => setTrip({ ...trip, packingItems })}
          />
        )}

        {activeTab === 'medicine' && (
          <MedicineList
            tripId={tripId}
            trip={trip}
            items={trip.medicineItems || []}
            onChange={(medicineItems) => setTrip({ ...trip, medicineItems })}
          />
        )}
      </div>

      {/* Modals */}
      {showInfoModal && (
        <TravelInfoModal trip={trip} onClose={() => setShowInfoModal(false)} />
      )}
      {showCopyModal && (
        <CopyChecklistModal
          currentTripId={tripId}
          onClose={() => setShowCopyModal(false)}
          onCopied={loadTrip}
        />
      )}
    </div>
  );
}
