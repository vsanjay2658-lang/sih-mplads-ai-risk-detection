import pandas as pd
import numpy as np

from pathlib import Path

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "MPLADS_ML_FEATURES.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "MPLADS_ANOMALY_RESULTS.csv"
)


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    print("=" * 60)
    print("LOADING ML FEATURES")
    print("=" * 60)

    df = pd.read_csv(
        INPUT_FILE,
        low_memory=False
    )

    print(f"Projects: {len(df):,}")
    print(f"Features: {len(df.columns)}")

    return df


# ============================================================
# SELECT ML FEATURES
# ============================================================

def select_features(df):

    print("\nSelecting anomaly detection features...")

    features = [

        # Financial
        "sanction_to_recommended_ratio",
        "expenditure_to_sanction_ratio",
        "final_to_recommended_ratio",
        "expenditure_to_recommended_ratio",

        # Time
        "recommendation_to_sanction_days",
        "sanction_to_completion_days",
        "total_project_duration_days",
        "expenditure_duration_days",

        # Payments
        "payment_count",
        "average_payment_amount",
        "payment_success_rate",

        # Vendors
        "vendor_count",
        "payments_per_vendor",

        # Peer comparison
        "cost_vs_category_median",
        "cost_vs_state_median",

        # MP-level
        "recommended_amount",
        "sanction_amount",
        "total_expenditure",
        "final_amount"
    ]

    available = [
        column
        for column in features
        if column in df.columns
    ]

    print("\nFeatures used:")

    for feature in available:
        print("  ✓", feature)

    return available


# ============================================================
# PREPARE DATA
# ============================================================

def prepare_features(df, features):

    X = df[features].copy()

    # Replace infinite values
    X = X.replace(
        [np.inf, -np.inf],
        np.nan
    )

    # Median imputation
    for column in X.columns:

        median = X[column].median()

        X[column] = X[column].fillna(
            median
        )

    # Scale features
    scaler = StandardScaler()

    X_scaled = scaler.fit_transform(X)

    return X_scaled


# ============================================================
# ISOLATION FOREST
# ============================================================

def run_isolation_forest(
    df,
    X
):

    print("\n" + "=" * 60)
    print("RUNNING ISOLATION FOREST")
    print("=" * 60)

    model = IsolationForest(

        n_estimators=200,

        contamination=0.05,

        random_state=42,

        n_jobs=-1

    )

    predictions = model.fit_predict(X)

    anomaly_score = model.decision_function(X)

    df["ml_anomaly"] = (
        predictions == -1
    ).astype(int)

    # Convert score so larger = more anomalous
    df["ml_anomaly_score"] = (
        -anomaly_score
    )

    print(
        "ML anomalies:",
        df["ml_anomaly"].sum()
    )

    return df


# ============================================================
# RULE-BASED RISK
# ============================================================

def calculate_rule_score(df):

    print("\nCalculating rule-based risk...")

    score = np.zeros(
        len(df)
    )

    # --------------------------------------------------------
    # Expenditure exceeds sanction
    # --------------------------------------------------------

    if "expenditure_exceeds_sanction" in df:

        score += np.where(
            df["expenditure_exceeds_sanction"] == 1,
            30,
            0
        )

    # --------------------------------------------------------
    # Large sanction increase
    # --------------------------------------------------------

    if "large_sanction_increase" in df:

        score += np.where(
            df["large_sanction_increase"] == 1,
            20,
            0
        )

    # --------------------------------------------------------
    # Large final cost increase
    # --------------------------------------------------------

    if "large_final_cost_increase" in df:

        score += np.where(
            df["large_final_cost_increase"] == 1,
            20,
            0
        )

    # --------------------------------------------------------
    # Long project
    # --------------------------------------------------------

    if "long_project_flag" in df:

        score += np.where(
            df["long_project_flag"] == 1,
            10,
            0
        )

    # --------------------------------------------------------
    # Many payments
    # --------------------------------------------------------

    if "high_payment_count" in df:

        score += np.where(
            df["high_payment_count"] == 1,
            10,
            0
        )

    # --------------------------------------------------------
    # Multiple vendors
    # --------------------------------------------------------

    if "high_vendor_count" in df:

        score += np.where(
            df["high_vendor_count"] == 1,
            10,
            0
        )

    # Cap at 100
    df["rule_risk_score"] = np.minimum(
        score,
        100
    )

    return df


# ============================================================
# ML RISK SCORE
# ============================================================

def calculate_ml_risk(df):

    print("\nCalculating ML risk score...")

    score = df["ml_anomaly_score"]

    min_score = score.min()
    max_score = score.max()

    if max_score > min_score:

        df["ml_risk_score"] = (
            (score - min_score)
            /
            (max_score - min_score)
        ) * 100

    else:

        df["ml_risk_score"] = 0

    return df


# ============================================================
# COMBINED RISK
# ============================================================

def calculate_combined_risk(df):

    print("\nCalculating combined risk...")

    # 60% rule-based
    # 40% ML

    df["risk_score"] = (

        df["rule_risk_score"] * 0.60

        +

        df["ml_risk_score"] * 0.40

    )

    df["risk_score"] = (
        df["risk_score"]
        .clip(0, 100)
        .round(2)
    )

    # --------------------------------------------------------
    # Risk level
    # --------------------------------------------------------

    df["risk_level"] = pd.cut(

        df["risk_score"],

        bins=[
            -1,
            30,
            60,
            80,
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
# EXPLANATION
# ============================================================

def generate_explanations(df):

    print("\nGenerating risk explanations...")

    explanations = []

    for _, row in df.iterrows():

        reasons = []

        if row.get(
            "expenditure_exceeds_sanction",
            0
        ) == 1:

            reasons.append(
                "Expenditure exceeds sanctioned amount"
            )

        if row.get(
            "large_sanction_increase",
            0
        ) == 1:

            reasons.append(
                "Large increase from recommended to sanctioned amount"
            )

        if row.get(
            "large_final_cost_increase",
            0
        ) == 1:

            reasons.append(
                "Final cost significantly exceeds recommendation"
            )

        if row.get(
            "long_project_flag",
            0
        ) == 1:

            reasons.append(
                "Project duration exceeds one year"
            )

        if row.get(
            "high_payment_count",
            0
        ) == 1:

            reasons.append(
                "Unusually high number of payments"
            )

        if row.get(
            "high_vendor_count",
            0
        ) == 1:

            reasons.append(
                "Multiple vendors detected"
            )

        if row.get(
            "ml_anomaly",
            0
        ) == 1:

            reasons.append(
                "ML model detected an unusual pattern"
            )

        if not reasons:

            reasons.append(
                "No major anomaly indicators detected"
            )

        explanations.append(
            " | ".join(reasons)
        )

    df["risk_explanation"] = explanations

    return df


# ============================================================
# SAVE
# ============================================================

def save_results(df):

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\n" + "=" * 60)
    print("ANOMALY RESULTS SAVED")
    print("=" * 60)

    print(
        f"File: {OUTPUT_FILE}"
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


# ============================================================
# MAIN
# ============================================================

def main():

    df = load_data()

    features = select_features(
        df
    )

    X = prepare_features(
        df,
        features
    )

    df = run_isolation_forest(
        df,
        X
    )

    df = calculate_rule_score(
        df
    )

    df = calculate_ml_risk(
        df
    )

    df = calculate_combined_risk(
        df
    )

    df = generate_explanations(
        df
    )

    save_results(
        df
    )


if __name__ == "__main__":

    main()