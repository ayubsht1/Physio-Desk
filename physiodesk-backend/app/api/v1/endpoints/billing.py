from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.invoice import Invoice
from app.models.patient import Patient
from app.models.user import User
from app.schemas import InvoiceCreate, InvoiceRead

router = APIRouter(prefix="/billing")


@router.get("", response_model=list[InvoiceRead])
def list_invoices(status_filter: str | None = Query(default=None, alias="status"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Invoice)
    if status_filter:
        query = query.filter(Invoice.status == status_filter)
    invoices = query.order_by(Invoice.invoice_date.desc()).all()
    return [
        {
            "id": invoice.id,
            "patient_id": invoice.patient_id,
            "service": invoice.service,
            "invoice_date": invoice.invoice_date,
            "amount": float(invoice.amount),
            "status": invoice.status,
            "payment_method": invoice.payment_method,
            "discount": float(invoice.discount),
            "notes": invoice.notes,
            "patient_name": invoice.patient.name,
        }
        for invoice in invoices
    ]


@router.post("", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
def create_invoice(payload: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles("admin", "staff"))):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=400, detail="Patient not found")
    invoice = Invoice(**payload.model_dump())
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return {
        "id": invoice.id,
        "patient_id": invoice.patient_id,
        "service": invoice.service,
        "invoice_date": invoice.invoice_date,
        "amount": float(invoice.amount),
        "status": invoice.status,
        "payment_method": invoice.payment_method,
        "discount": float(invoice.discount),
        "notes": invoice.notes,
        "patient_name": patient.name,
    }


@router.put("/{invoice_id}", response_model=InvoiceRead)
def update_invoice(invoice_id: int, payload: InvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles("admin", "staff"))):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for field, value in payload.model_dump().items():
        setattr(invoice, field, value)
    db.commit()
    db.refresh(invoice)
    return {
        "id": invoice.id,
        "patient_id": invoice.patient_id,
        "service": invoice.service,
        "invoice_date": invoice.invoice_date,
        "amount": float(invoice.amount),
        "status": invoice.status,
        "payment_method": invoice.payment_method,
        "discount": float(invoice.discount),
        "notes": invoice.notes,
        "patient_name": invoice.patient.name,
    }


@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("admin"))):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(invoice)
    db.commit()
    return {"message": "Invoice removed"}
