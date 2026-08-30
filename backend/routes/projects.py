from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
import pandas as pd
from pathlib import Path

router = APIRouter(prefix="/projects", tags=["Projects"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
FINAL_CSV = BASE_DIR / "data" / "processed" / "MPLADS_FINAL_RISK_RESULTS.csv"

_CACHED_DF: Optional[pd.DataFrame] = None

def load_projects_df() -> pd.DataFrame:
    global _CACHED_DF
    if _CACHED_DF is not None:
        return _CACHED_DF
    if FINAL_CSV.exists():
        _CACHED_DF = pd.read_csv(FINAL_CSV, low_memory=False)
        return _CACHED_DF
    return pd.DataFrame()

@router.get("")
async def get_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    search: Optional[str] = None,
    state: Optional[str] = None,
    risk_level: Optional[str] = None,
):
    """
    Returns paginated and filtered project queue.
    """
    df = load_projects_df()
    if df.empty:
        return {"total": 0, "page": page, "page_size": page_size, "items": []}

    # Filter state
    if state and state.lower() != "all":
        df = df[df["state"].astype(str).str.lower() == state.lower()]

    # Filter risk level
    if risk_level and risk_level.lower() != "all":
        if risk_level.lower() == "high":
            df = df[df["final_risk_level"].isin(["HIGH", "CRITICAL"])]
        elif risk_level.lower() == "medium":
            df = df[df["final_risk_level"] == "MEDIUM"]
        elif risk_level.lower() == "low":
            df = df[df["final_risk_level"] == "LOW"]

    # Search
    if search:
        q = search.lower()
        mask = (
            df["work_id"].astype(str).str.lower().str.contains(q, na=False) |
            df["state"].astype(str).str.lower().str.contains(q, na=False) |
            df["category"].astype(str).str.lower().str.contains(q, na=False)
        )
        df = df[mask]

    total = len(df)
    start = (page - 1) * page_size
    end = start + page_size
    items = df.iloc[start:end].fillna("").to_dict(orient="records")

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "items": items
    }

@router.get("/high-risk")
async def get_high_risk_projects(limit: int = Query(50, ge=1, le=500)):
    """
    Returns top high and critical risk works sorted by risk score.
    """
    df = load_projects_df()
    if df.empty:
        return {"total": 0, "items": []}

    high_risk_df = df[df["final_risk_level"].isin(["HIGH", "CRITICAL"]) | (df["final_risk_score"] >= 50)]
    high_risk_df = high_risk_df.sort_values(by="final_risk_score", ascending=False).head(limit)
    items = high_risk_df.fillna("").to_dict(orient="records")

    return {
        "total": len(high_risk_df),
        "items": items
    }

@router.get("/{work_id}")
async def get_project_by_id(work_id: str):
    """
    Returns complete single project intelligence breakdown.
    """
    df = load_projects_df()
    if df.empty:
        raise HTTPException(status_code=404, detail="Dataset unavailable")

    match = df[df["work_id"] == work_id]
    if match.empty:
        raise HTTPException(status_code=404, detail="Project not found")

    return match.iloc[0].fillna("").to_dict()
