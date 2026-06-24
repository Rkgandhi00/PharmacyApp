const PAGE_SIZE = 10

function daysUntil(d) { return Math.ceil((new Date(d) - Date.now()) / 864e5) }

function rowClass(m, expiryWarnDays, lowStockThreshold) {
  if (m.quantity === 0) return "r-out"
  if (daysUntil(m.expiryDate) < expiryWarnDays) return "r-expiry"
  if (m.quantity < lowStockThreshold) return "r-stock"
  return "r-ok"
}

function StatusBadge({ m, expiryWarnDays }) {
  const d = daysUntil(m.expiryDate)
  if (m.quantity === 0)         return <span className="b-out"><i className="bi bi-slash-circle me-1" />Out of stock</span>
  if (d < expiryWarnDays)       return <span className="b-expiry"><i className="bi bi-clock-history me-1" />Exp. in {d}d</span>
  if (m.quantity < 10)          return <span className="b-stock"><i className="bi bi-exclamation-triangle me-1" />Low stock</span>
  return <span className="b-ok"><i className="bi bi-check-circle me-1" />In stock</span>
}

function SortTh({ col, label, sortCol, sortDir, onSort }) {
  const active = sortCol === col
  return (
    <th
      className={`th-sort ${active ? sortDir : ""}`}
      onClick={() => onSort(col)}
    >
      {label} <i className={`bi ${active ? (sortDir === "asc" ? "bi-chevron-up" : "bi-chevron-down") : "bi-chevron-expand"} th-sort-icon`} />
    </th>
  )
}

export default function MedicineTable({
  medicines, search, activeFilter, sortCol, sortDir, currentPage,
  expiryWarnDays, lowStockThreshold, currency, dateLocale,
  onSort, onPageChange, onSell, onSearch, onFilterChange
}) {
  const fmt = d => new Date(d).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" })

  let list = [...medicines]
  if (activeFilter === "ok")     list = list.filter(m => m.quantity > 0 && daysUntil(m.expiryDate) >= expiryWarnDays && m.quantity >= lowStockThreshold)
  if (activeFilter === "stock")  list = list.filter(m => m.quantity > 0 && m.quantity < lowStockThreshold)
  if (activeFilter === "expiry") list = list.filter(m => daysUntil(m.expiryDate) < expiryWarnDays)
  if (activeFilter === "out")    list = list.filter(m => m.quantity === 0)
  if (search) list = list.filter(m => m.fullName.toLowerCase().includes(search.toLowerCase()) || m.brand.toLowerCase().includes(search.toLowerCase()))

  if (sortCol) {
    list.sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol]
      if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase() }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }

  const total = list.length
  const pages = Math.ceil(total / PAGE_SIZE)
  const start = (currentPage - 1) * PAGE_SIZE
  const page  = list.slice(start, start + PAGE_SIZE)

  const filters = [
    { key: "all", label: "All" },
    { key: "ok", label: "In Stock", cls: "fpill-ok" },
    { key: "stock", label: "Low Stock", cls: "fpill-stock" },
    { key: "expiry", label: "Expiring Soon", cls: "fpill-expiry" },
    { key: "out", label: "Out of Stock", cls: "fpill-out" },
  ]

  return (
    <>
      <div className="toolbar mb-3">
        <div className="search-wrap">
          <i className="bi bi-search search-icon" />
          <input
            className="search-input"
            placeholder="Search by medicine name or brand..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            autoComplete="off"
          />
          {search && (
            <button className="search-clear" onClick={() => onSearch("")}>
              <i className="bi bi-x-circle-fill" />
            </button>
          )}
        </div>
        <button className="btn btn-primary px-3" onClick={() => onSell(null, true)}>
          <i className="bi bi-plus-lg me-1" />Add Medicine
        </button>
      </div>

      <div className="filter-bar mb-3">
        {filters.map(f => (
          <button
            key={f.key}
            className={`fpill ${f.cls || ""} ${activeFilter === f.key ? "active" : ""}`}
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="tbl-card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <SortTh col="fullName"   label="Medicine Name" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh col="brand"      label="Brand"         sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh col="expiryDate" label="Expiry Date"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh col="quantity"   label="Stock"         sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <SortTh col="price"      label="Price"         sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <th>Status</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {page.length === 0 ? (
                <tr><td colSpan={8} className="empty-state"><i className="bi bi-capsule-pill" />No medicines found</td></tr>
              ) : page.map((m, i) => (
                <tr key={m.id} className={rowClass(m, expiryWarnDays, lowStockThreshold)}>
                  <td className="text-muted">{start + i + 1}</td>
                  <td><span className="med-name">{m.fullName}</span></td>
                  <td><span className="text-secondary">{m.brand}</span></td>
                  <td>{fmt(m.expiryDate)}</td>
                  <td>{m.quantity}</td>
                  <td>{currency}{m.price.toFixed(2)}</td>
                  <td><StatusBadge m={m} expiryWarnDays={expiryWarnDays} /></td>
                  <td>
                    <button className="btn-sell" disabled={m.quantity === 0} onClick={() => onSell(m.id)}>
                      <i className="bi bi-bag-plus-fill" /> Sell
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="d-flex justify-content-end px-3 py-2 pagination-bar">
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => onPageChange(currentPage - 1)}>
                    <i className="bi bi-chevron-left" />
                  </button>
                </li>
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter(p => p >= Math.max(1, currentPage - 2) && p <= Math.min(pages, currentPage + 2))
                  .map(p => (
                    <li key={p} className={`page-item ${p === currentPage ? "active" : ""}`}>
                      <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
                    </li>
                  ))}
                <li className={`page-item ${currentPage === pages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => onPageChange(currentPage + 1)}>
                    <i className="bi bi-chevron-right" />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </>
  )
}
