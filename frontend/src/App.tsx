import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import PvEPage from './pages/PvEPage';
import LobbyPage from './pages/LobbyPage';
import MatchPage from './pages/MatchPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="pve" element={<PvEPage />} />
        <Route path="training" element={<PvEPage />} />
        <Route path="lobby" element={<LobbyPage />} />
        <Route path="match" element={<MatchPage />} />
        <Route path="match/:hostChainId" element={<MatchPage />} />
      </Route>
    </Routes>
  );
}
