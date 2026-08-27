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
    / "MPLADS_RISK_RESULTS.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "MPLADS_PATTERN_RESULTS.csv"
)


# ============================================================
# LOAD
# ============================================================

def load_data():

    print("=" * 70)
    print("MPLADS PATTERN DETECTION")
    print("=" * 70)

    df = pd.read_csv(
        INPUT_FILE,
        low_memory=False
    )

    print(f"Projects : {len(df):,}")
    print(f"Columns  : {len(df.columns)}")

    return df


# ============================================================
# PAYMENT + VENDOR COMBINATION
# ============================================================

def detect_payment_vendor_patterns(df):

    print("\nDetecting payment/vendor patterns...")

    df["payment_vendor_pattern"] = 0

    # Many payments AND many vendors
    if (
        "payment_count" in df.columns
        and
        "vendor_count" in df.columns
    ):

        condition = (
            (df["payment_count"] >= 20)
            &
            (df["vendor_count"] >= 10)
        )

        df.loc[
            condition,
            "payment_vendor_pattern"
        ] = 1

    # Extremely unusual combination
    if (
        "payment_count" in df.columns
        and
        "vendor_count" in df.columns
    ):

        extreme_condition = (
            (df["payment_count"] >= 50)
            |
            (df["vendor_count"] >= 20)
        )

        df.loc[
            extreme_condition,
            "extreme_payment_vendor_pattern"
        ] = 1

    else:

        df["extreme_payment_vendor_pattern"] = 0

    return df


# ============================================================
# UNDER-UTILIZATION
# ============================================================

def detect_underutilization(df):

    print("Detecting under-utilization...")

    if (
        "total_expenditure" in df.columns
        and
        "sanction_amount" in df.columns
    ):

        ratio = np.where(

            df["sanction_amount"] > 0,

            df["total_expenditure"]
            /
            df["sanction_amount"],

            np.nan
        )

        df["expenditure_utilization_ratio"] = ratio

        # Less than 50% utilized
        df["underutilization_flag"] = (
            (df["sanction_amount"] > 0)
            &
            (df["total_expenditure"].notna())
            &
            (df["expenditure_utilization_ratio"] < 0.50)
        ).astype(int)

        # Less than 25%
        df["severe_underutilization_flag"] = (
            (df["sanction_amount"] > 0)
            &
            (df["total_expenditure"].notna())
            &
            (df["expenditure_utilization_ratio"] < 0.25)
        ).astype(int)

    return df


# ============================================================
# EXCESS EXPENDITURE
# ============================================================

def detect_excess_expenditure(df):

    print("Detecting excess expenditure...")

    if (
        "total_expenditure" in df.columns
        and
        "sanction_amount" in df.columns
    ):

        ratio = df[
            "expenditure_to_sanction_ratio"
        ]

        df["excess_expenditure_flag"] = (
            ratio > 1.0
        ).astype(int)

        df["severe_excess_expenditure_flag"] = (
            ratio > 1.20
        ).astype(int)

    return df


# ============================================================
# LONG DELAY
# ============================================================

def detect_delay_patterns(df):

    print("Detecting delay patterns...")

    if "total_project_duration_days" in df.columns:

        duration = df[
            "total_project_duration_days"
        ]

        df["delay_over_500_days"] = (
            duration > 500
        ).astype(int)

        df["delay_over_700_days"] = (
            duration > 700
        ).astype(int)

    return df


# ============================================================
# MP-LEVEL PATTERNS
# ============================================================

def detect_mp_patterns(df):

    print("Detecting MP-level patterns...")

    if "mp_name" not in df.columns:
        return df

    # --------------------------------------------------------
    # Number of projects per MP
    # --------------------------------------------------------

    mp_project_count = (
        df.groupby("mp_name")["work_id"]
        .transform("count")
    )

    df["mp_project_count"] = (
        mp_project_count
    )

    # --------------------------------------------------------
    # High-risk projects per MP
    # --------------------------------------------------------

    high_risk = (
        df["risk_level"]
        .isin(["HIGH", "CRITICAL"])
        .astype(int)
    )

    mp_high_risk_count = (
        high_risk
        .groupby(df["mp_name"])
        .transform("sum")
    )

    df["mp_high_risk_count"] = (
        mp_high_risk_count
    )

    # --------------------------------------------------------
    # MP anomaly rate
    # --------------------------------------------------------

    df["mp_high_risk_rate"] = np.where(

        df["mp_project_count"] > 0,

        df["mp_high_risk_count"]
        /
        df["mp_project_count"],

        0
    )

    # --------------------------------------------------------
    # MP average risk
    # --------------------------------------------------------

    mp_avg_risk = (
        df.groupby("mp_name")["risk_score"]
        .transform("mean")
    )

    df["mp_average_risk"] = (
        mp_avg_risk
    )

    return df


# ============================================================
# STATE-LEVEL PATTERNS
# ============================================================

def detect_state_patterns(df):

    print("Detecting state-level patterns...")

    if "state" not in df.columns:
        return df

    state_project_count = (
        df.groupby("state")["work_id"]
        .transform("count")
    )

    df["state_project_count"] = (
        state_project_count
    )

    high_risk = (
        df["risk_level"]
        .isin(["HIGH", "CRITICAL"])
        .astype(int)
    )

    state_high_risk_count = (
        high_risk
        .groupby(df["state"])
        .transform("sum")
    )

    df["state_high_risk_count"] = (
        state_high_risk_count
    )

    df["state_high_risk_rate"] = np.where(

        df["state_project_count"] > 0,

        df["state_high_risk_count"]
        /
        df["state_project_count"],

        0
    )

    return df


# ============================================================
# COMPOSITE PATTERN SCORE
# ============================================================

def calculate_pattern_score(df):

    print("Calculating pattern score...")

    score = np.zeros(
        len(df)
    )

    # Payment/vendor
    if "payment_vendor_pattern" in df.columns:

        score += np.where(
            df["payment_vendor_pattern"] == 1,
            20,
            0
        )

    # Extreme payment/vendor
    if "extreme_payment_vendor_pattern" in df.columns:

        score += np.where(
            df["extreme_payment_vendor_pattern"] == 1,
            15,
            0
        )

    # Underutilization
    if "underutilization_flag" in df.columns:

        score += np.where(
            df["underutilization_flag"] == 1,
            10,
            0
        )

    # Severe underutilization
    if "severe_underutilization_flag" in df.columns:

        score += np.where(
            df["severe_underutilization_flag"] == 1,
            10,
            0
        )

    # Excess expenditure
    if "excess_expenditure_flag" in df.columns:

        score += np.where(
            df["excess_expenditure_flag"] == 1,
            15,
            0
        )

    # Severe excess
    if "severe_excess_expenditure_flag" in df.columns:

        score += np.where(
            df["severe_excess_expenditure_flag"] == 1,
            10,
            0
        )

    # Long delay
    if "delay_over_500_days" in df.columns:

        score += np.where(
            df["delay_over_500_days"] == 1,
            10,
            0
        )

    if "delay_over_700_days" in df.columns:

        score += np.where(
            df["delay_over_700_days"] == 1,
            10,
            0
        )

    df["pattern_score"] = np.minimum(
        score,
        100
    )

    return df


# ============================================================
# PATTERN EXPLANATION
# ============================================================

def generate_pattern_explanations(df):

    print("Generating pattern explanations...")

    explanations = []

    for _, row in df.iterrows():

        reasons = []

        # Payment/vendor
        if row.get(
            "payment_vendor_pattern",
            0
        ) == 1:

            reasons.append(
                "High payment count combined "
                "with high vendor count"
            )

        if row.get(
            "extreme_payment_vendor_pattern",
            0
        ) == 1:

            reasons.append(
                "Extreme payment/vendor activity"
            )

        # Underutilization
        if row.get(
            "severe_underutilization_flag",
            0
        ) == 1:

            reasons.append(
                "Less than 25% of sanctioned amount "
                "has been utilized"
            )

        elif row.get(
            "underutilization_flag",
            0
        ) == 1:

            reasons.append(
                "Less than 50% of sanctioned amount "
                "has been utilized"
            )

        # Excess
        if row.get(
            "severe_excess_expenditure_flag",
            0
        ) == 1:

            reasons.append(
                "Expenditure exceeds sanction by "
                "more than 20%"
            )

        elif row.get(
            "excess_expenditure_flag",
            0
        ) == 1:

            reasons.append(
                "Expenditure exceeds sanctioned amount"
            )

        # Delay
        if row.get(
            "delay_over_700_days",
            0
        ) == 1:

            reasons.append(
                "Project duration exceeds 700 days"
            )

        elif row.get(
            "delay_over_500_days",
            0
        ) == 1:

            reasons.append(
                "Project duration exceeds 500 days"
            )

        if not reasons:

            reasons.append(
                "No major pattern detected"
            )

        explanations.append(
            " | ".join(reasons)
        )

    df[
        "pattern_explanation"
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
    print("PATTERN DETECTION COMPLETE")
    print("=" * 70)

    print(
        f"Output: {OUTPUT_FILE}"
    )

    print(
        f"Projects: {len(df):,}"
    )

    print("\nPattern statistics:")

    pattern_columns = [
        "payment_vendor_pattern",
        "extreme_payment_vendor_pattern",
        "underutilization_flag",
        "severe_underutilization_flag",
        "excess_expenditure_flag",
        "severe_excess_expenditure_flag",
        "delay_over_500_days",
        "delay_over_700_days"
    ]

    for column in pattern_columns:

        if column in df.columns:

            print(
                f"{column}:",
                int(df[column].sum())
            )

    print(
        "\nMaximum pattern score:",
        df["pattern_score"].max()
    )


# ============================================================
# MAIN
# ============================================================

def main():

    df = load_data()

    df = detect_payment_vendor_patterns(df)

    df = detect_underutilization(df)

    df = detect_excess_expenditure(df)

    df = detect_delay_patterns(df)

    df = detect_mp_patterns(df)

    df = detect_state_patterns(df)

    df = calculate_pattern_score(df)

    df = generate_pattern_explanations(df)

    save_results(df)


if __name__ == "__main__":

    main()