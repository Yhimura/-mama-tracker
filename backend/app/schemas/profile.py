import uuid
from datetime import date, datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ProfileBase(BaseModel):
    start_date: Optional[date] = Field(None, description="Дата последних месячных (LMP)")
    conception_date: Optional[date] = Field(None, description="Дата зачатия (опционально)")
    estimated_due_date: Optional[date] = Field(None, description="Предполагаемая дата родов (EDD)")
    initial_weight: Optional[float] = Field(None, ge=30.0, le=250.0, description="Вес до беременности (кг)")


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    start_date: Optional[date] = None
    conception_date: Optional[date] = None
    estimated_due_date: Optional[date] = None
    initial_weight: Optional[float] = None
    is_active: Optional[bool] = None


class FetalInfoDto(BaseModel):
    week: int
    fruit_name: str
    fruit_emoji: str
    weight_grams: Optional[int] = None
    length_cm: Optional[float] = None
    description: str


class PregnancyCalculationDto(BaseModel):
    current_week: int
    current_day: int
    days_pregnant_total: int
    days_left: int
    trimester: int
    trimester_title: str
    fetal_info: FetalInfoDto


class ProfileResponse(ProfileBase):
    id: uuid.UUID
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    calculation: Optional[PregnancyCalculationDto] = None

    class Config:
        from_attributes = True
