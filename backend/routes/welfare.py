from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/welfare", tags=["Welfare Reallocation Engine"])

CONSTITUENCY_SURPLUS_DATA = [
  {
    "constituency": "Barrackpur",
    "state": "West Bengal",
    "mp_name": "Partha Bhowmick",
    "completed_works_count": 48,
    "surplus_cr": 4.12,
    "surplus_raw": 41200000,
    "recommended_works": [
      {
        "id": "REC-WB-01",
        "title": "Solar Mini-Grid for 12 Anganwadi Centers",
        "estimated_cost_lakhs": 45.0,
        "category": "Clean Energy",
        "beneficiaries": "1,400+ Children & Mothers",
        "impact_score": 96
      },
      {
        "id": "REC-WB-02",
        "title": "Community RO Drinking Water Filtration Plant (Ward 4 & 7)",
        "estimated_cost_lakhs": 28.5,
        "category": "Drinking Water",
        "beneficiaries": "6,500 Residents",
        "impact_score": 94
      },
      {
        "id": "REC-WB-03",
        "title": "Government Secondary School STEM & Robotics Lab",
        "estimated_cost_lakhs": 35.0,
        "category": "Education",
        "beneficiaries": "850 High School Students",
        "impact_score": 91
      }
    ]
  },
  {
    "constituency": "Hamirpur",
    "state": "Himachal Pradesh",
    "mp_name": "Anurag Singh Thakur",
    "completed_works_count": 35,
    "surplus_cr": 3.45,
    "surplus_raw": 34500000,
    "recommended_works": [
      {
        "id": "REC-HP-01",
        "title": "Remote Village Telemedicine Diagnostic Kiosk",
        "estimated_cost_lakhs": 38.0,
        "category": "Healthcare",
        "beneficiaries": "4,200 Hill Tribe Residents",
        "impact_score": 95
      },
      {
        "id": "REC-HP-02",
        "title": "Rainwater Harvesting & Check-Dam for Apple Orchards",
        "estimated_cost_lakhs": 52.0,
        "category": "Agriculture Water",
        "beneficiaries": "1,100 Small Farmers",
        "impact_score": 93
      }
    ]
  },
  {
    "constituency": "Jodhpur",
    "state": "Rajasthan",
    "mp_name": "Gajendra Singh Shekhawat",
    "completed_works_count": 52,
    "surplus_cr": 5.28,
    "surplus_raw": 52800000,
    "recommended_works": [
      {
        "id": "REC-RJ-01",
        "title": "Solar Powered Deep-Tubewell Water Kiosks (5 Villages)",
        "estimated_cost_lakhs": 65.0,
        "category": "Drinking Water",
        "beneficiaries": "8,900 Rural Citizens",
        "impact_score": 98
      }
    ]
  }
]

class MemoRequest(BaseModel):
    constituency: str
    state: str
    mp_name: str
    total_allocated_lakhs: float
    selected_works: List[Dict[str, Any]]

@router.get("/constituencies")
async def get_surplus_constituencies():
    """
    Returns constituency-level verified unspent fund balances and AI recommendations.
    """
    return {
        "status": "success",
        "national_surplus_total_cr": 103.69,
        "national_completed_works_with_surplus": 5951,
        "constituencies": CONSTITUENCY_SURPLUS_DATA
    }

@router.post("/generate-memo")
async def generate_reallocation_memo(payload: MemoRequest):
    """
    Generates official Rule 3.12 Government Memorandum.
    """
    return {
        "status": "success",
        "memo_number": f"MEMO/MPLADS/REALLOC/{payload.constituency.upper()}/2026",
        "rule_reference": "MPLADS Operational Guidelines Rule 3.12 (Re-sanction of Unspent Surplus Balances)",
        "constituency": payload.constituency,
        "state": payload.state,
        "mp_name": payload.mp_name,
        "total_reallocated_lakhs": payload.total_allocated_lakhs,
        "selected_works_count": len(payload.selected_works)
    }
