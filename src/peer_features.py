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
    / "MPLADS_ML_FEATURES.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "MPLADS_PEER_FEATURES.csv"
)


# ============================================================
# LOAD
# ============================================================

print("=" * 60)
print("LOADING MPLADS ML FEATURES")
print("=" * 60)

df = pd.read_csv(
    INPUT_FILE,
    low_memory=False
)

print("Projects:", len(df))


# ============================================================
# HELPER
# ============================================================

def percentile_rank(series):

    return series.rank(
        pct=True,
        method="average"
    )


# ============================================================
# GLOBAL PERCENTILES
# ============================================================

print("\nCreating global percentile features...")

numeric_features = [

    "recommended_amount",
    "sanction_amount",
    "total_expenditure",
    "final_amount",

    "payment_count",
    "vendor_count",

    "recommendation_to_sanction_days",
    "sanction_to_completion_days",
    "total_project_duration_days",

    "average_payment_amount"

]


for column in numeric_features:

    if column in df.columns:

        df[column + "_percentile"] = (
            percentile_rank(
                df[column]
            )
        )


# ============================================================
# STATE-RELATIVE FEATURES
# ============================================================

print("Creating state-relative features...")


state_features = [

    "recommended_amount",
    "payment_count",
    "vendor_count",
    "total_project_duration_days"

]


for column in state_features:

    if column not in df.columns:
        continue

    median = (
        df.groupby("state")[column]
        .transform("median")
    )

    df[column + "_vs_state_median"] = np.where(

        median > 0,

        df[column] / median,

        np.nan

    )


# ============================================================
# MP-RELATIVE FEATURES
# ============================================================

print("Creating MP-relative features...")


mp_features = [

    "recommended_amount",
    "payment_count",
    "vendor_count",
    "total_project_duration_days"

]


for column in mp_features:

    if column not in df.columns:
        continue

    median = (
        df.groupby("mp_name")[column]
        .transform("median")
    )

    df[column + "_vs_mp_median"] = np.where(

        median > 0,

        df[column] / median,

        np.nan

    )


# ============================================================
# PAYMENT ANOMALY
# ============================================================

print("Creating payment anomaly indicators...")


if "payment_count" in df.columns:

    df["extreme_payment_count"] = (

        df["payment_count"]
        >= df["payment_count"].quantile(0.99)

    ).astype(int)


# ============================================================
# VENDOR ANOMALY
# ============================================================

if "vendor_count" in df.columns:

    df["extreme_vendor_count"] = (

        df["vendor_count"]
        >= df["vendor_count"].quantile(0.99)

    ).astype(int)


# ============================================================
# DURATION ANOMALY
# ============================================================

if "total_project_duration_days" in df.columns:

    df["extreme_project_duration"] = (

        df["total_project_duration_days"]
        >= df["total_project_duration_days"].quantile(0.95)

    ).astype(int)


# ============================================================
# FINANCIAL ANOMALIES
# ============================================================

if "expenditure_to_sanction_ratio" in df.columns:

    df["extreme_expenditure_ratio"] = (

        df["expenditure_to_sanction_ratio"]
        >= df["expenditure_to_sanction_ratio"].quantile(0.99)

    ).astype(int)


if "sanction_to_recommended_ratio" in df.columns:

    df["extreme_sanction_ratio"] = (

        df["sanction_to_recommended_ratio"]
        >= df["sanction_to_recommended_ratio"].quantile(0.99)

    ).astype(int)


# ============================================================
# SAVE
# ============================================================

df.to_csv(
    OUTPUT_FILE,
    index=False
)


print("\n" + "=" * 60)
print("PEER FEATURES CREATED")
print("=" * 60)

print("Rows:", len(df))
print("Columns:", len(df.columns))

print("\nOutput:")
print(OUTPUT_FILE)