import React, { useState, useMemo } from "react";
import { 
  X, 
  ShieldAlert, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  ChevronRight, 
  Building2, 
  Clock, 
  IndianRupee, 
  TrendingUp, 
  FileText,
  FileCheck,
  ChevronLeft
} from "lucide-react";

export default function HighRiskProjectsModal({ 
  projects = [], 
  onClose, 
  onSelectProject 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [riskSeverityFilter, setRiskSeverityFilter] = useState("all"); // 'all' | 'critical' | 'high' | 'payment' | 'vendor' | 'delay'
  const [sortBy, setSortBy] = useState("score_desc"); // 'score_desc' | 'amount_desc' | 'delay_desc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter only High & Critical projects (or score >= 50)
  const highRiskBase = useMemo(() => {
    return projects.filter((p) => {
      const s = String(p.status || p.risk_level || "").toLowerCase();
      const score = Number(p.risk_score || p.final_risk_score || 0);
      return s.includes("crit") || s.includes("high") || score >= 50;
    });
  }, [projects]);

  // Extract unique states for high-risk works
  const uniqueStates = useMemo(() => {
    const states = new Set(highRiskBase.map((p) => p.state).filter(Boolean));
    return Array.from(states).sort();
  }, [highRiskBase]);

  // Total sanctioned value of high-risk projects
  const totalHighRiskSanctionCr = useMemo(() => {
    const total = highRiskBase.reduce((sum, p) => sum + (Number(p.sanction_amount) || 0), 0);
    return (total / 10000000).toFixed(2);
  }, [highRiskBase]);

  // Filter and sort
  const filteredProjects = useMemo(() => {
    return highRiskBase
      .filter((p) => {
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const match =
            (p.work_id && p.work_id.toLowerCase().includes(q)) ||
            (p.state && p.state.toLowerCase().includes(q)) ||
            (p.mp_name && p.mp_name.toLowerCase().includes(q)) ||
            (p.ida && p.ida.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.primary_alert && p.primary_alert.toLowerCase().includes(q)) ||
            (p.officer_explanation && p.officer_explanation.toLowerCase().includes(q));
          if (!match) return false;
        }

        // State filter
        if (selectedState !== "all" && p.state !== selectedState) {
          return false;
        }

        // Severity / Driver filter
        const s = String(p.status || p.risk_level || "").toLowerCase();
        const score = Number(p.risk_score || p.final_risk_score || 0);
        const alertText = String(p.primary_alert || p.officer_explanation || "").toLowerCase();

        if (riskSeverityFilter === "critical") {
          if (!s.includes("crit") && score < 70) return false;
        } else if (riskSeverityFilter === "high_only") {
          if (s.includes("crit") || score >= 70) return false;
        } else if (riskSeverityFilter === "payment") {
          if (!alertText.includes("payment") && !alertText.includes("voucher") && !alertText.includes("disburs")) return false;
        } else if (riskSeverityFilter === "vendor") {
          if (!alertText.includes("vendor") && !alertText.includes("contractor") && !alertText.includes("fragmentation")) return false;
        } else if (riskSeverityFilter === "delay") {
          if (!alertText.includes("delay") && !alertText.includes("days") && !alertText.includes("duration")) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const scoreA = Number(a.risk_score || a.final_risk_score || 0);
        const scoreB = Number(b.risk_score || b.final_risk_score || 0);
        const amtA = Number(a.sanction_amount || 0);
        const amtB = Number(b.sanction_amount || 0);
        const delayA = Number(a.delay_risk || 0);
        const delayB = Number(b.delay_risk || 0);

        if (sortBy === "score_desc") return scoreB - scoreA;
        if (sortBy === "amount_desc") return amtB - amtA;
        if (sortBy === "delay_desc") return delayB - delayA;
        return 0;
      });
  }, [highRiskBase, searchTerm, selectedState, riskSeverityFilter, sortBy]);

  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const exportHighRiskDossier = () => {
    const headers = [
      "Work ID", "State", "Constituency", "IDA", "MP Name", "Category", 
      "Sanction Amount", "Risk Score", "Severity", "Primary Alert", "AI Explanation", "Recommended Action"
    ];

    const rows = filteredProjects.map((p) => [
      `"${p.work_id || ""}"`,
      `"${p.state || ""}"`,
      `"${p.constituency || ""}"`,
      `"${p.ida || ""}"`,
      `"${p.mp_name || ""}"`,
      `"${p.category || ""}"`,
      p.sanction_amount || 0,
      p.risk_score || p.final_risk_score || 0,
      `"${p.status || p.risk_level || ""}"`,
      `"${(p.primary_alert || "").replace(/"/g, '""')}"`,
      `"${(p.officer_explanation || "").replace(/"/g, '""')}"`,
      `"${(p.recommended_action || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mplads_high_risk_dossier_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container high-risk-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header high-risk-modal-header">
          <div className="modal-title-area">
            <div className="high-risk-emblem">
              <ShieldAlert size={24} className="text-red" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 className="modal-work-id">High-Risk Projects Command Center</h2>
                <span className="high-risk-badge-count">{highRiskBase.length} Flagged Works</span>
              </div>
              <p className="modal-sub">
                Complete intelligence dossier on high and critical risk public works requiring immediate District Magistrate and audit inspection.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close High-Risk Dashboard">
            <X size={20} />
          </button>
        </div>

        {/* High Risk KPI Bar */}
        <div className="high-risk-kpi-bar">
          <div className="hr-kpi-box">
            <span className="hr-kpi-lbl">Total Flagged Works</span>
            <strong className="hr-kpi-val text-red">{highRiskBase.length} Works</strong>
          </div>

          <div className="hr-kpi-box">
            <span className="hr-kpi-lbl">Flagged Sanction Value</span>
            <strong className="hr-kpi-val">₹{totalHighRiskSanctionCr} Cr</strong>
          </div>

          <div className="hr-kpi-box">
            <span className="hr-kpi-lbl">Critical Severity (Score ≥ 70)</span>
            <strong className="hr-kpi-val text-red">
              {highRiskBase.filter(p => Number(p.risk_score || p.final_risk_score) >= 70).length} Projects
            </strong>
          </div>

          <div className="hr-kpi-box">
            <span className="hr-kpi-lbl">States Affected</span>
            <strong className="hr-kpi-val">{uniqueStates.length} States</strong>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="queue-toolbar">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search high-risk works by ID, MP, District, Alert..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            {/* Filter Severity */}
            <select
              value={riskSeverityFilter}
              onChange={(e) => {
                setRiskSeverityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="queue-select"
            >
              <option value="all">All High-Risk Drivers ({highRiskBase.length})</option>
              <option value="critical">Critical Severity Only (Score ≥ 70)</option>
              <option value="high_only">High Severity (Score 50-69)</option>
              <option value="payment">Payment Velocity Spikes</option>
              <option value="vendor">Vendor Entity Splitting</option>
              <option value="delay">Severe Milestone Delay</option>
            </select>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setCurrentPage(1);
              }}
              className="queue-select"
            >
              <option value="all">All States ({uniqueStates.length})</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="queue-select"
            >
              <option value="score_desc">Sort: Highest Risk Score</option>
              <option value="amount_desc">Sort: Highest Sanction Amount</option>
              <option value="delay_desc">Sort: Highest Delay Risk</option>
            </select>

            <button 
              className="page-btn" 
              onClick={exportHighRiskDossier}
              title="Export high-risk projects dossier as CSV"
              style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#f8fafc" }}
            >
              <Download size={14} />
              <span>Export Dossier</span>
            </button>
          </div>
        </div>

        {/* High Risk Cards Grid */}
        <div className="modal-body high-risk-modal-body">
          {filteredProjects.length === 0 ? (
            <div className="empty-filter-state">
              <AlertTriangle size={36} className="text-orange" />
              <h3>No High-Risk Projects Matching Filters</h3>
              <p>Try resetting the search query or risk driver dropdown.</p>
            </div>
          ) : (
            <div className="high-risk-cards-list">
              {paginatedProjects.map((p) => {
                const score = Number(p.risk_score || p.final_risk_score || 0).toFixed(1);
                const isCrit = Number(score) >= 70;

                return (
                  <div key={p.work_id} className="high-risk-project-card">
                    {/* Card Header */}
                    <div className="hr-card-header">
                      <div className="hr-card-left">
                        <span className={`hr-score-pill ${isCrit ? "crit" : "high"}`}>
                          Risk Score {score} / 100 • {isCrit ? "CRITICAL" : "HIGH"}
                        </span>
                        <h3 className="hr-work-id">{p.work_id}</h3>
                        <div className="hr-meta-line">
                          <span>📍 {p.state}</span>
                          <span>•</span>
                          <span>🏛️ {p.ida}</span>
                          <span>•</span>
                          <span>👤 {p.mp_name}</span>
                        </div>
                      </div>

                      <div className="hr-card-right">
                        <span className="hr-sanction-lbl">SANCTIONED AMOUNT</span>
                        <strong className="hr-sanction-val">
                          {p.amount_formatted || `₹${Number(p.sanction_amount || 0).toLocaleString("en-IN")}`}
                        </strong>
                        <span className="hr-category-tag">{p.category}</span>
                      </div>
                    </div>

                    {/* AI Evidence Alert Box */}
                    <div className="hr-evidence-box">
                      <div className="hr-evidence-title">
                        <AlertTriangle size={14} className="text-red" />
                        <strong>Primary Anomaly Evidence:</strong>
                      </div>
                      <p className="hr-evidence-text">{p.primary_alert || p.officer_explanation}</p>
                    </div>

                    {/* 6-Factor Mini Progress Bars */}
                    <div className="hr-factor-mini-grid">
                      <div className="hr-mini-factor">
                        <div className="factor-header">
                          <span>Financial Risk</span>
                          <strong>{p.financial_risk || 0}%</strong>
                        </div>
                        <div className="factor-bar-track">
                          <div className="factor-bar-fill bg-red" style={{ width: `${p.financial_risk || 0}%` }} />
                        </div>
                      </div>

                      <div className="hr-mini-factor">
                        <div className="factor-header">
                          <span>Payment Velocity</span>
                          <strong>{p.payment_risk || 0}%</strong>
                        </div>
                        <div className="factor-bar-track">
                          <div className="factor-bar-fill bg-orange" style={{ width: `${p.payment_risk || 0}%` }} />
                        </div>
                      </div>

                      <div className="hr-mini-factor">
                        <div className="factor-header">
                          <span>Milestone Delay</span>
                          <strong>{p.delay_risk || 0}%</strong>
                        </div>
                        <div className="factor-bar-track">
                          <div className="factor-bar-fill bg-red" style={{ width: `${p.delay_risk || 0}%` }} />
                        </div>
                      </div>

                      <div className="hr-mini-factor">
                        <div className="factor-header">
                          <span>Vendor Fragmentation</span>
                          <strong>{p.vendor_risk || 0}%</strong>
                        </div>
                        <div className="factor-bar-track">
                          <div className="factor-bar-fill bg-purple" style={{ width: `${p.vendor_risk || 0}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Card Footer with Action Guidance and Detail Launcher */}
                    <div className="hr-card-footer">
                      <div className="hr-action-note">
                        <span className="hr-action-lbl">AUDIT ACTION:</span>
                        <span className="hr-action-text">{p.recommended_action || "Initiate District Collector physical verification."}</span>
                      </div>

                      <button
                        className="hr-inspect-btn"
                        onClick={() => onSelectProject(p)}
                        title="View Full Risk Radar and AI Explanation"
                      >
                        <span>Full Risk Radar</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="queue-pagination">
          <span className="pagination-info">
            Showing {filteredProjects.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0}–{Math.min(currentPage * pageSize, filteredProjects.length)} of {filteredProjects.length} high-risk projects
          </span>

          <div className="pagination-controls">
            <button
              className="page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>

            <div style={{ display: "flex", gap: "4px" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  className={`page-btn ${currentPage === pageNum ? "active-page" : ""}`}
                  style={{
                    minWidth: "30px",
                    justifyContent: "center",
                    backgroundColor: currentPage === pageNum ? "#dc2626" : "#ffffff",
                    color: currentPage === pageNum ? "#ffffff" : "var(--text-secondary)",
                    fontWeight: currentPage === pageNum ? "700" : "500",
                  }}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              className="page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
