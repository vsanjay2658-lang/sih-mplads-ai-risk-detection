import React, { useState, useEffect, useMemo } from "react";
import Header from "./components/Header";
import MetricCards from "./components/MetricCards";
import RiskDistributionChart from "./components/RiskDistributionChart";
import AnomalyOverview from "./components/AnomalyOverview";
import StateMonitoringChart from "./components/StateMonitoringChart";
import TopProjectsTable from "./components/TopProjectsTable";
import ProjectDetailModal from "./components/ProjectDetailModal";
import FullQueueModal from "./components/FullQueueModal";
import HighRiskProjectsModal from "./components/HighRiskProjectsModal";
import SurplusWelfareSection from "./components/SurplusWelfareSection";
import WelfareProposalModal from "./components/WelfareProposalModal";
import CSVUploadModal from "./components/CSVUploadModal";
import { supabase } from "./supabase";
import {
  BENCHMARK_METRICS,
  BENCHMARK_RISK_DISTRIBUTION,
  BENCHMARK_ANOMALY_CATEGORIES,
  BENCHMARK_STATE_MONITORING,
  BENCHMARK_PROJECTS,
} from "./data/benchmarkData";
import "./App.css";

export default function App() {
  const [dataSource, setDataSource] = useState("benchmark"); // 'benchmark' | 'live'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadSuccessAlert, setUploadSuccessAlert] = useState(null);

  // Filters & Interaction States
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeRiskLevel, setActiveRiskLevel] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeState, setActiveState] = useState(null);

  // Modals
  const [selectedProject, setSelectedProject] = useState(null);
  const [isFullQueueOpen, setIsFullQueueOpen] = useState(false);
  const [isHighRiskModalOpen, setIsHighRiskModalOpen] = useState(false);
  const [selectedWelfareConstituency, setSelectedWelfareConstituency] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // User uploaded evaluated projects
  const [customProjects, setCustomProjects] = useState([]);
  const [extraMetrics, setExtraMetrics] = useState({
    addedCount: 0,
    addedSanctionCr: 0,
    addedSpentCr: 0,
    addedHighRisk: 0,
    addedPaymentAlerts: 0,
    addedDelayAlerts: 0,
    addedDuplicates: 0,
    addedCostAnomalies: 0,
    addedVendorAlerts: 0,
  });

  // Handler for merging evaluated CSV projects into the dashboard
  const handleAddProjectsToDashboard = (newProjects, batchSummary) => {
    setCustomProjects((prev) => [...newProjects, ...prev]);
    setExtraMetrics((prev) => ({
      addedCount: prev.addedCount + batchSummary.totalCount,
      addedSanctionCr: Number((prev.addedSanctionCr + batchSummary.totalSanctionCr).toFixed(2)),
      addedSpentCr: Number((prev.addedSpentCr + batchSummary.totalSpentCr).toFixed(2)),
      addedHighRisk: prev.addedHighRisk + batchSummary.highRiskCount,
      addedPaymentAlerts: prev.addedPaymentAlerts + batchSummary.paymentAlertsCount,
      addedDelayAlerts: prev.addedDelayAlerts + batchSummary.delayAlertsCount,
      addedDuplicates: prev.addedDuplicates + batchSummary.duplicateAlertsCount,
      addedCostAnomalies: prev.addedCostAnomalies + batchSummary.costAnomaliesCount,
      addedVendorAlerts: prev.addedVendorAlerts + batchSummary.vendorAlertsCount,
    }));

    setUploadSuccessAlert(
      `Evaluated and added +${batchSummary.totalCount} new project works (+₹${batchSummary.totalSanctionCr} Cr) to total monitored dashboard projects!`
    );
    setTimeout(() => {
      setUploadSuccessAlert(null);
    }, 8000);
  };

  // Live Supabase Data Cache
  const [liveData, setLiveData] = useState({
    metrics: null,
    riskDistribution: [],
    anomalyCategories: [],
    stateMonitoring: [],
    projects: [],
  });

  // Fetch Live Data from Supabase when dataSource is set to 'live'
  useEffect(() => {
    if (dataSource !== "live") return;

    let isMounted = true;
    async function fetchSupabaseData() {
      setLoading(true);
      setError(null);
      try {
        // 1. Project Count (filtered by dataset_id = 2 to avoid duplicate batches)
        const { count: projectCount, error: countErr } = await supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("dataset_id", 2);
        if (countErr) throw countErr;

        // 2. Exact High Risk Count from full dataset (score >= 50)
        const { count: liveHighCount } = await supabase
          .from("risk_assessments")
          .select("id", { count: "exact", head: true })
          .gte("final_risk_score", 50);

        // 3. Exact Medium Risk Count (30 <= score < 50)
        const { count: liveMedCount } = await supabase
          .from("risk_assessments")
          .select("id", { count: "exact", head: true })
          .gte("final_risk_score", 30)
          .lt("final_risk_score", 50);

        // 4. Fetch Top Priority Risk Assessments with Projects for preview
        const { data: risks, error: riskErr } = await supabase
          .from("risk_assessments")
          .select(`
            id,
            final_risk_score,
            final_risk_level,
            risk_level,
            risk_score,
            officer_explanation,
            primary_evidence,
            financial_risk,
            payment_risk,
            delay_risk,
            vendor_risk,
            peer_risk,
            ml_risk,
            final_recommended_action,
            projects!inner (
              id,
              work_id,
              state,
              mp_name,
              ida,
              category,
              sanction_amount,
              final_amount,
              total_expenditure
            )
          `)
          .order("final_risk_score", { ascending: false })
          .limit(100);

        if (riskErr) throw riskErr;

        if (isMounted && risks) {
          // Format live projects
          const formattedProjects = risks.map((r, idx) => {
            const p = r.projects || {};
            const sanction = Number(p.sanction_amount || 0);
            const amtStr = sanction >= 10000000 
              ? `₹${(sanction / 10000000).toFixed(2)} Cr`
              : sanction >= 100000 
              ? `₹${(sanction / 100000).toFixed(1)} L`
              : `₹${sanction.toLocaleString("en-IN")}`;

            const riskLevel = r.final_risk_level || r.risk_level || "Medium";

            return {
              id: r.id || idx,
              work_id: p.work_id || `WS/MP/${String(idx + 1).padStart(5, "0")}`,
              state: p.state || "Unknown",
              ida: p.ida || "District Collector IDA",
              mp_name: p.mp_name || "Hon'ble MP",
              category: p.category || "Public Infrastructure",
              sanction_amount: sanction,
              disbursed_amount: Number(p.final_amount || p.total_expenditure || 0),
              amount_formatted: amtStr,
              risk_score: Number(r.final_risk_score || r.risk_score || 0),
              status: riskLevel.toUpperCase().includes("HIGH") || riskLevel.toUpperCase().includes("CRIT") ? "High" : riskLevel.toUpperCase().includes("MED") ? "Medium" : "Low",
              primary_alert: r.officer_explanation || r.primary_evidence || "Disbursement velocity risk detected.",
              financial_risk: r.financial_risk || 50,
              payment_risk: r.payment_risk || 50,
              delay_risk: r.delay_risk || 30,
              vendor_risk: r.vendor_risk || 20,
              peer_risk: r.peer_risk || 25,
              ml_risk: r.ml_risk || 40,
              officer_explanation: r.officer_explanation,
              recommended_action: r.final_recommended_action,
            };
          });

          const totalHigh = liveHighCount || 372;
          const totalMed = liveMedCount || 9390;
          const totalProjectsCount = projectCount || 96710;
          const totalLow = Math.max(0, totalProjectsCount - totalHigh - totalMed);

          setLiveData({
            metrics: {
              totalProjects: totalProjectsCount,
              sanctionedProjects: totalProjectsCount,
              sanctionedAmountCr: 2191.88,
              totalDisbursedCr: 1809.17,
              highRiskProjects: totalHigh,
              paymentAlerts: 5066,
              delayAlerts: 1866,
              duplicateAlerts: 128,
              costAnomalies: 54,
              vendorAlerts: 25,
            },
            riskDistribution: [
              { name: "Critical", value: 14, count: 14, color: "#991b1b" },
              { name: "High", value: Math.max(0, totalHigh - 14), count: Math.max(0, totalHigh - 14), color: "#ea580c" },
              { name: "Low", value: totalLow, count: totalLow, color: "#16a34a" },
              { name: "Medium", value: totalMed, count: totalMed, color: "#f59e0b" },
            ],
            anomalyCategories: [
              { id: "payment", title: "Payment Anomalies", count: 5066, icon: "IndianRupee", color: "#ea580c", bgColor: "rgba(234, 88, 12, 0.08)", borderColor: "rgba(234, 88, 12, 0.2)" },
              { id: "delay", title: "Delay Alerts", count: 1866, icon: "Clock", color: "#dc2626", bgColor: "rgba(220, 38, 38, 0.08)", borderColor: "rgba(220, 38, 38, 0.2)" },
              { id: "duplicate", title: "Potential Duplicates", count: 128, icon: "Copy", color: "#d97706", bgColor: "rgba(217, 119, 6, 0.08)", borderColor: "rgba(217, 119, 6, 0.2)" },
              { id: "cost", title: "Cost Anomalies", count: 54, icon: "TrendingUp", color: "#9333ea", bgColor: "rgba(147, 51, 234, 0.08)", borderColor: "rgba(147, 51, 234, 0.2)" },
              { id: "vendor", title: "Vendor Alerts", count: 25, icon: "Building2", color: "#2563eb", bgColor: "rgba(37, 99, 235, 0.08)", borderColor: "rgba(37, 99, 235, 0.2)" },
            ],
            stateMonitoring: BENCHMARK_STATE_MONITORING,
            projects: formattedProjects,
          });
        }
      } catch (err) {
        console.error("Live fetch error, fallback to benchmark:", err);
        setError("Live Supabase connection issue. Showing cached benchmark data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSupabaseData();
    return () => {
      isMounted = false;
    };
  }, [dataSource]);

  // Active dataset selector with dynamic extra evaluated metrics
  const baseMetrics = dataSource === "live" && liveData.metrics ? liveData.metrics : BENCHMARK_METRICS;
  const activeMetrics = useMemo(() => ({
    totalProjects: (baseMetrics.totalProjects || 96710) + extraMetrics.addedCount,
    sanctionedProjects: (baseMetrics.sanctionedProjects || 96710) + extraMetrics.addedCount,
    sanctionedAmountCr: Number(((baseMetrics.sanctionedAmountCr || 2191.88) + extraMetrics.addedSanctionCr).toFixed(2)),
    totalDisbursedCr: Number(((baseMetrics.totalDisbursedCr || 1809.17) + extraMetrics.addedSpentCr).toFixed(2)),
    highRiskProjects: (baseMetrics.highRiskProjects || 372) + extraMetrics.addedHighRisk,
    paymentAlerts: (baseMetrics.paymentAlerts || 5066) + extraMetrics.addedPaymentAlerts,
    delayAlerts: (baseMetrics.delayAlerts || 1866) + extraMetrics.addedDelayAlerts,
    duplicateAlerts: (baseMetrics.duplicateAlerts || 128) + extraMetrics.addedDuplicates,
    costAnomalies: (baseMetrics.costAnomalies || 54) + extraMetrics.addedCostAnomalies,
    vendorAlerts: (baseMetrics.vendorAlerts || 25) + extraMetrics.addedVendorAlerts,
  }), [baseMetrics, extraMetrics]);

  const baseRiskDist = dataSource === "live" && liveData.riskDistribution.length > 0 ? liveData.riskDistribution : BENCHMARK_RISK_DISTRIBUTION;
  const activeRiskDist = useMemo(() => {
    if (extraMetrics.addedCount === 0) return baseRiskDist;
    return baseRiskDist.map((item) => {
      let extra = 0;
      if (item.name === "High") extra = extraMetrics.addedHighRisk;
      else if (item.name === "Medium") extra = Math.max(0, extraMetrics.addedCount - extraMetrics.addedHighRisk);
      return { ...item, value: item.value + extra, count: item.count + extra };
    });
  }, [baseRiskDist, extraMetrics]);

  const baseAnomalies = dataSource === "live" && liveData.anomalyCategories.length > 0 ? liveData.anomalyCategories : BENCHMARK_ANOMALY_CATEGORIES;
  const activeAnomalies = useMemo(() => {
    if (extraMetrics.addedCount === 0) return baseAnomalies;
    return baseAnomalies.map((cat) => {
      let extra = 0;
      if (cat.id === "payment") extra = extraMetrics.addedPaymentAlerts;
      else if (cat.id === "delay") extra = extraMetrics.addedDelayAlerts;
      else if (cat.id === "duplicate") extra = extraMetrics.addedDuplicates;
      else if (cat.id === "cost") extra = extraMetrics.addedCostAnomalies;
      else if (cat.id === "vendor") extra = extraMetrics.addedVendorAlerts;
      return { ...cat, count: cat.count + extra };
    });
  }, [baseAnomalies, extraMetrics]);

  const baseProjects = dataSource === "live" && liveData.projects.length > 0 ? liveData.projects : BENCHMARK_PROJECTS;
  const rawProjects = useMemo(() => [...customProjects, ...baseProjects], [customProjects, baseProjects]);
  const activeStates = dataSource === "live" && liveData.stateMonitoring.length > 0 ? liveData.stateMonitoring : BENCHMARK_STATE_MONITORING;

  // Filter projects based on user interactions
  const displayedProjects = useMemo(() => {
    return rawProjects.filter((proj) => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          (proj.work_id && proj.work_id.toLowerCase().includes(q)) ||
          (proj.state && proj.state.toLowerCase().includes(q)) ||
          (proj.mp_name && proj.mp_name.toLowerCase().includes(q)) ||
          (proj.ida && proj.ida.toLowerCase().includes(q)) ||
          (proj.primary_alert && proj.primary_alert.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Risk Level Filter from Pie Chart
      if (activeRiskLevel) {
        const s = (proj.status || "").toLowerCase();
        if (activeRiskLevel.toLowerCase() === "high" && !s.includes("high") && !s.includes("crit")) return false;
        if (activeRiskLevel.toLowerCase() === "medium" && !s.includes("med")) return false;
        if (activeRiskLevel.toLowerCase() === "low" && !s.includes("low")) return false;
      }

      // Category Filter from Anomaly Overview
      if (activeCategory) {
        const alert = (proj.primary_alert || "").toLowerCase();
        if (activeCategory === "payment" && !alert.includes("payment") && !alert.includes("disburs") && !alert.includes("lump-sum")) return false;
        if (activeCategory === "delay" && !alert.includes("delay") && !alert.includes("days")) return false;
        if (activeCategory === "duplicate" && !alert.includes("duplicate") && !alert.includes("overlap")) return false;
        if (activeCategory === "cost" && !alert.includes("cost") && !alert.includes("sanction")) return false;
      }

      // State Filter from State Monitoring
      if (activeState && proj.state !== activeState) {
        return false;
      }

      // Metric Card Filter
      if (activeFilter === "high_risk") {
        if (!String(proj.status || "").toLowerCase().includes("high") && !String(proj.status || "").toLowerCase().includes("crit")) return false;
      } else if (activeFilter === "payment_alerts") {
        const alert = (proj.primary_alert || "").toLowerCase();
        if (!alert.includes("payment") && !alert.includes("utilization") && !alert.includes("lump-sum") && !alert.includes("exceeds")) return false;
      } else if (activeFilter === "delay_alerts") {
        const alert = (proj.primary_alert || "").toLowerCase();
        if (!alert.includes("delay") && !alert.includes("days")) return false;
      } else if (activeFilter === "duplicate_alerts") {
        const alert = (proj.primary_alert || "").toLowerCase();
        if (!alert.includes("duplicate") && !alert.includes("overlap") && !alert.includes("consecutive")) return false;
      }

      return true;
    });
  }, [rawProjects, searchTerm, activeRiskLevel, activeCategory, activeState, activeFilter]);

  // Export Full Summary Report
  const handleExportData = () => {
    const csvRows = [
      ["Metric", "Value"],
      ["Total Projects", activeMetrics.totalProjects],
      ["Sanctioned Projects", activeMetrics.sanctionedProjects],
      ["Sanctioned Amount (Cr)", activeMetrics.sanctionedAmountCr],
      ["Total Disbursed (Cr)", activeMetrics.totalDisbursedCr],
      ["High-Risk Projects", activeMetrics.highRiskProjects],
      ["Payment Alerts", activeMetrics.paymentAlerts],
      ["Delay Alerts", activeMetrics.delayAlerts],
      ["Duplicate Alerts", activeMetrics.duplicateAlerts],
      [],
      ["Work ID", "State", "IDA", "MP Name", "Amount", "Risk Score", "Status", "Primary Alert"],
      ...rawProjects.map((p) => [
        `"${p.work_id}"`,
        `"${p.state}"`,
        `"${p.ida}"`,
        `"${p.mp_name}"`,
        `"${p.amount_formatted}"`,
        p.risk_score,
        `"${p.status}"`,
        `"${(p.primary_alert || "").replace(/"/g, '""')}"`
      ])
    ];

    const csvString = csvRows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mplads_risk_overview_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="mplads-dashboard-root">
      {/* Top Header */}
      <Header
        totalProjects={activeMetrics.sanctionedProjects || activeMetrics.totalProjects}
        dataSource={dataSource}
        onToggleSource={(src) => setDataSource(src)}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenFullQueue={() => setIsFullQueueOpen(true)}
        onExportData={handleExportData}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
      />

      {uploadSuccessAlert && (
        <div className="dashboard-banner success">
          <span className="success-banner-text">✨ {uploadSuccessAlert}</span>
          <button className="banner-close-btn" onClick={() => setUploadSuccessAlert(null)}>Dismiss</button>
        </div>
      )}

      {error && (
        <div className="dashboard-banner warning">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <main className="dashboard-content">
        {/* Row 1: Top 8 KPI Metric Cards */}
        <MetricCards
          metrics={activeMetrics}
          onFilterCardClick={(cardId) => {
            if (cardId === "high_risk") {
              setIsHighRiskModalOpen(true);
            } else {
              setActiveFilter((prev) => (prev === cardId ? "all" : cardId));
            }
          }}
          activeFilter={activeFilter}
        />

        {/* Row 2: Two Columns: Risk Distribution (Donut) & Anomaly Overview */}
        <section className="dashboard-grid-2col" aria-label="Risk and Anomaly Distribution">
          <RiskDistributionChart
            data={activeRiskDist}
            onSelectRiskLevel={(lvl) => {
              if (lvl === "High" || lvl === "Critical") {
                setIsHighRiskModalOpen(true);
              } else {
                setActiveRiskLevel((prev) => (prev === lvl ? null : lvl));
              }
            }}
            activeRiskLevel={activeRiskLevel}
          />
          <AnomalyOverview
            categories={activeAnomalies}
            onSelectCategory={(catId) => setActiveCategory((prev) => (prev === catId ? null : catId))}
            activeCategory={activeCategory}
          />
        </section>

        {/* Row 3: State-wise Monitoring (Horizontal Dual Bar Chart) */}
        <StateMonitoringChart
          data={activeStates}
          onSelectState={(st) => setActiveState((prev) => (prev === st ? null : st))}
          activeState={activeState}
        />

        {/* Row 4: Unspent Fund Surplus & Welfare Reallocation Engine */}
        <SurplusWelfareSection 
          onSelectConstituency={(c) => setSelectedWelfareConstituency(c)} 
        />

        {/* Row 5: Top Projects Requiring Attention Table */}
        <TopProjectsTable
          projects={displayedProjects}
          onSelectProject={(proj) => setSelectedProject(proj)}
          onViewFullQueue={() => setIsFullQueueOpen(true)}
        />
      </main>

      {/* CSV Upload & ML Evaluation Modal */}
      {isUploadModalOpen && (
        <CSVUploadModal
          existingProjects={rawProjects}
          onClose={() => setIsUploadModalOpen(false)}
          onAddProjectsToDashboard={handleAddProjectsToDashboard}
        />
      )}

      {/* High-Risk Projects Command Center Modal */}
      {isHighRiskModalOpen && (
        <HighRiskProjectsModal
          projects={rawProjects}
          onClose={() => setIsHighRiskModalOpen(false)}
          onSelectProject={(proj) => {
            setSelectedProject(proj);
          }}
        />
      )}

      {/* Project Risk Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* Welfare Reallocation Proposal Modal */}
      {selectedWelfareConstituency && (
        <WelfareProposalModal
          constituencyData={selectedWelfareConstituency}
          onClose={() => setSelectedWelfareConstituency(null)}
        />
      )}

      {/* Full Queue Searchable Modal */}
      {isFullQueueOpen && (
        <FullQueueModal
          projects={rawProjects}
          onClose={() => setIsFullQueueOpen(false)}
          onSelectProject={(proj) => {
            setSelectedProject(proj);
          }}
        />
      )}
    </div>
  );
}
