import React from "react";
import { ArrowRight, ExternalLink, AlertCircle } from "lucide-react";

export default function TopProjectsTable({ 
  projects = [], 
  onSelectProject, 
  onViewFullQueue 
}) {
  // Format risk bar color
  const getRiskColor = (score) => {
    if (score >= 60) return "#dc2626"; // Red
    if (score >= 45) return "#ea580c"; // Orange
    if (score >= 30) return "#f59e0b"; // Amber
    return "#16a34a"; // Green
  };

  const getStatusBadgeClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("crit") || s.includes("high")) return "badge-high";
    if (s.includes("med")) return "badge-medium";
    return "badge-low";
  };

  return (
    <div className="dashboard-card top-projects-card">
      <div className="card-header table-header-flex">
        <div>
          <h2 className="card-title">Top Projects Requiring Attention</h2>
          <p className="card-subtitle">Sorted by overall risk score</p>
        </div>
        <button 
          className="view-full-queue-link"
          onClick={onViewFullQueue}
          title="Open complete list of all projects"
        >
          <span>View Full Queue</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="table-responsive">
        <table className="projects-table">
          <thead>
            <tr>
              <th className="th-risk">Risk</th>
              <th className="th-project-id">Project ID</th>
              <th className="th-state">State</th>
              <th className="th-ida">IDA</th>
              <th className="th-mp">MP</th>
              <th className="th-amount">Amount</th>
              <th className="th-status">Status</th>
              <th className="th-alert">Primary Alert</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-table-cell">
                  <AlertCircle size={20} />
                  <span>No projects match the selected criteria.</span>
                </td>
              </tr>
            ) : (
              projects.slice(0, 10).map((proj) => {
                const score = Number(proj.risk_score || proj.final_risk_score || 0).toFixed(1);
                const scorePercent = Math.min(100, Math.max(0, (score / 80) * 100));
                const barColor = getRiskColor(Number(score));

                return (
                  <tr 
                    key={proj.work_id || proj.id} 
                    className="project-row"
                    onClick={() => onSelectProject(proj)}
                  >
                    {/* Risk Bar + Score */}
                    <td className="td-risk">
                      <div className="risk-score-wrapper">
                        <div className="risk-bar-track">
                          <div 
                            className="risk-bar-fill" 
                            style={{ 
                              width: `${scorePercent}%`, 
                              backgroundColor: barColor 
                            }}
                          />
                        </div>
                        <span className="risk-score-text" style={{ color: barColor }}>
                          {score}
                        </span>
                      </div>
                    </td>

                    {/* Project ID */}
                    <td className="td-project-id">
                      <button 
                        className="project-id-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(proj);
                        }}
                      >
                        <span>{proj.work_id}</span>
                        <ExternalLink size={11} className="id-ext-icon" />
                      </button>
                    </td>

                    {/* State */}
                    <td className="td-state">{proj.state || "—"}</td>

                    {/* IDA */}
                    <td className="td-ida" title={proj.ida}>{proj.ida || "—"}</td>

                    {/* MP */}
                    <td className="td-mp" title={proj.mp_name}>{proj.mp_name || "—"}</td>

                    {/* Amount */}
                    <td className="td-amount font-mono">
                      {proj.amount_formatted || `₹${Number(proj.sanction_amount || 0).toLocaleString()}`}
                    </td>

                    {/* Status */}
                    <td className="td-status">
                      <span className={`status-pill ${getStatusBadgeClass(proj.status || proj.risk_level)}`}>
                        {proj.status || proj.risk_level || "Medium"}
                      </span>
                    </td>

                    {/* Primary Alert */}
                    <td className="td-alert" title={proj.primary_alert || proj.officer_explanation}>
                      <div className="alert-text-truncate">
                        {proj.primary_alert || proj.officer_explanation || "Routine monitoring."}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
