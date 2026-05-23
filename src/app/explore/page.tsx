'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

const CATEGORIES = ['All', 'Human', 'Plant', 'Animal', 'Environment', 'Education', 'Health'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'trending', label: 'Trending' },
];

export default function ExplorePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '12', sort });
    if (category !== 'All') params.set('category', category);
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/projects?${params}`);
      const data = await res.json();
      setProjects(data.projects || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {}
    setIsLoading(false);
  }, [page, category, sort, search]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => { setSearch(''); setSearchInput(''); setCategory('All'); setSort('newest'); setPage(1); };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-4">Explore Projects</h1>
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm" />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${category === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-sm border border-border bg-white focus:outline-none focus:border-primary">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {(search || category !== 'All') && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                  <X size={12} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!isLoading && (
          <p className="text-sm text-muted-foreground mb-6">{total} project{total !== 1 ? 's' : ''} found</p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState icon="🔍" title="No projects found" description="Try adjusting your filters or search query."
            action={{ label: 'Create a Project', href: '/projects/create' }} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {projects.map((p, i) => (
                <motion.div key={p._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <ProjectCard project={p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors">
              ← Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
                    {p}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}