import { useState } from 'react';
import VoiceInput from './VoiceInput';

const API = '/api/trips';

function getDueDateStatus(dueDateStr) {
  if (!dueDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'overdue';
  if (diff <= 3) return 'soon';
  return 'ok';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function TaskList({ tripId, tasks, onChange }) {
  const [showDateInput, setShowDateInput] = useState(null);
  const [pendingTask, setPendingTask] = useState(null);
  const [dateValue, setDateValue] = useState('');

  const addTask = async (text) => {
    setPendingTask(text);
    setDateValue('');
    setShowDateInput(true);
  };

  const confirmAddTask = async () => {
    if (!pendingTask) return;
    const res = await fetch(`${API}/${tripId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: pendingTask, due_date: dateValue || null }),
    });
    const newTask = await res.json();
    onChange([...tasks, newTask]);
    setPendingTask(null);
    setShowDateInput(false);
    setDateValue('');
  };

  const toggleTask = async (task) => {
    const res = await fetch(`${API}/${tripId}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    });
    const updated = await res.json();
    onChange(tasks.map((t) => (t.id === task.id ? updated : t)));
  };

  const deleteTask = async (taskId) => {
    await fetch(`${API}/${tripId}/tasks/${taskId}`, { method: 'DELETE' });
    onChange(tasks.filter((t) => t.id !== taskId));
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <VoiceInput
          placeholder="Aufgabe hinzufügen..."
          onSubmit={addTask}
        />
      </div>

      {showDateInput && (
        <div className="modal-overlay" onClick={() => setShowDateInput(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">Datum für Aufgabe</p>
            <p style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              „{pendingTask}"
            </p>
            <input
              type="date"
              className="input"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-full" onClick={() => {
                setDateValue('');
                confirmAddTask();
              }}>
                Ohne Datum
              </button>
              <button className="btn btn-primary btn-full" onClick={confirmAddTask}>
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="empty-state">
          <div className="emoji">📋</div>
          <p>Noch keine Aufgaben. Füge deine erste Aufgabe hinzu!</p>
        </div>
      )}

      {pendingTasks.map((task) => {
        const status = getDueDateStatus(task.due_date);
        return (
          <div key={task.id} className="checklist-item">
            <input
              type="checkbox"
              checked={false}
              onChange={() => toggleTask(task)}
              style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--primary)' }}
            />
            <div style={{ flex: 1 }}>
              <div className="item-text">{task.text}</div>
              {task.due_date && (
                <div className={`item-date ${status === 'overdue' ? 'overdue' : status === 'soon' ? 'soon' : ''}`}>
                  {status === 'overdue' ? '⚠️ Überfällig: ' : status === 'soon' ? '⏰ Bald: ' : '📅 '}
                  {formatDate(task.due_date)}
                </div>
              )}
            </div>
            <button className="btn-ghost btn" onClick={() => deleteTask(task.id)} style={{ fontSize: '1.1rem', padding: 6 }}>
              🗑
            </button>
          </div>
        );
      })}

      {doneTasks.length > 0 && (
        <>
          <div style={{ margin: '16px 0 8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            ERLEDIGT ({doneTasks.length})
          </div>
          {doneTasks.map((task) => (
            <div key={task.id} className="checklist-item" style={{ opacity: 0.6 }}>
              <input
                type="checkbox"
                checked={true}
                onChange={() => toggleTask(task)}
                style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--secondary)' }}
              />
              <div style={{ flex: 1 }}>
                <div className="item-text strikethrough">{task.text}</div>
                {task.due_date && (
                  <div className="item-date">{formatDate(task.due_date)}</div>
                )}
              </div>
              <button className="btn-ghost btn" onClick={() => deleteTask(task.id)} style={{ fontSize: '1.1rem', padding: 6 }}>
                🗑
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
