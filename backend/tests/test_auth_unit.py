import hashlib
import hmac
import json
import time
from urllib.parse import urlencode

from app.core.security import validate_telegram_init_data, TelegramInitData


def test_telegram_init_data_validation():
    bot_token = "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
    auth_date = int(time.time())
    user_dict = {
        "id": 42424242,
        "first_name": "Анна",
        "username": "anna_future_mom",
        "language_code": "ru",
    }

    raw_params = {
        "auth_date": str(auth_date),
        "query_id": "AAHdF6IQAAAAAN0XohC_dev",
        "user": json.dumps(user_dict, separators=(",", ":")),
    }

    # Build data_check_string
    sorted_items = sorted(raw_params.items(), key=lambda item: item[0])
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted_items)

    secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    correct_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()

    raw_params["hash"] = correct_hash
    init_data_string = urlencode(raw_params)

    # Validate using our function
    validated: TelegramInitData = validate_telegram_init_data(
        init_data_raw=init_data_string,
        bot_token=bot_token,
    )

    assert validated.user.id == 42424242
    assert validated.user.first_name == "Анна"
    assert validated.user.username == "anna_future_mom"
    print(" Telegram HMAC-SHA256 initData signature verified successfully!")


if __name__ == "__main__":
    test_telegram_init_data_validation()
