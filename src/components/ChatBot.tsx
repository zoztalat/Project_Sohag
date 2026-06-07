import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Minimize2, Maximize2, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SKINOVA_SYSTEM_PROMPT = `You are Skinova Assistant — a helpful AI guide embedded inside the Skinova AI Dermatology web app. Your job is to help users navigate and use the app effectively, and to answer general skin health awareness questions.

## About Skinova
Skinova is an AI-powered dermatology assistant with these main sections:

### 🏠 Dashboard
- Overview of the user's activity and recent diagnoses
- Quick stats (total diagnoses, active medications, community messages)
- Progress tracker showing how much of the platform they've explored
- Avatar upload — click on the profile image to change it

### 📤 Upload & Diagnosis
- Upload a photo of the affected skin area (JPEG/PNG)
- Enter any current medications you're taking (for drug interaction checking)
- Click "Diagnose" — the AI analyzes the image using ConvNeXt deep learning model
- Results show: disease name, confidence %, severity level, and treatment recommendation
- If a drug interaction is detected between your medications and the recommended treatment, a safe alternative is shown automatically
- The diagnosis is saved automatically to your Medical History

### 📋 Medical History
- Shows all your past diagnoses in a timeline
- Click any record to see full details including the skin image
- Toggle status between "Ongoing" and "Resolved"
- Download individual diagnosis as a PDF report
- Export all records as a single PDF

### 💊 Drug Interaction Checker
- Add your current medications to check for interactions
- Set medication reminders with exact times — they work even when the browser is closed (uses Service Worker technology)
- Reminders are saved permanently so they survive page refresh
- View known drug conflicts and safe alternatives

### 🗺️ Nearby Clinics & Pharmacies
- Shows real dermatology clinics and pharmacies near your current location
- Uses OpenStreetMap data — allow location access when prompted
- Click "Directions" on any clinic to see the road route and driving time
- Filter between All / Clinics / Pharmacies tabs

### 💬 Community
- Join one of 35 disease-specific support groups (e.g., Acne & Rosacea, Eczema, Melanoma)
- Real-time chat with other users using the same skin condition group
- React to messages with emojis, reply to specific messages, share images
- See how many members are active right now

### 📚 Awareness
- Educational content about skin health
- Tips for skin care and disease prevention

## How to Use the App
- **First time?** Register with email and password, then explore the Dashboard
- **Dark mode**: Click the moon/sun icon in the top navbar to toggle
- **Profile photo**: Click your avatar in the Dashboard to upload a new photo
- **Notifications**: The bell icon in the navbar shows alerts for new diagnoses, drug interactions, and community messages

## Important Notes
- Skinova is a supportive diagnostic tool, NOT a replacement for professional medical consultation
- Always consult a dermatologist for official diagnosis and treatment
- The AI covers 35 skin disease categories with 98.53% accuracy on test data
- All your data is private and secure (Row Level Security enforced)

## Your Behavior
- Be warm, friendly, and helpful — like a knowledgeable friend, not a formal system
- Answer questions about how to use any part of the app
- Answer general skin health awareness questions (what is eczema, how to care for acne, etc.)
- If asked for a medical diagnosis, remind the user to use the Upload & Diagnosis feature and consult a real doctor
- Keep responses concise and clear — use bullet points when listing steps
- Respond in the same language the user writes in (Arabic or English)
- If the user writes in Arabic, respond fully in Arabic
- Never make up features that don't exist in the app`;

export function ChatBot() {
  const [isOpen, setIsOpen]           = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages]       = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hi! I\'m Skinova Assistant 👋\nI\'m here to help you navigate the app or answer your skin health questions.\n\nFeel free to ask me about any section of the app! 😊',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // ضيف الـ key هنا مباشرة لو VITE_ANTHROPIC_API_KEY مش شغال
  // API Key is handled server-side in Supabase Edge Function

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    const history = [...messages.slice(1), userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://skinova.app',
          'X-Title': 'Skinova Assistant',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [
            { role: 'system', content: SKINOVA_SYSTEM_PROMPT },
            ...history,
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`${response.status}: ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? 'Sorry, an error occurred. Please try again.';

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      console.error('[ChatBot] Exception:', e);
      setError(`Error: ${e?.message ?? 'unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ── Floating button ───────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #1F4E79, #2E75B6)' }}
        title="Skinova Assistant"
      >
        <Bot className="w-7 h-7 text-white" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ background: 'linear-gradient(135deg, #1F4E79, #2E75B6)' }} />
      </button>
    );
  }

  // ── Chat window ───────────────────────────────────────────────────────────
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden
        dark:border dark:border-gray-700
        ${isMinimized ? 'h-14 w-80' : 'w-[380px] h-[580px]'}`}
      style={{ background: 'var(--chat-bg, #ffffff)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: 'linear-gradient(135deg, #1F4E79, #2E75B6)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Skinova Assistant</p>
            <p className="text-blue-200 text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Powered by AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(p => !p)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full shrink-0 mt-1 flex items-center justify-center text-white text-xs font-bold
                  ${msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-800'
                    : 'bg-gradient-to-br from-gray-400 to-gray-600'}`}>
                  {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                    ${msg.role === 'assistant'
                      ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm border border-gray-100 dark:border-gray-700'
                      : 'text-white rounded-tr-sm shadow-sm'}`}
                    style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #1F4E79, #2E75B6)' } : {}}>
                    {msg.content}
                  </div>
                  <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mx-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Quick suggestions ── */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'How do I diagnose a skin condition?',
                  'How do I add a medication reminder?',
                  'Where is the nearest clinic?',
                  'How do I use the Community?',
                ].map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    className="px-2.5 py-1 text-xs rounded-full border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Input ── */}
          <div className="px-3 py-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
                onKeyDown={handleKey}
                placeholder="Type your question here..."
                className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all overflow-hidden"
                style={{ minHeight: '40px', maxHeight: '100px' }}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                style={{ background: 'linear-gradient(135deg, #1F4E79, #2E75B6)' }}
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              For medical diagnosis, use the Upload & Diagnosis section and consult a doctor
            </p>
          </div>
        </>
      )}
    </div>
  );
}
