import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Briefcase, MessageSquare, ShieldCheck, Pill, X } from 'lucide-react';
import { db } from '../services/database';
import { Resident, StaffMember, ComplaintRecord, OperatingPermit } from '../types';

interface Result {
  id: string;
  label: string;
  sub: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); }
    else { setQuery(''); setResults([]); setSelected(0); }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const [residents, staff, complaints, permits] = await Promise.all([
        db.searchResidents(q),
        db.getStaff(),
        db.getComplaints(),
        db.getPermits(),
      ]);

      const r: Result[] = [
        ...residents.slice(0, 4).map(r => ({
          id: r.id, label: r.name, sub: `RUN: ${r.run} · ${r.status === 'activo' ? 'Activo' : 'Egresado'}`,
          href: `/residents/${r.id}`, icon: Users, color: 'text-blue-600 dark:text-blue-400'
        })),
        ...staff.filter(s => s.name.toLowerCase().includes(q.toLowerCase()) || s.run.toLowerCase().includes(q.toLowerCase())).slice(0, 3).map(s => ({
          id: s.id, label: s.name, sub: `${s.role.replace(/_/g,' ')} · ${s.active ? 'Activo' : 'Inactivo'}`,
          href: '/staff', icon: Briefcase, color: 'text-purple-600 dark:text-purple-400'
        })),
        ...complaints.filter(c => c.description.toLowerCase().includes(q.toLowerCase()) || String(c.folio).includes(q)).slice(0, 3).map(c => ({
          id: c.id, label: `Folio #${c.folio} — ${c.type}`, sub: c.description.slice(0, 60),
          href: '/complaints', icon: MessageSquare, color: 'text-yellow-600 dark:text-yellow-400'
        })),
        ...permits.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 2).map(p => ({
          id: p.id, label: p.name, sub: `${p.issuedBy} · ${p.status}`,
          href: '/permits', icon: ShieldCheck, color: 'text-green-600 dark:text-green-400'
        })),
      ];
      setResults(r);
      setSelected(0);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { doSearch(query); }, [query, doSearch]);

  const go = (href: string) => {
    navigate(href);
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) go(results[selected].href);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
        <Search className="w-4 h-4" />
        <span>Buscar...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 rounded">
          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey}
            placeholder="Buscar residentes, personal, reclamos, permisos..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm" />
          {loading && <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin shrink-0" />}
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((r, i) => (
              <li key={r.id}>
                <button onClick={() => go(r.href)} onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 dark:bg-gray-700 ${r.color}`}>
                    <r.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.sub}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : query.length >= 2 && !loading ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">Sin resultados para "{query}"</div>
        ) : query.length < 2 ? (
          <div className="px-4 py-6 text-center text-gray-400 text-sm">Escribe al menos 2 caracteres para buscar</div>
        ) : null}

        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex gap-4 text-xs text-gray-400">
          <span>↑↓ navegar</span><span>↵ abrir</span><span>Esc cerrar</span>
        </div>
      </div>
    </div>
  );
}
