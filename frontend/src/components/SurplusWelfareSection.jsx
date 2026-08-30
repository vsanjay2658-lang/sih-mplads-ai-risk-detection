import React, { useState, useMemo } from "react";
import { 
  PiggyBank, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  MapPin, 
  User, 
  Building2,
  CheckCircle,
  HelpCircle,
  Search
} from "lucide-react";
import { SURPLUS_FUNDS_SUMMARY, CONSTITUENCY_SURPLUS_OPPORTUNITIES } from "../data/welfareReallocationData";

export default function SurplusWelfareSection({ onSelectConstituency }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("all");

  const uniqueStates = useMemo(() => {
    const states = new Set(CONSTITUENCY_SURPLUS_OPPORTUNITIES.map((c) => c.state));
    return Array.from(states).sort();
  }, []);

  const filteredOpportunities = useMemo(() => {
    return CONSTITUENCY_SURPLUS_OPPORTUNITIES.filter((c) => {
      const matchSearch =
        !searchTerm ||
        c.constituency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ida.toLowerCase().includes(searchTerm.toLowerCase());

      const matchState = selectedState === "all" || c.state === selectedState;
      return matchSearch && matchState;
    });
  }, [searchTerm, selectedState]);

  return (
    <section className="dashboard-card surplus-welfare-card" aria-label="Surplus Funds and Welfare Reallocation">
      {/* Top Banner Header */}
      <div className="surplus-banner">
        <div className="surplus-banner-left">
          <div className="surplus-badge">
            <PiggyBank size={18} className="surplus-icon" />
            <span>UNSPENT FUND SURPLUS & WELFARE REALLOCATION</span>
          </div>
          <h2 className="surplus-heading">
            Constituency-Level Savings & Reallocation Opportunities
          </h2>
          <p className="surplus-subheading">
            Projects completed under sanctioned budget leave surplus funds in district accounts. 
            AI matches these savings with high-priority eligible local welfare works in the same constituency.
          </p>
        </div>

        <div className="surplus-stats-grid">
          <div className="surplus-stat-box">
            <span className="stat-label">Total Unspent Surplus</span>
            <strong className="stat-value text-emerald">₹{SURPLUS_FUNDS_SUMMARY.totalSurplusCr} Cr</strong>
            <span className="stat-sub">Across national master works</span>
          </div>
          <div className="surplus-stat-box">
            <span className="stat-label">Completed Works With Savings</span>
            <strong className="stat-value">{SURPLUS_FUNDS_SUMMARY.completedProjectsWithSavings.toLocaleString()}</strong>
            <span className="stat-sub">Final cost &lt; Sanctioned budget</span>
          </div>
          <div className="surplus-stat-box">
            <span className="stat-label">Constituencies Ready</span>
            <strong className="stat-value">{SURPLUS_FUNDS_SUMMARY.constituenciesWithSavings}</strong>
            <span className="stat-sub">With active unspent balances</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="surplus-toolbar">
        <div className="toolbar-left">
          <h3 className="section-sub-title">Top Priority Areas with Available Savings</h3>
          <span className="item-count-tag">{filteredOpportunities.length} Areas</span>
        </div>

        <div className="toolbar-right">
          <div className="search-box small">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search Constituency, MP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="queue-select small"
          >
            <option value="all">All States</option>
            {uniqueStates.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Constituency Opportunities */}
      <div className="constituency-cards-grid">
        {filteredOpportunities.map((item) => (
          <div key={item.id} className="constituency-card">
            <div className="constituency-card-header">
              <div>
                <div className="card-location">
                  <MapPin size={13} className="text-emerald" />
                  <span className="state-badge">{item.state}</span>
                </div>
                <h4 className="constituency-title">{item.constituency}</h4>
                <p className="constituency-mp">
                  <User size={12} /> {item.mp_name}
                </p>
              </div>

              <div className="savings-badge-box">
                <span className="savings-pill-lbl">Surplus Savings</span>
                <strong className="savings-pill-val">{item.savings_formatted}</strong>
                <span className="savings-pct-tag">+{item.savings_percentage}% saved</span>
              </div>
            </div>

            {/* Financial comparison bar */}
            <div className="constituency-financials">
              <div className="fin-row">
                <span>Sanctioned Budget:</span>
                <strong>₹{(item.total_sanction / 100000).toFixed(1)} L</strong>
              </div>
              <div className="fin-row">
                <span>Actual Expenditure:</span>
                <strong className="text-slate">₹{(item.total_spent / 100000).toFixed(1)} L</strong>
              </div>
              
              <div className="savings-progress-bar">
                <div 
                  className="savings-fill" 
                  style={{ width: `${item.savings_percentage}%` }}
                  title={`${item.savings_percentage}% saved`}
                />
              </div>
              <span className="source-proj-count">
                <CheckCircle size={12} className="text-emerald" /> Generated from {item.project_count} completed works
              </span>
            </div>

            {/* Recommended works teaser */}
            <div className="recommended-teaser">
              <div className="teaser-heading">
                <Sparkles size={13} className="text-purple" />
                <span>AI Suggested Local Works ({item.recommended_welfare_works.length})</span>
              </div>
              <ul className="teaser-list">
                {item.recommended_welfare_works.slice(0, 2).map((w) => (
                  <li key={w.id} className="teaser-item">
                    <span className="bullet">•</span>
                    <span className="teaser-text">{w.title} ({w.estimated_cost_formatted})</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card Action */}
            <button
              className="reallocate-action-btn"
              onClick={() => onSelectConstituency(item)}
            >
              <span>Explore Welfare Reallocation</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
