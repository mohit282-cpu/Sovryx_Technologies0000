'use client';

import React, { useState } from 'react';
import {
  Compass,
  Target,
  ShieldAlert,
  Map,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { StrategicPlan } from '@/types';

interface StrategicPlanningViewProps {
  plan?: StrategicPlan;
}

export default function StrategicPlanningView({ plan }: StrategicPlanningViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'swot' | 'roadmap' | 'risks'>('overview');

  // Fallback defaults
  const mission = plan?.mission || 'To build autonomous, ultra-performant AI systems that empower sovereign enterprise command.';
  const vision = plan?.vision || 'Become the global standard in high-velocity, serverless AI OS architectures.';
  const quarterly = plan?.quarterlyObjectives || [
    'Q3: Launch Neural OS Core v3.5 to Nexus Corp Global',
    'Q3: Resolve all backend database latency bottlenecks in BioGen Pipeline',
    'Q4: Achieve SOC2 Type II compliance and scale sales team'
  ];
  const annual = plan?.annualObjectives || [
    'Scale annual recurring revenue beyond $2.0M',
    'Maintain zero high-severity client outages',
    'Keep overall workforce productivity above 90%'
  ];

  const swot = plan?.swot || {
    strengths: ['Proprietary Gemini 3.6 Flash integration', 'Elite engineering talent', 'Direct CEO command structure'],
    weaknesses: ['Small team size', 'Dependency on single senior backend architect'],
    opportunities: ['Expansion into biotech predictive pipeline market', 'Enterprise AI auditing SaaS'],
    threats: ['Rapidly shifting LLM benchmark standards', 'Cloud compute cost spikes']
  };

  const roadmap = plan?.roadmap || [
    { phase: 'Phase 1: Foundation & Core OS', period: 'Q1-Q2 2026', focus: 'Engine Architecture', progress: 100 },
    { phase: 'Phase 2: Enterprise Integration', period: 'Q3 2026', focus: 'Client Delivery & Security', progress: 65 },
    { phase: 'Phase 3: Autonomous Scaling', period: 'Q4 2026', focus: 'Multi-Tenant SaaS Rollout', progress: 20 }
  ];

  const risks = plan?.risks || [
    { risk: 'BioGen project delay due to DB query leaks', mitigation: 'Assigned senior mentor and daily query profiling', level: 'High' },
    { risk: 'Single point of failure in neural model optimization', mitigation: 'Cross-training senior frontend lead on PyTorch quantization', level: 'Medium' }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20 font-bold">
            EXECUTIVE VISION
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">Strategic Planning & Roadmap</h1>
          <p className="text-xs text-slate-400">Mission, vision, SWOT analysis matrix, risk mitigation, and execution roadmap.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['overview', 'swot', 'roadmap', 'risks'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === tab ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Mission & Vision Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-4 h-4" /> Company Mission
              </div>
              <p className="text-base font-extrabold text-white leading-relaxed">{mission}</p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-500/30 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <Target className="w-4 h-4" /> Strategic Vision
              </div>
              <p className="text-base font-extrabold text-white leading-relaxed">{vision}</p>
            </div>
          </div>

          {/* Objectives Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" /> Quarterly Objectives (Q3 2026)
              </h3>
              <ul className="space-y-2">
                {quarterly.map((obj, i) => (
                  <li key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" /> Annual Objectives (2026)
              </h3>
              <ul className="space-y-2">
                {annual.map((obj, i) => (
                  <li key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'swot' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Strengths</h3>
            <ul className="space-y-2">
              {swot.strengths.map((item, i) => (
                <li key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-rose-500/30 space-y-3">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Weaknesses</h3>
            <ul className="space-y-2">
              {swot.weaknesses.map((item, i) => (
                <li key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Opportunities</h3>
            <ul className="space-y-2">
              {swot.opportunities.map((item, i) => (
                <li key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Threats */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Threats</h3>
            <ul className="space-y-2">
              {swot.threats.map((item, i) => (
                <li key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'roadmap' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Map className="w-4 h-4 text-purple-400" /> Strategic Execution Roadmap
          </h3>

          <div className="space-y-4">
            {roadmap.map((rm, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{rm.phase}</span>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{rm.period}</span>
                  </div>
                  <span className="font-bold text-indigo-400 font-mono">{rm.progress}%</span>
                </div>
                <p className="text-xs text-slate-400">Core Focus: {rm.focus}</p>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full transition-all duration-300" style={{ width: `${rm.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'risks' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" /> Risk Register & CEO Mitigation Directives
          </h3>

          <div className="space-y-3">
            {risks.map((r, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white">{r.risk}</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    r.level === 'High' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {r.level} RISK
                  </span>
                </div>
                <p className="text-xs text-slate-300"><strong className="text-indigo-400">Mitigation Strategy:</strong> {r.mitigation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
