import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './layouts/AppShell';
import { Login, Register } from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Monitors from './pages/Monitors';
import MonitorDetail from './pages/MonitorDetail';
import Incidents from './pages/Incidents';
import Notifications from './pages/Notifications';
import Analytics from './pages/Analytics';
import StatusPages from './pages/StatusPages';
import Settings from './pages/Settings';
import PublicStatus from './pages/PublicStatus';
import NotFound from './pages/NotFound';
import Landing from './pages/Landing';

export default function App() {
  return <BrowserRouter><ToastProvider><AuthProvider><Routes>
    <Route path="/" element={<Landing/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route path="/status/:slug" element={<PublicStatus/>}/>
    <Route element={<ProtectedRoute/>}><Route element={<AppShell/>}>
      <Route path="dashboard" element={<Dashboard/>}/>
      <Route path="projects" element={<Projects/>}/>
      <Route path="monitors" element={<Monitors/>}/>
      <Route path="monitors/:id" element={<MonitorDetail/>}/>
      <Route path="incidents" element={<Incidents/>}/>
      <Route path="incidents/:id" element={<Incidents/>}/>
      <Route path="analytics" element={<Analytics/>}/>
      <Route path="notifications" element={<Notifications/>}/>
      <Route path="status-pages" element={<StatusPages/>}/>
      <Route path="settings" element={<Settings/>}/>
    </Route></Route>
    <Route path="*" element={<NotFound/>}/>
  </Routes></AuthProvider></ToastProvider></BrowserRouter>;
}
