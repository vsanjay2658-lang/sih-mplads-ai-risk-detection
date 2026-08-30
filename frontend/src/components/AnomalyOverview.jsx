import React from "react";
import { 
  IndianRupee, 
  Clock, 
  Copy, 
  TrendingUp, 
  Building2 
} from "lucide-react";

export default function AnomalyOverview({ categories = [], onSelectCategory, activeCategory }) {
  const iconMap = {
    IndianRupee: IndianRupee,
    Clock: Clock,
    Copy: Copy,
    TrendingUp: TrendingUp,
    Building2: Building2,
  };

  return (
    <div className="dashboard-card anomaly-overview-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Anomaly Overview</h2>
          <p className="card-subtitle">Detected anomalies by category</p>
        </div>
        {activeCategory && (
          <button 
            className="clear-filter-btn"
            onClick={() => onSelectCategory(null)}
            title="Clear category filter"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="anomaly-list">
        {categories.map((item) => {
          const IconComponent = iconMap[item.icon] || IndianRupee;
          const isSelected = activeCategory === item.id;

          return (
            <div
              key={item.id}
              className={`anomaly-item-row ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectCategory && onSelectCategory(item.id)}
              role="button"
              tabIndex={0}
              title={item.description}
            >
              <div className="anomaly-item-left">
                <div 
                  className="anomaly-icon-pill"
                  style={{ 
                    color: item.color, 
                    backgroundColor: item.bgColor,
                    borderColor: item.borderColor 
                  }}
                >
                  <IconComponent size={16} />
                </div>
                <span className="anomaly-item-title">{item.title}</span>
              </div>

              <div className="anomaly-item-right">
                <span className="anomaly-item-count" style={{ color: item.count > 0 ? item.color : "#94a3b8" }}>
                  {item.count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
