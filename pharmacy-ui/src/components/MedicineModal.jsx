import { useState, useEffect } from "react"
import Modal from "./Modal"
import { addMedicine } from "../api"

const EMPTY = { fullName: "", brand: "", expiryDate: "", quantity: "", price: "", notes: "" }

export default function MedicineModal({ show, onClose, onSaved, medicines, currency }) {
  const [form, setForm]       = useState(EMPTY)
  const [error, setError]     = useState("")
  const [saving, setSaving]   = useState(false)

  useEffect(() => { if (!show) { setForm(EMPTY); setError("") } }, [show])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const ready = form.fullName && form.brand && form.expiryDate && form.quantity !== "" && form.price !== ""

  const duplicates = medicines.filter(m =>
    m.fullName.toLowerCase() === form.fullName.trim().toLowerCase() &&
    m.brand.toLowerCase()    === form.brand.trim().toLowerCase()
  )

  const fmt = d => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

  const submit = async () => {
    setError("")
    setSaving(true)
    try {
      await addMedicine({
        fullName:   form.fullName.trim(),
        brand:      form.brand.trim(),
        expiryDate: form.expiryDate,
        quantity:   parseInt(form.quantity, 10),
        price:      parseFloat(form.price),
        notes:      form.notes.trim()
      })
      onSaved("Medicine added successfully!")
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show={show} onClose={onClose} size="modal-lg">
      <div className="modal-header">
        <div>
          <h5 className="modal-title"><i className="bi bi-capsule-pill text-primary me-2" />Add New Medicine</h5>
          <div className="modal-sub">Fill in all required fields marked with *</div>
        </div>
        <button className="btn-close" onClick={onClose} />
      </div>
      <div className="modal-body">
        {error && <div className="alert alert-danger py-2 small mb-2">{error}</div>}
        {duplicates.length > 0 && (
          <div className="dup-notice mb-2">
            <i className="bi bi-exclamation-triangle-fill me-1" />
            <strong>{duplicates.length} batch{duplicates.length > 1 ? "es" : ""} already in stock.</strong> You are adding a new batch (different expiry / price / supplier).
            <div className="dup-batches">
              {duplicates.map(m => (
                <span key={m.id} className="dup-batch">Exp: {fmt(m.expiryDate)} · Stock: {m.quantity} · {currency}{m.price.toFixed(2)}</span>
              ))}
            </div>
          </div>
        )}
        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label">Full Name <span className="text-danger">*</span></label>
            <input className="form-control" placeholder="e.g. Amoxicillin 500mg" value={form.fullName} onChange={e => set("fullName", e.target.value)} />
          </div>
          <div className="col-md-4">
            <label className="form-label">Brand <span className="text-danger">*</span></label>
            <input className="form-control" placeholder="e.g. GSK" value={form.brand} onChange={e => set("brand", e.target.value)} />
          </div>
          <div className="col-sm-4">
            <label className="form-label">Expiry Date <span className="text-danger">*</span></label>
            <input type="date" className="form-control" value={form.expiryDate} onChange={e => set("expiryDate", e.target.value)} />
          </div>
          <div className="col-sm-4">
            <label className="form-label">Quantity <span className="text-danger">*</span></label>
            <input type="number" className="form-control" placeholder="0" min="0" value={form.quantity} onChange={e => set("quantity", e.target.value)} />
          </div>
          <div className="col-sm-4">
            <label className="form-label">Price <span className="text-danger">*</span></label>
            <div className="input-group">
              <span className="input-group-text">{currency}</span>
              <input type="number" className="form-control" placeholder="0.00" step="0.01" min="0" value={form.price} onChange={e => set("price", e.target.value)} />
            </div>
          </div>
          <div className="col-12">
            <label className="form-label">Notes <span className="text-muted fw-normal">(optional)</span></label>
            <textarea className="form-control" rows={2} placeholder="Dosage instructions, storage requirements..." value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-light px-4" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary px-4" disabled={!ready || saving} onClick={submit}>
          {saving ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : <><i className="bi bi-check-lg me-1" />Save Medicine</>}
        </button>
      </div>
    </Modal>
  )
}
