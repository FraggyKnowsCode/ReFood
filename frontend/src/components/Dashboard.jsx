import React, { useEffect, useState } from 'react';
import { cachedGet } from '../api';
import { useAuth } from '../AuthContext';
import { DollarSign, BarChart2, Archive } from 'lucide-react';
import { StatCardSkeleton } from './PageLoader';

const StatCard = ({ title, value, icon: Icon, color, accentBg, loading }) => (
  loading
    ? <StatCardSkeleton />
    : (
      <div className="stat-card-premium" style={{ '--card-color': color, '--card-bg': accentBg }}>
        <div className="stat-card-shine" />
        <div className="stat-card-glow" />
        <div className="stat-card-top">
          <p className="stat-card-title">{title}</p>
          <div className="stat-card-icon-box">
            <Icon size={20} color={color} strokeWidth={2} />
          </div>
        </div>
        <div className="stat-card-value">{value}</div>
        <p className="stat-card-trend"><span>+0%</span> this week</p>
        <div className="stat-card-bar" />
      </div>
    )
);

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    cachedGet('/dashboard/stats', (data, isLoading, err) => {
      if (err) { setError('Failed to load statistics.'); setLoading(false); return; }
      if (data) { setStats(data); setLoading(false); }
    });
  }, []);

  const firstName = profile?.first_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="fade-in dashboard-page">
      <header className="page-header">
        <h1>Welcome back, {firstName}</h1>
        <p className="subtitle">Here is your high-level system overview for today.</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <StatCard
          title="Total Donations"
          value={`৳${stats?.totalDonations?.toFixed(2) ?? '0.00'}`}
          icon={DollarSign}
          color="#3b82f6"
          accentBg="rgba(59,130,246,0.12)"
          loading={loading}
        />
        <StatCard
          title="Active Events"
          value={stats?.totalPrograms ?? 0}
          icon={BarChart2}
          color="#10b981"
          accentBg="rgba(16,185,129,0.12)"
          loading={loading}
        />
        <StatCard
          title="Waste Entries Logged"
          value={stats?.totalWasteEntries ?? 0}
          icon={Archive}
          color="#f59e0b"
          accentBg="rgba(245,158,11,0.12)"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Dashboard;
