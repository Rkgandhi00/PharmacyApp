import { useState, useEffect } from "react"
import Modal from "./Modal"
import { recordSale } from "../api"

export default function SaleModal({ show, onClose, onSaved, medicines, preSelectId, currency, lowStockThreshold }) {
  const [medId, setMedId]     = useState("")
  const [customer, setCustomer] = useState("")
  const [qty, setQty]         = useState("")
  const [error, setError]     = useState("")
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (!show) { setMedId(""); setCustomer(""); setQty(""); setError("") }
    else if (preSelectId) setMedId(preSelectId)
  }, [show, preSelectId])

  const selected = medicines.find(m => m.id === medId)
  const total    = selected && qty ? (selected.price * parseInt(qty || 0, 10)).toFixed(2) : "0.00"

  const submit = async () => {
    setError("")
    if (!medId)               return setError("Please select a medicine.")
    if (!customer.trim())     return setError("Please enter a customer name.")
    const q = parseInt(qty, 10)
    if (!q || q < 1)          return setError("Quantity must be at least 1.")
    if (q > selected.quantity) return setError(`Only ${selected.quantity} units in stock.`)
    setSaving(true)
    try {
      await recordSale({ medicineId: medId, customerName: customer.trim(), quantity: q })
      onSaved("Sale recorded successfully!")
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show={show} onClose={onClose} size="modal-sm" style={{ maxWidth: 480 }}>
      <div className="modal-header">
        <div>
          <h5 className="modal-title"><i className="bi bi-bag-check-fill text-success me-2" />Record a Sale</h5>
          <div className="modal-sub">Select a medicine and enter customer details</div>
        </div>
        <button className="btn-close" onClick={onClose} />
      </div>
      <div className="modal-body">
        {error && <div className="alert alert-warning py-2 small mb-2">{error}</div>}
        <div className="mb-3">
          <label className="form-label">Medicine <span className="text-danger">*</span></label>
          <select className="form-select" value={medId} onChange={e => setMedId(e.target.value)}>
            <option value="">— Select a medicine —</option>
            {medicines.map(m => (
              <option key={m.id} value={m.id} disabled={m.quantity === 0}>
                {m.fullName} · {m.brand} ({m.quantity} in stock)
              </option>
            ))}
          </select>
          {selected && (
            <div className="form-text mt-1">
              {selected.quantity < lowStockThreshold
                ? <><i className="bi bi-exclamation-triangle-fill text-warning me-1" />Only <strong>{selected.quantity}</strong> units in stock</>
                : <><i className="bi bi-check-circle-fill text-success me-1" /><strong>{selected.quantity}</strong> units available</>
              }
            </div>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">Customer Name <span className="text-danger">*</span></label>
          <input className="form-control" placeholder="Enter customer name" value={customer} onChange={e => setCustomer(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Quantity <span className="text-danger">*</span></label>
          <input type="number" className="form-control" placeholder="1" min="1" value={qty} onChange={e => setQty(e.target.value)} />
        </div>
        <div className="total-box">
          <span className="total-lbl"><i className="bi bi-calculator me-1" />Total Amount</span>
          <span className="total-amt">{currency}{total}</span>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-light px-4" onClick={onClose}>Cancel</button>
        <button className="btn btn-success px-4" disabled={saving} onClick={submit}>
          {saving ? <><span className="spinner-border spinner-border-sm me-1" />Processing...</> : <><i className="bi bi-check-lg me-1" />Confirm Sale</>}
        </button>
      </div>
    </Modal>
  )
}
