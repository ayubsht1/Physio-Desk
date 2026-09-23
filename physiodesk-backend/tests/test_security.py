from datetime import timedelta

import pytest
from fastapi import HTTPException

from app.core.security import create_access_token, create_refresh_token, get_user_from_token


def test_access_token_has_access_type() -> None:
    token = create_access_token("admin", timedelta(minutes=5))

    assert get_user_from_token(token) == "admin"


def test_refresh_token_cannot_be_used_as_access_token() -> None:
    token = create_refresh_token("admin")

    with pytest.raises(HTTPException):
        get_user_from_token(token)


def test_access_token_cannot_be_used_as_refresh_token() -> None:
    token = create_access_token("admin", timedelta(minutes=5))

    with pytest.raises(HTTPException):
        get_user_from_token(token, expected_type="refresh")