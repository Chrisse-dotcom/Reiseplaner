import VoiceInput from './VoiceInput';

const API = '/api/trips';

export default function PackingList({ tripId, items, onChange }) {
  const addItem = async (text) => {
    const res = await fetch(`${API}/${tripId}/packing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const newItem = await res.json();
    onChange([...items, newItem]);
  };

  const toggleItem = async (item) => {
    const res = await fetch(`${API}/${tripId}/packing/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: !item.checked }),
    });
    const updated = await res.json();
    onChange(items.map((i) => (i.id === item.id ? updated : i)));
  };

  const deleteItem = async (itemId) => {
    await fetch(`${API}/${tripId}/packing/${itemId}`, { method: 'DELETE' });
    onChange(items.filter((i) => i.id !== itemId));
  };

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <VoiceInput
          placeholder="Gegenstand hinzufügen..."
          onSubmit={addItem}
        />
      </div>

      {items.length === 0 && (
        <div className="empty-state">
          <div className="emoji">🧳</div>
          <p>Packliste ist leer. Füge Gegenstände hinzu!</p>
        </div>
      )}

      {unchecked.map((item) => (
        <div key={item.id} className="checklist-item">
          <input
            type="checkbox"
            checked={false}
            onChange={() => toggleItem(item)}
            style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--primary)' }}
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
                style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--secondary)' }}
              />
              <div className="item-text strikethrough" style={{ flex: 1, textDecoration: 'line-through', color: 'var(--text-muted)' }}>
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
