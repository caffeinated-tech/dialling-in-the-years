import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Gallery from './pages/Gallery.jsx';
import Submit from './pages/Submit.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Admin from './pages/Admin.jsx';
import AdminGuard from './components/AdminGuard.jsx';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
