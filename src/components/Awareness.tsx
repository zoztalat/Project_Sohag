import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Video, BookOpen, Search, Play, Clock,
  TrendingUp, Eye, ArrowLeft, X, ChevronRight, Loader2, AlertCircle,
} from 'lucide-react';
import { diseases, categoryColors, allCategories, type Disease } from './diseaseData';

// ─── Types ────────────────────────────────────────────────────────────────────
interface YTVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  viewCount: string;
  duration: string;
}

// ─── YouTube API ──────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string;

// Format ISO 8601 duration (PT10M30S) to readable (10:30)
function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '—';
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Format view count (1234567 → 1.2M)
function formatViews(count: string): string {
  const n = parseInt(count);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return count;
}

async function fetchYouTubeVideos(query: string, lang: 'en' | 'ar' = 'en'): Promise<YTVideo[]> {
  try {
    const relevanceLang = lang === 'ar' ? 'ar' : 'en';

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&relevanceLanguage=${relevanceLang}&safeSearch=strict&key=${API_KEY}`
    );
    const searchData = await searchRes.json();

    if (!searchData.items?.length) return [];

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

    // Step 2: Get durations and view counts
    const detailsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${API_KEY}`
    );
    const detailsData = await detailsRes.json();

    const detailsMap: Record<string, any> = {};
    detailsData.items?.forEach((item: any) => {
      detailsMap[item.id] = item;
    });

    let results = searchData.items.map((item: any) => {
      const details = detailsMap[item.id.videoId] || {};
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.channelTitle,
        viewCount: formatViews(details.statistics?.viewCount || '0'),
        duration: formatDuration(details.contentDetails?.duration || 'PT0S'),
      };
    });

    // Filter: if Arabic, keep only videos with Arabic characters in title or description
    if (lang === 'ar') {
      const arabicRegex = /[\u0600-\u06FF]/;
      const arabicResults = results.filter((v: YTVideo) => arabicRegex.test(v.title));
      // If enough Arabic results, use them; otherwise keep all
      if (arabicResults.length >= 3) results = arabicResults;
    }

    return results;
  } catch (e) {
    console.error('YouTube API error:', e);
    return [];
  }
}

// ─── Video Player Modal ───────────────────────────────────────────────────────
function VideoModal({ video, onClose }: { video: YTVideo; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 bg-gray-900">
          <div>
            <h4 className="text-white text-sm font-medium truncate pr-4">{video.title}</h4>
            <p className="text-gray-400 text-xs mt-0.5">{video.channelTitle}</p>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white shrink-0" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

// ─── Video Card ───────────────────────────────────────────────────────────────
function VideoCard({ video, onPlay }: { video: YTVideo; onPlay: () => void }) {
  return (
    <Card className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-all group cursor-pointer" onClick={onPlay}>
      <div className="relative">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-44 object-cover group-hover:opacity-90 transition-opacity"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-7 h-7 text-blue-600 ml-1" />
          </div>
        </div>
        <Badge className="absolute bottom-2 right-2 bg-black/80 text-white hover:bg-black/80 text-xs">
          <Clock className="w-3 h-3 mr-1" />{video.duration}
        </Badge>
      </div>
      <CardContent className="p-4">
        <p className="font-medium text-sm leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {video.title}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium text-gray-600 truncate pr-2">{video.channelTitle}</span>
          <div className="flex items-center gap-1 shrink-0">
            <Eye className="w-3 h-3" />{video.viewCount}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Disease Page ─────────────────────────────────────────────────────────────
function DiseasePage({ disease, onBack }: { disease: Disease; onBack: () => void }) {
  const [videos, setVideos]       = useState<YTVideo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [activeVideo, setActiveVideo] = useState<YTVideo | null>(null);
  const [lang, setLang]           = useState<'en' | 'ar'>('en');

  useEffect(() => {
    setLoading(true);
    setError(false);
    setVideos([]);
    const query = lang === 'ar' ? disease.searchQueryAr : disease.searchQuery;
    fetchYouTubeVideos(query, lang)
      .then((vids) => {
        if (vids.length === 0) setError(true);
        else setVideos(vids);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [disease.id, lang]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-8 h-8 ${disease.color} rounded-lg flex items-center justify-center`}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h2>{disease.displayName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={categoryColors[disease.category] ?? 'bg-gray-100 text-gray-700'}>
              {disease.category}
            </Badge>
            {!loading && !error && (
              <span className="text-sm text-gray-500">{videos.length} videos found</span>
            )}
          </div>
        </div>

        {/* Language Toggle */}
        <div className="ml-auto flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          <button
            onClick={() => setLang('en')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              lang === 'en'
                ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            🇬🇧 English
          </button>
          <button
            onClick={() => setLang('ar')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              lang === 'ar'
                ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            🇸🇦 العربية
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-400" />
          <p>Loading {lang === 'ar' ? 'Arabic' : 'English'} videos for {disease.displayName}...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <AlertCircle className="w-10 h-10 mb-3 text-red-400" />
          <p>Couldn't load videos. Check your API key.</p>
        </div>
      )}

      {/* Videos Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onPlay={() => setActiveVideo(video)} />
          ))}
        </div>
      )}

      {activeVideo && (
        <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Awareness() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);

  if (selectedDisease) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <DiseasePage disease={selectedDisease} onBack={() => setSelectedDisease(null)} />
      </div>
    );
  }

  const filteredDiseases = diseases.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || d.displayName.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
    const matchCat = !selectedCategory || d.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h2 className="mb-2">Awareness & Education</h2>
        <p className="text-gray-500">Learn about {diseases.length} skin diseases — real YouTube videos for each</p>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search diseases, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div>
        <h3 className="mb-4">Browse by Category</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={selectedCategory === null ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : ''}
          >
            All ({diseases.length})
          </Button>
          {allCategories.map((cat) => {
            const count = diseases.filter((d) => d.category === cat).length;
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={selectedCategory === cat ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : ''}
              >
                {cat} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Featured */}
      {!searchQuery && !selectedCategory && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Featured Topics
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {diseases.slice(0, 3).map((disease) => (
              <Card
                key={disease.id}
                className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
                onClick={() => setSelectedDisease(disease)}
              >
                <div className={`h-32 ${disease.color} flex items-center justify-center relative`}>
                  <BookOpen className="w-12 h-12 text-white opacity-80" />
                  <Badge className="absolute top-3 left-3 bg-orange-500 text-white hover:bg-orange-600 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" /> Featured
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold group-hover:text-blue-600 transition-colors mb-1">
                    {disease.displayName}
                  </h4>
                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs ${categoryColors[disease.category]}`}>{disease.category}</Badge>
                    <span className="text-xs text-gray-400">10 videos</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Disease Library */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />
            Disease Library
            <span className="text-sm font-normal text-gray-500">({filteredDiseases.length} diseases)</span>
          </h3>
        </div>

        {filteredDiseases.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No diseases found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredDiseases.map((disease) => (
              <Card
                key={disease.id}
                className="border-0 shadow-md cursor-pointer hover:shadow-xl transition-all hover:scale-105 group"
                onClick={() => setSelectedDisease(disease)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 ${disease.color} rounded-xl mx-auto mb-3 flex items-center justify-center`}>
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="mb-1 text-xs font-semibold leading-tight group-hover:text-blue-600 transition-colors">
                    {disease.displayName}
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">10 videos</p>
                  <Badge className={`text-xs ${categoryColors[disease.category] ?? 'bg-gray-100 text-gray-700'}`} variant="outline">
                    {disease.category}
                  </Badge>
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-blue-500 flex items-center justify-center gap-1">
                      View Videos <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
