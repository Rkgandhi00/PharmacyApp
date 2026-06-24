import { useState, useEffect, useCallback, useRef } from "react"
import { getConfig, getMedicines, getSales } from "./api"
import StatsBar      from "./components/StatsBar"
import SalesToday    from "./components/SalesToday"
import MedicineTable from "./components/MedicineTable"
import MedicineModal from "./components/MedicineModal"
import SaleModal     from "./components/SaleModal"
import SalesTab      from "./components/SalesTab"
import Toast         from "./components/Toast"

export default function App() {
  const [config, setConfig]   = useState({ currencySymbol: "Rs.", expiryWarningDays: 30, lowStockThreshold: 10, dateLocale: "en-IN" })
  const [medicines, setMeds]  = useState([])
  const [sales, setSales]     = useState([])
  const [activeTab, setTab]   = useState("inventory")
  const [search, setSearch]   = useState("")
  const [filter, setFilter]   = useState("all")
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState("asc")
  const [page, setPage]       = useState(1)
  const [todayOpen, setTodayOpen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showSale, setShowSale]   = useState(false)
  const [preSelect, setPreSelect] = useState(null)
  const [toasts, setToasts]   = useState([])
  const toastId = useRef(0)

  const toast = useCallback((msg, type = "success") => {
    const id = ++toastId.current
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const loadMeds  = useCallback(() => getMedicines().then(setMeds).catch(() => toast("Failed to load medicines.", "error")), [toast])
  const loadSales = useCallback(() => getSales().then(setSales).catch(() => {}), [])

  useEffect(() => {
    getConfig().then(setConfig).catch(() => {})
    loadMeds()
    loadSales()
  }, [loadMeds, loadSales])

  useEffect(() => {
    if (activeTab === "sales") loadSales()
  }, [activeTab, loadSales])

  const handleSort = col => {
    setSortDir(sortCol === col && sortDir === "asc" ? "desc" : "asc")
    setSortCol(col)
    setPage(1)
  }

  const handleSearch = val => { setSearch(val); setPage(1) }
  const handleFilter = val => { setFilter(val); setPage(1) }

  const openSell = (id = null, isAdd = false) => {
    if (isAdd) { setShowAdd(true); return }
    setPreSelect(id)
    setShowSale(true)
  }

  const afterSaved = msg => {
    toast(msg)
    loadMeds()
    loadSales()
  }

  const todaySales = sales.filter(s => new Date(s.saleDate).toDateString() === new Date().toDateString())
  const c = config.currencySymbol

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon"><i className="bi bi-capsule-pill" /></div>
          <div>
            <div className="brand-name">ABC Pharmacy</div>
            <span className="brand-sub">Medicine Management System</span>
          </div>
        </div>
        <nav className="nav-pills-custom">
          {["inventory", "sales"].map(tab => (
            <button
              key={tab}
              className={`npill ${activeTab === tab ? "active" : ""}`}
              onClick={() => setTab(tab)}
            >
              <i className={`bi ${tab === "inventory" ? "bi-grid-3x3-gap-fill" : "bi-receipt"}`} />
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      <div style={{ padding: 24 }}>
        {activeTab === "inventory" && (
          <>
            <StatsBar
              medicines={medicines}
              salesToday={todaySales}
              expiryWarnDays={config.expiryWarningDays}
              lowStockThreshold={config.lowStockThreshold}
              todayExpanded={todayOpen}
              onTodayClick={() => setTodayOpen(o => todaySales.length ? !o : false)}
            />
            {todayOpen && todaySales.length > 0 && (
              <SalesToday sales={todaySales} currency={c} dateLocale={config.dateLocale} />
            )}
            <MedicineTable
              medicines={medicines}
              search={search}
              activeFilter={filter}
              sortCol={sortCol}
              sortDir={sortDir}
              currentPage={page}
              expiryWarnDays={config.expiryWarningDays}
              lowStockThreshold={config.lowStockThreshold}
              currency={c}
              dateLocale={config.dateLocale}
              onSort={handleSort}
              onPageChange={setPage}
              onSell={openSell}
              onSearch={handleSearch}
              onFilterChange={handleFilter}
            />
          </>
        )}

        {activeTab === "sales" && (
          <SalesTab
            sales={sales}
            currency={c}
            dateLocale={config.dateLocale}
            onNewSale={() => { setPreSelect(null); setShowSale(true) }}
          />
        )}
      </div>

      <MedicineModal
        show={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={afterSaved}
        medicines={medicines}
        currency={c}
      />

      <SaleModal
        show={showSale}
        onClose={() => { setShowSale(false); setPreSelect(null) }}
        onSaved={afterSaved}
        medicines={medicines}
        preSelectId={preSelect}
        currency={c}
        lowStockThreshold={config.lowStockThreshold}
      />

      <Toast toasts={toasts} />
    </>
  )
}
