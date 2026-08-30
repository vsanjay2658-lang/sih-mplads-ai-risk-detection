import React, { useState } from "react";
import { 
  X, 
  Sparkles, 
  CheckSquare, 
  Square, 
  PiggyBank, 
  MapPin, 
  User, 
  Building2, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Users
} from "lucide-react";

export default function WelfareProposalModal({ constituencyData, onClose }) {
  if (!constituencyData) return null;

  // Selected works state (all selected by default if within budget)
  const [selectedWorks, setSelectedWorks] = useState(
    constituencyData.recommended_welfare_works.map((w) => w.id)
  );

  const [activeTab, setActiveTab] = useState("recommendations"); // 'recommendations' | 'source_projects' | 'official_memo'

  const totalAvailable = constituencyData.total_savings;

  // Compute allocated cost
  const totalAllocated = constituencyData.recommended_welfare_works
    .filter((w) => selectedWorks.includes(w.id))
    .reduce((acc, w) => acc + w.estimated_cost, 0);

  const remainingBudget = totalAvailable - totalAllocated;
  const budgetUtilizationPct = Math.min(100, (totalAllocated / totalAvailable) * 100);

  const toggleWork = (id) => {
    setSelectedWorks((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrintMemo = () => {
    window.print();
  };

  const downloadMemoTxt = () => {
    const memoContent = `
================================================================================
MEMORANDUM FOR REALLOCATION OF UNSPENT MPLADS SURPLUS FUNDS
================================================================================
TO: The District Magistrate / Implementing District Authority (IDA)
    ${constituencyData.ida}
    State of ${constituencyData.state}

FROM: Office of the Hon'ble Member of Parliament
      ${constituencyData.mp_name}
      Constituency: ${constituencyData.constituency}

DATE: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
SUBJECT: Reallocation of Identified Unspent Surplus Savings from Completed MPLADS Works for New Community Welfare Schemes

--------------------------------------------------------------------------------
1. SOURCE COMPLETED WORKS & IDENTIFIED SAVINGS
--------------------------------------------------------------------------------
Under the AI Public Expenditure Monitoring System, the following projects in ${constituencyData.constituency} 
have been completed with final expenditures strictly below the sanctioned budget:

${constituencyData.source_projects.map((p, idx) => `  (${idx + 1}) Work ID: ${p.work_id}
      Work Description: ${p.name}
      Sanctioned: ₹${(p.sanction / 100000).toFixed(2)} Lakhs | Actual Spent: ₹${(p.spent / 100000).toFixed(2)} Lakhs
      Surplus Available: ₹${(p.savings / 100000).toFixed(2)} Lakhs
`).join("\n")}

TOTAL SURPLUS IDENTIFIED: ${constituencyData.savings_formatted} (₹${(totalAvailable / 100000).toFixed(2)} Lakhs)

--------------------------------------------------------------------------------
2. PROPOSED LOCAL WELFARE REALLOCATION WORKS
--------------------------------------------------------------------------------
In accordance with MPLADS Implementation Guidelines, sanction is hereby recommended 
for the following community welfare works utilizing the above surplus savings:

${constituencyData.recommended_welfare_works
  .filter((w) => selectedWorks.includes(w.id))
  .map((w, idx) => `  [Scheme ${idx + 1}] ${w.title}
      Category: ${w.category}
      Estimated Cost: ${w.estimated_cost_formatted}
      Target Beneficiaries: ${w.beneficiaries}
      Brief Scope: ${w.description}
`).join("\n")}

TOTAL PROPOSED REALLOCATION: ₹${(totalAllocated / 100000).toFixed(2)} Lakhs
BALANCE CONTINGENCY SURPLUS: ₹${(remainingBudget / 100000).toFixed(2)} Lakhs

--------------------------------------------------------------------------------
3. STATUTORY COMPLIANCE & UNDERTAKING
--------------------------------------------------------------------------------
1. All recommended works create durable community assets in eligible sectors.
2. The executing agency shall be designated by the District Authority in accordance with state public procurement rules.
3. Geo-tagged photographs and asset registration shall be uploaded to the official portal upon completion.

(Signed & Recommended)
Hon'ble Member of Parliament / District Authority Nodal Officer
${constituencyData.constituency} (${constituencyData.state})
================================================================================
    `;

    const blob = new Blob([memoContent], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MPLADS_Surplus_Reallocation_${constituencyData.constituency}.txt`;
    link.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container welfare-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-area">
            <div className="reallocate-emblem">
              <PiggyBank size={20} className="text-emerald" />
            </div>
            <div>
              <div className="title-row">
                <h2 className="modal-work-id">{constituencyData.constituency}</h2>
                <span className="state-pill">{constituencyData.state}</span>
              </div>
              <p className="modal-sub">
                Surplus Fund Utilization & Welfare Reallocation Engine
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Modal">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="modal-tabs-nav">
          <button
            className={`modal-tab-btn ${activeTab === "recommendations" ? "active" : ""}`}
            onClick={() => setActiveTab("recommendations")}
          >
            <Sparkles size={15} />
            <span>AI Welfare Recommendations</span>
          </button>

          <button
            className={`modal-tab-btn ${activeTab === "source_projects" ? "active" : ""}`}
            onClick={() => setActiveTab("source_projects")}
          >
            <CheckCircle2 size={15} />
            <span>Source Completed Works ({constituencyData.source_projects.length})</span>
          </button>

          <button
            className={`modal-tab-btn ${activeTab === "official_memo" ? "active" : ""}`}
            onClick={() => setActiveTab("official_memo")}
          >
            <FileText size={15} />
            <span>Official Reallocation Memo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Top Summary Banner */}
          <div className="reallocation-budget-banner">
            <div className="budget-kpi">
              <span className="kpi-lbl">Total Unspent Savings</span>
              <strong className="kpi-val text-emerald">{constituencyData.savings_formatted}</strong>
            </div>

            <div className="budget-kpi">
              <span className="kpi-lbl">Selected Reallocation</span>
              <strong className="kpi-val">₹{(totalAllocated / 100000).toFixed(1)} L</strong>
            </div>

            <div className="budget-kpi">
              <span className="kpi-lbl">Remaining Balance</span>
              <strong className={`kpi-val ${remainingBudget < 0 ? "text-red" : "text-slate"}`}>
                ₹{(remainingBudget / 100000).toFixed(1)} L
              </strong>
            </div>

            {/* Live Progress Bar */}
            <div className="budget-progress-track">
              <div 
                className={`budget-progress-fill ${budgetUtilizationPct > 100 ? "bg-red" : "bg-emerald"}`}
                style={{ width: `${budgetUtilizationPct}%` }}
              />
            </div>
          </div>

          {/* TAB 1: AI Recommended Welfare Works */}
          {activeTab === "recommendations" && (
            <div className="tab-content">
              <div className="tab-intro-card">
                <Sparkles size={16} className="text-purple" />
                <p>
                  Select the community welfare works to fund using the <strong>{constituencyData.savings_formatted}</strong> savings. 
                  All recommendations comply with MPLADS Guideline Rule 3.12 for durable local asset creation.
                </p>
              </div>

              <div className="welfare-works-list">
                {constituencyData.recommended_welfare_works.map((work) => {
                  const isSelected = selectedWorks.includes(work.id);
                  return (
                    <div 
                      key={work.id} 
                      className={`welfare-work-card ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleWork(work.id)}
                    >
                      <div className="work-card-top">
                        <div className="work-select-box">
                          {isSelected ? (
                            <CheckSquare size={18} className="text-emerald" />
                          ) : (
                            <Square size={18} className="text-slate" />
                          )}
                          <div>
                            <h4 className="work-title">{work.title}</h4>
                            <span className="work-category-badge">{work.category}</span>
                          </div>
                        </div>

                        <div className="work-cost-badge">
                          <strong className="cost-num">{work.estimated_cost_formatted}</strong>
                          <span className="impact-tag"><Zap size={11} /> Score: {work.impact_score}/100</span>
                        </div>
                      </div>

                      <p className="work-desc">{work.description}</p>

                      <div className="work-card-footer">
                        <span className="beneficiary-tag">
                          <Users size={12} /> {work.beneficiaries}
                        </span>
                        <span className="priority-pill">{work.priority}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Source Completed Projects */}
          {activeTab === "source_projects" && (
            <div className="tab-content">
              <div className="tab-intro-card">
                <CheckCircle2 size={16} className="text-emerald" />
                <p>
                  These completed works in {constituencyData.constituency} were executed with high efficiency, 
                  generating <strong>{constituencyData.savings_formatted}</strong> in verified public fund savings.
                </p>
              </div>

              <div className="table-responsive">
                <table className="projects-table">
                  <thead>
                    <tr>
                      <th>Work ID</th>
                      <th>Work Description</th>
                      <th>Sanctioned</th>
                      <th>Actual Spent</th>
                      <th>Surplus Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {constituencyData.source_projects.map((proj) => (
                      <tr key={proj.work_id}>
                        <td className="font-mono text-blue font-bold">{proj.work_id}</td>
                        <td>{proj.name}</td>
                        <td>₹{(proj.sanction / 100000).toFixed(1)} L</td>
                        <td>₹{(proj.spent / 100000).toFixed(1)} L</td>
                        <td className="text-emerald font-bold font-mono">
                          +₹{(proj.savings / 100000).toFixed(1)} L
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Official Reallocation Memo */}
          {activeTab === "official_memo" && (
            <div className="tab-content">
              <div className="official-memo-container">
                <div className="memo-paper">
                  <div className="memo-govt-header">
                    <span className="emblem-text">GOVERNMENT OF INDIA</span>
                    <h3 className="memo-title">MEMORANDUM FOR REALLOCATION OF UNSPENT MPLADS SURPLUS FUNDS</h3>
                    <p className="memo-ref">REF: MPLADS/SURPLUS/{constituencyData.constituency}/{new Date().getFullYear()}/01</p>
                  </div>

                  <div className="memo-grid">
                    <div><strong>Constituency:</strong> {constituencyData.constituency} ({constituencyData.state})</div>
                    <div><strong>Hon'ble MP:</strong> {constituencyData.mp_name}</div>
                    <div><strong>Nodal Authority:</strong> {constituencyData.ida}</div>
                    <div><strong>Identified Savings:</strong> {constituencyData.savings_formatted}</div>
                  </div>

                  <hr className="memo-divider" />

                  <h4 className="memo-subheading">Proposed Reallocation Works ({selectedWorks.length} Schemes Selected)</h4>
                  <ul className="memo-works-list">
                    {constituencyData.recommended_welfare_works
                      .filter((w) => selectedWorks.includes(w.id))
                      .map((w, i) => (
                        <li key={w.id}>
                          <strong>{i + 1}. {w.title}</strong> — {w.estimated_cost_formatted}
                          <div className="memo-work-note">{w.description} (Impact: {w.beneficiaries})</div>
                        </li>
                      ))}
                  </ul>

                  <div className="memo-totals">
                    <div>Total Proposed Cost: <strong>₹{(totalAllocated / 100000).toFixed(2)} Lakhs</strong></div>
                    <div>Remaining Contingency: <strong>₹{(remainingBudget / 100000).toFixed(2)} Lakhs</strong></div>
                  </div>

                  <div className="memo-sign-area">
                    <div className="sign-box">
                      <div className="sign-line"></div>
                      <span>Hon'ble Member of Parliament</span>
                    </div>
                    <div className="sign-box">
                      <div className="sign-line"></div>
                      <span>District Magistrate / Nodal Officer</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="modal-action-btn secondary" onClick={onClose}>
            Close
          </button>
          
          <button className="modal-action-btn secondary" onClick={downloadMemoTxt}>
            <Download size={15} />
            <span>Download Official Memo (.txt)</span>
          </button>

          <button 
            className="modal-action-btn primary"
            onClick={() => {
              setActiveTab("official_memo");
              alert(`Welfare Reallocation Proposal generated successfully for ${constituencyData.constituency}! All ${selectedWorks.length} schemes ready for sanction.`);
            }}
          >
            <ShieldCheck size={16} />
            <span>Submit Reallocation Proposal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
