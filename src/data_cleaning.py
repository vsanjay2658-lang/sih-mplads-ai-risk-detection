import pandas as pd
import numpy as np
from pathlib import Path


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

RAW_DIR = BASE_DIR / "data" / "raw"
CLEAN_DIR = BASE_DIR / "data" / "cleaned"

CLEAN_DIR.mkdir(parents=True, exist_ok=True)


FILES = {
    "recommended": RAW_DIR / "recommended.csv",
    "completed": RAW_DIR / "completed.csv",
    "expenditures": RAW_DIR / "expenditures.csv",
    "mp_summary": RAW_DIR / "mp_summary.csv"
}


# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def clean_text(value):
    """
    Standardize text without changing the original meaning.
    """

    if pd.isna(value):
        return ""

    value = str(value)

    # Remove leading/trailing spaces
    value = value.strip()

    # Replace multiple spaces with one
    value = " ".join(value.split())

    return value


def clean_text_series(series):
    """
    Clean an entire text column.
    """
    return series.apply(clean_text)


def clean_numeric(series):
    """
    Convert currency/numeric values to numbers.

    Handles values such as:
        ₹10,00,000
        Rs. 100000
        100000
    """

    return (
        series
        .astype(str)
        .str.replace("₹", "", regex=False)
        .str.replace("Rs.", "", regex=False)
        .str.replace("Rs", "", regex=False)
        .str.replace(",", "", regex=False)
        .str.strip()
        .replace(["", "nan", "None", "NA", "N/A"], np.nan)
        .pipe(pd.to_numeric, errors="coerce")
    )


def clean_date(series):
    """
    Convert dates to pandas datetime.
    Invalid dates become NaT.
    """

    return pd.to_datetime(
        series,
        errors="coerce"
    )


def clean_work_id(series):
    """
    Standardize Work ID for joining.
    """

    return (
        series
        .astype(str)
        .str.strip()
        .replace(["nan", "None", ""], np.nan)
    )


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    print("\n" + "=" * 60)
    print("LOADING MPLADS DATA")
    print("=" * 60)

    recommended = pd.read_csv(
        FILES["recommended"],
        low_memory=False
    )

    completed = pd.read_csv(
        FILES["completed"],
        low_memory=False
    )

    expenditures = pd.read_csv(
        FILES["expenditures"],
        low_memory=False
    )

    mp_summary = pd.read_csv(
        FILES["mp_summary"],
        low_memory=False
    )

    print(f"Recommended works : {len(recommended):,}")
    print(f"Completed works   : {len(completed):,}")
    print(f"Expenditures      : {len(expenditures):,}")
    print(f"MP summary        : {len(mp_summary):,}")

    return (
        recommended,
        completed,
        expenditures,
        mp_summary
    )


# ============================================================
# RECOMMENDED WORKS
# ============================================================

def clean_recommended(df):

    print("\nCleaning Recommended Works...")

    df = df.copy()

    # Remove exact duplicate rows
    before = len(df)

    df = df.drop_duplicates()

    after = len(df)

    print(
        f"  Removed duplicates: "
        f"{before - after:,}"
    )

    # Work ID
    if "Work ID" in df.columns:
        df["Work ID"] = clean_work_id(
            df["Work ID"]
        )

    # Text columns
    text_columns = [
        "MP Name",
        "Work Description",
        "Category",
        "State",
        "Constituency",
        "IDA",
        "City",
        "Ward",
        "Block",
        "Village",
        "House"
    ]

    for column in text_columns:

        if column in df.columns:
            df[column] = clean_text_series(
                df[column]
            )

    # Date
    if "Recommendation Date" in df.columns:

        df["Recommendation Date"] = clean_date(
            df["Recommendation Date"]
        )

    # Amount
    if "Recommended Amount (₹)" in df.columns:

        df["Recommended Amount (₹)"] = clean_numeric(
            df["Recommended Amount (₹)"]
        )

    return df


# ============================================================
# COMPLETED WORKS
# ============================================================

def clean_completed(df):

    print("\nCleaning Completed Works...")

    df = df.copy()

    # Remove exact duplicates
    before = len(df)

    df = df.drop_duplicates()

    after = len(df)

    print(
        f"  Removed duplicates: "
        f"{before - after:,}"
    )

    # Work ID
    if "Work ID" in df.columns:

        df["Work ID"] = clean_work_id(
            df["Work ID"]
        )

    # Text columns
    text_columns = [
        "MP Name",
        "Work Description",
        "Category",
        "State",
        "Constituency",
        "IDA",
        "City",
        "Ward",
        "Block",
        "Village",
        "House"
    ]

    for column in text_columns:

        if column in df.columns:

            df[column] = clean_text_series(
                df[column]
            )

    # Date
    if "Completed Date" in df.columns:

        df["Completed Date"] = clean_date(
            df["Completed Date"]
        )

    # Amount
    if "Final Amount (₹)" in df.columns:

        df["Final Amount (₹)"] = clean_numeric(
            df["Final Amount (₹)"]
        )

    return df


# ============================================================
# EXPENDITURES
# ============================================================

def clean_expenditures(df):

    print("\nCleaning Expenditures...")

    df = df.copy()

    # VERY IMPORTANT:
    # Remove exact duplicates only.
    #
    # Do NOT remove similar transactions because
    # they may represent legitimate separate payments.

    before = len(df)

    df = df.drop_duplicates()

    after = len(df)

    print(
        f"  Exact duplicate rows removed: "
        f"{before - after:,}"
    )

    # Text columns
    text_columns = [
        "MP Name",
        "Work Description",
        "State",
        "Constituency",
        "IDA",
        "Vendor",
        "Payment Status"
    ]

    for column in text_columns:

        if column in df.columns:

            df[column] = clean_text_series(
                df[column]
            )

    # Date
    if "Expenditure Date" in df.columns:

        df["Expenditure Date"] = clean_date(
            df["Expenditure Date"]
        )

    # Amount
    if "Expenditure Amount (₹)" in df.columns:

        df["Expenditure Amount (₹)"] = clean_numeric(
            df["Expenditure Amount (₹)"]
        )

    return df


# ============================================================
# MP SUMMARY
# ============================================================

def clean_mp_summary(df):

    print("\nCleaning MP Summary...")

    df = df.copy()

    # Exact duplicates
    before = len(df)

    df = df.drop_duplicates()

    after = len(df)

    print(
        f"  Removed duplicates: "
        f"{before - after:,}"
    )

    # Text
    text_columns = [
        "MP Name",
        "State",
        "Constituency",
        "House"
    ]

    for column in text_columns:

        if column in df.columns:

            df[column] = clean_text_series(
                df[column]
            )

    # Numeric columns
    numeric_columns = [
        "Allocated Amount (₹)",
        "Total Expenditure (₹)",
        "Utilization %",
        "Completed Works",
        "Recommended Works",
        "Completion Rate %",
        "Unspent Amount (₹)",
        "Transaction Count",
        "Successful Payments",
        "Pending Payments",
        "Average Rating"
    ]

    for column in numeric_columns:

        if column in df.columns:

            df[column] = clean_numeric(
                df[column]
            )

    return df


# ============================================================
# DATA QUALITY REPORT
# ============================================================

def generate_quality_report(
    name,
    df
):

    print("\n" + "-" * 60)
    print(f"DATA QUALITY: {name}")
    print("-" * 60)

    print(
        f"Rows    : {len(df):,}"
    )

    print(
        f"Columns : {len(df.columns)}"
    )

    print(
        f"Duplicate rows: "
        f"{df.duplicated().sum():,}"
    )

    print("\nMissing values:")

    missing = (
        df.isnull()
        .sum()
        .sort_values(
            ascending=False
        )
    )

    for column, count in missing.items():

        if count > 0:

            percentage = (
                count / len(df)
            ) * 100

            print(
                f"  {column}: "
                f"{count:,} "
                f"({percentage:.2f}%)"
            )


# ============================================================
# VALIDATE WORK IDS
# ============================================================

def check_work_ids(
    recommended,
    completed
):

    print("\n" + "=" * 60)
    print("WORK ID VALIDATION")
    print("=" * 60)

    if (
        "Work ID" not in recommended.columns
        or
        "Work ID" not in completed.columns
    ):

        print(
            "Work ID not available "
            "in one or both datasets."
        )

        return

    recommended_ids = set(
        recommended["Work ID"]
        .dropna()
        .astype(str)
    )

    completed_ids = set(
        completed["Work ID"]
        .dropna()
        .astype(str)
    )

    common = (
        recommended_ids
        & completed_ids
    )

    print(
        f"Unique recommended Work IDs: "
        f"{len(recommended_ids):,}"
    )

    print(
        f"Unique completed Work IDs: "
        f"{len(completed_ids):,}"
    )

    print(
        f"Common Work IDs: "
        f"{len(common):,}"
    )

    if len(recommended_ids) > 0:

        percentage = (
            len(common)
            / len(recommended_ids)
        ) * 100

        print(
            f"Recommended → Completed match: "
            f"{percentage:.2f}%"
        )


# ============================================================
# SAVE DATA
# ============================================================

def save_data(
    recommended,
    completed,
    expenditures,
    mp_summary
):

    print("\n" + "=" * 60)
    print("SAVING CLEAN DATA")
    print("=" * 60)

    recommended.to_csv(
        CLEAN_DIR / "recommended_clean.csv",
        index=False
    )

    completed.to_csv(
        CLEAN_DIR / "completed_clean.csv",
        index=False
    )

    expenditures.to_csv(
        CLEAN_DIR / "expenditures_clean.csv",
        index=False
    )

    mp_summary.to_csv(
        CLEAN_DIR / "mp_summary_clean.csv",
        index=False
    )

    print(
        f"Files saved to:\n"
        f"{CLEAN_DIR}"
    )


# ============================================================
# MAIN PIPELINE
# ============================================================

def main():

    print("\n")
    print("=" * 60)
    print("MPLADS DATA CLEANING PIPELINE")
    print("=" * 60)

    # Load
    (
        recommended,
        completed,
        expenditures,
        mp_summary
    ) = load_data()

    # Clean
    recommended = clean_recommended(
        recommended
    )

    completed = clean_completed(
        completed
    )

    expenditures = clean_expenditures(
        expenditures
    )

    mp_summary = clean_mp_summary(
        mp_summary
    )

    # Validate
    generate_quality_report(
        "Recommended Works",
        recommended
    )

    generate_quality_report(
        "Completed Works",
        completed
    )

    generate_quality_report(
        "Expenditures",
        expenditures
    )

    generate_quality_report(
        "MP Summary",
        mp_summary
    )

    # Work ID validation
    check_work_ids(
        recommended,
        completed
    )

    # Save
    save_data(
        recommended,
        completed,
        expenditures,
        mp_summary
    )

    print("\n" + "=" * 60)
    print("DATA CLEANING COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()