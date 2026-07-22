'use client';

import React, { useState } from 'react';
import { FileText, Plus, Search, Tag, Download, Trash2, X } from 'lucide-react';
import { CompanyDocument } from '@/types';
import { createItem, deleteItem } from '@/lib/services/firestore';

interface DocumentViewProps {
  documents: CompanyDocument[];
  onRefresh: () => void;
}

export default function DocumentView({ documents, onRefresh }: DocumentViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newDoc, setNewDoc] = useState({
    title: '',
    category: 'Policy' as CompanyDocument['category'],
    tags: 'Governance, Legal',
    url: '#'
  });

  const categories = ['All', 'Policy', 'Contract', 'Project Brief', 'Financial', 'Technical'];

  const filtered = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title) return;

    try {
      const tagsArr = newDoc.tags.split(',').map(t => t.trim()).filter(Boolean);
      await createItem<Omit<CompanyDocument, 'id'>>('documents', {
        title: newDoc.title,
        category: newDoc.category,
        url: newDoc.url || '#',
        uploadedBy: 'CEO Sovereign',
        date: new Date().toISOString().split('T')[0],
        tags: tagsArr,
        size: '1.5 MB'
      });

      setShowAddModal(false);
      setNewDoc({
        title: '',
        category: 'Policy',
        tags: 'Governance, Legal',
        url: '#'
      });
      alert('Document Uploaded to Vault!');
    } catch (err: any) {
      alert('Error creating document: ' + err.message);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (confirm('Delete document from vault?')) {
      await deleteItem('documents', id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Executive Document Vault
          </h2>
          <p className="text-xs text-slate-400">Contracts, HR-Free Governance Policies, and Project Specs</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search document title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <div
            key={d.id}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg hover:border-indigo-500/50 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                {d.category}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                {d.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Uploaded by {d.uploadedBy} • {d.date}</p>
            </div>

            <div className="flex flex-wrap gap-1">
              {d.tags?.map((t, idx) => (
                <span key={idx} className="text-[10px] bg-slate-950 text-indigo-300 border border-slate-800 px-2 py-0.5 rounded">
                  #{t}
                </span>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[10px]">{d.size || '1 MB'}</span>
              <div className="flex items-center gap-3">
                <a
                  href={d.url}
                  onClick={(e) => { e.preventDefault(); alert('Simulated document download for: ' + d.title); }}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button onClick={() => handleDeleteDoc(d.id)} className="text-rose-400 hover:text-rose-300">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Doc Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Upload New Document
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newDoc.title}
                  onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Category</label>
                <select
                  value={newDoc.category}
                  onChange={e => setNewDoc({ ...newDoc, category: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Policy">Policy</option>
                  <option value="Contract">Contract</option>
                  <option value="Project Brief">Project Brief</option>
                  <option value="Financial">Financial</option>
                  <option value="Technical">Technical</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newDoc.tags}
                  onChange={e => setNewDoc({ ...newDoc, tags: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
