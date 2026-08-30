import { 
  ShieldAlert, 
  Database, 
  RefreshCw, 
  Download, 
  Search,
  Sparkles,
  Layers,
  UploadCloud
} from "lucide-react";

export default function Header({ 
  totalProjects = 96710, 
  dataSource = "benchmark", 
  onToggleSource, 
  loading = false,
  searchTerm = "",
  onSearchChange,
  onOpenFullQueue,
  onExportData,
  onOpenUploadModal
}) {
  return (
    <header className="dashboard-header">
      <div className="header-top">
        <div className="brand-section">
          <div className="brand-badge">
            <div className="emblem-container">
              <ShieldAlert className="emblem-icon" size={20} />
            </div>
            <div className="brand-text">
              <span className="brand-org">GOVERNMENT OF INDIA • MPLADS AI RISK INTELLIGENCE</span>
              <div className="title-row">
                <h1 className="header-title">Overview</h1>
                <span className="live-status-pill">
                  <span className="pulse-dot"></span>
                  {dataSource === "live" ? "Live Cloud Sync" : "National Master Dataset (96,710 Works)"}
                </span>
              </div>
              <p className="header-subtitle">
                AI powered monitoring of MPLADS implementation across <span className="highlight-count">{totalProjects.toLocaleString()}</span> sanctioned works
              </p>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {/* Search bar */}
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search Project ID, MP, State, IDA..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Dataset Switcher */}
          <div className="source-switcher">
            <button
              className={`switcher-btn ${dataSource === "benchmark" ? "active" : ""}`}
              onClick={() => onToggleSource("benchmark")}
              title="View benchmark national dataset from Supabase"
            >
              <Sparkles size={14} />
              <span>National (96.7k)</span>
            </button>
            <button
              className={`switcher-btn ${dataSource === "live" ? "active" : ""}`}
              onClick={() => onToggleSource("live")}
              title="Query live Supabase cloud database directly"
            >
              <Database size={14} />
              <span>Supabase Live</span>
            </button>
          </div>

          {/* Quick Action buttons */}
          <button 
            className="header-btn upload-accent-btn"
            onClick={onOpenUploadModal}
            title="Upload raw CSV file and run AI risk evaluation"
          >
            <UploadCloud size={15} />
            <span>Upload & Evaluate CSV</span>
          </button>

          <button 
            className="header-btn secondary"
            onClick={onOpenFullQueue}
            title="Open Complete Project Queue"
          >
            <Layers size={15} />
            <span>Full Queue</span>
          </button>

          <button 
            className="header-btn primary"
            onClick={onExportData}
            title="Export summary data as CSV"
          >
            <Download size={15} />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </header>
  );
}
