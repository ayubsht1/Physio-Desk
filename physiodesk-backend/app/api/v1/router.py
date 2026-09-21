from fastapi import APIRouter

from app.api.v1.endpoints.health import health

api_router = APIRouter()
api_router.add_api_route("/health", health, methods=["GET"], tags=["health"])
