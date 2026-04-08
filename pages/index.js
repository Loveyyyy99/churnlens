// pages/index.js
import { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import StatsCards from '../components/StatsCards';
import Charts from '../components/Charts';
import CustomerForm from '../components/CustomerForm';
import PredictionResult from '../components/PredictionResult';
import CSVUploader from '../components/CSVUploader';
import CustomerTable from '../components/CustomerTable';
import WhatIfSimulator from '../components/WhatIfSimulator';
import { AIInsights, AlertsPanel } from '../components/AIInsights';
import { generateMockData, computeStats, predictChurn } from '../lib/churnEngine';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'predict', label: 'Predict', icon: '⚡' },
  { id: 'upload', label: 'Bulk Upload', icon: '📁' },
  { id: 'simulator', label: 'What-If', icon: '🔬' },
];

export default function Home() {
  const [industry, setIndustry] = useState('telecom');
  const [tab, setTab] = useState('dashboard');
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [aiAlerts, setAiAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Load mock data on mount / industry change
  useEffect(() => {
    const mock = generateMockData(60, industry);
    const computed = computeStats(mock);
    setCustomers(mock);
    setStats(computed);
    setPrediction(null);
    setSelectedCustomer(null);
    setAiAlerts([]);
    setInitialized(true);
  }, [industry]);

  const handleAlertsUpdate = useCallback((alerts) => {
    setAiAlerts(alerts);
    setAlertsLoading(false);
  }, []);

  const handlePredict = useCallback(async (formData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: formData, industry }),
      });
      const data = await res.json();
      if (data.success) {
        setPrediction(data);
        setTab('predict');
        setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [industry]);

  const handleCSVLoaded = useCallback((rawCustomers, fileName) => {
    const predicted = rawCustomers.map(c => {
      const result = predictChurn(c, industry);
      return { ...c, ...result };
    });
    const computed = computeStats(predicted);
    setCustomers(predicted);
    setStats(computed);
    setAiAlerts([]);
    setTab('dashboard');
  }, [industry]);

  const handleSelectCustomer = useCallback((customer) => {
    setSelectedCustomer(customer);
    setPrediction({
      probability: customer.probability,
      riskLevel: customer.riskLevel,
      reasons: customer.reasons,
      recommendations: customer.recommendations,
      factors: customer.factors,
    });
    setTab('predict');
    setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-obsidian-950 bg-grid flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-mono text-sm">Initializing ChurnLens...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>ChurnLens — AI Churn Prediction Dashboard</title>
        <meta name="description" content="Real-time customer churn prediction with AI-powered insights" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>" />
      </Head>

      <div className="min-h-screen bg-obsidian-950 bg-grid">
        <Header industry={industry} onIndustryChange={setIndustry} customerCount={customers.length} />

        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* Hero */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display font-800 text-2xl sm:text-3xl text-white leading-tight">
                Customer Churn{' '}
                <span className="gradient-text">Intelligence</span>
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                AI-powered churn prediction & retention playbook for {
                  industry === 'telecom' ? 'Telecommunications' : industry === 'banking' ? 'Banking & Finance' : 'SaaS'
                }
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { 
                  const mock = generateMockData(60, industry); 
                  setCustomers(mock); 
                  setStats(computeStats(mock));
                  setAiAlerts([]);
                }}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all">
                ↻ Refresh Data
              </button>
              <button
                onClick={() => setTab('predict')}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 transition-all">
                ⚡ New Prediction
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl border border-slate-800 bg-slate-900/50 w-fit">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  tab === t.id
                    ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="mr-1.5">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {/* Dashboard Tab */}
          {tab === 'dashboard' && (
            <div className="space-y-6 slide-up-fade">
              <StatsCards stats={stats} />
              <Charts stats={stats} />
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                  <CustomerTable customers={customers} onSelect={handleSelectCustomer} />
                </div>
                <div className="space-y-4">
                  <AIInsights 
                    stats={stats} 
                    industryKey={industry} 
                    onAlertsUpdate={handleAlertsUpdate}
                  />
                  <AlertsPanel alerts={aiAlerts} loading={alertsLoading} />
                </div>
              </div>
            </div>
          )}

          {/* Predict Tab */}
          {tab === 'predict' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 slide-up-fade">
              <div className="card p-6 space-y-5">
                <div>
                  <h2 className="font-display font-700 text-white">Customer Profile</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Enter details to predict churn risk</p>
                </div>
                <CustomerForm onPredict={handlePredict} loading={loading} />
              </div>

              <div id="result" className="space-y-4">
                {loading && (
                  <div className="card p-6 flex flex-col items-center justify-center gap-4 min-h-64">
                    <div className="relative">
                      <div className="w-16 h-16 border-2 border-cyan-400/20 rounded-full animate-spin border-t-cyan-400" />
                      <div className="absolute inset-2 border-2 border-indigo-400/20 rounded-full animate-spin border-b-indigo-400" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold text-sm">Analyzing customer risk...</p>
                      <p className="text-slate-500 text-xs mt-1">Running churn prediction model</p>
                    </div>
                  </div>
                )}

                {!loading && prediction && <PredictionResult result={prediction} />}

                {!loading && !prediction && (
                  <div className="card p-8 flex flex-col items-center justify-center gap-4 min-h-64 border-dashed">
                    <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center text-3xl">
                      ⚡
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 font-semibold text-sm">No prediction yet</p>
                      <p className="text-slate-600 text-xs mt-1">Fill in the form and click Predict</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {tab === 'upload' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 slide-up-fade">
              <div className="card p-6 space-y-5">
                <div>
                  <h2 className="font-display font-700 text-white">Bulk CSV Upload</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Upload customer data to predict churn at scale</p>
                </div>
                <CSVUploader onDataLoaded={handleCSVLoaded} />

                {/* Sample CSV download */}
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-xs text-slate-600 mb-2">Don't have a CSV? Download a sample:</p>
                  <button
                    onClick={() => {
                      const csv = `customerID,tenure,MonthlyCharges,TotalCharges,Contract,InternetService,TechSupport,OnlineSecurity,NumServices\nCUST-001,12,75.50,906,Month-to-month,Fiber optic,No,No,2\nCUST-002,48,45.00,2160,Two year,DSL,Yes,Yes,5\nCUST-003,3,110.00,330,Month-to-month,Fiber optic,No,No,1\nCUST-004,60,30.00,1800,One year,DSL,Yes,Yes,6\nCUST-005,8,85.00,680,Month-to-month,Fiber optic,No,Yes,3`;
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'sample_customers.csv'; a.click();
                    }}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                  >
                    ↓ Download Sample CSV
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {customers.length > 0 && (
                  <>
                    <StatsCards stats={stats} />
                    <AlertsPanel alerts={aiAlerts} loading={alertsLoading} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* What-If Tab */}
          {tab === 'simulator' && (
            <div className="slide-up-fade">
              <WhatIfSimulator industryKey={industry} />
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 mt-12 py-6">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-700 font-mono">ChurnLens v1.0 · AI-Powered Churn Intelligence</p>
            <p className="text-xs text-slate-700 font-mono">Built with Next.js + Tailwind CSS · Deployable on Vercel</p>
          </div>
        </footer>
      </div>
    </>
  );
}