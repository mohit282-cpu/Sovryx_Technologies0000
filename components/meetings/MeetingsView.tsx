'use client';

import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  Users,
  Sparkles,
  CheckCircle2,
  X,
  FileText,
  Brain
} from 'lucide-react';
import { Meeting, Employee } from '@/types';
import { createItem, updateItem } from '@/lib/services/firestore';
import { callAI } from '@/lib/aiClient';

interface MeetingsViewProps {
  meetings: Meeting[];
  employees: Employee[];
  onRefresh: () => void;
}

export default function MeetingsView({ meetings, employees, onRefresh }: MeetingsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [rawNotes, setRawNotes] = useState('');
  const [aiSummaryResult, setAiSummaryResult] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    durationMinutes: 45,
    agenda: '',
    participantIds: [] as string[]
  });

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.title) return;

    try {
      const participantNames = employees.filter(e => newMeeting.participantIds.includes(e.id)).map(e => e.name);

      await createItem<Omit<Meeting, 'id'>>('meetings', {
        title: newMeeting.title,
        date: newMeeting.date,
        time: newMeeting.time,
        durationMinutes: Number(newMeeting.durationMinutes),
        participants: newMeeting.participantIds,
        participantNames,
        agenda: newMeeting.agenda,
        status: 'Scheduled',
        actionItems: []
      });

      setShowAddModal(false);
      setNewMeeting({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM',
        durationMinutes: 45,
        agenda: '',
        participantIds: []
      });
      alert('Executive Meeting Scheduled!');
    } catch (err: any) {
      alert('Error creating meeting: ' + err.message);
    }
  };

  const handleSummarizeMeetingWithAI = async (m: Meeting) => {
    setLoadingAI(true);
    setAiSummaryResult('');
    try {
      const res = await callAI('meeting-summary', {
        title: m.title,
        agenda: m.agenda,
        rawNotes
      });
      setAiSummaryResult(res);
      await updateItem('meetings', m.id, { summary: res });
    } catch (err: any) {
      setAiSummaryResult('AI Summarization Error: ' + err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
            Executive Meetings & Syncs
          </h2>
          <p className="text-xs text-slate-400">Schedule meetings, record audio notes, and auto-generate AI action items</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Schedule Meeting
        </button>
      </div>

      {/* Meetings List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {meetings.map((m) => (
          <div
            key={m.id}
            onClick={() => setSelectedMeeting(m)}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all space-y-4 shadow-lg group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                  {m.date} • {m.time} ({m.durationMinutes}m)
                </span>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors mt-0.5">
                  {m.title}
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {m.status}
              </span>
            </div>

            <p className="text-xs text-slate-400 line-clamp-2">{m.agenda}</p>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                {m.participantNames?.length || m.participants?.length || 0} Participants
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" /> AI Summary Ready
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedMeeting.title}</h3>
                <p className="text-xs text-slate-400">{selectedMeeting.date} at {selectedMeeting.time}</p>
              </div>
              <button onClick={() => setSelectedMeeting(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <p className="font-bold text-slate-200 mb-1">Agenda & Goals:</p>
                <p className="text-slate-400">{selectedMeeting.agenda}</p>
              </div>

              {/* AI Summarizer Form */}
              <div className="p-4 bg-slate-900 rounded-xl border border-indigo-500/30 space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-400" /> AI Executive Summarizer & Action Item Extractor
                </h4>

                <textarea
                  rows={3}
                  placeholder="Paste meeting discussion notes or transcript..."
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />

                <button
                  onClick={() => handleSummarizeMeetingWithAI(selectedMeeting)}
                  disabled={loadingAI}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  {loadingAI ? 'Processing AI Summary...' : 'Generate AI Executive Summary'}
                </button>

                {(aiSummaryResult || selectedMeeting.summary) && (
                  <div className="p-3 bg-slate-950 rounded-xl text-slate-200 whitespace-pre-wrap leading-relaxed border border-slate-800">
                    {aiSummaryResult || selectedMeeting.summary}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button onClick={() => setSelectedMeeting(null)} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Meeting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-400" />
                Schedule Executive Meeting
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Strategic Hiring & Budget Sync"
                  value={newMeeting.title}
                  onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={e => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Time</label>
                  <input
                    type="text"
                    value={newMeeting.time}
                    onChange={e => setNewMeeting({ ...newMeeting, time: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Agenda & Objectives</label>
                <textarea
                  rows={2}
                  value={newMeeting.agenda}
                  onChange={e => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
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
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
