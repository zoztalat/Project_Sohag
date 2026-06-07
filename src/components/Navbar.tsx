import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import {
  Bell, Settings, User, LogOut, Menu,
  MessageCircle, Stethoscope, AlertTriangle,
  Moon, Sun, Trash2, CheckCheck,
} from 'lucide-react';
import { avatarUpdateEvent } from './Dashboard';
import { useNotifications } from '../useNotifications';

interface NavbarProps {
  onLogout: () => void;
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const notifIcon = (type: string) => {
  if (type === 'community') return <MessageCircle className="w-4 h-4 text-blue-500 shrink-0" />;
  if (type === 'conflict')  return <AlertTriangle  className="w-4 h-4 text-red-500 shrink-0" />;
  return                           <Stethoscope    className="w-4 h-4 text-green-500 shrink-0" />;
};

const timeAgo = (date: Date) => {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60)   return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export function Navbar({ onLogout, onToggleSidebar, darkMode, onToggleDarkMode }: NavbarProps) {
  const [profile, setProfile]     = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications();

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
    };
    load();

    const handler = (e: Event) => setAvatarUrl((e as CustomEvent).detail as string);
    avatarUpdateEvent.addEventListener('avatarChanged', handler);
    return () => avatarUpdateEvent.removeEventListener('avatarChanged', handler);
  }, []);

  const avatarSrc = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || 'patient'}`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 shadow-sm bg-white/80 dark:bg-gray-900/90 backdrop-blur-lg transition-colors duration-300">
      <div className="flex items-center justify-between h-16 px-6">

        {/* Left */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
            <Menu className="w-5 h-5" />
          </Button>
          <img src="/src/components/assets/logo2.png" alt="Logo" width={190} />
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">

          {/* ── Dark Mode Toggle ── */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDarkMode}
            className="relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode
              ? <Sun  className="w-5 h-5 text-yellow-400" />
              : <Moon className="w-5 h-5 text-gray-500" />
            }
          </Button>

          {/* ── Notifications ── */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="relative outline-none text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute flex items-center justify-center w-5 h-5 p-0 bg-red-500 text-white -top-1 -right-1 border-2 border-white dark:border-gray-900 text-[10px]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="z-[100] w-96 bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-700 p-0">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-gray-800 dark:text-gray-100">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs px-1.5 py-0">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} title="Mark all read"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearAll} title="Clear all"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Bell className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm">No notifications yet</p>
                    <p className="text-xs mt-1 opacity-70">We'll notify you of important updates</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        !n.read ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className={`mt-0.5 p-2 rounded-full shrink-0 ${
                        n.type === 'community' ? 'bg-blue-100 dark:bg-blue-900/40' :
                        n.type === 'conflict'  ? 'bg-red-100 dark:bg-red-900/40'  :
                                                 'bg-green-100 dark:bg-green-900/40'
                      }`}>
                        {notifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium dark:text-gray-100 ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.time)}</p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ── Profile ── */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger>
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 outline-none transition-colors">
                <Avatar className="w-8 h-8 ring-1 ring-gray-200 dark:ring-gray-600">
                  <AvatarImage src={avatarSrc} className="object-cover" />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                    {profile?.full_name?.substring(0, 2).toUpperCase() || 'SK'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden font-semibold text-gray-700 dark:text-gray-200 md:inline">
                  {profile?.full_name || 'Loading...'}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="z-[100] w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl p-1" forceMount>
              <div className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800 rounded-t-md mb-1 flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-2 ring-blue-100">
                  <AvatarImage src={avatarSrc} className="object-cover" />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                    {profile?.full_name?.substring(0, 2).toUpperCase() || 'SK'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{profile?.full_name || 'Skinova User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</p>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md cursor-pointer">
                  🌐 Change Language
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="z-[110] bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-md">
                  <DropdownMenuItem className="cursor-pointer dark:text-gray-300 dark:hover:bg-gray-800">العربية - Arabic</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer dark:text-gray-300 dark:hover:bg-gray-800">English - الإنجليزية</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Dark mode in dropdown too */}
              <DropdownMenuItem
                onClick={onToggleDarkMode}
                className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md"
              >
                {darkMode
                  ? <><Sun  className="w-4 h-4 mr-2 text-yellow-400" /> Light Mode</>
                  : <><Moon className="w-4 h-4 mr-2 text-gray-500"  /> Dark Mode</>
                }
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md">
                <User     className="w-4 h-4 mr-2 text-gray-500" /> Profile Details
              </DropdownMenuItem>
              <DropdownMenuItem className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md">
                <Settings className="w-4 h-4 mr-2 text-gray-500" /> Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={onLogout} className="px-3 py-2 text-sm text-red-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md">
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
