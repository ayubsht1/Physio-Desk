from fastapi import APIRouter

router = APIRouter()


@router.get("/health", summary="Check API health")
def health() -> dict[str, str]:
    return {"status": "ok"}
