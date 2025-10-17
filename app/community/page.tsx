'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CheckCircle, MapPin, Calendar, Filter, ShieldCheck, PencilLine } from 'lucide-react';
import { useStore } from '@/lib/store';
import { generateId } from '@/utils/helpers';

export default function CommunityPage() {
  const router = useRouter();
  const { communityPosts, role, setRole, addCommunityPost, userLocation } = useStore();
  // hydrate role from localStorage once
  useState(() => {
    try {
      const r = localStorage.getItem('role') as 'farmer' | 'expert' | null;
      if (r) setRole(r);
    } catch {}
  });

  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedCrop, setSelectedCrop] = useState<string>('All');

  // Compose form (experts only)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [crop, setCrop] = useState('All Crops');
  const [region, setRegion] = useState<string>(userLocation || 'Tamil Nadu');

  const regions = useMemo(() => {
    const set = new Set<string>(['Tamil Nadu', 'Karnataka', 'Maharashtra', 'Punjab']);
    communityPosts.forEach((p) => set.add(p.region));
    return Array.from(set);
  }, [communityPosts]);

  const crops = useMemo(() => {
    const set = new Set<string>(['All Crops', 'Tomato', 'Rice', 'Potato']);
    communityPosts.forEach((p) => set.add(p.crop));
    return ['All', ...Array.from(set)];
  }, [communityPosts]);

  const filteredPosts = communityPosts.filter((post) => {
    const regionMatch = selectedRegion === 'All' || post.region === selectedRegion;
    const cropMatch = selectedCrop === 'All' || post.crop === selectedCrop || post.crop === 'All Crops';
    return regionMatch && cropMatch;
  });

  const handlePublish = () => {
    if (role !== 'expert') return;
    if (!title.trim() || !content.trim()) return;
    addCommunityPost({
      id: generateId(),
      title: title.trim(),
      content: content.trim(),
      author: 'Expert',
      region,
      crop,
      date: new Date().toISOString(),
      verified: true,
    });
    setTitle('');
    setContent('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌾</span>
            <h1 className="text-2xl font-bold text-green-800">CropGuard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 rounded-lg p-1">
              <button onClick={() => setRole('farmer')} className={`px-3 py-1 rounded-md text-sm ${role === 'farmer' ? 'bg-white shadow font-semibold' : ''}`}>Farmer</button>
              <button onClick={() => setRole('expert')} className={`px-3 py-1 rounded-md text-sm ${role === 'expert' ? 'bg-white shadow font-semibold' : ''}`}>Expert</button>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">Signed in as {role}</span>
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-green-700 font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-900">Expert Community</h2>
          </div>
          <p className="text-gray-600">
            Verified agricultural updates and guidance from experts and KVK officers
          </p>
        </div>

        {/* Expert compose box */}
        {role === 'expert' ? (
          <div className="bg-white rounded-xl shadow-md p-5 mb-6 border">
            <div className="flex items-center gap-2 mb-3">
              <PencilLine className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">Post an update</span>
              <span className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700"><ShieldCheck className="w-3 h-3" /> Expert</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              <div className="grid grid-cols-2 gap-3">
                <select value={crop} onChange={(e) => setCrop(e.target.value)} className="px-3 py-2 border rounded-lg">
                  {crops.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="px-3 py-2 border rounded-lg">
                  {regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Write expert guidance, alerts, or best practices…" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            <div className="mt-3 flex justify-end">
              <button onClick={handlePublish} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Publish</button>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-900">
            Only verified experts can post. You are viewing as a Farmer.
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-800">Filters</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="All">All Regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Crop Type</label>
              <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                {crops.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {filteredPosts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No posts found for the selected filters.</p>
            </div>
          )}

          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-900 flex-1">{post.title}</h3>
                {post.verified && (
                  <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Verified
                  </span>
                )}
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t pt-3">
                <div className="flex items-center gap-1"><span className="font-medium">By:</span> {post.author}</div>
                <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{post.region}</div>
                <div className="flex items-center gap-1"><span className="font-medium">Crop:</span> {post.crop}</div>
                <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}