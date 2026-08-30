import React, { useState } from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

export default function RiskDistributionChart({ data = [], onSelectRiskLevel, activeRiskLevel }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Fallback defaults matching reference design
  const chartData = data.length > 0 ? data : [
    { name: "Critical", value: 0, count: 0, color: "#991b1b" },
    { name: "High", value: 1, count: 1, color: "#ea580c" },
    { name: "Low", value: 248, count: 248, color: "#16a34a" },
    { name: "Medium", value: 23, count: 23, color: "#f59e0b" },
  ];

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  // Custom customized label for slices with offset line/text
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
    if (value === 0 && total > 50) return null; // hide 0 on pie when dominant
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // If dominant (like 248 Low), show inside slice
    if (value > 100) {
      return (
        <text 
          x={x - 20} 
          y={y} 
          fill="#166534" 
          textAnchor="middle" 
          dominantBaseline="central"
          style={{ fontSize: "14px", fontWeight: "700", fontFamily: "Inter, sans-serif" }}
        >
          {value}
        </text>
      );
    }

    // Outer callout for medium/high
    const sx = cx + (outerRadius + 8) * Math.cos(-midAngle * RADIAN);
    const sy = cy + (outerRadius + 8) * Math.sin(-midAngle * RADIAN);
    const color = name === "Medium" ? "#d97706" : name === "High" ? "#dc2626" : "#991b1b";

    return (
      <text 
        x={sx + (sx > cx ? 12 : -12)} 
        y={sy} 
        fill={color} 
        textAnchor={sx > cx ? "start" : "end"} 
        dominantBaseline="central"
        style={{ fontSize: "13px", fontWeight: "600", fontFamily: "Inter, sans-serif" }}
      >
        {value}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="chart-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-color-indicator" style={{ backgroundColor: item.color }}></span>
            <span className="tooltip-title">{item.name} Risk</span>
          </div>
          <div className="tooltip-body">
            <p className="tooltip-row">
              <span>Projects:</span>
              <strong>{item.value.toLocaleString()}</strong>
            </p>
            <p className="tooltip-row">
              <span>Share:</span>
              <strong>{pct}%</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-card risk-distribution-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Risk Distribution</h2>
          <p className="card-subtitle">Projects by overall risk level</p>
        </div>
        {activeRiskLevel && (
          <button 
            className="clear-filter-btn" 
            onClick={() => onSelectRiskLevel(null)}
            title="Reset risk filter"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="chart-container pie-chart-wrapper">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={95}
              innerRadius={0}
              dataKey="value"
              animationBegin={100}
              animationDuration={800}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={(entry) => onSelectRiskLevel && onSelectRiskLevel(entry.name)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => {
                const isSelected = activeRiskLevel === entry.name;
                const isHovered = hoveredIndex === index;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 3 : 1.5}
                    style={{
                      filter: isHovered || isSelected ? "drop-shadow(0px 4px 8px rgba(0,0,0,0.15))" : "none",
                      transform: isHovered ? "scale(1.03)" : "scale(1)",
                      transformOrigin: "center",
                      transition: "all 0.2s ease"
                    }}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend at bottom matching screenshot order: Critical, High, Low, Medium */}
      <div className="chart-legend-row">
        {chartData.map((item) => {
          const isSelected = activeRiskLevel === item.name;
          return (
            <div 
              key={item.name} 
              className={`legend-item ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectRiskLevel && onSelectRiskLevel(item.name)}
              role="button"
              tabIndex={0}
            >
              <span className="legend-box" style={{ backgroundColor: item.color }}></span>
              <span className="legend-text">{item.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
