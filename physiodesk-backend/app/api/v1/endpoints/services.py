from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.service import Service
from app.models.user import User
from app.schemas import ServiceCreate, ServiceRead, ServiceUpdate


router = APIRouter(
    prefix="/services",
    tags=["Services"],
)


@router.get("", response_model=list[ServiceRead])
def list_services(
    include_inactive: bool = Query(
        default=False,
        description="Include inactive services",
    ),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    query = db.query(Service).filter(
        Service.is_deleted == False
    )

    if not include_inactive:
        query = query.filter(
            Service.is_active == True
        )

    return query.order_by(Service.name.asc()).all()


@router.get("/{service_id}", response_model=ServiceRead)
def get_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = (
        db.query(Service)
        .filter(
            Service.id == service_id,
            Service.is_deleted == False,
        )
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found",
        )

    return service


@router.post(
    "",
    response_model=ServiceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    existing = (
        db.query(Service)
        .filter(
            Service.name == payload.name,
            Service.is_deleted == False,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="A service with this name already exists",
        )

    service = Service(
        name=payload.name,
        description=payload.description,
        duration=payload.duration,
        price=payload.price,
        is_active=payload.is_active,
        is_deleted=False,
    )

    db.add(service)
    db.commit()
    db.refresh(service)

    return service


@router.put("/{service_id}", response_model=ServiceRead)
def update_service(
    service_id: int,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    service = (
        db.query(Service)
        .filter(
            Service.id == service_id,
            Service.is_deleted == False,
        )
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found",
        )

    update_data = payload.model_dump(
        exclude_unset=True
    )

    if "name" in update_data:
        existing = (
            db.query(Service)
            .filter(
                Service.name == update_data["name"],
                Service.id != service_id,
                Service.is_deleted == False,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="A service with this name already exists",
            )

    for field, value in update_data.items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)

    return service


@router.delete(
    "/{service_id}",
    status_code=status.HTTP_200_OK,
)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    service = (
        db.query(Service)
        .filter(Service.id == service_id)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found",
        )

    service.is_deleted = True
    service.is_active = False

    db.commit()

    return {
        "message": "Service deleted successfully"
    }