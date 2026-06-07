import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { UploadDiagnosis } from './components/UploadDiagnosis';
import { MedicalHistory } from './components/MedicalHistory';
import { DrugInteraction } from './components/DrugInteraction';
import { Community } from './components/Community';
import { ClinicsMap } from './components/ClinicsMap';
import { Awareness } from './components/Awareness';
import { Toaster } from './components/ui/sonner';
import { ChatBot } from './components/ChatBot';
import { supabase } from './supabaseClient';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType]               = useState<'patient' | 'dermatologist'>('patient');
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('skinova_current_page') || 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen]     = useState(false);
  const [loading, setLoading]                 = useState(true);

  // ── Dark mode — persisted in localStorage ─────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('skinova_dark_mode') === 'true';
  });

  useEffect(() => {
    if (!isAuthenticated) {
      document.documentElement.classList.remove('dark');
      return;
    }
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('skinova_dark_mode', String(darkMode));
  }, [darkMode, isAuthenticated]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserType(session.user.user_metadata?.user_type || 'patient');
        setIsAuthenticated(true);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserType(session.user.user_metadata?.user_type || 'patient');
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setCurrentPage('dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin  = (type: 'patient' | 'dermatologist') => { setUserType(type); setIsAuthenticated(true); };
  const handleLogout = async () => { await supabase.auth.signOut(); setIsAuthenticated(false); setCurrentPage('dashboard'); localStorage.removeItem('skinova_current_page'); };
  const handleNavigate  = (page: string) => { setCurrentPage(page); localStorage.setItem('skinova_current_page', page); };
  const toggleSidebar   = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar    = () => setIsSidebarOpen(false);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading Skinova...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Navbar
        onLogout={handleLogout}
        onToggleSidebar={toggleSidebar}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <div className="flex">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />

        <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-auto">
          {currentPage === 'dashboard'  && <Dashboard onNavigate={handleNavigate} />}
          {currentPage === 'upload'     && <UploadDiagnosis onNavigate={handleNavigate} />}
          {currentPage === 'history'    && <MedicalHistory />}
          {currentPage === 'drugs'      && <DrugInteraction />}
          {currentPage === 'community'  && <Community />}
          {currentPage === 'clinics'    && <ClinicsMap />}
          {currentPage === 'awareness'  && <Awareness />}
        </main>
      </div>

      <Toaster />
      <ChatBot />
    </div>
  );
}
