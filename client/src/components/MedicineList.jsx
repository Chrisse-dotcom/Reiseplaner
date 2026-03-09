import { useState } from 'react';
import VoiceInput from './VoiceInput';

const API = '/api/trips';

export default function MedicineList({ tripId, trip, items, onChange }) {
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState(null);

  const addItem = async (text) => {
    const res = await fetch(`${API}/${tripId}/medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const newItem = await res.json();
    onChange([...items, newItem]);
  };

  const toggleItem = async (item) => {
    const res = await fetch(`${API}/${tripId}/medicine/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: !item.checked }),
    });
    const updated = await res.json();
    onChange(items.map((i) => (i.id === item.id ? updated : i)));
  };

  const deleteItem = async (itemId) => {
    await fetch(`${API}/${tripId}/medicine/${itemId}`, { method: 'DELETE' });
    onChange(items.filter((i) => i.id !== itemId));
  };

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    setSuggestionError(null);
    try {
      const res = await fetch('/api/medicine-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: trip.destination, country: trip.country }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Add only items that are not already in the list (case-insensitive)
      const existing = new Set(items.map((i) => i.text.toLowerCase()));
      const newItems = [];
      for (const text of data.items) {
        if (!existing.has(text.toLowerCase())) {
          const r = await fetch(`${API}/${tripId}/medicine`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          });
          const newItem = await r.json();
          newItems.push(newItem);
          existing.add(text.toLowerCase());
        }
      }
      onChange([...items, ...newItems]);
    } catch (err) {
      setSuggestionError(err.message);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <div>
      {/* AI Suggestions Button */}
      <button
        className="btn"
        style={{
          width: '100%',
          marginBottom: 16,
          background: 'linear-gradient(135deg, #fdf4ff, #fae8ff)',
          color: '#7e22ce',
          border: '1px solid #e9d5ff',
          borderRadius: 14,
          padding: '14px 16px',
          fontSize: '0.95rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
        onClick={fetchSuggestions}
        disabled={loadingSuggestions}
      >
        {loadingSuggestions ? (
          <>
            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            KI erstellt Empfehlungen...
          </>
        ) : (
          <>🤖 KI-Empfehlungen für {trip.destination}</>
        )}
      </button>

      {suggestionError && (
        <div className="alert alert-warning" style={{ marginBottom: 12 }}>
          <span>⚠️</span>
          <span>{suggestionError}</span>
        </div>
      )}

      {/* Manual Input */}
      <div style={{ marginBottom: 16 }}>
        <VoiceInput placeholder="Medikament hinzufügen..." onSubmit={addItem} />
      </div>

      {items.length === 0 && !loadingSuggestions && (
        <div className="empty-state">
          <div className="emoji">💊</div>
          <p>Reiseapotheke ist leer. Lass dir von der KI Empfehlungen geben oder füge selbst Medikamente hinzu!</p>
        </div>
      )}

      {unchecked.map((item) => (
        <div key={item.id} className="checklist-item">
          <input
            type="checkbox"
            checked={false}
            onChange={() => toggleItem(item)}
            style={{ marginTop: 3, width: 18, height: 18, accentColor: '#7e22ce' }}
          />
          <div className="item-text" style={{ flex: 1 }}>{item.text}</div>
          <button className="btn-ghost btn" onClick={() => deleteItem(item.id)} style={{ fontSize: '1.1rem', padding: 6 }}>
            🗑
          </button>
        </div>
      ))}

      {checked.length > 0 && (
        <>
          <div style={{ margin: '16px 0 8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            EINGEPACKT ({checked.length})
          </div>
          {checked.map((item) => (
            <div key={item.id} className="checklist-item">
              <input
                type="checkbox"
                checked={true}
                onChange={() => toggleItem(item)}
                style={{ marginTop: 3, width: 18, height: 18, accentColor: '#a855f7' }}
              />
              <div className="item-text" style={{ flex: 1, textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                {item.text}
              </div>
              <button className="btn-ghost btn" onClick={() => deleteItem(item.id)} style={{ fontSize: '1.1rem', padding: 6 }}>
                🗑
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
