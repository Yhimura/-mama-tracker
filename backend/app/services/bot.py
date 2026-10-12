import httpx
from typing import Optional
from app.core.config import settings


async def send_telegram_message(
    chat_id: int,
    text: str,
    parse_mode: str = "Markdown",
) -> bool:
    """
    Sends message to user's Telegram chat using Bot API.
    """
    if not settings.BOT_TOKEN or settings.BOT_TOKEN == "mock_bot_token":
        print(f"[BotService Mock] Message to chat {chat_id}:\n{text}")
        return True

    url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                return True
            else:
                print(f"[BotService Warning] Failed to send telegram message: {resp.text}")
                return False
    except Exception as e:
        print(f"[BotService Error] Telegram API request error: {e}")
        return False
