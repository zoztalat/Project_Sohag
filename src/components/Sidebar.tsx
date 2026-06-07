import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { supabase } from '../supabaseClient';
import { fetchDiagnosisHistory } from '../diagnosisHistory';
import {
  Home, Upload, History, Pill, MapPin,
  Video, Users, X, CheckCircle,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Progress criteria (each = 20%) ──────────────────────────────────────────
// 1. Has profile photo (avatar_url set)
// 2. Has at least 1 diagnosis
// 3. Has sent at least 1 community message
// 4. Has 2+ diagnoses
// 5. Has a drug conflict detected in history

interface ProgressItem {
  label: string;
  done: boolean;
}

export function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [diagnosisCount, setDiagnosisCount] = useState(0);
  const [conflictCount, setConflictCount]   = useState(0);
  const [loadingStats, setLoadingStats]     = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Check avatar
        const { data: profile } = await supabase
          .from('profiles').select('avatar_url').eq('id', user.id).single();
        const hasAvatar = !!(profile?.avatar_url);

        // 2 & 4. Diagnosis count
        const history = await fetchDiagnosisHistory();
        const dCount  = history.length;
        const hasDiagnosis   = dCount >= 1;
        const hasMoreDiagnoses = dCount >= 2;

        // 3. Community message
        // Check Firestore via REST isn't easy — use localStorage as lightweight flag
        const hasCommunityMsg = localStorage.getItem('skinova_sent_message') === 'true';

        // 5. Drug conflict
        const cCount = history.filter(r => r.conflict_detected).length;
        const hasConflict = cCount > 0;

        setDiagnosisCount(dCount);
        setConflictCount(cCount);

        setProgressItems([
          { label: 'Profile photo uploaded',    done: hasAvatar },
          { label: 'First diagnosis completed', done: hasDiagnosis },
          { label: 'Community message sent',    done: hasCommunityMsg },
          { label: '2+ diagnoses completed',    done: hasMoreDiagnoses },
          { label: 'Drug interaction checked',  done: hasConflict },
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();

    // Refresh stats when navigating back to sidebar triggers
    window.addEventListener('skinova_stats_refresh', loadStats);
    return () => window.removeEventListener('skinova_stats_refresh', loadStats);
  }, [currentPage]); // re-run when page changes

  const completedCount = progressItems.filter(p => p.done).length;
  const progressPercent = progressItems.length > 0
    ? Math.round((completedCount / progressItems.length) * 100)
    : 0;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard',           icon: Home,    color: 'text-blue-500' },
    { id: 'upload',    label: 'Upload & Diagnose',   icon: Upload,  color: 'text-cyan-500' },
    { id: 'history',   label: 'Medical History',     icon: History, color: 'text-purple-500' },
    { id: 'drugs',     label: 'Medications',         icon: Pill,    color: 'text-green-500' },
    { id: 'community', label: 'Community',           icon: Users,   color: 'text-pink-500' },
    { id: 'clinics',   label: 'Clinics & Pharmacies',icon: MapPin,  color: 'text-orange-500' },
    { id: 'awareness', label: 'Awareness',           icon: Video,   color: 'text-indigo-500' },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    if (window.innerWidth < 1024) onClose();
  };

  // Progress bar color
  const barColor = progressPercent === 100
    ? 'from-green-400 to-emerald-500'
    : progressPercent >= 60
    ? 'from-blue-500 to-cyan-500'
    : 'from-orange-400 to-amber-500';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        w-72 z-50 lg:z-30
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-end p-4 lg:hidden">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 px-4 py-6">
            {/* Nav */}
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = card => card.icon;
                const Ic = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                      w-full justify-start gap-3 h-12
                      ${isActive
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-200'}
                      transition-all duration-200
                    `}
                    onClick={() => handleNavigate(item.id)}
                  >
                    <Ic className={`w-5 h-5 ${isActive ? 'text-white' : item.color}`} />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </nav>

            {/* Progress Card */}
            <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold dark:text-gray-100">Your Progress</h4>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  progressPercent === 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                }`}>
                  {progressPercent}%
                </span>
              </div>

              {/* Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mb-4 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Checklist */}
              {loadingStats ? (
                <div className="space-y-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {progressItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        item.done ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                      }`}>
                        {item.done && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-xs ${item.done ? 'text-gray-700 dark:text-gray-400 line-through opacity-60' : 'text-gray-600 dark:text-gray-300'}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {progressPercent === 100 && (
                <div className="mt-3 text-center text-xs text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/30 rounded-lg py-1.5">
                  🎉 Profile Complete!
                </div>
              )}

              {/* Real Stats */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{diagnosisCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Diagnoses</div>
                </div>
                <div className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                  <div className="text-xl font-bold text-red-500 dark:text-red-400">{conflictCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Conflicts</div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}
