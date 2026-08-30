import React, { useState, useRef } from "react";
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  PlusCircle, 
  Eye, 
  ShieldAlert,
  BrainCircuit,
  Layers
} from "lucide-react";
import { 
  evaluateCSVBatch, 
  getSampleCSVTemplate, 
  saveBatchToSupabase 
} from "../utils/mlRiskEngine";

export default function CSVUploadModal({ 
  onClose, 
  onAddProjectsToDashboard, 
  existingProjects = [] 
}) {
  const [file, setFile] = useState(null);
  const [csvRawText, setCsvRawText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSavingToDB, setIsSavingToDB] = useState(false);
  const [syncToSupabase, setSyncToSupabase] = useState(true);
  const [dbSyncStatus, setDbSyncStatus] = useState(null);
  const [evalProgress, setEvalProgress] = useState(0);
  const [evalStatusText, setEvalStatusText] = useState("");
  const [evalResult, setEvalResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selectedFile) => {
    if (!selectedFile.name.endsWith(".csv")) {
      setErrorMsg("Please upload a valid .csv file.");
      return;
    }
    setErrorMsg(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvRawText(text);
      runEvaluation(text, selectedFile.name);
    };
    reader.readAsText(selectedFile);
  };

  const handleLoadSample = () => {
    const sample = getSampleCSVTemplate();
    setFile({ name: "mplads_sample_pilot_batch.csv", size: sample.length });
    setCsvRawText(sample);
    setErrorMsg(null);
    runEvaluation(sample, "mplads_sample_pilot_batch.csv");
  };

  const runEvaluation = (rawText, fileName) => {
    setIsEvaluating(true);
    setEvalProgress(15);
    setEvalStatusText("Parsing CSV structure & column headers...");

    setTimeout(() => {
      setEvalProgress(45);
      setEvalStatusText("Running Multi-Factor Financial & Payment Risk Models...");
    }, 400);

    setTimeout(() => {
      setEvalProgress(75);
      setEvalStatusText("Executing ML Isolation Forest & Peer Anomaly Detection...");
    }, 800);

    setTimeout(() => {
      try {
        const result = evaluateCSVBatch(rawText, existingProjects);
        setEvalResult(result);
        setEvalProgress(100);
        setEvalStatusText("AI Risk Evaluation Complete!");
      } catch (err) {
        setErrorMsg(err.message || "Failed to evaluate CSV data.");
      } finally {
        setIsEvaluating(false);
      }
    }, 1200);
  };

  const handleDownloadTemplate = () => {
    const template = getSampleCSVTemplate();
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mplads_project_upload_template.csv";
    link.click();
  };

  const handleDownloadScoredCSV = () => {
    if (!evalResult) return;
    const headers = [
      "work_id", "state", "mp_name", "constituency", "ida", "category",
      "sanction_amount", "final_amount", "final_risk_score", "final_risk_level",
      "primary_risk_driver", "financial_risk", "payment_risk", "delay_risk",
      "vendor_risk", "peer_risk", "ml_risk", "primary_alert", "officer_explanation", "recommended_action"
    ];

    const rows = evalResult.evaluatedProjects.map((p) => [
      `"${p.work_id}"`,
      `"${p.state}"`,
      `"${p.mp_name}"`,
      `"${p.constituency}"`,
      `"${p.ida}"`,
      `"${p.category}"`,
      p.sanction_amount,
      p.final_amount,
      p.risk_score,
      `"${p.final_risk_level}"`,
      `"${p.primary_risk_driver}"`,
      p.financial_risk,
      p.payment_risk,
      p.delay_risk,
      p.vendor_risk,
      p.peer_risk,
      p.ml_risk,
      `"${(p.primary_alert || "").replace(/"/g, '""')}"`,
      `"${(p.officer_explanation || "").replace(/"/g, '""')}"`,
      `"${(p.recommended_action || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mplads_ml_evaluated_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleMergeIntoDashboard = async () => {
    if (!evalResult) return;
    
    if (syncToSupabase) {
      setIsSavingToDB(true);
      setDbSyncStatus("Syncing records to Supabase live database...");
      try {
        const res = await saveBatchToSupabase(evalResult.evaluatedProjects);
        if (res.success) {
          setDbSyncStatus("Saved to Supabase successfully!");
        } else {
          console.warn("Supabase save notice:", res.error);
        }
      } catch (err) {
        console.error("Supabase sync exception:", err);
      } finally {
        setIsSavingToDB(false);
      }
    }

    onAddProjectsToDashboard(evalResult.evaluatedProjects, evalResult.batchSummary);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container upload-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-area">
            <div className="upload-emblem">
              <UploadCloud size={22} className="text-blue" />
            </div>
            <div>
              <h2 className="modal-work-id">Upload & Evaluate Projects via AI Model</h2>
              <p className="modal-sub">
                Upload raw CSV project records to calculate ML risk scores, detect anomalies, and append to total monitored works.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Upload Modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Upload Area */}
          {!evalResult && (
            <div
              className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <div className="dropzone-icon-circle">
                <FileSpreadsheet size={32} className="text-blue" />
              </div>
              <h3 className="dropzone-title">Drop your MPLADS CSV file here, or browse</h3>
              <p className="dropzone-subtitle">Supports columns: work_id, state, mp_name, sanction_amount, expenditure, payments, delay_days</p>
              
              <div className="dropzone-actions" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="quick-sample-btn"
                  onClick={handleLoadSample}
                  title="Test with pre-configured 5 project pilot dataset"
                >
                  <Sparkles size={13} className="text-purple" />
                  <span>Try Sample Demo Batch (5 Works)</span>
                </button>

                <button 
                  className="quick-sample-btn secondary"
                  onClick={handleDownloadTemplate}
                  title="Download standard CSV header format"
                >
                  <Download size={13} />
                  <span>Download Blank CSV Template</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="dashboard-banner warning">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)}>Dismiss</button>
            </div>
          )}

          {/* Evaluating State Animation */}
          {isEvaluating && (
            <div className="evaluation-loading-card">
              <div className="ai-scanning-badge">
                <BrainCircuit size={20} className="spinning-icon text-purple" />
                <span>AI Neural Risk Pipeline Active</span>
              </div>
              <p className="eval-status-msg">{evalStatusText}</p>
              <div className="eval-progress-bar">
                <div className="eval-progress-fill" style={{ width: `${evalProgress}%` }} />
              </div>
            </div>
          )}

          {/* Results Summary Box */}
          {evalResult && !isEvaluating && (
            <div className="eval-results-wrapper">
              <div className="eval-success-header">
                <div className="success-tag">
                  <CheckCircle2 size={18} className="text-emerald" />
                  <span>Successfully Evaluated {evalResult.batchSummary.totalCount} New Works</span>
                </div>
                <button 
                  className="reupload-btn"
                  onClick={() => {
                    setEvalResult(null);
                    setFile(null);
                  }}
                >
                  Upload Another File
                </button>
              </div>

              {/* Batch KPI Summary */}
              <div className="batch-kpi-grid">
                <div className="batch-kpi-card">
                  <span className="batch-kpi-lbl">New Works Evaluated</span>
                  <strong className="batch-kpi-val">+{evalResult.batchSummary.totalCount}</strong>
                </div>

                <div className="batch-kpi-card">
                  <span className="batch-kpi-lbl">Sanction Added</span>
                  <strong className="batch-kpi-val">+₹{evalResult.batchSummary.totalSanctionCr} Cr</strong>
                </div>

                <div className="batch-kpi-card alert">
                  <span className="batch-kpi-lbl">High/Critical Risk</span>
                  <strong className="batch-kpi-val text-red">+{evalResult.batchSummary.highRiskCount}</strong>
                </div>

                <div className="batch-kpi-card">
                  <span className="batch-kpi-lbl">Payment Alerts</span>
                  <strong className="batch-kpi-val text-orange">+{evalResult.batchSummary.paymentAlertsCount}</strong>
                </div>

                <div className="batch-kpi-card">
                  <span className="batch-kpi-lbl">Delay Alerts</span>
                  <strong className="batch-kpi-val text-red">+{evalResult.batchSummary.delayAlertsCount}</strong>
                </div>
              </div>

              {/* Evaluated Projects Table Preview */}
              <div className="eval-preview-section">
                <h4 className="preview-heading">Evaluated Projects Preview</h4>
                <div className="table-responsive eval-table-wrapper">
                  <table className="projects-table">
                    <thead>
                      <tr>
                        <th>Risk Score</th>
                        <th>Work ID</th>
                        <th>State</th>
                        <th>MP</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>AI Detected Evidence & Explanation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evalResult.evaluatedProjects.map((p) => {
                        const score = Number(p.risk_score).toFixed(1);
                        return (
                          <tr key={p.work_id}>
                            <td className="font-bold font-mono">
                              <span className={`score-badge ${Number(score) >= 50 ? "score-high" : Number(score) >= 30 ? "score-med" : "score-low"}`}>
                                {score}
                              </span>
                            </td>
                            <td className="font-mono text-blue font-bold">{p.work_id}</td>
                            <td>{p.state}</td>
                            <td>{p.mp_name}</td>
                            <td className="font-mono font-bold">{p.amount_formatted}</td>
                            <td>
                              <span className={`status-pill ${p.status === "High" ? "badge-high" : p.status === "Medium" ? "badge-medium" : "badge-low"}`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="text-secondary" style={{ fontSize: "12px", maxWidth: "280px" }}>
                              <div className="alert-text-truncate" title={p.officer_explanation}>
                                {p.officer_explanation}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ justifyContent: "space-between", alignItems: "center" }}>
          {evalResult ? (
            <label className="supabase-sync-toggle" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer", color: "var(--text-secondary)" }}>
              <input 
                type="checkbox" 
                checked={syncToSupabase} 
                onChange={(e) => setSyncToSupabase(e.target.checked)} 
              />
              <span>Sync & persist records to live Supabase database</span>
            </label>
          ) : (
            <div />
          )}

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button className="modal-action-btn secondary" onClick={onClose} disabled={isSavingToDB}>
              Cancel
            </button>

            {evalResult && (
              <>
                <button 
                  className="modal-action-btn secondary"
                  onClick={handleDownloadScoredCSV}
                  disabled={isSavingToDB}
                  title="Download CSV containing all calculated risk features and scores"
                >
                  <Download size={15} />
                  <span>Export Scored CSV</span>
                </button>

                <button 
                  className="modal-action-btn primary"
                  onClick={handleMergeIntoDashboard}
                  disabled={isSavingToDB}
                  title="Merge newly evaluated works into dashboard and save to Supabase"
                >
                  {isSavingToDB ? (
                    <span>Saving to Supabase...</span>
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      <span>Add +{evalResult.batchSummary.totalCount} Works to Dashboard</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
