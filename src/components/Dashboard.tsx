import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  Upload, History, Pill, MapPin, Video, Activity,
  TrendingUp, CheckCircle, AlertCircle, X, Camera, Loader2,
} from 'lucide-react';
import { fetchDiagnosisHistory, type DiagnosisRecord } from '../diagnosisHistory';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

// Shared event so Navbar reacts to avatar changes instantly
export const avatarUpdateEvent = new EventTarget();

export function Dashboard({ onNavigate }: DashboardProps) {
  const [profile, setProfile]                 = useState<any>(null);
  const [userEmail, setUserEmail]             = useState('');
  const [avatarUrl, setAvatarUrl]             = useState('');
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [uploading, setUploading]             = useState(false);
  const [recentDiagnoses, setRecentDiagnoses] = useState<DiagnosisRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || '');

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      }

      const history = await fetchDiagnosisHistory();
      setRecentDiagnoses(history.slice(0, 2));
    };
    load();
  }, []);

  // ── Upload avatar ─────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split('.').pop() || 'jpg';
      // ✅ Unique filename every time → busts browser cache
      const filePath = `${user.id}/avatar_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL and add cache-busting param
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const freshUrl = `${publicUrl}?t=${Date.now()}`;

      // Save to profiles
      await supabase.from('profiles').update({ avatar_url: freshUrl }).eq('id', user.id);

      setAvatarUrl(freshUrl);

      // Notify Navbar to update immediately
      avatarUpdateEvent.dispatchEvent(new CustomEvent('avatarChanged', { detail: freshUrl }));
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const quickAccessCards = [
    { title: 'Upload Skin Image',  description: 'Get AI-powered diagnosis', icon: Upload,   color: 'from-blue-500 to-cyan-500',    page: 'upload' },
    { title: 'Medical History',    description: 'View past diagnoses',      icon: History,  color: 'from-purple-500 to-pink-500',  page: 'history' },
    { title: 'Drug Checker',       description: 'Check medication safety',  icon: Pill,     color: 'from-green-500 to-emerald-500',page: 'drugs' },
    { title: 'Find Nearby Clinic', description: 'Locate dermatologists',    icon: MapPin,   color: 'from-orange-500 to-red-500',   page: 'clinics' },
    { title: 'Awareness Videos',   description: 'Learn about skincare',     icon: Video,    color: 'from-indigo-500 to-blue-500',  page: 'awareness' },
    { title: 'Community',          description: 'Connect with others',      icon: Activity, color: 'from-pink-500 to-rose-500',    page: 'community' },
  ];

  const avatarSrc = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || 'patient'}`;

  return (
    <div className="relative space-y-6 p-6 dark:text-gray-100">

      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer group" onClick={() => setIsModalOpen(true)}>
            <Avatar className="w-16 h-16 ring-4 ring-blue-100 transition-transform group-hover:scale-110">
              <AvatarImage src={avatarSrc} className="object-cover" />
              <AvatarFallback>{profile?.full_name?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Welcome back, {profile ? profile.full_name.split(' ')[0] : 'there'}!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">How can we help you today?</p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
          <CheckCircle className="w-4 h-4 mr-1" /> System Active
        </Badge>
      </div>

      {/* Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm border-0 shadow-2xl animate-in fade-in zoom-in duration-300 dark:bg-gray-900">
            <div className="relative flex flex-col items-center p-6 pb-2">
              <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>

              {/* Avatar + upload button */}
              <div className="relative mb-4">
                <Avatar className="w-24 h-24 ring-4 ring-blue-50">
                  <AvatarImage src={avatarSrc} className="object-cover" />
                  <AvatarFallback>{profile?.full_name?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors"
                  title="Change profile picture"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <h3 className="text-xl font-bold dark:text-gray-100">{profile?.full_name || 'Loading...'}</h3>
              <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mb-4">Patient Profile</p>
            </div>

            <div className="px-6 pb-6 space-y-3 text-sm">
              <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                <span className="text-gray-500 dark:text-gray-400">Email</span>
                <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[60%] text-right">{userEmail}</span>
              </div>
              <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                <span className="text-gray-500 dark:text-gray-400">Gender</span>
                <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">{profile?.gender || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                <span className="text-gray-500 dark:text-gray-400">Birth Date</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{profile?.birth_date || 'N/A'}</span>
              </div>
              {uploading && (
                <p className="text-xs text-blue-500 text-center flex items-center justify-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading photo...
                </p>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full mt-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickAccessCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:scale-105"
              onClick={() => onNavigate(card.page)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{card.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{card.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Diagnoses */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <TrendingUp className="w-5 h-5" /> Recent Diagnoses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDiagnoses.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No diagnoses yet.</p>
                <button onClick={() => onNavigate('upload')} className="mt-2 text-xs text-blue-500 hover:underline">
                  Start your first diagnosis →
                </button>
              </div>
            ) : (
              recentDiagnoses.map((d, i) => (
                <div
                  key={i}
                  className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onNavigate('history')}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-gray-100">{d.diagnosis}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{d.date}</p>
                    </div>
                    <Badge className={
                      d.severity === 'Mild'     ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                      d.severity === 'Moderate' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' :
                                                  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    }>
                      {d.severity}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">AI Confidence</span>
                      <span className="font-bold dark:text-gray-200">{d.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${d.confidence}%` }} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Health Reminders */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
              <AlertCircle className="w-5 h-5" /> Health Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { text: 'Apply moisturizer - Morning', sub: 'Due in 2 hours',  color: 'bg-green-500' },
              { text: 'Sunscreen application',       sub: 'Daily reminder', color: 'bg-blue-500' },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center gap-3">
                <div className={`w-2 h-2 ${item.color} rounded-full animate-pulse`} />
                <div>
                  <p className="text-sm font-medium dark:text-gray-200">{item.text}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{item.sub}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
