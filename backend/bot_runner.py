import asyncio
import httpx
import logging
from app.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("mompulse-bot")

WEB_APP_URL = "https://yhimura.github.io/-mama-tracker/"


async def run_bot():
    token = settings.BOT_TOKEN
    if not token:
        logger.error("BOT_TOKEN is not set in .env")
        return

    base_url = f"https://api.telegram.org/bot{token}"
    offset = 0

    logger.info("🌸 Бот «МамаТрекер» запущен в режиме Long Polling!")
    logger.info(f"🔗 Ссылка на WebApp: {WEB_APP_URL}")

    async with httpx.AsyncClient(timeout=30.0) as client:
        while True:
            try:
                resp = await client.get(f"{base_url}/getUpdates", params={"offset": offset, "timeout": 20})
                if resp.status_code != 200:
                    await asyncio.sleep(3)
                    continue

                data = resp.json()
                for update in data.get("result", []):
                    offset = update["update_id"] + 1
                    message = update.get("message")
                    if not message:
                        continue

                    chat_id = message["chat"]["id"]
                    first_name = message.get("from", {}).get("first_name", "Мама")
                    text = message.get("text", "")

                    if text.startswith("/start"):
                        welcome_text = (
                            f"Здравствуйте, {first_name}! 🌸\n\n"
                            "Добро пожаловать в **«МамаТрекер»** — ваш персональный интерактивный дневник беременности.\n\n"
                            "В приложении вы можете:\n"
                            "• 👶 Узнать текущий срок, триместр и размер малыша в понятных аналогиях;\n"
                            "• 📅 Вести ежедневный чек-ин самочувствия, токсикоза и энергии;\n"
                            "• 💧 Отслеживать водный баланс и толчки малыша;\n"
                            "• ⏱ Использовать схваткосчиталку по правилу 5-1-1;\n"
                            "• 🎒 Собирать интерактивную сумку в роддом;\n"
                            "• 📋 Формировать структурированный отчет для вашего врача.\n\n"
                            "Нажмите кнопку ниже, чтобы открыть дневник:"
                        )

                        keyboard = {
                            "inline_keyboard": [
                                [
                                    {
                                        "text": "🌸 Открыть МамаТрекер",
                                        "web_app": {"url": WEB_APP_URL},
                                    }
                                ]
                            ]
                        }

                        await client.post(
                            f"{base_url}/sendMessage",
                            json={
                                "chat_id": chat_id,
                                "text": welcome_text,
                                "parse_mode": "Markdown",
                                "reply_markup": keyboard,
                            },
                        )

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"Error in bot loop: {e}")
                await asyncio.sleep(2)


if __name__ == "__main__":
    try:
        asyncio.run(run_bot())
    except KeyboardInterrupt:
        logger.info("Бот остановлен.")
