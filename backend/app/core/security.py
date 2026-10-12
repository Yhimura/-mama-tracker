import hashlib
import hmac
import json
import time
from typing import Any, Dict, Optional
from urllib.parse import parse_qsl

from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import settings


class TelegramUserData(BaseModel):
    """Data of the authenticated Telegram user extracted from initData."""
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    language_code: Optional[str] = "ru"
    is_premium: Optional[bool] = False
    photo_url: Optional[str] = None


class TelegramInitData(BaseModel):
    """Parsed and verified initData payload."""
    query_id: Optional[str] = None
    user: TelegramUserData
    auth_date: int
    hash: str
    start_param: Optional[str] = None


def validate_telegram_init_data(
    init_data_raw: str,
    bot_token: str = settings.BOT_TOKEN,
    max_age_seconds: int = settings.INIT_DATA_MAX_AGE_SECONDS,
) -> TelegramInitData:
    """
    Validates Telegram WebApp initData string using HMAC-SHA256 signature verification.
    
    Telegram Security Specification:
    1. Parse raw query string into key-value pairs.
    2. Extract and remove 'hash'.
    3. Sort remaining pairs alphabetically by key, format as "key=value", join by '\n'.
    4. Compute secret_key = HMAC_SHA256(key=b"WebAppData", data=bot_token).
    5. Compute signature = HMAC_SHA256(key=secret_key, data=data_check_string).
    6. Verify signature match and check auth_date expiration.
    """
    if not init_data_raw:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Telegram initData credentials",
        )

    try:
        # Step 1: Parse query params
        parsed_params: Dict[str, str] = dict(parse_qsl(init_data_raw, keep_blank_values=True))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed initData format",
        )

    received_hash = parsed_params.get("hash")
    if not received_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hash parameter is missing in initData",
        )

    # Step 2: Remove hash from the pairs
    data_to_verify = {k: v for k, v in parsed_params.items() if k != "hash"}

    # Step 3: Sort keys alphabetically and build data_check_string
    sorted_items = sorted(data_to_verify.items(), key=lambda item: item[0])
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted_items)

    # Step 4: Secret key derivation
    # secret_key = HMAC-SHA256(b"WebAppData", bot_token)
    secret_key = hmac.new(
        key=b"WebAppData",
        msg=bot_token.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).digest()

    # Step 5: Calculate HMAC-SHA256 of data_check_string
    calculated_hash = hmac.new(
        key=secret_key,
        msg=data_check_string.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    # Step 6: Constant-time hash verification
    if not hmac.compare_digest(calculated_hash, received_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid initData signature",
        )

    # Step 7: Check auth_date expiration
    auth_date_str = parsed_params.get("auth_date")
    if not auth_date_str or not auth_date_str.isdigit():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing auth_date in initData",
        )

    auth_date = int(auth_date_str)
    current_time = int(time.time())

    if current_time - auth_date > max_age_seconds:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="initData has expired (> 24 hours)",
        )

    # Step 8: Parse user JSON object
    user_json = parsed_params.get("user")
    if not user_json:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User information not found in initData",
        )

    try:
        user_dict = json.loads(user_json)
        user_data = TelegramUserData(**user_dict)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to parse user payload: {exc}",
        )

    return TelegramInitData(
        query_id=parsed_params.get("query_id"),
        user=user_data,
        auth_date=auth_date,
        hash=received_hash,
        start_param=parsed_params.get("start_param"),
    )
