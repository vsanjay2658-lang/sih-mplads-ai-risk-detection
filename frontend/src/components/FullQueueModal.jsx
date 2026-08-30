import React, { useState, useMemo } from "react";
import { 
  X, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  ArrowUpDown
} from "lucide-react";

export default function FullQueueModal({ 
  projects = [], 
  onClose, 
  onSelectProject 
}) {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Extract unique states
  const uniqueStates = useMemo(() => {
    const states = new Set(projects.map((p) => p.state).filter(Boolean));
    return Array.from(states).sort();
  }, [projects]);

  // Filtered & searched data
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Search
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (p.work_id && p.work_id.toLowerCase().includes(q)) ||
        (p.state && p.state.toLowerCase().includes(q)) ||
        (p.mp_name && p.mp_name.toLowerCase().includes(q)) ||
        (p.ida && p.ida.toLowerCase().includes(q)) ||
        (p.primary_alert && p.primary_alert.toLowerCase().includes(q));

      // State
      const matchState = stateFilter === "all" || p.state === stateFilter;

      // Risk level
      const pStatus = (p.status || p.risk_level || "").toLowerCase();
      const matchRisk =
        riskFilter === "all" ||
        (riskFilter === "high" && (pStatus.includes("high") || pStatus.includes("crit"))) ||
        (riskFilter === "medium" && pStatus.includes("med")) ||
        (riskFilter === "low" && pStatus.includes("low"));

      return matchSearch && matchState && matchRisk;
    });
  }, [projects, search, stateFilter, riskFilter]);

  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const exportCSV = () => {
    const headers = ["Work ID", "State", "IDA", "MP Name", "Sanction Amount", "Risk Score", "Status", "Primary Alert"];
    const rows = filteredProjects.map((p) => [
      `"${p.work_id || ""}"`,
      `"${p.state || ""}"`,
      `"${p.ida || ""}"`,
      `"${p.mp_name || ""}"`,
      p.sanction_amount || 0,
      p.risk_score || p.final_risk_score || 0,
      `"${p.status || p.risk_level || ""}"`,
      `"${(p.primary_alert || p.officer_explanation || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mplads_full_queue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container full-queue-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="title-row">
              <ShieldAlert className="text-blue" size={22} />
              <h2 className="modal-heading">Complete Project Queue</h2>
            </div>
            <p className="modal-sub">
              Showing {filteredProjects.length} of {projects.length} monitored sanctioned works
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Full Queue">
            <X size={20} />
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="queue-toolbar">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Work ID, State, MP, IDA..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            {/* State Filter */}
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="queue-select"
            >
              <option value="all">All States ({uniqueStates.length})</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* Risk Level Filter */}
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="queue-select"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High & Critical Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>

            {/* Export CSV */}
            <button className="header-btn secondary" onClick={exportCSV} title="Export filtered list to CSV">
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive queue-table-wrapper">
          <table className="projects-table">
            <thead>
              <tr>
                <th className="th-risk">Risk Score</th>
                <th className="th-project-id">Work ID</th>
                <th className="th-state">State</th>
                <th className="th-ida">Implementing Authority</th>
                <th className="th-mp">MP Name</th>
                <th className="th-amount">Amount</th>
                <th className="th-status">Status</th>
                <th className="th-alert">Primary AI Alert</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProjects.map((p) => {
                const score = Number(p.risk_score || p.final_risk_score || 0).toFixed(1);
                return (
                  <tr 
                    key={p.work_id || p.id} 
                    className="project-row"
                    onClick={() => onSelectProject(p)}
                  >
                    <td className="td-risk font-bold">
                      <span className={`score-badge ${Number(score) >= 45 ? "score-high" : Number(score) >= 30 ? "score-med" : "score-low"}`}>
                        {score}
                      </span>
                    </td>
                    <td className="td-project-id">
                      <button className="project-id-btn">
                        <span>{p.work_id}</span>
                        <ExternalLink size={10} />
                      </button>
                    </td>
                    <td className="td-state">{p.state}</td>
                    <td className="td-ida">{p.ida}</td>
                    <td className="td-mp">{p.mp_name}</td>
                    <td className="td-amount font-mono">
                      {p.amount_formatted || `₹${Number(p.sanction_amount || 0).toLocaleString("en-IN")}`}
                    </td>
                    <td className="td-status">
                      <span className={`status-pill ${String(p.status || p.risk_level).toLowerCase().includes("high") ? "badge-high" : String(p.status || p.risk_level).toLowerCase().includes("med") ? "badge-medium" : "badge-low"}`}>
                        {p.status || p.risk_level}
                      </span>
                    </td>
                    <td className="td-alert">
                      <div className="alert-text-truncate">{p.primary_alert || p.officer_explanation || "Standard execution."}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="queue-pagination">
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({filteredProjects.length} total entries)
          </span>
          <div className="pagination-controls">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              className="page-btn"
              disabled={currentPage === totalPages}
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
