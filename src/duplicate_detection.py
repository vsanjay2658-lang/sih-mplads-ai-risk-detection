import pandas as pd
import numpy as np
from pathlib import Path


# ============================================================
# CONFIGURATION
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
    / "MPLADS_DUPLICATE_CANDIDATES.csv"
)

# Minimum number of projects needed to create a group
MIN_GROUP_SIZE = 2

# Amount similarity threshold
AMOUNT_TOLERANCE = 0.01       # 1%

# Strong candidate threshold
DUPLICATE_SCORE_THRESHOLD = 75


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    print("=" * 70)
    print("MPLADS DUPLICATE CANDIDATE DETECTION")
    print("=" * 70)

    df = pd.read_csv(
        INPUT_FILE,
        low_memory=False
    )

    print(f"Projects : {len(df):,}")
    print(f"Columns  : {len(df.columns)}")

    return df


# ============================================================
# PREPARE DATA
# ============================================================

def prepare_data(df):

    print("\nPreparing data...")

    text_columns = [
        "state",
        "mp_name",
        "ida",
        "constituency",
        "category"
    ]

    for col in text_columns:

        if col in df.columns:

            df[col] = (
                df[col]
                .fillna("")
                .astype(str)
                .str.upper()
                .str.strip()
            )

    numeric_columns = [
        "recommended_amount",
        "sanction_amount",
        "total_expenditure",
        "final_amount",
        "recommendation_year",
        "recommendation_month"
    ]

    for col in numeric_columns:

        if col in df.columns:

            df[col] = pd.to_numeric(
                df[col],
                errors="coerce"
            )

    # --------------------------------------------------------
    # Amount bucket
    # --------------------------------------------------------
    #
    # Used only for creating candidate groups.
    #
    # Example:
    #
    # 999000
    # 1000000
    #
    # can fall into the same approximate range.
    # --------------------------------------------------------

    df["amount_bucket"] = (
        df["recommended_amount"]
        .fillna(-1)
        .div(100000)
        .round()
    )

    return df


# ============================================================
# AMOUNT SIMILARITY
# ============================================================

def amount_similarity(a, b):

    if pd.isna(a) or pd.isna(b):
        return 0

    if a <= 0 or b <= 0:
        return 0

    avg = (abs(a) + abs(b)) / 2

    if avg == 0:
        return 0

    difference = abs(a - b)

    return 1 - (difference / avg)


# ============================================================
# CREATE CANDIDATE GROUPS
# ============================================================

def create_candidate_groups(df):

    print("\nCreating candidate groups...")

    # --------------------------------------------------------
    # Strong grouping attributes
    # --------------------------------------------------------

    group_columns = [
        "mp_name",
        "ida",
        "category",
        "recommendation_year",
        "recommendation_month",
        "amount_bucket"
    ]

    existing_columns = [
        c
        for c in group_columns
        if c in df.columns
    ]

    grouped = df.groupby(
        existing_columns,
        dropna=False
    )

    candidates = []

    group_id = 1

    total_groups = 0
    suspicious_groups = 0

    for group_key, group in grouped:

        total_groups += 1

        if len(group) < MIN_GROUP_SIZE:
            continue

        # ----------------------------------------------------
        # Don't generate enormous groups.
        # ----------------------------------------------------

        if len(group) > 50:

            continue

        # ----------------------------------------------------
        # Calculate group statistics
        # ----------------------------------------------------

        recommended_amounts = (
            group["recommended_amount"]
            .dropna()
        )

        sanction_amounts = (
            group["sanction_amount"]
            .dropna()
        )

        if len(recommended_amounts) > 0:

            amount_min = (
                recommended_amounts.min()
            )

            amount_max = (
                recommended_amounts.max()
            )

            amount_mean = (
                recommended_amounts.mean()
            )

            amount_similarity = (
                amount_min / amount_max
                if amount_max > 0
                else 0
            )

        else:

            amount_similarity = 0

        # ----------------------------------------------------
        # Calculate expenditure similarity
        # ----------------------------------------------------

        expenditure_similarity = 0

        if "total_expenditure" in group.columns:

            expenditures = (
                group[
                    "total_expenditure"
                ]
                .dropna()
            )

            if len(expenditures) >= 2:

                exp_min = expenditures.min()
                exp_max = expenditures.max()

                if exp_max > 0:

                    expenditure_similarity = (
                        exp_min / exp_max
                    )

        # ----------------------------------------------------
        # Calculate candidate score
        # ----------------------------------------------------

        score = 0
        evidence = []

        # Same MP
        if group["mp_name"].nunique() == 1:

            score += 20
            evidence.append(
                "Same MP"
            )

        # Same IDA
        if (
            "ida" in group.columns
            and group["ida"].nunique() == 1
            and group["ida"].iloc[0] != ""
        ):

            score += 20
            evidence.append(
                "Same IDA"
            )

        # Same constituency
        if (
            "constituency" in group.columns
            and group["constituency"].nunique() == 1
            and group["constituency"].iloc[0] != ""
        ):

            score += 10
            evidence.append(
                "Same constituency"
            )

        # Same category
        if (
            "category" in group.columns
            and group["category"].nunique() == 1
            and group["category"].iloc[0] != ""
        ):

            score += 10
            evidence.append(
                "Same category"
            )

        # Same recommendation period
        if (
            "recommendation_year" in group.columns
            and group["recommendation_year"].nunique() == 1
        ):

            score += 5
            evidence.append(
                "Same recommendation year"
            )

        if (
            "recommendation_month" in group.columns
            and group["recommendation_month"].nunique() == 1
        ):

            score += 5
            evidence.append(
                "Same recommendation month"
            )

        # Similar amount
        if amount_similarity >= 0.99:

            score += 20

            evidence.append(
                "Recommended amounts within 1%"
            )

        elif amount_similarity >= 0.95:

            score += 10

            evidence.append(
                "Recommended amounts within 5%"
            )

        # Similar expenditure
        if expenditure_similarity >= 0.99:

            score += 5

            evidence.append(
                "Expenditures within 1%"
            )

        # ----------------------------------------------------
        # Require strong evidence
        # ----------------------------------------------------

        if score < DUPLICATE_SCORE_THRESHOLD:

            continue

        suspicious_groups += 1

        current_group_id = (
            f"DUP-{group_id:05d}"
        )

        group_id += 1

        # ----------------------------------------------------
        # Create one row per project
        # ----------------------------------------------------

        for _, row in group.iterrows():

            candidates.append({

                "group_id":
                    current_group_id,

                "work_id":
                    row["work_id"],

                "state":
                    row["state"],

                "mp_name":
                    row["mp_name"],

                "ida":
                    row["ida"],

                "constituency":
                    row["constituency"],

                "category":
                    row["category"],

                "recommended_amount":
                    row["recommended_amount"],

                "sanction_amount":
                    row["sanction_amount"],

                "total_expenditure":
                    row["total_expenditure"],

                "recommendation_year":
                    row["recommendation_year"],

                "recommendation_month":
                    row["recommendation_month"],

                "group_size":
                    len(group),

                "amount_similarity":
                    round(
                        amount_similarity * 100,
                        2
                    ),

                "expenditure_similarity":
                    round(
                        expenditure_similarity * 100,
                        2
                    ),

                "duplicate_candidate_score":
                    score,

                "classification":
                    "POTENTIAL DUPLICATE GROUP",

                "evidence":
                    " | ".join(
                        evidence
                    ),

                "manual_verification_required":
                    True
            })

    print(
        f"Candidate groups examined: "
        f"{total_groups:,}"
    )

    print(
        f"Suspicious groups found: "
        f"{suspicious_groups:,}"
    )

    print(
        f"Projects in candidate groups: "
        f"{len(candidates):,}"
    )

    return pd.DataFrame(
        candidates
    )


# ============================================================
# SAVE RESULTS
# ============================================================

def save_results(results):

    results.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\n" + "=" * 70)
    print("DUPLICATE DETECTION COMPLETE")
    print("=" * 70)

    print(
        f"Output: {OUTPUT_FILE}"
    )

    print(
        f"Candidate projects: "
        f"{len(results):,}"
    )

    if len(results) > 0:

        print("\nCandidate groups:")

        print(
            results[
                "group_id"
            ]
            .nunique()
        )

        print(
            "\nLargest groups:"
        )

        print(
            results[
                [
                    "group_id",
                    "group_size",
                    "duplicate_candidate_score",
                    "evidence"
                ]
            ]
            .drop_duplicates(
                "group_id"
            )
            .sort_values(
                "duplicate_candidate_score",
                ascending=False
            )
            .head(20)
            .to_string(
                index=False
            )
        )


# ============================================================
# MAIN
# ============================================================

def main():

    df = load_data()

    df = prepare_data(
        df
    )

    results = create_candidate_groups(
        df
    )

    if results.empty:

        print(
            "\nNo strong duplicate "
            "candidate groups found."
        )

        results.to_csv(
            OUTPUT_FILE,
            index=False
        )

        return

    save_results(
        results
    )


if __name__ == "__main__":

    main()