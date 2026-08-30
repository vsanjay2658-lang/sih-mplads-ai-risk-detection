import React from "react";
import { 
  X, 
  ShieldAlert, 
  IndianRupee, 
  MapPin, 
  User, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  BrainCircuit,
  FileText
} from "lucide-react";

export default function ProjectDetailModal({ project, onClose }) {
  if (!project) return null;

  const score = Number(project.risk_score || project.final_risk_score || 0).toFixed(1);

  const getRiskBadge = (val) => {
    if (val >= 60) return { label: "CRITICAL RISK", color: "#dc2626", bg: "#fee2e2" };
    if (val >= 45) return { label: "HIGH RISK", color: "#ea580c", bg: "#ffedd5" };
    if (val >= 30) return { label: "MEDIUM RISK", color: "#d97706", bg: "#fef3c7" };
    return { label: "LOW RISK", color: "#16a34a", bg: "#dcfce7" };
  };

  const badge = getRiskBadge(Number(score));

  const sanctionVal = Number(project.sanction_amount || 0);
  const disbursedVal = Number(project.disbursed_amount || project.final_amount || project.total_expenditure || 0);
  const utilization = sanctionVal > 0 ? ((disbursedVal / sanctionVal) * 100).toFixed(1) : 0;

  const riskFactors = [
    { name: "Payment Risk", score: project.payment_risk || 68, color: "#ea580c" },
    { name: "Financial Risk", score: project.financial_risk || 54, color: "#dc2626" },
    { name: "Delay Risk", score: project.delay_risk || 44, color: "#f59e0b" },
    { name: "ML Anomaly Risk", score: project.ml_risk || 56, color: "#8b5cf6" },
    { name: "Peer Group Deviation", score: project.peer_risk || 38, color: "#0ea5e9" },
    { name: "Vendor Concentration", score: project.vendor_risk || 32, color: "#64748b" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-area">
            <span className="modal-work-id">{project.work_id}</span>
            <span 
              className="modal-risk-pill" 
              style={{ color: badge.color, backgroundColor: badge.bg }}
            >
              {badge.label} • Score: {score}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Metadata Grid */}
          <div className="modal-meta-grid">
            <div className="meta-card">
              <span className="meta-label"><MapPin size={13} /> State & Constituency</span>
              <strong className="meta-val">{project.state} • {project.constituency || "District Pool"}</strong>
            </div>

            <div className="meta-card">
              <span className="meta-label"><User size={13} /> Member of Parliament (MP)</span>
              <strong className="meta-val">{project.mp_name || "Hon'ble MP"}</strong>
            </div>

            <div className="meta-card">
              <span className="meta-label"><Building2 size={13} /> Implementing Agency (IDA)</span>
              <strong className="meta-val">{project.ida || "District Authority"}</strong>
            </div>

            <div className="meta-card">
              <span className="meta-label"><FileText size={13} /> Category</span>
              <strong className="meta-val">{project.category || "Public Infrastructure"}</strong>
            </div>
          </div>

          {/* Financial Utilization Box */}
          <div className="modal-finance-box">
            <div className="finance-col">
              <span className="finance-lbl">Sanctioned Amount</span>
              <strong className="finance-num">₹{sanctionVal.toLocaleString("en-IN")}</strong>
            </div>
            <div className="finance-col">
              <span className="finance-lbl">Total Disbursed</span>
              <strong className="finance-num">₹{disbursedVal.toLocaleString("en-IN")}</strong>
            </div>
            <div className="finance-col">
              <span className="finance-lbl">Utilization Ratio</span>
              <strong className={`finance-num ${utilization > 100 ? "text-red" : "text-green"}`}>
                {utilization}%
              </strong>
            </div>
          </div>

          {/* AI Officer Explanation */}
          <div className="modal-section-card ai-summary-card">
            <div className="section-card-title">
              <BrainCircuit size={18} className="text-purple" />
              <h3>AI Risk Engine & Officer Explanation</h3>
            </div>
            <p className="ai-explanation-text">
              {project.officer_explanation || project.primary_alert || "Project parameters are within standard operating benchmarks."}
            </p>
          </div>

          {/* Risk Factors Breakdown */}
          <div className="modal-section-card">
            <div className="section-card-title">
              <ShieldAlert size={18} className="text-orange" />
              <h3>Risk Factors & Deviations</h3>
            </div>
            <div className="factors-grid">
              {riskFactors.map((factor) => (
                <div key={factor.name} className="factor-item">
                  <div className="factor-header">
                    <span>{factor.name}</span>
                    <strong style={{ color: factor.color }}>{Number(factor.score).toFixed(1)}/100</strong>
                  </div>
                  <div className="factor-bar-track">
                    <div 
                      className="factor-bar-fill" 
                      style={{ width: `${Math.min(100, factor.score)}%`, backgroundColor: factor.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Action Checklist */}
          <div className="modal-section-card action-card">
            <div className="section-card-title">
              <AlertTriangle size={18} className="text-red" />
              <h3>Recommended Audit Action</h3>
            </div>
            <p className="action-text">
              {project.recommended_action || "Routine monitoring and scheduled field inspection by District Authority."}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="modal-action-btn secondary" onClick={onClose}>
            Close
          </button>
          <button 
            className="modal-action-btn primary"
            onClick={() => {
              alert(`Audit memo generated for project ${project.work_id}`);
            }}
          >
            <CheckCircle2 size={16} />
            <span>Generate Official Audit Memo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
