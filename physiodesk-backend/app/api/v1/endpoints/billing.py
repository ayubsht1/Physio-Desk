import random
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.invoice import Invoice
from app.models.patient import Patient
from app.models.user import User
from app.schemas import InvoiceCreate, InvoiceRead, InvoiceUpdate

router = APIRouter(prefix="/billing", tags=["Billing"])


def generate_invoice_number(db: Session) -> str:
    today_str = date.today().strftime("%Y%m%d")
    for _ in range(10):
        rand = random.randint(1000, 9999)
        num = f"INV-{today_str}-{rand}"
        if not db.query(Invoice).filter(Invoice.invoice_number == num).first():
            return num
    return f"INV-{today_str}-{random.randint(10000, 99999)}"


def format_invoice(invoice: Invoice) -> dict:
    return {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "patient_id": invoice.patient_id,
        "appointment_id": invoice.appointment_id,
        "invoice_date": invoice.invoice_date,
        "subtotal": float(invoice.subtotal),
        "discount": float(invoice.discount),
        "tax": float(invoice.tax),
        "total": float(invoice.total),
        "status": invoice.status,
        "notes": invoice.notes,
        "patient_name": invoice.patient.name if invoice.patient else None,
        "created_at": invoice.created_at,
    }


@router.get("", response_model=list[InvoiceRead])
def list_invoices(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Invoice)
    if status_filter:
        query = query.filter(Invoice.status == status_filter)
    invoices = query.order_by(Invoice.invoice_date.desc(), Invoice.id.desc()).all()
    return [format_invoice(inv) for inv in invoices]


@router.post("", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
def create_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "staff")),
):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=400, detail="Patient not found")

    data = payload.model_dump()
    if not data.get("invoice_number"):
        data["invoice_number"] = generate_invoice_number(db)

    subtotal = float(data.get("subtotal") or 0.0)
    discount = float(data.get("discount") or 0.0)
    tax = float(data.get("tax") or 0.0)
    if data.get("total") is None:
        data["total"] = max(round(subtotal - discount + tax, 2), 0.0)

    invoice = Invoice(**data)
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return format_invoice(invoice)


@router.put("/{invoice_id}", response_model=InvoiceRead)
def update_invoice(
    invoice_id: int,
    payload: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "staff")),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if payload.patient_id is not None:
        patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
        if not patient:
            raise HTTPException(status_code=400, detail="Patient not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(invoice, field, value)

    # Recalculate total if subtotal, discount, or tax changed and total not explicitly passed
    if "total" not in update_data and any(k in update_data for k in ("subtotal", "discount", "tax")):
        invoice.total = max(round(float(invoice.subtotal) - float(invoice.discount) + float(invoice.tax), 2), 0.0)

    db.commit()
    db.refresh(invoice)
    return format_invoice(invoice)


@router.delete("/{invoice_id}", status_code=status.HTTP_200_OK)
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(invoice)
    db.commit()
    return {"message": "Invoice removed successfully"}
