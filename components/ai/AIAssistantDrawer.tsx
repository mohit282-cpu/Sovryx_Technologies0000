'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Zap,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  Brain
} from 'lucide-react';
import { callAI } from '@/lib/aiClient';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contextData: any;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export default function AIAssistantDrawer({
  isOpen,
  onClose,
  contextData
}: AIAssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Good day, CEO. Sovryx OS Intelligence is active. How may I assist your company strategy, project risk analysis, or workforce planning today?',
      timestamp: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const responseText = await callAI('chat', {
        userMessage: promptToSend,
        context: {
          employeesCount: contextData.employees?.length || 0,
          projectsCount: contextData.projects?.length || 0,
          atRiskCount: contextData.projects?.filter((p: any) => p.status === 'At Risk').length || 0,
          urgentTasksCount: contextData.tasks?.filter((t: any) => t.priority === 'Urgent' && t.status !== 'Completed').length || 0
        }
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: '⚠️ AI Operational Error: ' + err.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (actionType: string) => {
    setLoading(true);
    const actionLabel = actionType.replace('-', ' ').toUpperCase();
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: `[EXECUTE AI ACTION]: ${actionLabel}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await callAI(actionType, contextData);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: '⚠️ Failed to execute action: ' + err.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-all">
      <div className="w-full max-w-lg h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                CEO AI Co-Pilot
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                  Gemini 2.5
                </span>
              </h2>
              <p className="text-xs text-slate-400">Direct Command Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Quick Prompts */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/40 grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => handleQuickAction('weekly-summary')}
            disabled={loading}
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all text-left"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate font-medium">Weekly Executive Brief</span>
          </button>
          <button
            onClick={() => handleQuickAction('risk-detection')}
            disabled={loading}
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-slate-300 hover:text-white transition-all text-left"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate font-medium">Scan Project Risks</span>
          </button>
          <button
            onClick={() => handleQuickAction('ceo-recommendations')}
            disabled={loading}
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white transition-all text-left"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate font-medium">CEO Recommendations</span>
          </button>
          <button
            onClick={() => handleQuickAction('performance-analysis')}
            disabled={loading}
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-all text-left"
          >
            <ListTodo className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate font-medium">Workforce Analysis</span>
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {m.text}
                <div
                  className={`text-[9px] mt-1 text-right ${
                    m.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 font-bold text-xs">
                  CEO
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-indigo-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Analyzing company datasets & generating AI response...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask CEO AI (e.g., Should we reassign David to Project A?)..."
              disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
