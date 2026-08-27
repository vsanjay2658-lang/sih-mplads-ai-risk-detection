import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "MPLADS_FINAL_RISK_EXPLAINABLE.csv"
)

df = pd.read_csv(FILE, low_memory=False)

print("=" * 70)
print("MPLADS RISK ENGINE VALIDATION")
print("=" * 70)

print(f"\nProjects: {len(df):,}")

# ------------------------------------------------------------
# 1. Risk distribution
# ------------------------------------------------------------

print("\nRISK DISTRIBUTION")
print("-" * 40)

print(
    df["final_risk_level"]
    .value_counts()
)

# ------------------------------------------------------------
# 2. Score statistics
# ------------------------------------------------------------

print("\nRISK SCORE STATISTICS")
print("-" * 40)

print(
    df["final_risk_score"]
    .describe()
)

# ------------------------------------------------------------
# 3. Score validation
# ------------------------------------------------------------

components = [
    "financial_risk",
    "payment_risk",
    "vendor_risk",
    "delay_risk",
    "peer_risk",
    "ml_risk"
]

calculated = (
    df[components]
    .fillna(0)
    .sum(axis=1)
    .round(2)
)

difference = (
    calculated
    - df["final_risk_score"]
).abs()

print("\nSCORE CONSISTENCY")
print("-" * 40)

print(
    f"Maximum difference: {difference.max()}"
)

print(
    f"Mismatched rows: {(difference > 0.01).sum():,}"
)

print(
    f"Scores > 100: {(df['final_risk_score'] > 100).sum():,}"
)

# ------------------------------------------------------------
# 4. CRITICAL projects
# ------------------------------------------------------------

print("\nCRITICAL PROJECTS")
print("-" * 40)

critical = (
    df[
        df["final_risk_level"] == "CRITICAL"
    ]
    .sort_values(
        "final_risk_score",
        ascending=False
    )
)

critical_columns = [
    "work_id",
    "state",
    "final_risk_score",
    "primary_evidence",
    "supporting_evidence",
    "evidence_confidence"
]

print(
    critical[
        critical_columns
    ].to_string(index=False)
)

# ------------------------------------------------------------
# 5. HIGH projects
# ------------------------------------------------------------

print("\nTOP 20 HIGH-RISK PROJECTS")
print("-" * 40)

high = (
    df[
        df["final_risk_level"] == "HIGH"
    ]
    .sort_values(
        "final_risk_score",
        ascending=False
    )
    .head(20)
)

print(
    high[
        critical_columns
    ].to_string(index=False)
)

# ------------------------------------------------------------
# 6. Primary evidence
# ------------------------------------------------------------

print("\nPRIMARY EVIDENCE")
print("-" * 40)

print(
    df["primary_evidence"]
    .value_counts()
)

# ------------------------------------------------------------
# 7. Confidence
# ------------------------------------------------------------

print("\nEVIDENCE CONFIDENCE")
print("-" * 40)

print(
    df["evidence_confidence"]
    .describe()
)

# ------------------------------------------------------------
# 8. High risk with weak confidence
# ------------------------------------------------------------

print("\nHIGH/CRITICAL WITH LOW CONFIDENCE")
print("-" * 40)

weak = df[
    df["final_risk_level"].isin(
        ["HIGH", "CRITICAL"]
    )
    &
    (df["evidence_confidence"] < 50)
]

print(
    f"Count: {len(weak):,}"
)

if len(weak) > 0:

    print(
        weak[
            critical_columns
        ]
        .head(20)
        .to_string(index=False)
    )

print("\nVALIDATION COMPLETE")