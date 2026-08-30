import os
import math
import pandas as pd

from dotenv import load_dotenv
from supabase import create_client


# ============================================================
# CONFIG
# ============================================================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

CSV_PATH = (
    "/Users/nithish/Documents/SIH/"
    "sih-mplads-ai-risk-detection/data/processed/"
    "MPLADS_FINAL_RISK_EXPLAINABLE.csv"
)

# Existing dataset
DATASET_ID = 2

# Number of risk records sent per request
BATCH_SIZE = 2000

# Number of project IDs requested per Supabase query
FETCH_BATCH_SIZE = 100


# ============================================================
# SUPABASE CONNECTION
# ============================================================

if not SUPABASE_URL:
    raise ValueError(
        "SUPABASE_URL environment variable is missing."
    )

if not SUPABASE_KEY:
    raise ValueError(
        "SUPABASE_KEY environment variable is missing."
    )

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


# ============================================================
# SAFE VALUE CLEANING
# ============================================================

def clean_value(value):

    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass

    # Convert numpy scalar to Python scalar
    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass

    # Convert 0.0 -> 0
    if isinstance(value, float):

        if math.isnan(value):
            return None

        if value.is_integer():
            return int(value)

    return value


# ============================================================
# START
# ============================================================

print("=" * 60)
print("MPLADS RISK-ONLY SUPABASE IMPORT")
print("=" * 60)

print(f"\nDataset ID: {DATASET_ID}")


# ============================================================
# LOAD CSV
# ============================================================

print("\nLoading CSV...")

df = pd.read_csv(CSV_PATH)

print(
    f"Projects in CSV: {len(df):,}"
)


# ============================================================
# VALIDATE CSV
# ============================================================

required_columns = [
    "work_id",
    "risk_score",
    "final_risk_score",
    "risk_level"
]

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:

    raise ValueError(
        "Missing CSV columns:\n"
        + "\n".join(missing_columns)
    )


missing_risk = df["risk_score"].isna().sum()

missing_final_risk = (
    df["final_risk_score"].isna().sum()
)

print("\nRisk score validation")
print("-" * 40)

print(
    f"Missing risk_score: "
    f"{missing_risk:,}"
)

print(
    f"Missing final_risk_score: "
    f"{missing_final_risk:,}"
)

if missing_risk > 0:

    raise ValueError(
        "CSV contains NULL risk_score values."
    )

print("Risk score validation: OK")


# ============================================================
# RISK COLUMNS
# ============================================================

RISK_COLUMNS = [

    "financial_risk",
    "payment_risk",
    "vendor_risk",
    "delay_risk",
    "peer_risk",
    "ml_risk",

    "ml_raw_score",

    "risk_score",
    "risk_level",

    "primary_evidence",
    "supporting_evidence",

    "evidence_confidence",

    "review_priority",
    "recommended_action",

    "primary_risk_driver",

    "available_risk_components",
    "missing_risk_components",

    "final_risk_explanation",
    "final_recommended_action",

    "final_risk_level",
    "final_risk_score",

    "final_review_priority",

    "officer_explanation"
]


# ============================================================
# FETCH EXISTING PROJECT IDS
# ============================================================

print("\n" + "=" * 60)
print("FETCHING EXISTING PROJECT IDs")
print("=" * 60)

project_id_map = {}

total_projects = len(df)

total_fetch_batches = (
    total_projects
    + FETCH_BATCH_SIZE
    - 1
) // FETCH_BATCH_SIZE


for start in range(
    0,
    total_projects,
    FETCH_BATCH_SIZE
):

    end_index = min(
        start + FETCH_BATCH_SIZE,
        total_projects
    )

    batch_df = df.iloc[
        start:end_index
    ]

    work_ids = (
        batch_df["work_id"]
        .dropna()
        .astype(str)
        .tolist()
    )

    if not work_ids:
        continue

    response = (
        supabase
        .table("projects")
        .select("id,work_id")
        .eq(
            "dataset_id",
            DATASET_ID
        )
        .in_(
            "work_id",
            work_ids
        )
        .execute()
    )

    for project in response.data:

        work_id = project.get("work_id")
        project_id = project.get("id")

        if (
            work_id is not None
            and project_id is not None
        ):

            project_id_map[
                work_id
            ] = project_id

    batch_number = (
        start // FETCH_BATCH_SIZE
    ) + 1

    print(
        f"Fetched: "
        f"{end_index:,}/{total_projects:,} "
        f"({batch_number}/{total_fetch_batches})"
    )


# ============================================================
# VERIFY PROJECT MAPPING
# ============================================================

print("\n" + "-" * 60)

print(
    f"Project IDs found: "
    f"{len(project_id_map):,}"
)

if len(project_id_map) == total_projects:

    print(
        "Project mapping: COMPLETE"
    )

else:

    missing_count = (
        total_projects
        - len(project_id_map)
    )

    print(
        f"WARNING: "
        f"{missing_count:,} projects "
        f"could not be mapped."
    )


# ============================================================
# PREPARE RISK RECORDS
# ============================================================

print("\n" + "=" * 60)
print("PREPARING RISK ASSESSMENTS")
print("=" * 60)

risk_rows = []

skipped_projects = 0


for _, row in df.iterrows():

    work_id = row["work_id"]

    project_id = project_id_map.get(
        work_id
    )

    if project_id is None:

        skipped_projects += 1

        continue


    record = {}


    # --------------------------------------------------------
    # COPY RISK COLUMNS
    # --------------------------------------------------------

    for column in RISK_COLUMNS:

        if column in row.index:

            record[column] = clean_value(
                row[column]
            )

        else:

            record[column] = None


    # --------------------------------------------------------
    # RISK SCORE MUST EXIST
    # --------------------------------------------------------

    if record.get("risk_score") is None:

        print("\n" + "=" * 60)
        print("ERROR: NULL RISK SCORE")
        print("=" * 60)

        print(
            "Work ID:",
            work_id
        )

        print(
            "CSV risk_score:",
            row["risk_score"]
        )

        print(
            "CSV final_risk_score:",
            row["final_risk_score"]
        )

        raise ValueError(
            f"risk_score is NULL for {work_id}"
        )


    # --------------------------------------------------------
    # LINK RISK ASSESSMENT TO PROJECT
    # --------------------------------------------------------

    record["project_id"] = project_id

    risk_rows.append(record)


print(
    f"\nRisk records prepared: "
    f"{len(risk_rows):,}"
)

print(
    f"Skipped projects: "
    f"{skipped_projects:,}"
)


# ============================================================
# IMPORT RISK ASSESSMENTS
# ============================================================

print("\n" + "=" * 60)
print("IMPORTING RISK ASSESSMENTS")
print("=" * 60)


total_risk_records = len(
    risk_rows
)

total_risk_batches = (
    total_risk_records
    + BATCH_SIZE
    - 1
) // BATCH_SIZE


for start in range(
    0,
    total_risk_records,
    BATCH_SIZE
):

    end_index = min(
        start + BATCH_SIZE,
        total_risk_records
    )

    batch = risk_rows[
        start:end_index
    ]


    # --------------------------------------------------------
    # FINAL VALIDATION
    # --------------------------------------------------------

    for record in batch:

        if record.get(
            "project_id"
        ) is None:

            raise ValueError(
                "NULL project_id detected."
            )

        if record.get(
            "risk_score"
        ) is None:

            raise ValueError(
                "NULL risk_score detected."
            )


    # --------------------------------------------------------
    # UPSERT
    # --------------------------------------------------------

    (
        supabase
        .table("risk_assessments")
        .upsert(
            batch,
            on_conflict="project_id"
        )
        .execute()
    )


    batch_number = (
        start // BATCH_SIZE
    ) + 1


    print(
        f"Risk records: "
        f"{end_index:,}/"
        f"{total_risk_records:,} "
        f"({batch_number}/"
        f"{total_risk_batches})"
    )


# ============================================================
# VERIFY DATABASE
# ============================================================

print("\n" + "=" * 60)
print("IMPORT COMPLETE")
print("=" * 60)

print(
    f"\nDataset ID: {DATASET_ID}"
)

print(
    f"Projects mapped: "
    f"{len(project_id_map):,}"
)

print(
    f"Risk records uploaded: "
    f"{len(risk_rows):,}"
)

print(
    "\nMPLADS risk import completed successfully."
)
