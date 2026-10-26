import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Clock, BookOpen, Zap, FileText, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { globalSearch } from '../services/api';
import { formatDate } from '../utils/helpers';

const typeConfig = {
  meeting: { color: 'blue', icon: FileText, label: 'Meeting' },
  action: { color: 'yellow', icon: Zap, label: 'Action' },
  decision: { color: 'indigo', icon: BookOpen, label: 'Decision' },
};

export default function KnowledgeSearch() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showRecent, setShowRecent] = useState(true);
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState(
    () => JSON.parse(localStorage.getItem('recentSearches') || '["microservices","sprint retrospective","Acme Corp","design tokens","budget"]')
  );

  const debounceRef = useRef(null);

  const performSearch = useCallback(async (q, type) => {
    if (!q && type === 'all') {
      setResults([]);
      setTotalResults(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const types = type !== 'all' ? type : undefined;
      const data = await globalSearch(q, types);
      setResults(data.results || []);
      setTotalResults(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to search');
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search when query or filter changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(query, typeFilter);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, typeFilter, performSearch]);

  // Save to recent searches when user triggers a search with content
  useEffect(() => {
    if (query.length >= 3) {
      setRecentSearches(prev => {
        const updated = [query, ...prev.filter(s => s !== query)].slice(0, 8);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
        return updated;
      });
    }
  }, [results]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasSearch = query.length > 0 || typeFilter !== 'all';

  // Compute stats from results
  const stats = {
    total: totalResults,
    meetings: results.filter(r => r.type === 'meeting').length,
    actions: results.filter(r => r.type === 'action').length,
    decisions: results.filter(r => r.type === 'decision').length,
  };

  function handleRecentSearch(term) {
    setQuery(term);
    setShowRecent(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Knowledge Search</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Search across all meeting insights, decisions, and action items.</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Results', value: stats.total, color: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
          { label: 'Meetings', value: stats.meetings, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
          { label: 'Actions', value: stats.actions, color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' },
          { label: 'Decisions', value: stats.decisions, color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 ${s.color} text-center`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search bar - large */}
      <Card>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowRecent(false); }}
            onFocus={() => !query && setShowRecent(true)}
            placeholder="Search across meetings, decisions, actions..."
            className="w-full pl-12 pr-4 py-3 text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        {/* Type filter chips */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Types' },
            { key: 'meeting', label: 'Meetings' },
            { key: 'action', label: 'Actions' },
            { key: 'decision', label: 'Decisions' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                typeFilter === t.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Recent searches */}
        {showRecent && !query && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Recent Searches</p>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map(term => (
                <button
                  key={term}
                  onClick={() => handleRecentSearch(term)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Clock className="w-3 h-3" /> {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-500 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Searching...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 dark:text-red-400 font-medium">Error: {error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please try again later.</p>
        </div>
      ) : !hasSearch ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Type to search across all meeting knowledge</p>
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description={`No items matching "${query}" were found. Try different keywords.`}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">{totalResults} result{totalResults !== 1 ? 's' : ''} found</p>
          {results.map(item => {
            const cfg = typeConfig[item.type] || typeConfig.decision;
            const Icon = cfg.icon;
            return (
              <Card key={item.id}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-${cfg.color}-50 dark:bg-${cfg.color}-900/20 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 text-${cfg.color}-600 dark:text-${cfg.color}-400`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                      <Badge color={cfg.color}>{cfg.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{item.snippet}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {item.status && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Status: {item.status}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
