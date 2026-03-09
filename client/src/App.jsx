import { useState } from 'react';
import StartScreen from './pages/StartScreen';
import DestinationScreen from './pages/DestinationScreen';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [screen, setScreen] = useState('start'); // 'start' | 'new' | 'dashboard'
  const [currentTripId, setCurrentTripId] = useState(null);

  const goToStart = () => {
    setScreen('start');
    setCurrentTripId(null);
  };

  const goToNew = () => setScreen('new');

  const openTrip = (tripId) => {
    setCurrentTripId(tripId);
    setScreen('dashboard');
  };

  if (screen === 'start') {
    return <StartScreen onSelectTrip={openTrip} onNewTrip={goToNew} />;
  }

  if (screen === 'new') {
    return <DestinationScreen onBack={goToStart} onCreate={openTrip} />;
  }

  if (screen === 'dashboard') {
    return <Dashboard tripId={currentTripId} onBack={goToStart} />;
  }

  return null;
}
