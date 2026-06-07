import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Switch } from './ui/switch';
import {
  Pill, Plus, Trash2, AlertTriangle, CheckCircle,
  Clock, Bell, Search, X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Medication {
  id: number;
  name: string;
  type: string;
  frequency: string;
  time: string[];
}

interface Reminder {
  id: string;
  time: string;       // "HH:MM"
  medication: string;
  enabled: boolean;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS_REMINDERS  = 'skinova_reminders';
const LS_MEDS       = 'skinova_medications';

function loadReminders(): Reminder[] | null {
  try {
    const raw = localStorage.getItem(LS_REMINDERS);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveReminders(r: Reminder[]) {
  localStorage.setItem(LS_REMINDERS, JSON.stringify(r));
}

function loadMedications(): Medication[] | null {
  try {
    const raw = localStorage.getItem(LS_MEDS);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveMedications(m: Medication[]) {
  localStorage.setItem(LS_MEDS, JSON.stringify(m));
}

// ─── Default data ─────────────────────────────────────────────────────────────
const DEFAULT_MEDS: Medication[] = [
  { id: 1, name: 'Hydrocortisone 1%', type: 'Current', frequency: '2x daily', time: ['08:00', '20:00'] },
  { id: 2, name: 'Cetirizine',        type: 'Chronic', frequency: '1x daily',  time: ['21:00'] },
];

function buildReminders(meds: Medication[]): Reminder[] {
  return meds.flatMap((med) =>
    med.time.map((t) => ({ id: `${med.id}-${t}`, time: t, medication: med.name, enabled: true }))
  );
}

// ─── Service Worker registration ─────────────────────────────────────────────
async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/reminder-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.warn('SW registration failed:', e);
    return null;
  }
}

async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ─── Fallback in-tab notification (used when SW not available) ────────────────
function fireTabNotification(medication: string, time: string) {
  if (Notification.permission !== 'granted') return;
  new Notification('💊 Medication Reminder', {
    body: `Time to take your ${medication} (${time})`,
    icon: '/favicon.ico',
    requireInteraction: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export function DrugInteraction() {
  // ── State — loaded from localStorage on first render ──────────────────────
  const [medications, setMedications] = useState<Medication[]>(
    () => loadMedications() ?? DEFAULT_MEDS
  );

  const [reminders, setReminders] = useState<Reminder[]>(
    () => loadReminders() ?? buildReminders(loadMedications() ?? DEFAULT_MEDS)
  );

  const [conflicts] = useState([
    {
      drug1: 'Hydrocortisone',
      drug2: 'Ibuprofen',
      severity: 'Moderate',
      description: 'May increase risk of gastrointestinal side effects',
      alternative: 'Acetaminophen (Tylenol)',
    },
  ]);

  const [newMed,           setNewMed]           = useState('');
  const [notifPermission,  setNotifPermission]  = useState<NotificationPermission>('default');
  const [showAddReminder,  setShowAddReminder]  = useState(false);
  const [newReminderTime,  setNewReminderTime]  = useState('08:00');
  const [newReminderMed,   setNewReminderMed]   = useState('');
  const [swReady,          setSwReady]          = useState(false);

  // Refs for the ticker
  const remindersRef = useRef<Reminder[]>(reminders);
  const firedRef     = useRef<Set<string>>(new Set());
  const swRegRef     = useRef<ServiceWorkerRegistration | null>(null);

  // Keep remindersRef in sync
  useEffect(() => { remindersRef.current = reminders; }, [reminders]);

  // ── Persist reminders to localStorage whenever they change ────────────────
  useEffect(() => { saveReminders(reminders); }, [reminders]);
  useEffect(() => { saveMedications(medications); }, [medications]);

  // ── Register SW + check permission on mount ───────────────────────────────
  useEffect(() => {
    setNotifPermission(Notification.permission as NotificationPermission);

    registerSW().then((reg) => {
      swRegRef.current = reg;
      if (reg) setSwReady(true);
    });
  }, []);

  // ── Main ticker: every 1 second ───────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now      = new Date();
      const HH       = String(now.getHours()).padStart(2, '0');
      const MM       = String(now.getMinutes()).padStart(2, '0');
      const SS       = String(now.getSeconds());
      const timeStr  = `${HH}:${MM}`;
      const dayKey   = `${timeStr}-${now.getDate()}`;

      // Only trigger at :00 seconds to avoid repeat fires within the same minute
      if (SS !== '0' && SS !== '1' && SS !== '2') return;

      remindersRef.current.forEach((reminder) => {
        if (!reminder.enabled)      return;
        if (reminder.time !== timeStr) return;

        const fireKey = `${reminder.id}-${dayKey}`;
        if (firedRef.current.has(fireKey)) return;
        firedRef.current.add(fireKey);

        // Cleanup old keys
        if (firedRef.current.size > 200) {
          const arr = Array.from(firedRef.current);
          firedRef.current = new Set(arr.slice(-100));
        }

        // Try Service Worker first (works even when tab is hidden)
        if (swRegRef.current && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CHECK_REMINDERS',
            reminders: [reminder],
            now: { time: timeStr, day: now.getDate() },
          });
        } else {
          // Fallback: in-tab notification
          fireTabNotification(reminder.medication, reminder.time);
        }
      });
    }, 1_000); // every second

    return () => clearInterval(interval);
  }, []);

  // ── Enable notifications ───────────────────────────────────────────────────
  const enableNotifications = async () => {
    const granted = await requestPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted && !swRegRef.current) {
      const reg = await registerSW();
      swRegRef.current = reg;
      if (reg) setSwReady(true);
    }
  };

  // ── Test notification ──────────────────────────────────────────────────────
  const sendTest = () => {
    if (Notification.permission !== 'granted') return;
    new Notification('💊 Test Reminder', {
      body: 'Reminders are working! ✅ They will fire even when the site is closed.',
      icon: '/favicon.ico',
    });
  };

  // ── Toggle reminder ────────────────────────────────────────────────────────
  const toggleReminder = (id: string) => {
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  // ── Add medication ─────────────────────────────────────────────────────────
  const handleAddMedication = () => {
    if (!newMed.trim()) return;
    const med: Medication = {
      id: Date.now(),
      name: newMed.trim(),
      type: 'Current',
      frequency: 'As needed',
      time: [],
    };
    setMedications((prev) => [...prev, med]);
    setNewMed('');
  };

  // ── Remove medication ──────────────────────────────────────────────────────
  const handleRemoveMedication = (id: number) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    setReminders((prev) => prev.filter((r) => !r.id.startsWith(`${id}-`)));
  };

  // ── Add reminder ───────────────────────────────────────────────────────────
  const handleAddReminder = () => {
    const medName = newReminderMed.trim() || (medications[0]?.name ?? 'Medication');
    const newReminder: Reminder = {
      id: `custom-${Date.now()}`,
      time: newReminderTime,
      medication: medName,
      enabled: true,
    };
    setReminders((prev) => [...prev, newReminder]);
    setShowAddReminder(false);
    setNewReminderTime('08:00');
    setNewReminderMed('');
  };

  // ── Remove reminder ────────────────────────────────────────────────────────
  const handleRemoveReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h2 className="mb-2 dark:text-gray-100">Drug Interaction Checker</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage your medications and check for potential interactions</p>
      </div>

      {/* Permission Banner */}
      {notifPermission !== 'granted' && (
        <Alert className={notifPermission === 'denied'
          ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
          : 'border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700'}>
          <Bell className="w-4 h-4 text-purple-600" />
          <AlertTitle className="dark:text-gray-100">
            {notifPermission === 'denied' ? 'Notifications Blocked' : 'Enable Medication Reminders'}
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between mt-1">
            <span className="text-sm dark:text-gray-300">
              {notifPermission === 'denied'
                ? 'Go to browser settings → allow notifications for this site.'
                : 'Allow notifications to get real alerts at the exact second — even when the site is closed.'}
            </span>
            {notifPermission !== 'denied' && (
              <Button size="sm" className="ml-4 bg-gradient-to-r from-purple-500 to-pink-500 shrink-0" onClick={enableNotifications}>
                <Bell className="w-3 h-3 mr-1" /> Enable
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* SW active badge */}
      {notifPermission === 'granted' && swReady && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700 py-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block" />
            Reminders are active — you'll be notified even when the site is closed.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Medications + Conflicts ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <Pill className="w-5 h-5 text-blue-500" />
                Current Medications
              </CardTitle>
              <CardDescription className="dark:text-gray-400">Add and manage your medications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Enter medication name..."
                    value={newMed}
                    onChange={(e) => setNewMed(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddMedication()}
                    className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <Button onClick={handleAddMedication} className="bg-gradient-to-r from-blue-500 to-cyan-500">
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>

              <div className="space-y-3">
                {medications.map((med) => (
                  <div key={med.id} className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="dark:text-gray-100">{med.name}</h4>
                          <Badge variant={med.type === 'Current' ? 'default' : 'secondary'}>{med.type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {med.frequency}
                          </div>
                          {med.time.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {med.time.map((t, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs dark:border-gray-500 dark:text-gray-300">{t}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveMedication(med.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <Bell className="w-5 h-5 text-purple-500" />
                Medication Reminders
                {notifPermission === 'granted' && (
                  <Badge className="ml-auto bg-green-100 text-green-700 text-xs">🟢 Active</Badge>
                )}
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                {swReady ? 'Works even when site is closed' : 'Real daily notifications'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reminders.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No reminders yet. Add one below.</p>
              )}

              {reminders.map((reminder) => (
                <div key={reminder.id} className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <div className="text-2xl mb-1 dark:text-gray-100">{reminder.time}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{reminder.medication}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Repeats daily · saved</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={reminder.enabled}
                        onCheckedChange={() => toggleReminder(reminder.id)}
                        disabled={notifPermission !== 'granted'}
                      />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleRemoveReminder(reminder.id)}>
                        <X className="w-3 h-3 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {showAddReminder ? (
                <div className="p-3 border border-purple-200 dark:border-purple-700 rounded-lg space-y-3 bg-white dark:bg-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">New Reminder</p>
                  <Input
                    type="time"
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    className="h-9 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
                  />
                  <Input
                    placeholder="Medication name..."
                    value={newReminderMed}
                    onChange={(e) => setNewReminderMed(e.target.value)}
                    className="h-9 text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
                    list="med-names"
                  />
                  <datalist id="med-names">
                    {medications.map((m) => <option key={m.id} value={m.name} />)}
                  </datalist>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500" onClick={handleAddReminder}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 dark:border-gray-500 dark:text-gray-300" onClick={() => setShowAddReminder(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" onClick={() => setShowAddReminder(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Reminder
                </Button>
              )}

              {notifPermission === 'granted' && (
                <Button variant="outline" size="sm" className="w-full text-purple-600 border-purple-200 dark:border-purple-700 dark:text-purple-400" onClick={sendTest}>
                  <Bell className="w-3 h-3 mr-2" /> Send Test Notification
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700">
            <CardHeader><CardTitle className="dark:text-gray-100">Medication Stats</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Active Medications</span>
                  <span className="text-2xl dark:text-gray-100">{medications.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Daily Reminders</span>
                  <span className="text-2xl dark:text-gray-100">{reminders.filter((r) => r.enabled).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Conflicts Found</span>
                  <span className="text-2xl text-orange-600 dark:text-orange-400">{conflicts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Tips */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Safety Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {[
                  'Always inform your doctor about all medications',
                  'Keep medications in their original containers',
                  'Never share prescription medications',
                  'Check expiration dates regularly',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
