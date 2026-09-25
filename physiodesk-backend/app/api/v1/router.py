from fastapi import APIRouter

from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.appointments import router as appointments_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.billing import router as billing_router
from app.api.v1.endpoints.dashboard import router as dashboard_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.patients import router as patients_router
from app.api.v1.endpoints.public import router as public_router
from app.api.v1.endpoints.therapists import router as therapists_router
from app.api.v1.endpoints.services import router as services_router


api_router = APIRouter()

api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(dashboard_router, tags=["dashboard"])
api_router.include_router(patients_router, tags=["patients"])
api_router.include_router(appointments_router, tags=["appointments"])
api_router.include_router(billing_router, tags=["billing"])
api_router.include_router(therapists_router, tags=["therapists"])
api_router.include_router(public_router, tags=["public"])
api_router.include_router(services_router, tags=["services"])


# Register the admin router (Accessible at /api/v1/admin/users)
api_router.include_router(admin_router)