'use client';

import React, { useState } from 'react';
import { UserCheck, Plus, Search, DollarSign, Mail, Phone, Briefcase, X } from 'lucide-react';
import { Client } from '@/types';
import { createItem, deleteItem } from '@/lib/services/firestore';
import { formatNPR } from '@/lib/nepaliCalendar';

interface ClientViewProps {
  clients: Client[];
  onRefresh: () => void;
}

export default function ClientView({ clients, onRefresh }: ClientViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newClient, setNewClient] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    totalSpent: 100000,
    status: 'Active' as const
  });

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.company) return;

    try {
      await createItem<Omit<Client, 'id'>>('clients', {
        name: newClient.name,
        company: newClient.company,
        email: newClient.email || 'contact@client.com',
        phone: newClient.phone || '+1 (800) 555-0000',
        totalSpent: Number(newClient.totalSpent),
        activeProjectsCount: 1,
        status: newClient.status
      });

      setShowAddModal(false);
      setNewClient({
        name: '',
        company: '',
        email: '',
        phone: '',
        totalSpent: 100000,
        status: 'Active'
      });
      alert('Client Added!');
    } catch (err: any) {
      alert('Error creating client: ' + err.message);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Delete client record?')) {
      await deleteItem('clients', id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            Enterprise Client Directory
          </h2>
          <p className="text-xs text-slate-400">Total client lifetime spend & active project partnerships</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search clients or companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4 shadow-lg hover:border-emerald-500/50 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {c.name}
                </h3>
                <p className="text-xs text-slate-400 font-medium">{c.company}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                c.status === 'Active'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {c.status}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Spend (NPR)</span>
                <span className="font-extrabold text-emerald-400">{formatNPR(c.totalSpent)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Projects</span>
                <span className="font-bold text-slate-200">{c.activeProjectsCount || 1}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-indigo-400" /> {c.email}</p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-indigo-400" /> {c.phone}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleDeleteClient(c.id)}
                className="text-xs text-rose-400 hover:underline font-semibold"
              >
                Delete Client
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Add New Client
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Company / Organization *</label>
                <input
                  type="text"
                  required
                  value={newClient.company}
                  onChange={e => setNewClient({ ...newClient, company: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Email</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={newClient.phone}
                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
