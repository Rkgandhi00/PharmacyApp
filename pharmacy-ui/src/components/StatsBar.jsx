export default function StatsBar({ medicines, salesToday, expiryWarnDays, lowStockThreshold, todayExpanded, onTodayClick }) {
  const expiring = medicines.filter(m => daysUntil(m.expiryDate) < expiryWarnDays).length
  const lowStock = medicines.filter(m => m.quantity > 0 && m.quantity < lowStockThreshold).length

  return (
    <div className="row g-3 mb-4">
      <div className="col-6 col-lg-3">
        <div className="stat-card">
          <div className="stat-icon si-blue"><i className="bi bi-capsule-pill" /></div>
          <div><div className="stat-val">{medicines.length}</div><div className="stat-lbl">Total Medicines</div></div>
        </div>
      </div>
      <div className="col-6 col-lg-3">
        <div className="stat-card">
          <div className="stat-icon si-red"><i className="bi bi-hourglass-split" /></div>
          <div><div className="stat-val">{expiring}</div><div className="stat-lbl">Expiring &lt; {expiryWarnDays} Days</div></div>
        </div>
      </div>
      <div className="col-6 col-lg-3">
        <div className="stat-card">
          <div className="stat-icon si-amber"><i className="bi bi-exclamation-triangle-fill" /></div>
          <div><div className="stat-val">{lowStock}</div><div className="stat-lbl">Low Stock (&lt; {lowStockThreshold})</div></div>
        </div>
      </div>
      <div className="col-6 col-lg-3">
        <div className={`stat-card stat-card-clickable ${todayExpanded ? "active" : ""}`} onClick={onTodayClick} title="Click to view today sales">
          <div className="stat-icon si-green"><i className="bi bi-bag-check-fill" /></div>
          <div>
            <div className="stat-val">{salesToday.length}</div>
            <div className="stat-lbl">
              Sales Today <i className={`bi ms-1 ${todayExpanded ? "bi-chevron-up" : "bi-chevron-down"}`} style={{ fontSize: ".65rem" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function daysUntil(d) { return Math.ceil((new Date(d) - Date.now()) / 864e5) }
