# ABC Pharmacy — Medicine Management System

A lightweight web-based pharmacy management system built with **ASP.NET Core (.NET 10)** backend and a **React 19 / Vite** frontend. All data is stored locally in JSON files — no database required.

| | |
|---|---|
| **Non-coders** | [⬇ Download latest release](https://github.com/Rkgandhi00/PharmacyApp/releases/latest) — unzip and double-click, no installation needed |
| **Coders** | `git clone https://github.com/Rkgandhi00/PharmacyApp.git` then see [Running from Source](#running-from-source) |

---

## Features

- **Inventory** — add, restock, and delete medicines with live form validation
- **Sales** — record sales with automatic stock deduction and full audit trail
- **Status tracking** — colour-coded rows: expiring soon, low stock, out of stock
- **Search & filters** — live search by name or brand; filter pills by status
- **Sortable columns** — click any column header to sort ascending / descending
- **Pagination** — 10 rows per page with windowed page controls
- **Today's sales** — click the "Sales Today" card to expand a live horizontal card strip
- **Config-driven** — currency symbol, low-stock threshold, expiry warning, and locale all live in `appsettings.json` — no code changes needed
- **Duplicate warning** — soft frontend alert when the same medicine + brand already exists (different batches with different expiry / price are allowed)
- **Input validation** — save button disabled until form is complete; backend blocks test placeholder values
- **Error handling** — global exception handler returns RFC 7807 `ProblemDetails` JSON; never exposes stack traces

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | ASP.NET Core 10 Web API — Controllers + Minimal API |
| Frontend | React 19, Vite 8, Bootstrap 5.3, Bootstrap Icons 1.11 |
| Build | Vite — dev server with HMR; production build outputs to `wwwroot/` |
| Persistence | JSON flat files (`Data/`) — no database required |
| Thread safety | Singleton `FileStoreLock` (reentrant Monitor) shared across all services |
| Tests | xUnit 2.9.3 · Moq 4.20.72 · 46 tests (unit + integration + controller) |

---

## Prerequisites

### To run the app (non-coders)
No installation needed — [download the release zip](https://github.com/Rkgandhi00/PharmacyApp/releases/latest).

### To run from source (developers)

| Tool | Version | Notes |
|---|---|---|
| .NET SDK | 10.0+ | [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/10.0) |
| Node.js | 18+ | Required only to rebuild the frontend |
| Visual Studio | 2022 v17.14+ | Or VS Code with C# Dev Kit |
| Browser | Chrome / Edge / Firefox | — |

> **Visual Studio note:** VS 2022 v17.14 or later is required. Older versions bundle an SDK that predates .NET 10 and will show an SDK-not-found error on load.

---

## Solution Structure

```
PharmacyApp/                          ← git repo root / solution root
├── PharmacyApp.sln                   ← open this in Visual Studio or Rider
├── .gitignore
├── .gitattributes
├── README.md
│
├── pharmacy-ui/                      ← React frontend (Vite)
│   ├── vite.config.js                ← proxy /api → :5000 in dev; build → wwwroot/
│   ├── package.json
│   └── src/
│       ├── main.jsx                  ← ReactDOM entry point
│       ├── App.jsx                   ← root component — all state lives here
│       ├── App.css                   ← all custom styles
│       ├── api.js                    ← all fetch calls in one place
│       └── components/
│           ├── Modal.jsx             ← reusable backdrop + dialog (no Bootstrap JS)
│           ├── Toast.jsx             ← toast notification list
│           ├── StatsBar.jsx          ← 4 stat cards (total, expiring, low stock, today)
│           ├── SalesToday.jsx        ← expandable horizontal card strip
│           ├── MedicineTable.jsx     ← sort + filter + pagination + sell button
│           ├── MedicineModal.jsx     ← add medicine with duplicate batch warning
│           ├── SaleModal.jsx         ← record sale with live total + stock hint
│           └── SalesTab.jsx          ← revenue stats + full sales table
│
├── PharmacyApp/                      ← ASP.NET Core Web API project
│   ├── PharmacyApp.csproj
│   ├── Program.cs                    ← DI wiring, middleware, /api/config endpoint
│   ├── appsettings.json              ← currency, thresholds, locale, port
│   ├── Controllers/
│   │   ├── MedicinesController.cs
│   │   └── SalesController.cs
│   ├── Data/                         ← JSON data files (auto-created on first run)
│   │   ├── medicines.json
│   │   ├── sales.json
│   │   └── stock-transactions.json
│   ├── Infrastructure/
│   │   ├── FileStoreLock.cs          ← shared reentrant Monitor for thread safety
│   │   ├── JsonOptions.cs
│   │   └── NotTestValueAttribute.cs  ← blocks "test" placeholder values
│   ├── Models/
│   │   ├── Medicine.cs
│   │   ├── Sale.cs                   ← immutable; name+price snapshotted at sale time
│   │   ├── StockTransaction.cs       ← signed audit log entry (- out, + in)
│   │   └── DTOs/
│   ├── Repositories/
│   │   ├── IMedicineRepository.cs
│   │   ├── ISaleRepository.cs
│   │   ├── IStockTransactionRepository.cs
│   │   └── Json/
│   │       ├── JsonRepositoryBase.cs ← shared file I/O + lock wiring (Template Method)
│   │       ├── JsonMedicineRepository.cs
│   │       ├── JsonSaleRepository.cs
│   │       └── JsonStockTransactionRepository.cs
│   ├── Services/
│   │   ├── IStockService.cs
│   │   └── StockService.cs           ← atomic sale + restock (lock held across repos)
│   └── wwwroot/                      ← React build output (generated by npm run build)
│
└── PharmacyApp.Tests/                ← xUnit test project (46 tests)
    ├── Controllers/
    │   ├── MedicinesControllerTests.cs
    │   └── SalesControllerTests.cs
    ├── Repositories/
    │   └── JsonMedicineRepositoryTests.cs  ← integration tests using temp dir
    └── Services/
        └── StockServiceTests.cs
```

---

## Running from Source

### Option A — Production mode (single process)

The React app is pre-built. The .NET server serves both the API and the frontend.

```powershell
# 1. Clone
git clone https://github.com/Rkgandhi00/PharmacyApp.git
cd PharmacyApp

# 2. Build the React frontend (first time or after UI changes)
cd pharmacy-ui
npm install
npm run build     # outputs to ../PharmacyApp/wwwroot/
cd ..

# 3. Run the backend
dotnet run --project PharmacyApp

# 4. Open http://localhost:5000
```

### Option B — Dev mode (hot reload)

Run the .NET API and Vite dev server in separate terminals. The Vite dev server proxies all `/api` calls to the .NET backend automatically.

```powershell
# Terminal 1 — .NET API
dotnet run --project PharmacyApp

# Terminal 2 — React dev server (hot module reload)
cd pharmacy-ui
npm install
npm run dev       # opens http://localhost:5173
```

Changes to `.jsx` / `.css` files reflect instantly without a page reload.

### Run all tests

```powershell
dotnet test PharmacyApp.sln
```

Expected: `Passed! — Failed: 0, Passed: 46`

---

## Configuration

All business values live in [`PharmacyApp/appsettings.json`](PharmacyApp/appsettings.json) — no code or rebuild required:

```json
{
  "Urls": "http://0.0.0.0:5000",
  "Currency": {
    "Symbol": "₹",
    "Code": "INR"
  },
  "App": {
    "ExpiryWarningDays": 30,
    "LowStockThreshold": 10,
    "DateLocale": "en-IN"
  }
}
```

| Setting | Default | Description |
|---|---|---|
| `Urls` | `http://0.0.0.0:5000` | Port the .NET server listens on |
| `Currency.Symbol` | `₹` | Symbol shown next to all prices in the UI |
| `Currency.Code` | `INR` | Currency code (display only) |
| `App.ExpiryWarningDays` | `30` | Days before expiry to flag "Expiring Soon" |
| `App.LowStockThreshold` | `10` | Quantity at which a medicine shows "Low Stock" |
| `App.DateLocale` | `en-IN` | Date format locale — `en-GB`, `en-US`, etc. |

The React app fetches these values from `/api/config` on startup, so the frontend and backend always stay in sync with a single config file.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/medicines` | List all medicines (optional `?search=`) |
| `POST` | `/api/medicines` | Add a new medicine |
| `PUT` | `/api/medicines/{id}` | Update medicine fields (partial update) |
| `DELETE` | `/api/medicines/{id}` | Delete a medicine |
| `POST` | `/api/medicines/{id}/restock` | Add stock units |
| `GET` | `/api/sales` | List all sales |
| `POST` | `/api/sales` | Record a sale (deducts stock atomically) |
| `GET` | `/api/config` | Frontend config payload (currency, thresholds, locale) |

All error responses follow RFC 7807 `ProblemDetails` format — no stack traces exposed.

---

## Sharing & Distribution

### Non-coders — GitHub Release (recommended)

Go to [Releases](https://github.com/Rkgandhi00/PharmacyApp/releases/latest), download `PharmacyApp-v1.0-win-x64.zip`.

1. Unzip anywhere (e.g. Desktop)
2. Double-click **PharmacyApp.exe**
3. Wait for: `Now listening on: http://0.0.0.0:5000`
4. Open **http://localhost:5000** in your browser
5. Close the terminal window to stop the app

> Self-contained — no .NET runtime or Node.js required on the target machine. Windows 10/11 x64 only.

---

### Developers — build a release package

**Step 1 — build the React frontend**

```powershell
cd pharmacy-ui
npm run build     # writes to ../PharmacyApp/wwwroot/
cd ..
```

**Step 2 — publish the .NET app**

Self-contained single EXE (~100 MB, no .NET required on target machine):

```powershell
dotnet publish PharmacyApp -r win-x64 --self-contained true /p:PublishSingleFile=true -c Release -o publish
```

Framework-dependent (~15 MB, requires [.NET 10 Runtime](https://dotnet.microsoft.com/download/dotnet/10.0)):

```powershell
dotnet publish PharmacyApp -c Release -o publish
```

Zip the `publish/` folder and share. Recipients follow the same steps as above.

---

## Notes

- **Data files** are plain JSON in `Data/` next to the EXE. To reset all data, clear each file to `[]`.
- **Thread safety** — a single `FileStoreLock` (shared Monitor) ensures all repositories and `StockService` are mutually exclusive across concurrent HTTP requests.
- **No external dependencies** — no database, no cloud services, no message queue. The app runs entirely offline.
- **Frontend build** — the `wwwroot/` folder is generated by `npm run build` and is gitignored. Clone + `npm run build` + `dotnet run` is the full setup.
- The app listens on all interfaces (`0.0.0.0`) on port 5000 but is intended for local / intranet use only.
