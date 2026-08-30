import React from "react";
import { 
  FolderKanban, 
  CheckSquare, 
  IndianRupee, 
  WalletCards, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Copy 
} from "lucide-react";

export default function MetricCards({ metrics = {}, onFilterCardClick, activeFilter }) {
  const {
    totalProjects = 272,
    sanctionedProjects = 272,
    sanctionedAmountCr = 54.07,
    totalDisbursedCr = 21.22,
    highRiskProjects = 1,
    paymentAlerts = 28,
    delayAlerts = 41,
    duplicateAlerts = 7,
  } = metrics;

  const cards = [
    {
      id: "all",
      label: "TOTAL PROJECTS",
      value: totalProjects.toLocaleString(),
      unit: null,
      icon: FolderKanban,
      variant: "neutral",
      tooltip: "Total registered MPLADS project works",
    },
    {
      id: "sanctioned",
      label: "SANCTIONED",
      value: sanctionedProjects.toLocaleString(),
      unit: null,
      icon: CheckSquare,
      variant: "neutral",
      tooltip: "Projects with official administrative sanction",
    },
    {
      id: "sanctioned_amount",
      label: "SANCTIONED AMOUNT",
      value: `₹${Number(sanctionedAmountCr).toFixed(2)}`,
      unit: "Cr",
      icon: IndianRupee,
      variant: "neutral",
      tooltip: "Total sanctioned fund value in Crores",
    },
    {
      id: "total_disbursed",
      label: "TOTAL DISBURSED",
      value: `₹${Number(totalDisbursedCr).toFixed(2)}`,
      unit: "Cr",
      icon: WalletCards,
      variant: "neutral",
      tooltip: "Total public expenditure disbursed in Crores",
    },
    {
      id: "high_risk",
      label: "HIGH-RISK PROJECTS",
      value: highRiskProjects.toLocaleString(),
      unit: null,
      icon: ShieldAlert,
      variant: "alert-critical",
      tooltip: "Projects classified as high/critical risk requiring audit",
    },
    {
      id: "payment_alerts",
      label: "PAYMENT ALERTS",
      value: paymentAlerts.toLocaleString(),
      unit: null,
      icon: AlertTriangle,
      variant: "alert-warning",
      tooltip: "Payment velocity, lump-sum or over-disbursement alerts",
    },
    {
      id: "delay_alerts",
      label: "DELAY ALERTS",
      value: delayAlerts.toLocaleString(),
      unit: null,
      icon: Clock,
      variant: "alert-delay",
      tooltip: "Execution or sanction delays over 180+ days",
    },
    {
      id: "duplicates",
      label: "DUPLICATES",
      value: duplicateAlerts.toLocaleString(),
      unit: null,
      icon: Copy,
      variant: "alert-duplicate",
      tooltip: "AI detected potential duplicate or overlapping works",
    },
  ];

  return (
    <section className="metric-cards-grid" aria-label="Key Performance Metrics">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const isAlert = card.variant.startsWith("alert");
        const isSelected = activeFilter === card.id;

        return (
          <div
            key={card.id}
            className={`metric-card ${card.variant} ${isSelected ? "selected" : ""}`}
            onClick={() => onFilterCardClick && onFilterCardClick(card.id)}
            title={card.tooltip}
            role="button"
            tabIndex={0}
          >
            <div className="card-top-row">
              <span className="card-label">{card.label}</span>
              <div className={`card-icon-wrapper ${card.variant}`}>
                <IconComponent size={15} />
              </div>
            </div>

            <div className="card-value-container">
              <span className={`card-value ${isAlert ? "alert-text" : ""}`}>
                {card.value}
              </span>
              {card.unit && <span className="card-unit">{card.unit}</span>}
            </div>
          </div>
        );
      })}
    </section>
  );
}
