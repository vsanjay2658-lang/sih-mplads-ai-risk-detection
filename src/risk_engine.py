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
    / "MPLADS_ANOMALY_RESULTS_V2.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "MPLADS_RISK_RESULTS.csv"
)


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    print("=" * 70)
    print("MPLADS RISK ENGINE")
    print("=" * 70)

    df = pd.read_csv(
        INPUT_FILE,
        low_memory=False
    )

    print(f"Projects : {len(df):,}")
    print(f"Features : {len(df.columns)}")

    return df


# ============================================================
# FINANCIAL EVIDENCE
# ============================================================

def financial_evidence(row):

    reasons = []
    score = 0

    expenditure_ratio = row.get(
        "expenditure_to_sanction_ratio",
        np.nan
    )

    sanction_ratio = row.get(
        "sanction_to_recommended_ratio",
        np.nan
    )

    final_ratio = row.get(
        "final_to_recommended_ratio",
        np.nan
    )

    # --------------------------------------------------------
    # Expenditure exceeds sanction
    # --------------------------------------------------------

    if pd.notna(expenditure_ratio):

        if expenditure_ratio > 1.20:

            score += 25

            reasons.append(
                f"Expenditure is "
                f"{expenditure_ratio * 100:.1f}% "
                "of sanctioned amount"
            )

        elif expenditure_ratio > 1.05:

            score += 15

            reasons.append(
                f"Expenditure is "
                f"{expenditure_ratio * 100:.1f}% "
                "of sanctioned amount"
            )

    # --------------------------------------------------------
    # Sanction significantly exceeds recommendation
    # --------------------------------------------------------

    if pd.notna(sanction_ratio):

        if sanction_ratio > 1.50:

            score += 20

            reasons.append(
                "Sanction amount exceeds "
                "recommendation by more than 50%"
            )

        elif sanction_ratio > 1.30:

            score += 10

            reasons.append(
                "Sanction amount exceeds "
                "recommendation by more than 30%"
            )

    # --------------------------------------------------------
    # Final amount significantly exceeds recommendation
    # --------------------------------------------------------

    if pd.notna(final_ratio):

        if final_ratio > 1.50:

            score += 20

            reasons.append(
                "Final amount exceeds "
                "recommendation by more than 50%"
            )

        elif final_ratio > 1.30:

            score += 10

            reasons.append(
                "Final amount exceeds "
                "recommendation by more than 30%"
            )

    return min(score, 25), reasons


# ============================================================
# PAYMENT EVIDENCE
# ============================================================

def payment_evidence(row):

    score = 0
    reasons = []

    payment_count = row.get(
        "payment_count",
        np.nan
    )

    percentile = row.get(
        "payment_count_percentile",
        np.nan
    )

    # --------------------------------------------------------
    # Extreme payment count
    # --------------------------------------------------------

    if pd.notna(percentile):

        if percentile >= 0.995:

            score += 20

            reasons.append(
                "Payment count is in the "
                "top 0.5% of projects"
            )

        elif percentile >= 0.98:

            score += 14

            reasons.append(
                "Payment count is unusually high"
            )

        elif percentile >= 0.95:

            score += 8

            reasons.append(
                "Payment count is above normal range"
            )

    # Explicit count
    if pd.notna(payment_count):

        if payment_count >= 50:

            score = max(score, 20)

            reasons.append(
                f"{int(payment_count)} payments recorded"
            )

        elif payment_count >= 20:

            score = max(score, 12)

            reasons.append(
                f"{int(payment_count)} payments recorded"
            )

    return min(score, 20), reasons


# ============================================================
# VENDOR EVIDENCE
# ============================================================

def vendor_evidence(row):

    score = 0
    reasons = []

    vendor_count = row.get(
        "vendor_count",
        np.nan
    )

    percentile = row.get(
        "vendor_count_percentile",
        np.nan
    )

    if pd.notna(percentile):

        if percentile >= 0.995:

            score += 15

            reasons.append(
                "Vendor count is in the "
                "top 0.5% of projects"
            )

        elif percentile >= 0.98:

            score += 10

            reasons.append(
                "Vendor count is unusually high"
            )

        elif percentile >= 0.95:

            score += 6

            reasons.append(
                "Vendor count is above normal range"
            )

    if pd.notna(vendor_count):

        if vendor_count >= 20:

            score = max(score, 15)

            reasons.append(
                f"{int(vendor_count)} vendors recorded"
            )

        elif vendor_count >= 10:

            score = max(score, 10)

            reasons.append(
                f"{int(vendor_count)} vendors recorded"
            )

    return min(score, 15), reasons


# ============================================================
# DELAY EVIDENCE
# ============================================================

def delay_evidence(row):

    score = 0
    reasons = []

    duration = row.get(
        "total_project_duration_days",
        np.nan
    )

    percentile = row.get(
        "total_project_duration_days_percentile",
        np.nan
    )

    # --------------------------------------------------------
    # Extreme duration
    # --------------------------------------------------------

    if pd.notna(percentile):

        if percentile >= 0.99:

            score += 15

            reasons.append(
                "Project duration is in the "
                "top 1% of projects"
            )

        elif percentile >= 0.95:

            score += 10

            reasons.append(
                "Project duration is unusually long"
            )

        elif percentile >= 0.90:

            score += 5

            reasons.append(
                "Project duration is above normal"
            )

    if pd.notna(duration):

        if duration >= 700:

            score = max(score, 15)

            reasons.append(
                f"Project duration is "
                f"{int(duration)} days"
            )

        elif duration >= 500:

            score = max(score, 10)

            reasons.append(
                f"Project duration is "
                f"{int(duration)} days"
            )

    return min(score, 15), reasons


# ============================================================
# PEER EVIDENCE
# ============================================================

def peer_evidence(row):

    score = 0
    reasons = []

    # --------------------------------------------------------
    # State comparison
    # --------------------------------------------------------

    state_ratio = row.get(
        "recommended_amount_vs_state_median",
        np.nan
    )

    if pd.notna(state_ratio):

        if state_ratio >= 4:

            score += 10

            reasons.append(
                "Project cost is more than "
                "4× state median"
            )

        elif state_ratio >= 3:

            score += 7

            reasons.append(
                "Project cost is more than "
                "3× state median"
            )

        elif state_ratio >= 2:

            score += 4

            reasons.append(
                "Project cost is more than "
                "2× state median"
            )

    # --------------------------------------------------------
    # MP comparison
    # --------------------------------------------------------

    mp_ratio = row.get(
        "recommended_amount_vs_mp_median",
        np.nan
    )

    if pd.notna(mp_ratio):

        if mp_ratio >= 4:

            score += 5

            reasons.append(
                "Project cost is substantially "
                "above MP-level median"
            )

        elif mp_ratio >= 3:

            score += 3

            reasons.append(
                "Project cost is above "
                "MP-level median"
            )

    return min(score, 10), reasons


# ============================================================
# ML EVIDENCE
# ============================================================

def ml_evidence(row):

    score = 0
    reasons = []

    ml_anomaly = row.get(
        "ml_anomaly",
        0
    )

    ml_risk = row.get(
        "ml_risk",
        0
    )

    if ml_anomaly == 1:

        if ml_risk >= 12:

            score = 15

            reasons.append(
                "ML detected a strong unusual "
                "combination of characteristics"
            )

        elif ml_risk >= 8:

            score = 10

            reasons.append(
                "ML detected an unusual "
                "combination of characteristics"
            )

        else:

            score = 6

            reasons.append(
                "ML detected an unusual pattern"
            )

    return min(score, 15), reasons


# ============================================================
# PROCESS EACH PROJECT
# ============================================================

def calculate_risk(df):

    print("\nCalculating evidence-based risk...")

    financial_scores = []
    payment_scores = []
    vendor_scores = []
    delay_scores = []
    peer_scores = []
    ml_scores = []

    explanations = []

    for _, row in df.iterrows():

        # Individual evidence
        f_score, f_reasons = financial_evidence(row)
        p_score, p_reasons = payment_evidence(row)
        v_score, v_reasons = vendor_evidence(row)
        d_score, d_reasons = delay_evidence(row)
        peer_score, peer_reasons = peer_evidence(row)
        ml_score, ml_reasons = ml_evidence(row)

        financial_scores.append(f_score)
        payment_scores.append(p_score)
        vendor_scores.append(v_score)
        delay_scores.append(d_score)
        peer_scores.append(peer_score)
        ml_scores.append(ml_score)

        all_reasons = (
            f_reasons
            + p_reasons
            + v_reasons
            + d_reasons
            + peer_reasons
            + ml_reasons
        )

        if not all_reasons:

            all_reasons.append(
                "No major risk indicators detected"
            )

        explanations.append(
            " | ".join(all_reasons)
        )

    df["financial_evidence_score"] = financial_scores
    df["payment_evidence_score"] = payment_scores
    df["vendor_evidence_score"] = vendor_scores
    df["delay_evidence_score"] = delay_scores
    df["peer_evidence_score"] = peer_scores
    df["ml_evidence_score"] = ml_scores

    df["risk_score"] = (

        df["financial_evidence_score"]
        +
        df["payment_evidence_score"]
        +
        df["vendor_evidence_score"]
        +
        df["delay_evidence_score"]
        +
        df["peer_evidence_score"]
        +
        df["ml_evidence_score"]

    )

    df["risk_score"] = (
        df["risk_score"]
        .clip(0, 100)
        .round(2)
    )

    df["risk_explanation"] = explanations

    return df


# ============================================================
# RISK LEVEL
# ============================================================

def assign_risk_level(df):

    print("\nAssigning risk levels...")

    df["risk_level"] = pd.cut(

        df["risk_score"],

        bins=[
            -1,
            25,
            50,
            75,
            100
        ],

        labels=[
            "LOW",
            "MEDIUM",
            "HIGH",
            "CRITICAL"
        ]
    )

    return df


# ============================================================
# RECOMMENDATION
# ============================================================

def generate_recommendations(df):

    print("Generating recommendations...")

    recommendations = []

    for _, row in df.iterrows():

        level = str(
            row["risk_level"]
        )

        reasons = str(
            row["risk_explanation"]
        )

        recommendation = (
            "No immediate action required"
        )

        # ----------------------------------------------------
        # Critical
        # ----------------------------------------------------

        if level == "CRITICAL":

            recommendation = (
                "Priority investigation: verify "
                "financial records, payment history, "
                "vendor details and project execution."
            )

        # ----------------------------------------------------
        # High
        # ----------------------------------------------------

        elif level == "HIGH":

            recommendation = (
                "Review project documentation and "
                "investigate the highlighted anomalies."
            )

        # ----------------------------------------------------
        # Medium
        # ----------------------------------------------------

        elif level == "MEDIUM":

            recommendation = (
                "Monitor project and verify "
                "specific flagged indicators."
            )

        recommendations.append(
            recommendation
        )

    df["recommended_action"] = recommendations

    return df


# ============================================================
# CONFIDENCE
# ============================================================

def calculate_confidence(df):

    print("Calculating confidence...")

    confidence = []

    for _, row in df.iterrows():

        evidence_count = 0

        evidence_columns = [
            "financial_evidence_score",
            "payment_evidence_score",
            "vendor_evidence_score",
            "delay_evidence_score",
            "peer_evidence_score",
            "ml_evidence_score"
        ]

        for column in evidence_columns:

            if row[column] > 0:

                evidence_count += 1

        # More independent evidence sources
        # = greater confidence in flagging

        value = min(
            evidence_count / 6 * 100,
            100
        )

        confidence.append(
            round(value, 1)
        )

    df["evidence_confidence"] = confidence

    return df


# ============================================================
# PRIORITY
# ============================================================

def assign_priority(df):

    priority = []

    for _, row in df.iterrows():

        score = row["risk_score"]

        if score >= 75:

            priority.append(
                "P1 - Immediate Review"
            )

        elif score >= 50:

            priority.append(
                "P2 - High Priority"
            )

        elif score >= 25:

            priority.append(
                "P3 - Monitor"
            )

        else:

            priority.append(
                "P4 - Low Priority"
            )

    df["review_priority"] = priority

    return df


# ============================================================
# SAVE
# ============================================================

def save_results(df):

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\n" + "=" * 70)
    print("RISK ENGINE COMPLETE")
    print("=" * 70)

    print(
        f"Output: {OUTPUT_FILE}"
    )

    print(
        f"Projects: {len(df):,}"
    )

    print("\nRisk distribution:")

    print(
        df["risk_level"]
        .value_counts()
        .sort_index()
    )

    print(
        "\nAverage risk:",
        round(
            df["risk_score"].mean(),
            2
        )
    )

    print(
        "Maximum risk:",
        df["risk_score"].max()
    )


# ============================================================
# MAIN
# ============================================================

def main():

    df = load_data()

    df = calculate_risk(
        df
    )

    df = assign_risk_level(
        df
    )

    df = generate_recommendations(
        df
    )

    df = calculate_confidence(
        df
    )

    df = assign_priority(
        df
    )

    save_results(
        df
    )


if __name__ == "__main__":

    main()