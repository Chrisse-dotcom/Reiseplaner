import { useState, useRef } from 'react';

export default function VoiceInput({ onResult, placeholder = 'Aufgabe eingeben...', onSubmit }) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Spracherkennung wird von diesem Browser nicht unterstützt. Bitte Text eingeben.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setText((prev) => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.onerror = (e) => {
      console.error('Speech recognition error', e.error);
      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setRecording(false);
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <input
        className="input"
        style={{ flex: 1 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      <button
        className={`voice-btn ${recording ? 'recording' : ''}`}
        onClick={recording ? stopRecording : startRecording}
        title={recording ? 'Aufnahme stoppen' : 'Spracheingabe'}
      >
        {recording ? '⏹' : '🎤'}
      </button>
      <button
        className="btn btn-primary"
        style={{ padding: '12px 14px', borderRadius: 8 }}
        onClick={handleSubmit}
        disabled={!text.trim()}
      >
        ＋
      </button>
    </div>
  );
}
