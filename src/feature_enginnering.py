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
    / "MPLADS_PROJECT_MASTER_V3.csv"
)

OUTPUT_DIR = (
    BASE_DIR
    / "data"
    / "processed"
)

OUTPUT_FILE = (
    OUTPUT_DIR
    / "MPLADS_ML_FEATURES.csv"
)


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    print("=" * 60)
    print("LOADING MPLADS PROJECT MASTER")
    print("=" * 60)

    df = pd.read_csv(
        INPUT_FILE,
        low_memory=False
    )

    print(f"Rows    : {len(df):,}")
    print(f"Columns : {len(df.columns)}")

    return df


# ============================================================
# DATE FEATURES
# ============================================================

def create_date_features(df):

    print("\nCreating date features...")

    date_columns = [
        "recommendation_date",
        "sanction_date",
        "first_expenditure_date",
        "last_expenditure_date",
        "completion_date"
    ]

    for column in date_columns:

        if column in df.columns:

            df[column] = pd.to_datetime(
                df[column],
                errors="coerce"
            )

    # Recommendation year
    if "recommendation_date" in df.columns:

        df["recommendation_year"] = (
            df["recommendation_date"].dt.year
        )

        df["recommendation_month"] = (
            df["recommendation_date"].dt.month
        )

    # Expenditure duration
    if (
        "first_expenditure_date" in df.columns
        and
        "last_expenditure_date" in df.columns
    ):

        df["expenditure_duration_days"] = (
            df["last_expenditure_date"]
            -
            df["first_expenditure_date"]
        ).dt.days

    return df


# ============================================================
# COST FEATURES
# ============================================================

def create_cost_features(df):

    print("Creating cost features...")

    # Sanction vs recommendation

    if (
        "recommended_amount" in df.columns
        and
        "sanction_amount" in df.columns
    ):

        df["sanction_to_recommended_ratio"] = np.where(

            df["recommended_amount"] > 0,

            df["sanction_amount"]
            /
            df["recommended_amount"],

            np.nan
        )

    # Expenditure vs sanction

    if (
        "total_expenditure" in df.columns
        and
        "sanction_amount" in df.columns
    ):

        df["expenditure_to_sanction_ratio"] = np.where(

            df["sanction_amount"] > 0,

            df["total_expenditure"]
            /
            df["sanction_amount"],

            np.nan
        )

    # Final amount vs recommendation

    if (
        "final_amount" in df.columns
        and
        "recommended_amount" in df.columns
    ):

        df["final_to_recommended_ratio"] = np.where(

            df["recommended_amount"] > 0,

            df["final_amount"]
            /
            df["recommended_amount"],

            np.nan
        )

    # Expenditure vs recommendation

    if (
        "total_expenditure" in df.columns
        and
        "recommended_amount" in df.columns
    ):

        df["expenditure_to_recommended_ratio"] = np.where(

            df["recommended_amount"] > 0,

            df["total_expenditure"]
            /
            df["recommended_amount"],

            np.nan
        )

    return df


# ============================================================
# PAYMENT FEATURES
# ============================================================

def create_payment_features(df):

    print("Creating payment features...")

    if "payment_count" in df.columns:

        df["high_payment_count"] = (
            df["payment_count"] > 10
        ).astype(int)

    if (
        "total_expenditure" in df.columns
        and
        "payment_count" in df.columns
    ):

        df["average_payment_amount"] = np.where(

            df["payment_count"] > 0,

            df["total_expenditure"]
            /
            df["payment_count"],

            np.nan
        )

    if (
        "successful_payment_count" in df.columns
        and
        "payment_count" in df.columns
    ):

        df["payment_success_rate"] = np.where(

            df["payment_count"] > 0,

            df["successful_payment_count"]
            /
            df["payment_count"],

            np.nan
        )

    return df


# ============================================================
# VENDOR FEATURES
# ============================================================

def create_vendor_features(df):

    print("Creating vendor features...")

    if "vendor_count" in df.columns:

        df["multiple_vendor_flag"] = (
            df["vendor_count"] > 1
        ).astype(int)

        df["high_vendor_count"] = (
            df["vendor_count"] > 5
        ).astype(int)

    if (
        "vendor_count" in df.columns
        and
        "payment_count" in df.columns
    ):

        df["payments_per_vendor"] = np.where(

            df["vendor_count"] > 0,

            df["payment_count"]
            /
            df["vendor_count"],

            np.nan
        )

    return df


# ============================================================
# DELAY FEATURES
# ============================================================

def create_delay_features(df):

    print("Creating delay features...")

    if "sanction_to_completion_days" in df.columns:

        df["delay_over_180_days"] = (
            df["sanction_to_completion_days"] > 180
        ).astype(int)

        df["delay_over_365_days"] = (
            df["sanction_to_completion_days"] > 365
        ).astype(int)

    if "total_project_duration_days" in df.columns:

        df["project_over_365_days"] = (
            df["total_project_duration_days"] > 365
        ).astype(int)

    return df


# ============================================================
# ANOMALY INDICATORS
# ============================================================

def create_rule_indicators(df):

    print("Creating rule-based indicators...")

    # --------------------------------------------------------
    # Expenditure exceeding sanction
    # --------------------------------------------------------

    if "expenditure_to_sanction_ratio" in df.columns:

        df["expenditure_exceeds_sanction"] = (
            df["expenditure_to_sanction_ratio"] > 1
        ).astype(int)

    # --------------------------------------------------------
    # Large recommendation → sanction increase
    # --------------------------------------------------------

    if "sanction_to_recommended_ratio" in df.columns:

        df["large_sanction_increase"] = (
            df["sanction_to_recommended_ratio"] > 1.30
        ).astype(int)

    # --------------------------------------------------------
    # Large final cost increase
    # --------------------------------------------------------

    if "final_to_recommended_ratio" in df.columns:

        df["large_final_cost_increase"] = (
            df["final_to_recommended_ratio"] > 1.30
        ).astype(int)

    # --------------------------------------------------------
    # Long duration
    # --------------------------------------------------------

    if "total_project_duration_days" in df.columns:

        df["long_project_flag"] = (
            df["total_project_duration_days"] > 365
        ).astype(int)

    return df


# ============================================================
# PEER FEATURES
# ============================================================

def create_peer_features(df):

    print("Creating peer comparison features...")

    # --------------------------------------------------------
    # Category median
    # --------------------------------------------------------

    if (
        "category" in df.columns
        and
        "recommended_amount" in df.columns
    ):

        category_median = (
            df.groupby("category")[
                "recommended_amount"
            ]
            .transform("median")
        )

        df["category_median_cost"] = (
            category_median
        )

        df["cost_vs_category_median"] = np.where(

            category_median > 0,

            df["recommended_amount"]
            /
            category_median,

            np.nan
        )

    # --------------------------------------------------------
    # State median
    # --------------------------------------------------------

    if (
        "state" in df.columns
        and
        "recommended_amount" in df.columns
    ):

        state_median = (
            df.groupby("state")[
                "recommended_amount"
            ]
            .transform("median")
        )

        df["state_median_cost"] = (
            state_median
        )

        df["cost_vs_state_median"] = np.where(

            state_median > 0,

            df["recommended_amount"]
            /
            state_median,

            np.nan
        )

    return df


# ============================================================
# DATA QUALITY FLAGS
# ============================================================

def create_quality_features(df):

    print("Creating data quality features...")

    # Missing lifecycle information

    lifecycle_columns = [
        "recommendation_date",
        "sanction_date",
        "completion_date"
    ]

    existing = [
        c for c in lifecycle_columns
        if c in df.columns
    ]

    if existing:

        df["missing_lifecycle_fields"] = (
            df[existing]
            .isna()
            .sum(axis=1)
        )

    # Negative duration

    duration_columns = [
        "recommendation_to_sanction_days",
        "sanction_to_completion_days",
        "total_project_duration_days"
    ]

    existing = [
        c for c in duration_columns
        if c in df.columns
    ]

    if existing:

        df["negative_duration_flag"] = (
            df[existing]
            .lt(0)
            .any(axis=1)
            .astype(int)
        )

    return df


# ============================================================
# FINAL FEATURE SELECTION
# ============================================================

def finalize(df):

    print("\nFinalizing ML dataset...")

    # Remove raw datetime columns from ML features.
    # We already extracted useful date features.

    datetime_columns = [
        "recommendation_date",
        "sanction_date",
        "first_expenditure_date",
        "last_expenditure_date",
        "completion_date"
    ]

    # Keep a copy for audit, but remove from ML dataframe
    ml_df = df.drop(
        columns=[
            c for c in datetime_columns
            if c in df.columns
        ]
    )

    # Remove raw long text from the numerical ML dataset.
    # We will use work descriptions separately later
    # for duplicate/NLP analysis.

    text_columns = [
        "work_description",
        "work"
    ]

    ml_df = ml_df.drop(
        columns=[
            c for c in text_columns
            if c in ml_df.columns
        ]
    )

    return ml_df


# ============================================================
# SAVE
# ============================================================

def save_data(df):

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\n" + "=" * 60)
    print("FEATURE DATASET SAVED")
    print("=" * 60)

    print(f"File    : {OUTPUT_FILE}")
    print(f"Rows    : {len(df):,}")
    print(f"Columns : {len(df.columns)}")


# ============================================================
# MAIN
# ============================================================

def main():

    df = load_data()

    df = create_date_features(df)

    df = create_cost_features(df)

    df = create_payment_features(df)

    df = create_vendor_features(df)

    df = create_delay_features(df)

    df = create_rule_indicators(df)

    df = create_peer_features(df)

    df = create_quality_features(df)

    ml_df = finalize(df)

    save_data(ml_df)

    print("\nSample:")
    print(
        ml_df.head().to_string()
    )


if __name__ == "__main__":
    main()