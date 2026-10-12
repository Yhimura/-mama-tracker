from datetime import date
from typing import List, Optional, Dict
from pydantic import BaseModel


class MetricPoint(BaseModel):
    date: date
    value: float


class ToxicosisSummary(BaseModel):
    average_nausea: float
    max_nausea: int
    days_with_vomiting: int


class AnalyticsSummaryResponse(BaseModel):
    days_count: int
    logged_days_count: int
    average_energy: float
    toxicosis: ToxicosisSummary
    weight_dynamics: List[MetricPoint]
    nausea_dynamics: List[MetricPoint]
    water_dynamics: List[MetricPoint]
    kicks_dynamics: List[MetricPoint]
    top_symptoms: Dict[str, int]


class DoctorReportResponse(BaseModel):
    period_start: date
    period_end: date
    patient_name: str
    gestational_age: str
    total_days_logged: int
    average_blood_pressure: Optional[str] = None
    weight_change: Optional[str] = None
    frequent_symptoms: List[str]
    notes_and_questions: List[str]
    formatted_markdown_text: str
