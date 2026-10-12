from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import TelegramInitData, TelegramUserData, validate_telegram_init_data
from app.models.user import User
from app.models.profile import PregnancyProfile


async def get_telegram_auth_data(
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_dev_user_id: Optional[str] = Header(None, alias="X-Dev-User-Id"),
) -> TelegramInitData:
    """
    Extracts and verifies Telegram Web App initData.
    Accepts:
      1. 'X-Telegram-Init-Data' header
      2. 'Authorization: tma <initData>' header
      3. Dev bypass via 'X-Dev-User-Id' if ALLOW_DEV_AUTH_BYPASS is enabled
    """
    init_data_raw = x_telegram_init_data

    if not init_data_raw and authorization and authorization.startswith("tma "):
        init_data_raw = authorization.split(" ", 1)[1].strip()

    # Allow local development testing outside Telegram if configured
    if not init_data_raw and settings.ALLOW_DEV_AUTH_BYPASS:
        mock_user_id = int(x_dev_user_id) if x_dev_user_id and x_dev_user_id.isdigit() else 999999999
        return TelegramInitData(
            query_id="dev_query_id",
            user=TelegramUserData(
                id=mock_user_id,
                first_name="Мама (Тест)",
                username="test_mom",
                language_code="ru",
            ),
            auth_date=int(9999999999),
            hash="dev_mock_hash",
        )

    if not init_data_raw:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header 'X-Telegram-Init-Data' or 'Authorization: tma ...' is required",
        )

    return validate_telegram_init_data(init_data_raw=init_data_raw)


async def get_current_user(
    auth_data: TelegramInitData = Depends(get_telegram_auth_data),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Gets or creates user in database based on verified Telegram credentials.
    """
    tg_user = auth_data.user
    stmt = select(User).where(User.id == tg_user.id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        # Auto-provision user on first launch
        user = User(
            id=tg_user.id,
            username=tg_user.username,
            first_name=tg_user.first_name,
            language_code=tg_user.language_code or "ru",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Keep profile updated if name or username changed in Telegram
        updated = False
        if user.first_name != tg_user.first_name:
            user.first_name = tg_user.first_name
            updated = True
        if user.username != tg_user.username:
            user.username = tg_user.username
            updated = True
        if updated:
            await db.commit()
            await db.refresh(user)

    return user


async def get_current_active_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Optional[PregnancyProfile]:
    """
    Retrieves currently active pregnancy profile for the authenticated user.
    """
    stmt = (
        select(PregnancyProfile)
        .where(
            PregnancyProfile.user_id == user.id,
            PregnancyProfile.is_active.is_(True),
        )
        .order_by(PregnancyProfile.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
