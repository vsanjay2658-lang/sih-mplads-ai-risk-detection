import pandas as pd
import numpy as np
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "MPLADS_FINAL_RISK_RESULTS.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "MPLADS_FINAL_RISK_EXPLAINABLE.csv"
)


# ============================================================
# HELPERS
# ============================================================

def is_positive(row, column):
    """Safely check whether a numeric indicator is positive."""
    value = row.get(column, 0)

    if pd.isna(value):
        return False

    return value > 0


def format_money(value):
    """Format INR values."""
    if pd.isna(value):
        return None

    return f"₹{value:,.0f}"


# ============================================================
# PRIMARY EVIDENCE
# ============================================================

def determine_primary_evidence(row):

    # --------------------------------------------------------
    # 1. Financial
    # --------------------------------------------------------
    score = row.get("final_risk_score", 0)

    if pd.notna(score) and score < 25:
        return "Routine / No Significant Risk"
    financial_signals = [
        "expenditure_exceeds_sanction",
        "high_cost_deviation",
        "large_sanction_increase",
        "large_final_cost_increase"
    ]

    if any(
        is_positive(row, x)
        for x in financial_signals
    ):
        return "Financial Anomaly"

    # --------------------------------------------------------
    # 2. Payment
    # --------------------------------------------------------

    payment_signals = [
        "high_payment_count",
        "extreme_payment_count"
    ]

    if any(
        is_positive(row, x)
        for x in payment_signals
    ):
        return "Payment Pattern"

    # --------------------------------------------------------
    # 3. Vendor
    # --------------------------------------------------------

    vendor_signals = [
        "multiple_vendor_flag",
        "high_vendor_count",
        "extreme_vendor_count"
    ]

    if any(
        is_positive(row, x)
        for x in vendor_signals
    ):
        return "Vendor Pattern"

    # --------------------------------------------------------
    # 4. Delay
    # --------------------------------------------------------

    delay_signals = [
        "delay_over_180_days",
        "delay_over_365_days",
        "project_over_365_days",
        "long_project",
        "long_project_flag",
        "extreme_project_duration"
    ]

    if any(
        is_positive(row, x)
        for x in delay_signals
    ):
        return "Project Delay"

    # --------------------------------------------------------
    # 5. Peer-relative
    # --------------------------------------------------------

    peer_signals = [
        "cost_vs_state_median",
        "cost_vs_category_median",
        "recommended_amount_vs_state_median",
        "recommended_amount_vs_mp_median"
    ]

    peer_detected = False

    for column in peer_signals:

        value = row.get(column)

        if pd.notna(value):

            # Ratios significantly above 2 indicate
            # unusual peer-relative behavior.
            if value >= 2:

                peer_detected = True
                break

    if peer_detected:
        return "Peer-relative Anomaly"

    # --------------------------------------------------------
    # 6. ML fallback
    # --------------------------------------------------------

    ml_risk = row.get(
        "ml_risk",
        0
    )

    if pd.notna(ml_risk) and ml_risk >= 12:
        return "ML Anomaly"

    


# ============================================================
# SUPPORTING EVIDENCE
# ============================================================

def generate_supporting_evidence(row):

    evidence = []

    # --------------------------------------------------------
    # Financial
    # --------------------------------------------------------

    if is_positive(
        row,
        "expenditure_exceeds_sanction"
    ):

        evidence.append(
            "Expenditure exceeds sanctioned amount"
        )

    if is_positive(
        row,
        "high_cost_deviation"
    ):

        evidence.append(
            "Project cost is unusually high"
        )

    if is_positive(
        row,
        "large_sanction_increase"
    ):

        evidence.append(
            "Large increase from recommendation to sanction"
        )

    if is_positive(
        row,
        "large_final_cost_increase"
    ):

        evidence.append(
            "Final cost increased substantially"
        )

    # --------------------------------------------------------
    # Payment
    # --------------------------------------------------------

    payment_count = row.get(
        "payment_count"
    )

    if pd.notna(payment_count):

        if payment_count >= 20:

            evidence.append(
                f"{payment_count:.0f} payments recorded"
            )

        elif payment_count >= 10:

            evidence.append(
                f"High payment count: {payment_count:.0f}"
            )

    # --------------------------------------------------------
    # Vendor
    # --------------------------------------------------------

    vendor_count = row.get(
        "vendor_count"
    )

    if pd.notna(vendor_count):

        if vendor_count >= 10:

            evidence.append(
                f"{vendor_count:.0f} vendors recorded"
            )

        elif vendor_count >= 5:

            evidence.append(
                f"Multiple vendors: {vendor_count:.0f}"
            )

    # --------------------------------------------------------
    # Delay
    # --------------------------------------------------------

    duration = row.get(
        "total_project_duration_days"
    )

    if pd.notna(duration):

        if duration > 700:

            evidence.append(
                f"Project duration is {duration:.0f} days"
            )

        elif duration > 500:

            evidence.append(
                f"Project duration is {duration:.0f} days"
            )

        elif duration > 365:

            evidence.append(
                f"Project exceeds one year ({duration:.0f} days)"
            )

    # --------------------------------------------------------
    # Peer comparison
    # --------------------------------------------------------

    state_ratio = row.get(
        "cost_vs_state_median"
    )

    if pd.notna(state_ratio):

        if state_ratio >= 4:

            evidence.append(
                "Project cost is more than 4× state median"
            )

        elif state_ratio >= 2:

            evidence.append(
                "Project cost is more than 2× state median"
            )

    mp_ratio = row.get(
        "recommended_amount_vs_mp_median"
    )

    if pd.notna(mp_ratio):

        if mp_ratio >= 2:

            evidence.append(
                "Project cost is substantially above MP-level peers"
            )

    # --------------------------------------------------------
    # ML
    # --------------------------------------------------------

    ml_risk = row.get(
        "ml_risk"
    )

    if pd.notna(ml_risk):

        if ml_risk >= 12:

            evidence.append(
                "ML detected a strong unusual pattern"
            )

        elif ml_risk >= 7:

            evidence.append(
                "ML detected an unusual pattern"
            )

    if not evidence:

        evidence.append(
            "No strong individual anomaly detected"
        )

    return " | ".join(evidence)


# ============================================================
# RECOMMENDATION
# ============================================================

def generate_action(row):

    level = row.get(
        "final_risk_level",
        "LOW"
    )

    primary = row.get(
        "primary_evidence",
        ""
    )

    if level == "CRITICAL":

        return (
            "Immediate review of project records, "
            "payments and supporting documentation"
        )

    if level == "HIGH":

        return (
            f"High-priority review focusing on "
            f"{primary.lower()}"
        )

    if level == "MEDIUM":

        return (
            f"Monitor project and verify "
            f"{primary.lower()} evidence"
        )

    return (
        "No immediate action; continue routine monitoring"
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("MPLADS EXPLAINABILITY ENGINE")
    print("=" * 70)

    # --------------------------------------------------------
    # Load
    # --------------------------------------------------------

    df = pd.read_csv(
        INPUT_FILE,
        low_memory=False
    )

    print(
        f"Projects : {len(df):,}"
    )

    # --------------------------------------------------------
    # Primary evidence
    # --------------------------------------------------------

    print(
        "\nDetermining primary evidence..."
    )

    df["primary_evidence"] = df.apply(
        determine_primary_evidence,
        axis=1
    )

    # --------------------------------------------------------
    # Supporting evidence
    # --------------------------------------------------------

    print(
        "Generating supporting evidence..."
    )

    df["supporting_evidence"] = df.apply(
        generate_supporting_evidence,
        axis=1
    )

    # --------------------------------------------------------
    # Final explanation
    # --------------------------------------------------------

    df["officer_explanation"] = (
        df["primary_evidence"]
        + " | "
        + df["supporting_evidence"]
    )

    # --------------------------------------------------------
    # Recommended action
    # --------------------------------------------------------

    print(
        "Generating recommended actions..."
    )

    df["final_recommended_action"] = df.apply(
        generate_action,
        axis=1
    )

    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print(
        "\n" + "=" * 70
    )

    print(
        "EXPLAINABILITY ENGINE COMPLETE"
    )

    print(
        "=" * 70
    )

    print(
        f"Output: {OUTPUT_FILE}"
    )

    print(
        f"Projects: {len(df):,}"
    )

    # --------------------------------------------------------
    # Distribution
    # --------------------------------------------------------

    print(
        "\nPrimary evidence distribution:"
    )

    print(
        df[
            "primary_evidence"
        ].value_counts()
    )

    # --------------------------------------------------------
    # Risk + evidence
    # --------------------------------------------------------

    print(
        "\nRisk + primary evidence:"
    )

    print(
        pd.crosstab(
            df["final_risk_level"],
            df["primary_evidence"]
        )
    )

    # --------------------------------------------------------
    # High/Critical examples
    # --------------------------------------------------------

    print(
        "\nHigh/Critical examples:"
    )

    columns = [
        "work_id",
        "final_risk_score",
        "final_risk_level",
        "primary_evidence",
        "supporting_evidence",
        "final_recommended_action"
    ]

    columns = [
        c
        for c in columns
        if c in df.columns
    ]

    print(
        df[
            df["final_risk_level"]
            .isin(["HIGH", "CRITICAL"])
        ][columns]
        .head(20)
        .to_string(index=False)
    )


if __name__ == "__main__":
    main()