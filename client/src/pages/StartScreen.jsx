import { useState, useEffect } from 'react';

const API = '/api/trips';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StartScreen({ onSelectTrip, onNewTrip }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((data) => setTrips(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deleteTrip = async (tripId) => {
    await fetch(`${API}/${tripId}`, { method: 'DELETE' });
    setTrips(trips.filter((t) => t.id !== tripId));
    setDeleteConfirm(null);
  };

  return (
    <div className="app">
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)',
        padding: '40px 24px 32px',
        color: 'white',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>✈️</div>
        <h1 style={{ color: 'white', marginBottom: 6 }}>Reiseplaner</h1>
        <p style={{ opacity: 0.85, fontSize: '1rem' }}>Dein persönlicher Reisebegleiter</p>
      </div>

      <div className="page" style={{ paddingTop: 24 }}>
        {/* New Trip Button */}
        <button
          className="btn btn-primary btn-full"
          style={{ fontSize: '1.05rem', padding: '16px', borderRadius: 14, marginBottom: 24 }}
          onClick={onNewTrip}
        >
          ＋ Neue Reise planen
        </button>

        {/* Saved Trips */}
        <h3 style={{ marginBottom: 12, color: 'var(--text-muted)' }}>Gespeicherte Reisen</h3>

        {loading && <div className="spinner" style={{ marginTop: 32 }} />}

        {!loading && trips.length === 0 && (
          <div className="empty-state">
            <div className="emoji">🌍</div>
            <p>Noch keine gespeicherten Reisen.<br />Erstelle deine erste Reise!</p>
          </div>
        )}

        {trips.map((trip) => (
          <div
            key={trip.id}
            className="card"
            style={{ cursor: 'pointer', marginBottom: 10 }}
            onClick={() => onSelectTrip(trip.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '1.5rem' }}>📍</span>
                  <h3>{trip.country || trip.destination}</h3>
                </div>
                {trip.destination && trip.destination !== trip.country && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 36, marginBottom: 2 }}>
                    {trip.destination}
                  </p>
                )}
                {(trip.start_date || trip.end_date) && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 36 }}>
                    {trip.start_date && formatDate(trip.start_date)}
                    {trip.start_date && trip.end_date && ' → '}
                    {trip.end_date && formatDate(trip.end_date)}
                  </p>
                )}
              </div>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '1.2rem', padding: '4px 8px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(trip.id);
                }}
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Reise löschen?</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center', fontSize: '0.95rem' }}>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Checklisten werden ebenfalls gelöscht.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline btn-full" onClick={() => setDeleteConfirm(null)}>
                Abbrechen
              </button>
              <button className="btn btn-danger btn-full" onClick={() => deleteTrip(deleteConfirm)}>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
