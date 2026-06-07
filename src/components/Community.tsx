import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  MessageCircle, Users, Send, Pin,
  Image as ImageIcon, Stethoscope,
  Smile, X, Loader2, Reply,
} from 'lucide-react';
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, doc, updateDoc,
  setDoc, getDoc, increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import { supabase } from '../supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Reaction { emoji: string; count: number; userIds: string[] }
interface Message {
  id: string; author: string; avatar: string; userId: string;
  text: string; imageBase64?: string; timestamp: any;
  reactions: Record<string, Reaction>;
  replyTo?: { author: string; text: string } | null;
}

interface CurrentUser {
  userId: string;
  userName: string;
  avatar: string;
}

// ─── 35 Groups ────────────────────────────────────────────────────────────────
const groups = [
  { id: 'acne_rosacea',         name: 'Acne & Rosacea',                  from: '#ef4444', to: '#f97316', text: '#fff' },
  { id: 'actinic_keratosis',    name: 'Actinic Keratosis & Skin Cancer', from: '#374151', to: '#111827', text: '#fff' },
  { id: 'atopic_dermatitis',    name: 'Atopic Dermatitis',               from: '#f97316', to: '#ea580c', text: '#fff' },
  { id: 'cellulitis',           name: 'Cellulitis',                      from: '#ca8a04', to: '#a16207', text: '#fff' },
  { id: 'impetigo',             name: 'Impetigo',                        from: '#eab308', to: '#ca8a04', text: '#1a1a1a' },
  { id: 'benign_tumors',        name: 'Benign Skin Tumors',              from: '#16a34a', to: '#15803d', text: '#fff' },
  { id: 'bullous_disease',      name: 'Bullous Disease',                 from: '#4f46e5', to: '#3730a3', text: '#fff' },
  { id: 'bacterial_infections', name: 'Bacterial Skin Infections',       from: '#d97706', to: '#b45309', text: '#fff' },
  { id: 'eczema',               name: 'Eczema',                          from: '#f97316', to: '#dc2626', text: '#fff' },
  { id: 'drug_eruptions',       name: 'Drug Eruptions',                  from: '#e11d48', to: '#be185d', text: '#fff' },
  { id: 'athletes_foot',        name: "Athlete's Foot",                  from: '#0d9488', to: '#0f766e', text: '#fff' },
  { id: 'nail_fungus',          name: 'Nail Fungus',                     from: '#0891b2', to: '#0e7490', text: '#fff' },
  { id: 'ringworm',             name: 'Ringworm',                        from: '#14b8a6', to: '#0d9488', text: '#fff' },
  { id: 'hair_loss',            name: 'Hair Loss & Alopecia',            from: '#7c3aed', to: '#6d28d9', text: '#fff' },
  { id: 'healthy_skin',         name: 'Healthy Skin',                    from: '#22c55e', to: '#16a34a', text: '#fff' },
  { id: 'herpes_hpv',           name: 'Herpes & HPV',                    from: '#db2777', to: '#be185d', text: '#fff' },
  { id: 'pigmentation',         name: 'Pigmentation Disorders',          from: '#f59e0b', to: '#d97706', text: '#1a1a1a' },
  { id: 'lupus',                name: 'Lupus & Connective Tissue',       from: '#7c3aed', to: '#4f46e5', text: '#fff' },
  { id: 'malignant',            name: 'Malignant Skin Conditions',       from: '#1e293b', to: '#0f172a', text: '#fff' },
  { id: 'melanoma',             name: 'Melanoma & Moles',                from: '#334155', to: '#1e293b', text: '#fff' },
  { id: 'nail_disease',         name: 'Nail Diseases',                   from: '#0284c7', to: '#0369a1', text: '#fff' },
  { id: 'larva_migrans',        name: 'Cutaneous Larva Migrans',         from: '#65a30d', to: '#4d7c0f', text: '#fff' },
  { id: 'contact_dermatitis',   name: 'Contact Dermatitis',              from: '#15803d', to: '#166534', text: '#fff' },
  { id: 'psoriasis',            name: 'Psoriasis & Lichen Planus',       from: '#c026d3', to: '#a21caf', text: '#fff' },
  { id: 'rashes',               name: 'Skin Rashes',                     from: '#dc2626', to: '#b91c1c', text: '#fff' },
  { id: 'scabies_lyme',         name: 'Scabies & Lyme Disease',          from: '#4d7c0f', to: '#3f6212', text: '#fff' },
  { id: 'seborrheic_keratoses', name: 'Seborrheic Keratoses',            from: '#78716c', to: '#57534e', text: '#fff' },
  { id: 'systemic_disease',     name: 'Systemic Disease & Skin',         from: '#1d4ed8', to: '#1e40af', text: '#fff' },
  { id: 'tinea_candidiasis',    name: 'Tinea & Candidiasis',             from: '#0f766e', to: '#115e59', text: '#fff' },
  { id: 'urticaria',            name: 'Urticaria (Hives)',               from: '#fb7185', to: '#f43f5e', text: '#fff' },
  { id: 'vascular_tumors',      name: 'Vascular Tumors',                 from: '#b91c1c', to: '#991b1b', text: '#fff' },
  { id: 'vasculitis',           name: 'Vasculitis',                      from: '#9f1239', to: '#881337', text: '#fff' },
  { id: 'chickenpox',           name: 'Chickenpox',                      from: '#0284c7', to: '#075985', text: '#fff' },
  { id: 'shingles',             name: 'Shingles (Herpes Zoster)',        from: '#0369a1', to: '#1e3a5f', text: '#fff' },
  { id: 'warts_viral',          name: 'Warts, Molluscum & Viral',        from: '#38bdf8', to: '#0284c7', text: '#fff' },
];

const REACTIONS = [
  { key: 'like', emoji: '👍' }, { key: 'love', emoji: '❤️' },
  { key: 'wow',  emoji: '😮' }, { key: 'haha', emoji: '😂' },
  { key: 'sad',  emoji: '😢' }, { key: 'angry', emoji: '😡' },
];

// ─── Compress image ───────────────────────────────────────────────────────────
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const MAX = 800;
        if (width > MAX || height > MAX) {
          if (width > height) { height = (height / width) * MAX; width = MAX; }
          else { width = (width / height) * MAX; height = MAX; }
        }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const pinnedMessage = {
  author: 'Dr. Sarah Johnson', role: 'Dermatologist',
  message: '🩺 Weekly Tip: Always apply sunscreen 15-30 minutes before sun exposure for maximum protection.',
  time: '2 days ago',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function Community() {
  const [selectedGroup, setSelectedGroup]         = useState(0);
  const [messages, setMessages]                   = useState<Message[]>([]);
  const [text, setText]                           = useState('');
  const [sending, setSending]                     = useState(false);
  const [activeMembers, setActiveMembers]         = useState(0);
  const [groupMemberCounts, setGroupMemberCounts] = useState<Record<string, number>>({});
  const [messagesCount, setMessagesCount]         = useState(0);
  const [openReactionFor, setOpenReactionFor]     = useState<string | null>(null);
  const [imagePreview, setImagePreview]           = useState<string | null>(null);
  const [replyTo, setReplyTo]                     = useState<{ id: string; author: string; text: string } | null>(null);
  const [searchQuery, setSearchQuery]             = useState('');
  const [currentUser, setCurrentUser]             = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser]             = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const presenceRef  = useRef<any>(null);

  const group = groups[selectedGroup];

  // ── Get real user from Supabase ───────────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        const userId   = user.id;
        const avatar   = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
        setCurrentUser({ userId, userName: fullName, avatar });
      }
      setLoadingUser(false);
    };
    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const fullName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
        setCurrentUser({
          userId:   session.user.id,
          userName: fullName,
          avatar:   `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Presence ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const ref = doc(db, 'presence', currentUser.userId);
    setDoc(ref, { userId: currentUser.userId, userName: currentUser.userName, groupId: group.id, lastSeen: serverTimestamp(), online: true });
    presenceRef.current = ref;
    return () => { setDoc(ref, { online: false, lastSeen: serverTimestamp() }, { merge: true }); };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !presenceRef.current) return;
    setDoc(presenceRef.current, { groupId: group.id, lastSeen: serverTimestamp(), online: true }, { merge: true });
  }, [selectedGroup, currentUser]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'presence'), (snap) => {
      let c = 0;
      snap.forEach((d) => { const x = d.data(); if (x.online && x.groupId === group.id) c++; });
      setActiveMembers(c);
    });
    return () => unsub();
  }, [selectedGroup]);

  // ── Messages ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setMessages([]);
    const q = query(collection(db, 'groups', group.id, 'messages'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs: Message[] = [];
      snap.forEach((d) => msgs.push({ id: d.id, ...d.data() } as Message));
      setMessages(msgs); setMessagesCount(msgs.length);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [selectedGroup]);

  // ── Group stats ───────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'groupStats'), (snap) => {
      const c: Record<string, number> = {};
      snap.forEach((d) => { c[d.id] = d.data().members || 0; });
      setGroupMemberCounts(c);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const ref = doc(db, 'groupStats', group.id);
    getDoc(ref).then((d) => {
      if (!d.exists()) setDoc(ref, { members: 1 });
      else updateDoc(ref, { members: increment(1) });
    });
  }, [selectedGroup]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!currentUser || (!text.trim() && !imagePreview)) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'groups', group.id, 'messages'), {
        author:      currentUser.userName,
        avatar:      currentUser.avatar,
        userId:      currentUser.userId,
        text:        text.trim(),
        imageBase64: imagePreview || null,
        timestamp:   serverTimestamp(),
        reactions:   {},
        replyTo:     replyTo ? { author: replyTo.author, text: replyTo.text } : null,
      });
      setText(''); setImagePreview(null); setReplyTo(null);
      localStorage.setItem('skinova_sent_message', 'true');
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    setImagePreview(await compressImage(file));
  };

  const handleReaction = async (messageId: string, reactionKey: string) => {
    if (!currentUser) return;
    const msgRef = doc(db, 'groups', group.id, 'messages', messageId);
    const snap   = await getDoc(msgRef);
    if (!snap.exists()) return;
    const reactions = { ...snap.data().reactions } || {};
    const r   = reactions[reactionKey] || { emoji: REACTIONS.find(x => x.key === reactionKey)?.emoji, count: 0, userIds: [] };
    const ids: string[] = r.userIds || [];
    if (ids.includes(currentUser.userId)) {
      r.count = Math.max(0, r.count - 1);
      r.userIds = ids.filter(id => id !== currentUser.userId);
    } else {
      r.count += 1;
      r.userIds = [...ids, currentUser.userId];
    }
    reactions[reactionKey] = r;
    await updateDoc(msgRef, { reactions });
    setOpenReactionFor(null);
  };

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      <div>
        <h2 className="mb-2 dark:text-gray-100">Community</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Connect with others who share similar skin conditions
          {currentUser && (
            <span className="ml-2 text-blue-500 font-medium">· Welcome, {currentUser.userName}!</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          <Card className="border-0 shadow-lg dark:bg-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base dark:text-gray-100">
                <Users className="w-5 h-5 text-blue-500" /> Groups
              </CardTitle>
              <CardDescription className="dark:text-gray-400">Join a support group</CardDescription>
              <Input placeholder="Search groups..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="mt-2 h-8 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ScrollArea className="h-[430px] pr-1">
                <div className="space-y-1.5">
                  {filteredGroups.map((g) => {
                    const idx      = groups.findIndex(gr => gr.id === g.id);
                    const isActive = selectedGroup === idx;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGroup(idx)}
                        style={isActive ? { background: `linear-gradient(135deg,${g.from},${g.to})`, color: g.text } : {}}
                        className={`w-full p-3 rounded-xl text-left transition-all ${isActive ? 'shadow-md scale-[1.02]' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'}`}
                      >
                        <div className="flex items-center gap-2">
                          {!isActive && (
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: `linear-gradient(135deg,${g.from},${g.to})` }} />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold leading-tight truncate">{g.name}</p>
                            <p className={`text-xs mt-0.5 ${isActive ? 'opacity-75' : 'text-gray-400 dark:text-gray-500'}`}>
                              {groupMemberCounts[g.id] || 0} members
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700">
            <CardHeader><CardTitle className="text-base dark:text-gray-100">Group Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Now</span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />{activeMembers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Messages</span>
                <span className="text-xl dark:text-gray-200">{messagesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Members</span>
                <span className="text-xl dark:text-gray-200">{groupMemberCounts[group.id] || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Chat ── */}
        <div className="lg:col-span-3">
          <Card className="border-0 shadow-lg h-[800px] flex flex-col overflow-hidden dark:bg-gray-800">

            {/* Header */}
            <div className="px-6 py-4 shrink-0 rounded-t-lg" style={{ background: `linear-gradient(135deg,${group.from},${group.to})` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2" style={{ color: group.text }}>
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-semibold text-lg">{group.name}</span>
                </div>
                <Badge className="bg-white/20 hover:bg-white/30 text-white text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                  {activeMembers} online
                </Badge>
              </div>
            </div>

            {/* Pinned */}
            <div className="px-4 py-3 border-b border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 shrink-0">
              <div className="flex items-start gap-2">
                <Pin className="w-4 h-4 mt-0.5 text-yellow-600 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-medium dark:text-gray-200">{pinnedMessage.author}</span>
                    <Badge variant="outline" className="text-xs py-0 dark:border-gray-500 dark:text-gray-300">
                      <Stethoscope className="w-3 h-3 mr-1" />{pinnedMessage.role}
                    </Badge>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{pinnedMessage.time}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{pinnedMessage.message}</p>
                </div>
              </div>
            </div>

            <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3">
                <div className="space-y-4" onClick={() => setOpenReactionFor(null)}>
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                      <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-sm">No messages yet. Be the first to share!</p>
                    </div>
                  )}

                  {messages.map((msg) => {
                    const isMe = msg.userId === currentUser?.userId;
                    const time = msg.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';
                    const hasReactions = msg.reactions && Object.values(msg.reactions).some((r: any) => r.count > 0);

                    return (
                      <div key={msg.id} className={`flex gap-2 group ${isMe ? 'flex-row-reverse' : ''}`}>
                        {!isMe && (
                          <Avatar className="w-8 h-8 shrink-0 mt-1">
                            <AvatarImage src={msg.avatar} />
                            <AvatarFallback className="text-xs">{msg.author[0]}</AvatarFallback>
                          </Avatar>
                        )}

                        <div className={`flex flex-col max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                          {!isMe && (
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{msg.author}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">{time}</span>
                            </div>
                          )}

                          {msg.replyTo && (
                            <div className={`mb-1.5 px-3 py-1.5 rounded-lg border-l-4 text-xs max-w-full ${
                              isMe ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                            }`}>
                              <p className="font-semibold mb-0.5">{msg.replyTo.author}</p>
                              <p className="truncate opacity-80">{msg.replyTo.text || '📷 Image'}</p>
                            </div>
                          )}

                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? 'text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'}`}
                            style={isMe ? { background: `linear-gradient(135deg,${group.from},${group.to})` } : {}}
                          >
                            {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                            {msg.imageBase64 && (
                              <img src={msg.imageBase64} alt="shared" className="mt-2 rounded-xl max-w-xs max-h-60 object-cover" />
                            )}
                          </div>

                          {isMe && <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">{time}</span>}

                          {hasReactions && (
                            <div className="flex flex-wrap gap-1 mt-1.5 px-1">
                              {Object.entries(msg.reactions).map(([key, r]: any) =>
                                r.count > 0 ? (
                                  <button
                                    key={key}
                                    onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, key); }}
                                    className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-all hover:scale-105 ${
                                      r.userIds?.includes(currentUser?.userId)
                                        ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 font-medium'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 shadow-sm'
                                    }`}
                                  >
                                    <span>{r.emoji}</span><span className="ml-0.5">{r.count}</span>
                                  </button>
                                ) : null
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenReactionFor(openReactionFor === msg.id ? null : msg.id); }}
                              className="p-1.5 rounded-full bg-white dark:bg-gray-700 shadow border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-400 hover:text-yellow-500 transition-colors"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>
                            {openReactionFor === msg.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute bottom-8 ${isMe ? 'right-0' : 'left-0'} bg-white dark:bg-gray-700 rounded-full shadow-xl border border-gray-100 dark:border-gray-600 flex items-center px-2 py-1.5 gap-0.5 z-30`}
                              >
                                {REACTIONS.map((r) => (
                                  <button key={r.key} onClick={() => handleReaction(msg.id, r.key)}
                                    className="text-xl hover:scale-125 transition-transform p-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600">
                                    {r.emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setReplyTo({ id: msg.id, author: msg.author, text: msg.text })}
                            className="p-1.5 rounded-full bg-white dark:bg-gray-700 shadow border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              {/* Reply banner */}
              {replyTo && (
                <div className="mx-4 mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Reply className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{replyTo.author}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{replyTo.text || '📷 Image'}</p>
                    </div>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-2 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Image preview */}
              {imagePreview && (
                <div className="px-4 pb-2 shrink-0">
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="preview" className="h-16 rounded-lg object-cover border" />
                    <button onClick={() => setImagePreview(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  <Button variant="outline" size="icon" className="shrink-0 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Share your thoughts, experiences, or questions..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={sending || (!text.trim() && !imagePreview)}
                    className="shrink-0 text-white"
                    style={{ background: `linear-gradient(135deg,${group.from},${group.to})` }}
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  Be respectful and supportive. For medical emergencies, contact a healthcare provider.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
