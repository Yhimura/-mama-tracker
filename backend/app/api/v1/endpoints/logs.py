import calendar
from collections import Counter
from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_current_active_profile, get_db
from app.models.user import User
from app.models.profile import PregnancyProfile
from app.models.daily_log import DailyLog
from app.schemas.daily_log import (
    DailyLogCreateOrUpdate,
    DailyLogResponse,
    CalendarDayStatus,
)
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    ToxicosisSummary,
    MetricPoint,
    DoctorReportResponse,
)
from app.services.pregnancy import calculate_gestational_age

router = APIRouter(prefix="/logs", tags=["Daily Diary Logs"])


@router.get("/calendar", response_model=List[CalendarDayStatus])
async def get_monthly_calendar_logs(
    year: int = Query(default=None, description="Год (например 2026)"),
    month: int = Query(default=None, ge=1, le=12, description="Месяц (1-12)"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns days of the given month with indicator flags (logged, nausea, energy, symptoms, kicks).
    """
    today = date.today()
    target_year = year or today.year
    target_month = month or today.month

    # Determine date range for month
    num_days = calendar.monthrange(target_year, target_month)[1]
    start_dt = date(target_year, target_month, 1)
    end_dt = date(target_year, target_month, num_days)

    stmt = (
        select(DailyLog)
        .where(
            and_(
                DailyLog.user_id == user.id,
                DailyLog.log_date >= start_dt,
                DailyLog.log_date <= end_dt,
            )
        )
    )
    result = await db.execute(stmt)
    logs_by_date = {log.log_date: log for log in result.scalars().all()}

    calendar_days: List[CalendarDayStatus] = []
    for day_num in range(1, num_days + 1):
        d = date(target_year, target_month, day_num)
        log = logs_by_date.get(d)
        if log:
            calendar_days.append(
                CalendarDayStatus(
                    date=d,
                    has_log=True,
                    nausea_level=log.nausea_level,
                    energy_level=log.energy_level,
                    water_cups=log.water_cups,
                    kick_count=log.kick_count,
                    symptoms_count=len(log.symptoms or []),
                    weight=log.weight,
                )
            )
        else:
            calendar_days.append(
                CalendarDayStatus(
                    date=d,
                    has_log=False,
                    symptoms_count=0,
                )
            )

    return calendar_days


@router.get("/by-date/{target_date}", response_model=Optional[DailyLogResponse])
async def get_daily_log_by_date(
    target_date: date,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetches daily diary log for a specific date.
    """
    stmt = select(DailyLog).where(
        DailyLog.user_id == user.id,
        DailyLog.log_date == target_date,
    )
    result = await db.execute(stmt)
    log = result.scalar_one_or_none()
    return log


@router.post("", response_model=DailyLogResponse)
async def upsert_daily_log(
    payload: DailyLogCreateOrUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates or updates the daily diary entry for specified date.
    """
    stmt = select(DailyLog).where(
        DailyLog.user_id == user.id,
        DailyLog.log_date == payload.log_date,
    )
    result = await db.execute(stmt)
    existing_log = result.scalar_one_or_none()

    if existing_log:
        # Update existing record
        existing_log.nausea_level = payload.nausea_level
        existing_log.energy_level = payload.energy_level
        existing_log.symptoms = payload.symptoms
        existing_log.water_cups = payload.water_cups
        existing_log.food_notes = payload.food_notes
        existing_log.food_tags = payload.food_tags
        existing_log.weight = payload.weight
        existing_log.blood_pressure_sys = payload.blood_pressure_sys
        existing_log.blood_pressure_dia = payload.blood_pressure_dia
        existing_log.kick_count = payload.kick_count
        existing_log.notes = payload.notes
        await db.commit()
        await db.refresh(existing_log)
        return existing_log
    else:
        # Insert new record
        new_log = DailyLog(
            user_id=user.id,
            log_date=payload.log_date,
            nausea_level=payload.nausea_level,
            energy_level=payload.energy_level,
            symptoms=payload.symptoms,
            water_cups=payload.water_cups,
            food_notes=payload.food_notes,
            food_tags=payload.food_tags,
            weight=payload.weight,
            blood_pressure_sys=payload.blood_pressure_sys,
            blood_pressure_dia=payload.blood_pressure_dia,
            kick_count=payload.kick_count,
            notes=payload.notes,
        )
        db.add(new_log)
        await db.commit()
        await db.refresh(new_log)
        return new_log


@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    days: int = Query(default=30, ge=7, le=180, description="Период в днях"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Aggregates dynamics (weight, nausea, energy, hydration, kicks) over the last N days.
    """
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    stmt = (
        select(DailyLog)
        .where(
            DailyLog.user_id == user.id,
            DailyLog.log_date >= start_date,
            DailyLog.log_date <= today,
        )
        .order_by(DailyLog.log_date.asc())
    )
    result = await db.execute(stmt)
    logs: List[DailyLog] = list(result.scalars().all())

    logged_days = len(logs)
    if not logs:
        return AnalyticsSummaryResponse(
            days_count=days,
            logged_days_count=0,
            average_energy=3.0,
            toxicosis=ToxicosisSummary(average_nausea=0.0, max_nausea=0, days_with_vomiting=0),
            weight_dynamics=[],
            nausea_dynamics=[],
            water_dynamics=[],
            kicks_dynamics=[],
            top_symptoms={},
        )

    # Dynamics points
    weight_points = [
        MetricPoint(date=l.log_date, value=round(l.weight, 1))
        for l in logs
        if l.weight is not None
    ]
    nausea_points = [MetricPoint(date=l.log_date, value=float(l.nausea_level)) for l in logs]
    water_points = [MetricPoint(date=l.log_date, value=float(l.water_cups)) for l in logs]
    kicks_points = [MetricPoint(date=l.log_date, value=float(l.kick_count)) for l in logs if l.kick_count > 0]

    # Toxicosis & Energy
    avg_energy = sum(l.energy_level for l in logs) / logged_days
    avg_nausea = sum(l.nausea_level for l in logs) / logged_days
    max_nausea = max(l.nausea_level for l in logs)
    vomiting_days = sum(1 for l in logs if l.nausea_level >= 4)

    # Top symptoms
    all_symptoms = []
    for l in logs:
        if l.symptoms:
            all_symptoms.extend(l.symptoms)
    symptom_counter = Counter(all_symptoms)

    return AnalyticsSummaryResponse(
        days_count=days,
        logged_days_count=logged_days,
        average_energy=round(avg_energy, 1),
        toxicosis=ToxicosisSummary(
            average_nausea=round(avg_nausea, 1),
            max_nausea=max_nausea,
            days_with_vomiting=vomiting_days,
        ),
        weight_dynamics=weight_points,
        nausea_dynamics=nausea_points,
        water_dynamics=water_points,
        kicks_dynamics=kicks_points,
        top_symptoms=dict(symptom_counter.most_common(8)),
    )


@router.get("/export/doctor-summary", response_model=DoctorReportResponse)
async def generate_doctor_report(
    days: int = Query(default=14, ge=7, le=60, description="Период отчета для врача"),
    user: User = Depends(get_current_user),
    profile: Optional[PregnancyProfile] = Depends(get_current_active_profile),
    db: AsyncSession = Depends(get_db),
):
    """
    Generates a structured medical report with symptoms, vitals, and questions.
    """
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    stmt = (
        select(DailyLog)
        .where(
            DailyLog.user_id == user.id,
            DailyLog.log_date >= start_date,
            DailyLog.log_date <= today,
        )
        .order_by(DailyLog.log_date.asc())
    )
    result = await db.execute(stmt)
    logs: List[DailyLog] = list(result.scalars().all())

    # Gestational info
    gestation_str = "Срок не рассчитан"
    if profile:
        calc = calculate_gestational_age(
            start_date=profile.start_date,
            estimated_due_date=profile.estimated_due_date,
        )
        gestation_str = f"{calc['current_week']} нед. {calc['current_day']} дн. ({calc['trimester_title']})"

    # Pressure
    bp_list = [
        f"{l.blood_pressure_sys}/{l.blood_pressure_dia}"
        for l in logs
        if l.blood_pressure_sys and l.blood_pressure_dia
    ]
    avg_bp = bp_list[-1] if bp_list else "Не измерялось"

    # Weight change
    weights = [l.weight for l in logs if l.weight is not None]
    if weights:
        weight_diff = weights[-1] - weights[0]
        weight_change_str = f"{weights[-1]:.1f} кг (динамика за {days} дн.: {weight_diff:+.1f} кг)"
    else:
        weight_change_str = "Данные о весе не вносились"

    # Frequent symptoms
    all_symp = []
    notes_list = []
    for l in logs:
        if l.symptoms:
            all_symp.extend(l.symptoms)
        if l.notes and l.notes.strip():
            notes_list.append(f"{l.log_date.strftime('%d.%m')}: {l.notes.strip()}")

    symp_counter = Counter(all_symp)
    top_symps = [f"{symp} ({count} дн.)" for symp, count in symp_counter.most_common(5)]

    # Markdown format
    md_lines = [
        f"📋 **ОТЧЕТ САМОЧУВСТВИЯ ДЛЯ ВРАЧА — «МамаТрекер»**",
        f"👤 Пациент: {user.first_name} {f'(@{user.username})' if user.username else ''}",
        f"🗓 Период: с {start_date.strftime('%d.%m.%Y')} по {today.strftime('%d.%m.%Y')} ({len(logs)} записей)",
        f"👶 Текущий срок: **{gestation_str}**",
        "",
        f"🩺 **ОСНОВНЫЕ ПОКАЗАТЕЛИ:**",
        f"• Артериальное давление (последнее/среднее): {avg_bp}",
        f"• Вес: {weight_change_str}",
        "",
        f"⚠️ **ЧАСТЫЕ СИМПТОМЫ И ЖАЛОБЫ:**",
    ]

    if top_symps:
        for s in top_symps:
            md_lines.append(f"• {s}")
    else:
        md_lines.append("• Жалоб и выраженных симптомов не зафиксировано")

    if notes_list:
        md_lines.append("")
        md_lines.append(f"📝 **ЗАМЕТКИ И ВОПРОСЫ К ПРИЕМУ:**")
        for note in notes_list[-5:]:
            md_lines.append(f"• {note}")

    report_markdown = "\n".join(md_lines)

    return DoctorReportResponse(
        period_start=start_date,
        period_end=today,
        patient_name=user.first_name,
        gestational_age=gestation_str,
        total_days_logged=len(logs),
        average_blood_pressure=avg_bp,
        weight_change=weight_change_str,
        frequent_symptoms=top_symps,
        notes_and_questions=notes_list[-10:],
        formatted_markdown_text=report_markdown,
    )
