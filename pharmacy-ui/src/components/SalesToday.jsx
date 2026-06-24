export default function SalesToday({ sales, currency, dateLocale }) {
  if (!sales.length) return null
  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <i className="bi bi-bag-check-fill text-success" />
        <span className="fw-semibold">Today&apos;s Sales</span>
        <span className="badge bg-success">{sales.length}</span>
      </div>
      <div className="today-sales-scroll">
        {[...sales].reverse().map(s => (
          <div key={s.id} className="sale-card">
            <div className="sale-card-name" title={s.medicineName}>{s.medicineName}</div>
            <div className="sale-card-cust"><i className="bi bi-person me-1" />{s.customerName}</div>
            <div className="sale-card-row">
              <span className="sale-card-qty">{s.quantity} x {currency}{s.unitPrice.toFixed(2)}</span>
              <span className="sale-card-total">{currency}{s.totalAmount.toFixed(2)}</span>
            </div>
            <div className="sale-card-time">
              <i className="bi bi-clock me-1" />
              {new Date(s.saleDate).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
