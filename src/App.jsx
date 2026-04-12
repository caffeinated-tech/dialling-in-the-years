import { Routes, Route, Navigate } from 'react-router-dom';
import Gallery from './pages/Gallery.jsx';

// Phase 3 and 4 pages are stubbed — they'll be filled in later.
function ComingSoon({ name }) {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>{name}</h1>
      <p>Coming soon.</p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      <Route path="/submit" element={<ComingSoon name="Submit a song" />} />
      <Route path="/admin/login" element={<ComingSoon name="Admin login" />} />
      <Route path="/admin" element={<ComingSoon name="Admin panel" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
