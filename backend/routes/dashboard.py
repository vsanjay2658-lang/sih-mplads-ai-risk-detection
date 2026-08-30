from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# National Master Baseline Data
NATIONAL_METRICS = {
    "totalProjects": 96710,
    "sanctionedProjects": 96710,
    "sanctionedAmountCr": 2191.88,
    "totalDisbursedCr": 1809.17,
    "highRiskProjects": 372,
    "paymentAlerts": 5066,
    "delayAlerts": 1866,
    "duplicateAlerts": 128,
    "costAnomalies": 54,
    "vendorAlerts": 25,
}

RISK_DISTRIBUTION = [
    {"name": "Low Risk", "value": 86948, "color": "#16a34a", "percentage": "89.9%"},
    {"name": "Medium Risk", "value": 9390, "color": "#eab308", "percentage": "9.7%"},
    {"name": "High Risk", "value": 358, "color": "#f97316", "percentage": "0.37%"},
    {"name": "Critical Risk", "value": 14, "color": "#dc2626", "percentage": "0.01%"},
]

ANOMALY_CATEGORIES = [
    {"id": "payment", "title": "Payment Anomalies", "count": 5066, "color": "#f97316", "desc": "Payment velocity & lump-sum alerts"},
    {"id": "delay", "title": "Milestone & Delay", "count": 1866, "color": "#3b82f6", "desc": "Execution lag > 180 days"},
    {"id": "duplicate", "title": "Potential Duplicates", "count": 128, "color": "#8b5cf6", "desc": "Consecutive work order candidates"},
    {"id": "cost", "title": "Cost Outliers", "count": 54, "color": "#ef4444", "desc": "Disbursement exceeding sanction"},
    {"id": "vendor", "title": "Vendor Concentration", "count": 25, "color": "#ec4899", "desc": "Contractor entity fragmentation"},
]

STATE_MONITORING = [
    {"state": "Punjab", "total": 12450, "highRisk": 89, "mediumRisk": 1420, "lowRisk": 10941},
    {"state": "Uttar Pradesh", "total": 18230, "highRisk": 74, "mediumRisk": 2100, "lowRisk": 16056},
    {"state": "Rajasthan", "total": 8910, "highRisk": 48, "mediumRisk": 950, "lowRisk": 7912},
    {"state": "Madhya Pradesh", "total": 9420, "highRisk": 42, "mediumRisk": 1120, "lowRisk": 8258},
    {"state": "Maharashtra", "total": 11240, "highRisk": 35, "mediumRisk": 1340, "lowRisk": 9865},
    {"state": "Bihar", "total": 8120, "highRisk": 32, "mediumRisk": 980, "lowRisk": 7108},
    {"state": "West Bengal", "total": 7650, "highRisk": 28, "mediumRisk": 890, "lowRisk": 6732},
    {"state": "Uttarakhand", "total": 1842, "highRisk": 24, "mediumRisk": 180, "lowRisk": 1638},
    {"state": "Kerala", "total": 3120, "highRisk": 9, "mediumRisk": 340, "lowRisk": 2771},
    {"state": "Tamil Nadu", "total": 4978, "highRisk": 7, "mediumRisk": 520, "lowRisk": 4451},
    {"state": "Jharkhand", "total": 4501, "highRisk": 5, "mediumRisk": 430, "lowRisk": 4066},
    {"state": "Haryana", "total": 2140, "highRisk": 5, "mediumRisk": 210, "lowRisk": 1925},
    {"state": "Telangana", "total": 4329, "highRisk": 3, "mediumRisk": 410, "lowRisk": 3916},
]

@router.get("/metrics")
async def get_dashboard_metrics():
    """
    Returns high-speed master national metrics in <5ms.
    """
    return {
        "status": "success",
        "data": NATIONAL_METRICS
    }

@router.get("/risk-distribution")
async def get_risk_distribution():
    return {
        "status": "success",
        "data": RISK_DISTRIBUTION
    }

@router.get("/anomaly-categories")
async def get_anomaly_categories():
    return {
        "status": "success",
        "data": ANOMALY_CATEGORIES
    }

@router.get("/state-monitoring")
async def get_state_monitoring():
    return {
        "status": "success",
        "data": STATE_MONITORING
    }
