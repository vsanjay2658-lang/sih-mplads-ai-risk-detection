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
    / "MPLADS_FINAL_RISK_RESULTS.csv"
)


# ============================================================
# COMPONENTS
# ============================================================

RISK_COMPONENTS = [
    "financial_risk",
    "payment_risk",
    "vendor_risk",
    "delay_risk",
    "peer_risk",
    "ml_risk"
]


# Maximum possible contribution of each component
MAX_COMPONENTS = {
    "financial_risk": 15,
    "payment_risk": 20,
    "vendor_risk": 15,
    "delay_risk": 15,
    "peer_risk": 10,
    "ml_risk": 15
}


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    print("=" * 70)
    print("MPLADS FINAL RISK ENGINE V2")
    print("=" * 70)

    df = pd.read_csv(
        INPUT_FILE,
        low_memory=False
    )

    print(
        f"Projects : {len(df):,}"
    )

    print(
        f"Columns  : {len(df.columns)}"
    )

    return df


# ============================================================
# VALIDATE
# ============================================================

def validate_columns(df):

    required = [
        "work_id",
        "state",
        "mp_name"
    ] + RISK_COMPONENTS

    missing = [
        column
        for column in required
        if column not in df.columns
    ]

    if missing:

        raise ValueError(
            "Missing columns: "
            + ", ".join(missing)
        )

    print(
        "\nRequired columns validated ✓"
    )


# ============================================================
# PREPARE COMPONENTS
# ============================================================

def prepare_components(df):

    print(
        "\nPreparing risk components..."
    )

    for column in RISK_COMPONENTS:

        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )

        # Prevent impossible values
        df[column] = df[column].clip(
            lower=0
        )

    return df


# ============================================================
# CALCULATE FINAL SCORE
# ============================================================

def calculate_final_score(df):

    print(
        "\nCalculating final risk score..."
    )

    # --------------------------------------------------------
    # Preserve information about missing evidence
    # --------------------------------------------------------

    df["missing_risk_components"] = (
        df[RISK_COMPONENTS]
        .isna()
        .sum(axis=1)
    )

    df["available_risk_components"] = (
        df[RISK_COMPONENTS]
        .notna()
        .sum(axis=1)
    )

    # --------------------------------------------------------
    # Missing component contributes ZERO to score.
    #
    # IMPORTANT:
    # This is NOT saying risk is zero.
    # It means there is insufficient evidence to calculate
    # that component.
    # --------------------------------------------------------

    score_components = (
        df[RISK_COMPONENTS]
        .fillna(0)
    )

    df["final_risk_score"] = (
        score_components
        .sum(axis=1)
        .clip(0, 100)
        .round(2)
    )

    return df


# ============================================================
# RISK LEVEL
# ============================================================

def assign_risk_level(df):

    print(
        "\nAssigning risk levels..."
    )

    def classify(score):

        if score >= 70:
            return "CRITICAL"

        elif score >= 50:
            return "HIGH"

        elif score >= 25:
            return "MEDIUM"

        else:
            return "LOW"

    df["final_risk_level"] = (
        df["final_risk_score"]
        .apply(classify)
    )

    return df


# ============================================================
# PRIMARY DRIVER
# ============================================================

def calculate_primary_driver(df):

    print(
        "\nCalculating primary risk drivers..."
    )

    # Convert component names into readable names
    names = {
        "financial_risk": "Financial",
        "payment_risk": "Payment",
        "vendor_risk": "Vendor",
        "delay_risk": "Delay",
        "peer_risk": "Peer",
        "ml_risk": "ML"
    }

    def find_driver(row):

        values = {}

        for column in RISK_COMPONENTS:

            value = row[column]

            if pd.notna(value):

                values[
                    names[column]
                ] = value

        if not values:

            return "Insufficient Evidence"

        return max(
            values,
            key=values.get
        )

    df["primary_risk_driver"] = (
        df.apply(
            find_driver,
            axis=1
        )
    )

    return df


# ============================================================
# EVIDENCE CONFIDENCE
# ============================================================

def calculate_confidence(df):

    print(
        "\nCalculating evidence confidence..."
    )

    # --------------------------------------------------------
    # Base confidence
    # --------------------------------------------------------

    df["evidence_confidence"] = (
        (
            df["available_risk_components"]
            /
            len(RISK_COMPONENTS)
        )
        * 100
    )

    # --------------------------------------------------------
    # Round
    # --------------------------------------------------------

    df["evidence_confidence"] = (
        df["evidence_confidence"]
        .round(1)
    )

    return df


# ============================================================
# REVIEW PRIORITY
# ============================================================

def calculate_priority(df):

    print(
        "\nCalculating review priority..."
    )

    def priority(row):

        score = row[
            "final_risk_score"
        ]

        confidence = row[
            "evidence_confidence"
        ]

        # High score + reasonable evidence
        if (
            score >= 70
            and confidence >= 50
        ):

            return "P1 - Immediate Review"

        elif (
            score >= 50
            and confidence >= 50
        ):

            return "P2 - High Priority"

        elif score >= 25:

            return "P3 - Monitor"

        else:

            return "P4 - Routine"

    df["final_review_priority"] = (
        df.apply(
            priority,
            axis=1
        )
    )

    return df


# ============================================================
# GENERATE EXPLANATION
# ============================================================

def generate_explanation(df):

    print(
        "\nGenerating final explanations..."
    )

    def explain(row):

        evidence = []

        mapping = {
            "financial_risk":
                "Financial anomalies",

            "payment_risk":
                "Payment anomalies",

            "vendor_risk":
                "Vendor anomalies",

            "delay_risk":
                "Project delay anomalies",

            "peer_risk":
                "Unusual compared with peer projects",

            "ml_risk":
                "ML detected unusual characteristics"
        }

        for column, label in mapping.items():

            value = row[column]

            if (
                pd.notna(value)
                and value > 0
            ):

                evidence.append(
                    label
                )

        if not evidence:

            return "No significant risk evidence detected"

        return " | ".join(evidence)

    df["final_risk_explanation"] = (
        df.apply(
            explain,
            axis=1
        )
    )

    return df


# ============================================================
# SAVE
# ============================================================

def save_results(df):

    # --------------------------------------------------------
    # Important columns first
    # --------------------------------------------------------

    first_columns = [

        "work_id",
        "state",
        "mp_name",

        "final_risk_score",
        "final_risk_level",

        "final_review_priority",

        "financial_risk",
        "payment_risk",
        "vendor_risk",
        "delay_risk",
        "peer_risk",
        "ml_risk",

        "primary_risk_driver",

        "available_risk_components",
        "missing_risk_components",

        "evidence_confidence",

        "final_risk_explanation",

        "recommended_action"

    ]

    first_columns = [
        column
        for column in first_columns
        if column in df.columns
    ]

    remaining_columns = [
        column
        for column in df.columns
        if column not in first_columns
    ]

    df = df[
        first_columns
        + remaining_columns
    ]

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print(
        "\n" + "=" * 70
    )

    print(
        "FINAL RISK ENGINE V2 COMPLETE"
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

    print(
        "\nRisk distribution:"
    )

    print(
        df[
            "final_risk_level"
        ].value_counts()
    )

    print(
        "\nRisk statistics:"
    )

    print(
        df[
            "final_risk_score"
        ].describe()
    )

    print(
        "\nPrimary risk drivers:"
    )

    print(
        df[
            "primary_risk_driver"
        ].value_counts()
    )

    print(
        "\nEvidence confidence:"
    )

    print(
        df[
            "evidence_confidence"
        ].describe()
    )


# ============================================================
# MAIN
# ============================================================

def main():

    df = load_data()

    validate_columns(
        df
    )

    df = prepare_components(
        df
    )

    df = calculate_final_score(
        df
    )

    df = assign_risk_level(
        df
    )

    df = calculate_primary_driver(
        df
    )

    df = calculate_confidence(
        df
    )

    df = calculate_priority(
        df
    )

    df = generate_explanation(
        df
    )

    save_results(
        df
    )


if __name__ == "__main__":

    main()