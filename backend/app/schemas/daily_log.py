import uuid
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class DailyLogBase(BaseModel):
    log_date: date = Field(..., description="Дата дневника")
    nausea_level: int = Field(0, ge=0, le=5, description="Уровень тошноты / токсикоза (0-5)")
    energy_level: int = Field(3, ge=1, le=5, description="Уровень энергии (1-5)")
    symptoms: List[str] = Field(default_factory=list, description="Список активных симптомов")
    water_cups: int = Field(0, ge=0, le=30, description="Количество выпитых стаканов воды (по 250 мл)")
    food_notes: Optional[str] = Field(None, max_length=1000, description="Что кушала сегодня")
    food_tags: List[str] = Field(default_factory=list, description="Теги питания (аппетит, тяга и т.д.)")
    weight: Optional[float] = Field(None, ge=30.0, le=250.0, description="Текущий вес за день (кг)")
    blood_pressure_sys: Optional[int] = Field(None, ge=50, le=250, description="Систолическое давление (верхнее)")
    blood_pressure_dia: Optional[int] = Field(None, ge=30, le=150, description="Диастолическое давление (нижнее)")
    kick_count: int = Field(0, ge=0, le=200, description="Счетчик толчков / шевелений")
    notes: Optional[str] = Field(None, max_length=2000, description="Личные мысли или вопросы к врачу")


class DailyLogCreateOrUpdate(DailyLogBase):
    pass


class DailyLogResponse(DailyLogBase):
    id: uuid.UUID
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CalendarDayStatus(BaseModel):
    date: date
    has_log: bool
    nausea_level: Optional[int] = None
    energy_level: Optional[int] = None
    water_cups: Optional[int] = None
    kick_count: Optional[int] = None
    symptoms_count: int = 0
    weight: Optional[float] = None
