import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function StateMonitoringChart({ data = [], onSelectState, activeState }) {
  // Format numbers on axis (e.g. 5000 -> 5k)
  const formatXAxis = (val) => {
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val;
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-title">{label}</span>
          </div>
          <div className="tooltip-body">
            {payload.map((entry, index) => (
              <p key={`item-${index}`} className="tooltip-row">
                <span style={{ color: entry.color, fontWeight: "600" }}>{entry.name}:</span>
                <strong>{entry.value.toLocaleString()} works</strong>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-card state-monitoring-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">State-wise Monitoring</h2>
          <p className="card-subtitle">Top 10 states by monitored project and high-risk count</p>
        </div>
        {activeState && (
          <button 
            className="clear-filter-btn"
            onClick={() => onSelectState(null)}
            title="Clear state filter"
          >
            Clear Filter ({activeState})
          </button>
        )}
      </div>

      <div className="chart-container horizontal-bar-wrapper">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 30, left: 100, bottom: 5 }}
            barCategoryGap={8}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis 
              type="number" 
              tickFormatter={formatXAxis}
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis 
              dataKey="state" 
              type="category" 
              stroke="#64748b"
              tick={{ fill: "#1e293b", fontSize: 11.5, fontWeight: 500 }}
              width={95}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="highRisk" 
              name="High-Risk" 
              fill="#dc2626" 
              radius={[0, 3, 3, 0]} 
              barSize={8}
              onClick={(entry) => onSelectState && onSelectState(entry.state)}
              cursor="pointer"
            />
            <Bar 
              dataKey="total" 
              name="Total Projects" 
              fill="#0f172a" 
              radius={[0, 3, 3, 0]} 
              barSize={8}
              onClick={(entry) => onSelectState && onSelectState(entry.state)}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend below matching screenshot */}
      <div className="chart-legend-row bar-legend">
        <div className="legend-item">
          <span className="legend-box" style={{ backgroundColor: "#dc2626" }}></span>
          <span className="legend-text">High-Risk</span>
        </div>
        <div className="legend-item">
          <span className="legend-box" style={{ backgroundColor: "#0f172a" }}></span>
          <span className="legend-text">Total Projects</span>
        </div>
      </div>
    </div>
  );
}
