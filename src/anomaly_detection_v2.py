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
    / "MPLADS_PEER_FEATURES.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "MPLADS_ANOMALY_RESULTS_V2.csv"
)


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    print("=" * 70)
    print("MPLADS ANOMALY DETECTION V2")
    print("=" * 70)

    df = pd.read_csv(
        INPUT_FILE,
        low_memory=False
    )

    print(f"Projects : {len(df):,}")
    print(f"Features : {len(df.columns)}")

    return df


# ============================================================
# HELPER
# ============================================================

def percentile_score(
    series,
    low=0.90,
    high=0.99
):
    """
    Converts a numerical feature into a 0-100
    anomaly score based on percentile.

    Below 90th percentile -> low risk
    90-99th -> increasing risk
    99th+ -> very high risk
    """

    result = pd.Series(
        0.0,
        index=series.index
    )

    valid = series.dropna()

    if len(valid) == 0:
        return result

    p_low = valid.quantile(low)
    p_high = valid.quantile(high)

    if p_high <= p_low:
        return result

    result = (
        (series - p_low)
        /
        (p_high - p_low)
        *
        100
    )

    result = result.clip(
        0,
        100
    )

    return result.fillna(0)


# ============================================================
# FINANCIAL RISK
# ============================================================

def calculate_financial_risk(df):

    print("\nCalculating financial risk...")

    score = pd.Series(
        0.0,
        index=df.index
    )

    # --------------------------------------------------------
    # Expenditure vs sanction
    # --------------------------------------------------------

    if "expenditure_to_sanction_ratio" in df.columns:

        ratio = df[
            "expenditure_to_sanction_ratio"
        ]

        # No penalty for normal <= 100%
        overrun = (
            (ratio - 1)
            .clip(lower=0)
        )

        score += (
            overrun
            .clip(0, 1)
            * 25
        )

    # --------------------------------------------------------
    # Recommendation → sanction increase
    # --------------------------------------------------------

    if "sanction_to_recommended_ratio" in df.columns:

        ratio = df[
            "sanction_to_recommended_ratio"
        ]

        increase = (
            ratio - 1
        ).clip(
            lower=0
        )

        score += (
            increase
            .clip(0, 1)
            * 20
        )

    # --------------------------------------------------------
    # Final → recommendation increase
    # --------------------------------------------------------

    if "final_to_recommended_ratio" in df.columns:

        ratio = df[
            "final_to_recommended_ratio"
        ]

        increase = (
            ratio - 1
        ).clip(
            lower=0
        )

        score += (
            increase
            .clip(0, 1)
            * 20
        )

    # --------------------------------------------------------
    # Peer-relative cost
    # --------------------------------------------------------

    peer_columns = [
        "cost_vs_state_median",
        "cost_vs_category_median"
    ]

    peer_scores = []

    for column in peer_columns:

        if column in df.columns:

            peer_scores.append(
                percentile_score(
                    df[column]
                )
            )

    if peer_scores:

        peer_average = pd.concat(
            peer_scores,
            axis=1
        ).mean(axis=1)

        score += (
            peer_average
            * 0.15
        )

    df["financial_risk"] = (
        score.clip(0, 25)
    )

    return df


# ============================================================
# PAYMENT RISK
# ============================================================

def calculate_payment_risk(df):

    print("Calculating payment risk...")

    score = pd.Series(
        0.0,
        index=df.index
    )

    # Payment count percentile
    if "payment_count_percentile" in df.columns:

        score += (
            df["payment_count_percentile"]
            .clip(0, 1)
            * 12
        )

    # Extreme payment count
    if "extreme_payment_count" in df.columns:

        score += np.where(
            df["extreme_payment_count"] == 1,
            8,
            0
        )

    df["payment_risk"] = (
        score.clip(0, 20)
    )

    return df


# ============================================================
# VENDOR RISK
# ============================================================

def calculate_vendor_risk(df):

    print("Calculating vendor risk...")

    score = pd.Series(
        0.0,
        index=df.index
    )

    if "vendor_count_percentile" in df.columns:

        score += (
            df["vendor_count_percentile"]
            .clip(0, 1)
            * 8
        )

    if "extreme_vendor_count" in df.columns:

        score += np.where(
            df["extreme_vendor_count"] == 1,
            7,
            0
        )

    df["vendor_risk"] = (
        score.clip(0, 15)
    )

    return df


# ============================================================
# DELAY RISK
# ============================================================

def calculate_delay_risk(df):

    print("Calculating delay risk...")

    score = pd.Series(
        0.0,
        index=df.index
    )

    if "total_project_duration_days_percentile" in df.columns:

        score += (
            df[
                "total_project_duration_days_percentile"
            ]
            .clip(0, 1)
            * 8
        )

    if "extreme_project_duration" in df.columns:

        score += np.where(
            df["extreme_project_duration"] == 1,
            7,
            0
        )

    df["delay_risk"] = (
        score.clip(0, 15)
    )

    return df


# ============================================================
# PEER RISK
# ============================================================

def calculate_peer_risk(df):

    print("Calculating peer-relative risk...")

    score = pd.Series(
        0.0,
        index=df.index
    )

    peer_features = [
        "recommended_amount_vs_state_median",
        "recommended_amount_vs_mp_median",
        "payment_count_vs_state_median",
        "payment_count_vs_mp_median",
        "vendor_count_vs_state_median",
        "vendor_count_vs_mp_median",
        "total_project_duration_days_vs_state_median",
        "total_project_duration_days_vs_mp_median"
    ]

    existing = [
        c
        for c in peer_features
        if c in df.columns
    ]

    if existing:

        percentile_scores = []

        for column in existing:

            percentile_scores.append(
                percentile_score(
                    df[column]
                )
            )

        score = pd.concat(
            percentile_scores,
            axis=1
        ).mean(axis=1)

    df["peer_risk"] = (
        score
        .clip(0, 100)
        * 0.10
    )

    return df


# ============================================================
# ISOLATION FOREST
# ============================================================

def run_isolation_forest(df):

    print("\n" + "=" * 70)
    print("RUNNING ISOLATION FOREST V2")
    print("=" * 70)

    features = [

        "sanction_to_recommended_ratio",
        "expenditure_to_sanction_ratio",
        "final_to_recommended_ratio",

        "recommendation_to_sanction_days",
        "sanction_to_completion_days",
        "total_project_duration_days",

        "payment_count",
        "vendor_count",

        "payment_count_percentile",
        "vendor_count_percentile",

        "recommended_amount_vs_state_median",
        "recommended_amount_vs_mp_median",

        "payment_count_vs_state_median",
        "payment_count_vs_mp_median",

        "vendor_count_vs_state_median",
        "vendor_count_vs_mp_median",

        "total_project_duration_days_vs_state_median",
        "total_project_duration_days_vs_mp_median"
    ]

    features = [
        c
        for c in features
        if c in df.columns
    ]

    print("\nML features:")

    for feature in features:
        print("  ✓", feature)

    X = df[
        features
    ].copy()

    X = X.replace(
        [np.inf, -np.inf],
        np.nan
    )

    # Median imputation
    for column in X.columns:

        X[column] = X[column].fillna(
            X[column].median()
        )

    # Scaling
    scaler = StandardScaler()

    X_scaled = scaler.fit_transform(
        X
    )

    # Isolation Forest
    model = IsolationForest(

        n_estimators=300,

        contamination=0.03,

        max_samples="auto",

        random_state=42,

        n_jobs=-1

    )

    prediction = model.fit_predict(
        X_scaled
    )

    raw_score = model.decision_function(
        X_scaled
    )

    df["ml_anomaly"] = (
        prediction == -1
    ).astype(int)

    # Convert anomaly score:
    # higher = more anomalous
    df["ml_raw_score"] = -raw_score

    # Percentile-normalized ML score
    df["ml_risk"] = (
        df["ml_raw_score"]
        .rank(pct=True)
        * 15
    )

    print(
        "\nML anomalies:",
        int(df["ml_anomaly"].sum())
    )

    return df


# ============================================================
# COMBINE RISK
# ============================================================

def calculate_total_risk(df):

    print("\nCalculating total risk...")

    df["risk_score"] = (

        df["financial_risk"]

        +

        df["payment_risk"]

        +

        df["vendor_risk"]

        +

        df["delay_risk"]

        +

        df["peer_risk"]

        +

        df["ml_risk"]

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
# EXPLANATION
# ============================================================

def generate_explanations(df):

    print("Generating explanations...")

    explanations = []

    for _, row in df.iterrows():

        reasons = []

        # Financial
        if (
            row.get(
                "expenditure_to_sanction_ratio",
                np.nan
            ) > 1
        ):

            percentage = (
                row[
                    "expenditure_to_sanction_ratio"
                ]
                * 100
            )

            reasons.append(
                f"Expenditure is {percentage:.1f}% "
                "of sanctioned amount"
            )

        # Sanction increase
        if (
            row.get(
                "sanction_to_recommended_ratio",
                np.nan
            ) > 1.30
        ):

            reasons.append(
                "Sanction amount is more than "
                "30% above recommendation"
            )

        # Payment
        if (
            row.get(
                "extreme_payment_count",
                0
            ) == 1
        ):

            reasons.append(
                "Payment count is in the "
                "extreme range"
            )

        # Vendor
        if (
            row.get(
                "extreme_vendor_count",
                0
            ) == 1
        ):

            reasons.append(
                "Unusually high number of vendors"
            )

        # Duration
        if (
            row.get(
                "extreme_project_duration",
                0
            ) == 1
        ):

            reasons.append(
                "Project duration is unusually long"
            )

        # Peer cost
        if (
            row.get(
                "recommended_amount_vs_state_median",
                0
            ) > 2
        ):

            reasons.append(
                "Project cost is more than "
                "2× state median"
            )

        # ML
        if (
            row.get(
                "ml_anomaly",
                0
            ) == 1
        ):

            reasons.append(
                "ML detected an unusual "
                "combination of project characteristics"
            )

        if not reasons:

            reasons.append(
                "No major anomaly indicators detected"
            )

        explanations.append(
            " | ".join(reasons)
        )

    df[
        "risk_explanation"
    ] = explanations

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
    print("ANOMALY DETECTION V2 COMPLETE")
    print("=" * 70)

    print(
        f"Output: {OUTPUT_FILE}"
    )

    print(
        f"Projects: {len(df):,}"
    )

    print("\nRisk distribution:")

    print(
        df[
            "risk_level"
        ]
        .value_counts()
        .sort_index()
    )

    print("\nAverage risk:", round(
        df["risk_score"].mean(),
        2
    ))

    print(
        "Maximum risk:",
        df["risk_score"].max()
    )


# ============================================================
# MAIN
# ============================================================

def main():

    df = load_data()

    df = calculate_financial_risk(
        df
    )

    df = calculate_payment_risk(
        df
    )

    df = calculate_vendor_risk(
        df
    )

    df = calculate_delay_risk(
        df
    )

    df = calculate_peer_risk(
        df
    )

    df = run_isolation_forest(
        df
    )

    df = calculate_total_risk(
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