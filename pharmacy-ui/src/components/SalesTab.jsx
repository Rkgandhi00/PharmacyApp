export default function SalesTab({ sales, currency, dateLocale, onNewSale }) {
  const revenue = sales.reduce((s, r) => s + r.totalAmount, 0)
  const uniq    = new Set(sales.map(r => r.customerName.toLowerCase())).size
  const today   = sales.filter(r => new Date(r.saleDate).toDateString() === new Date().toDateString()).length
  const fmt     = d => new Date(d).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" })

  return (
    <>
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="stat-card">
            <div className="stat-icon si-green"><i className="bi bi-currency-rupee" /></div>
            <div><div className="stat-val">{currency}{revenue.toFixed(2)}</div><div className="stat-lbl">Total Revenue</div></div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <div className="stat-icon si-blue"><i className="bi bi-receipt" /></div>
            <div><div className="stat-val">{sales.length}</div><div className="stat-lbl">Total Transactions</div></div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stat-card">
            <div className="stat-icon si-purple"><i className="bi bi-people-fill" /></div>
            <div><div className="stat-val">{uniq}</div><div className="stat-lbl">Unique Customers</div></div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="fw-semibold">All Sale Records</span>
        <button className="btn btn-success px-3" onClick={onNewSale}>
          <i className="bi bi-plus-lg me-1" />Record New Sale
        </button>
      </div>

      <div className="tbl-card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Medicine</th>
                <th>Customer</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Sale Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={7} className="empty-state"><i className="bi bi-receipt" />No sales recorded yet</td></tr>
              ) : [...sales].reverse().map((s, i) => (
                <tr key={s.id}>
                  <td className="text-muted">{i + 1}</td>
                  <td><span className="fw-medium">{s.medicineName}</span></td>
                  <td>{s.customerName}</td>
                  <td>{s.quantity}</td>
                  <td>{currency}{s.unitPrice.toFixed(2)}</td>
                  <td><strong className="text-success">{currency}{s.totalAmount.toFixed(2)}</strong></td>
                  <td className="text-muted">{fmt(s.saleDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
