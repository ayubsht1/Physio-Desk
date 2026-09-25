from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_user_from_token,
    verify_password,
    get_password_hash,
)

from app.models.user import User

from app.schemas import (
    LoginRequest,
    RefreshRequest,
    TokenPayload,
    UserPublic,
    UserPasswordChange,
)

router = APIRouter(prefix="/auth")


@router.post("/login", response_model=TokenPayload)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    identifier = payload.username.strip().lower()

    user = (
        db.query(User)
        .filter(
            (User.username == identifier)
            | (User.email == identifier)
        )
        .first()
    )

    if (
        user is None
        or not user.is_active
        or not verify_password(
            payload.password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token = create_access_token(user.username)
    refresh_token = create_refresh_token(user.username)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=TokenPayload)
def refresh_token(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
):
    username = get_user_from_token(
        payload.refresh_token,
        expected_type="refresh",
    )

    user = (
        db.query(User)
        .filter(
            User.username == username,
            User.is_active.is_(True),
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return {
        "access_token": create_access_token(user.username),
        "refresh_token": create_refresh_token(user.username),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserPublic)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user

@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: UserPasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allow currently authenticated users to change their own password."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )

    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    return {"message": "Password changed successfully."}