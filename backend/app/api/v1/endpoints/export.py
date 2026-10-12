from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_current_active_profile, get_db
from app.models.user import User
from app.models.profile import PregnancyProfile
from app.api.v1.endpoints.logs import generate_doctor_report
from app.services.bot import send_telegram_message

router = APIRouter(prefix="/export", tags=["Medical Export & Sharing"])


@router.post("/send-to-telegram")
async def send_report_to_telegram(
    days: int = Query(default=14, ge=7, le=60),
    user: User = Depends(get_current_user),
    profile: Optional[PregnancyProfile] = Depends(get_current_active_profile),
    db: AsyncSession = Depends(get_db),
):
    """
    Generates medical doctor report and directly sends it to the user's private Telegram chat!
    """
    report = await generate_doctor_report(days=days, user=user, profile=profile, db=db)

    success = await send_telegram_message(
        chat_id=user.id,
        text=report.formatted_markdown_text,
        parse_mode="Markdown",
    )

    if not success:
        return {
            "status": "warning",
            "message": "Отчет сгенерирован, но не удалось доставить в Telegram (проверьте BOT_TOKEN или начал ли пользователь диалог с ботом).",
            "report": report,
        }

    return {
        "status": "success",
        "message": f"Отчет успешно отправлен в ваш диалог с ботом в Telegram!",
        "report": report,
    }
