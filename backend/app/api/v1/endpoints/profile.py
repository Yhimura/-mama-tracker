from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.profile import PregnancyProfile
from app.schemas.profile import (
    ProfileCreate,
    ProfileUpdate,
    ProfileResponse,
    PregnancyCalculationDto,
)
from app.services.pregnancy import calculate_gestational_age

router = APIRouter(prefix="/profile", tags=["Pregnancy Profile"])


def _attach_calculation(profile: PregnancyProfile) -> Optional[PregnancyCalculationDto]:
    try:
        calc_dict = calculate_gestational_age(
            start_date=profile.start_date,
            estimated_due_date=profile.estimated_due_date,
            conception_date=profile.conception_date,
        )
        return PregnancyCalculationDto(**calc_dict)
    except Exception:
        return None


@router.get("", response_model=Optional[ProfileResponse])
async def get_my_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns active pregnancy profile of the current user with real-time calculated week and baby data.
    """
    stmt = (
        select(PregnancyProfile)
        .where(PregnancyProfile.user_id == user.id, PregnancyProfile.is_active.is_(True))
        .order_by(PregnancyProfile.created_at.desc())
    )
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        return None

    calc_dto = _attach_calculation(profile)
    response_data = ProfileResponse.model_validate(profile)
    response_data.calculation = calc_dto
    return response_data


@router.post("", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_or_replace_profile(
    payload: ProfileCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Initial onboarding: creates pregnancy profile (or marks previous as inactive).
    """
    if not payload.start_date and not payload.estimated_due_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Необходимо указать либо дату последних месячных (LMP), либо ПДР (EDD).",
        )

    # Calculate gestational age and initial week
    calc = calculate_gestational_age(
        start_date=payload.start_date,
        estimated_due_date=payload.estimated_due_date,
        conception_date=payload.conception_date,
    )

    # Deactivate older profiles
    await db.execute(
        update(PregnancyProfile)
        .where(PregnancyProfile.user_id == user.id)
        .values(is_active=False)
    )

    new_profile = PregnancyProfile(
        user_id=user.id,
        start_date=calc["start_date"],
        estimated_due_date=calc["estimated_due_date"],
        conception_date=payload.conception_date,
        current_week=calc["current_week"],
        initial_weight=payload.initial_weight,
        is_active=True,
    )
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)

    response = ProfileResponse.model_validate(new_profile)
    response.calculation = PregnancyCalculationDto(**calc)
    return response


@router.put("", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Updates active pregnancy profile information.
    """
    stmt = (
        select(PregnancyProfile)
        .where(PregnancyProfile.user_id == user.id, PregnancyProfile.is_active.is_(True))
        .order_by(PregnancyProfile.created_at.desc())
    )
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Активный профиль беременности не найден. Пройдите онбординг.",
        )

    if payload.start_date is not None:
        profile.start_date = payload.start_date
    if payload.conception_date is not None:
        profile.conception_date = payload.conception_date
    if payload.estimated_due_date is not None:
        profile.estimated_due_date = payload.estimated_due_date
    if payload.initial_weight is not None:
        profile.initial_weight = payload.initial_weight
    if payload.is_active is not None:
        profile.is_active = payload.is_active

    # Recalculate weeks
    calc = calculate_gestational_age(
        start_date=profile.start_date,
        estimated_due_date=profile.estimated_due_date,
        conception_date=profile.conception_date,
    )
    profile.current_week = calc["current_week"]
    profile.start_date = calc["start_date"]
    profile.estimated_due_date = calc["estimated_due_date"]

    await db.commit()
    await db.refresh(profile)

    response = ProfileResponse.model_validate(profile)
    response.calculation = PregnancyCalculationDto(**calc)
    return response
