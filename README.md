# ABC Pharmacy — Medicine Management System

A lightweight web-based pharmacy management system built with **ASP.NET Core (.NET 10)** and **Vanilla JS / Bootstrap 5**. All data is stored locally in JSON files — no database required.

| | |
|---|---|
| **Non-coders** | [⬇ Download latest release](https://github.com/Rkgandhi00/PharmacyApp/releases/latest) — unzip and double-click, no installation needed |
| **Coders** | `git clone https://github.com/Rkgandhi00/PharmacyApp.git` then `dotnet run --project PharmacyApp` |

---

## Features

- **Inventory** — add, edit, restock, and delete medicines
- **Sales** — record sales with automatic stock deduction and audit trail
- **Status tracking** — colour-coded rows: expiring soon, low stock, out of stock
- **Search & filters** — live search by name or brand; filter pills by status
- **Sortable columns** — click any column header to sort ascending / descending
- **Pagination** — 10 rows per page
- **Today's sales** — click the "Sales Today" card to expand a live card strip
- **Config-driven** — currency symbol, low-stock threshold, expiry warning, and locale all live in `appsettings.json` with no code changes needed
- **Duplicate warning** — soft frontend alert when the same medicine + brand already exists (different batches with different expiry / price are allowed)
- **Input validation** — required-field highlighting, save button disabled until form is complete, test-value guard on the backend

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Backend API | ASP.NET Core 10 Web API (Minimal + Controllers) |
| Frontend    | Vanilla JS (ES2022), Bootstrap 5.3, Bootstrap Icons 1.11 |
| Persistence | JSON flat files (`Data/`) — no database         |
| DI lifetime | Singleton throughout (file-lock shared across all services) |
| Tests       | xUnit 2.9.3 · Moq 4.20.72 · 46 tests           |
| SDK pin     | .NET 10.0.301 (`global.json`, rolls forward to latest minor) |

---

## Prerequisites

### To run the app (non-coders)
No installation needed — [download the release zip](https://github.com/Rkgandhi00/PharmacyApp/releases/latest).

### To run from source (developers)
| Tool | Version | Download |
|------|---------|----------|
| .NET SDK | 10.0+ | [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/10.0) |
| Visual Studio | 2022 v17.14+ | Required for .NET 10 support |
| — or VS Code | any | with C# Dev Kit extension |
| Browser | Chrome / Edge / Firefox | — |

> **Visual Studio note:** VS 2022 v17.14 or later is required. Older versions bundle an SDK that predates .NET 10 and will show an SDK-not-found error on load.

---

## Solution Structure

```
PharmacyApp/                        ← git repo root / solution root
├── PharmacyApp.sln                 ← open this in Visual Studio or Rider
├── global.json                     ← pins SDK to .NET 10
├── .gitignore
├── .gitattributes
├── README.md
│
├── PharmacyApp/                    ← web API project
│   ├── PharmacyApp.csproj
│   ├── Program.cs                  ← DI wiring + /api/config endpoint
│   ├── appsettings.json            ← currency, thresholds, locale, port
│   ├── Controllers/
│   │   ├── MedicinesController.cs
│   │   └── SalesController.cs
│   ├── Data/                       ← JSON data files (auto-created on first run)
│   │   ├── medicines.json
│   │   ├── sales.json
│   │   └── stock-transactions.json
│   ├── Infrastructure/
│   │   ├── FileStoreLock.cs        ← shared reentrant Monitor for thread safety
│   │   ├── JsonOptions.cs
│   │   └── NotTestValueAttribute.cs
│   ├── Models/
│   │   ├── Medicine.cs
│   │   ├── Sale.cs                 ← immutable; name+price snapshotted at sale time
│   │   ├── StockTransaction.cs     ← audit log entry
│   │   └── DTOs/
│   ├── Repositories/
│   │   ├── IMedicineRepository.cs
│   │   ├── ISaleRepository.cs
│   │   ├── IStockTransactionRepository.cs
│   │   └── Json/
│   │       ├── JsonRepositoryBase.cs   ← shared file I/O + lock wiring
│   │       ├── JsonMedicineRepository.cs
│   │       ├── JsonSaleRepository.cs
│   │       └── JsonStockTransactionRepository.cs
│   ├── Services/
│   │   ├── IStockService.cs
│   │   └── StockService.cs         ← atomic sale + restock (lock held across repos)
│   └── wwwroot/
│       ├── index.html
│       └── app.js
│
└── PharmacyApp.Tests/              ← test project (46 tests)
    ├── PharmacyApp.Tests.csproj
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

```powershell
# 1. Clone
git clone https://github.com/Rkgandhi00/PharmacyApp.git
cd PharmacyApp

# 2. Run the app
dotnet run --project PharmacyApp

# 3. Open in browser
# http://localhost:5000
```

### Run all tests

```powershell
dotnet test PharmacyApp.sln
```

Expected output: `Passed! — Failed: 0, Passed: 46`

---

## Configuration

All business values live in [`PharmacyApp/appsettings.json`](PharmacyApp/appsettings.json) — no code changes needed:

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
| `Urls` | `http://0.0.0.0:5000` | Port the app listens on |
| `Currency.Symbol` | `₹` | Symbol shown next to all prices |
| `Currency.Code` | `INR` | Currency code (display only) |
| `App.ExpiryWarningDays` | `30` | Days before expiry to flag "Expiring Soon" |
| `App.LowStockThreshold` | `10` | Quantity below which a medicine shows "Low Stock" |
| `App.DateLocale` | `en-IN` | Date format locale — `en-GB`, `en-US`, etc. |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/medicines` | List all medicines (optional `?search=`) |
| `POST` | `/api/medicines` | Add a new medicine |
| `PUT` | `/api/medicines/{id}` | Update medicine fields |
| `DELETE` | `/api/medicines/{id}` | Delete a medicine |
| `POST` | `/api/medicines/{id}/restock` | Add stock units |
| `GET` | `/api/sales` | List all sales |
| `POST` | `/api/sales` | Record a sale (deducts stock atomically) |
| `GET` | `/api/config` | Frontend config payload (currency, thresholds) |

---

## Sharing & Distribution

### Non-coders — GitHub Release (recommended)

Go to [Releases](https://github.com/Rkgandhi00/PharmacyApp/releases/latest), download `PharmacyApp-v1.0-win-x64.zip`.

1. Unzip anywhere (e.g. Desktop)
2. Double-click **PharmacyApp.exe**
3. Wait for: `Now listening on: http://0.0.0.0:5000`
4. Open **http://localhost:5000** in your browser
5. Close the terminal window to stop the app

> Self-contained — no .NET runtime installation required. Windows 10/11 x64 only.

---

### Developers — build your own release package

**Self-contained single EXE** (~100 MB, no .NET required on target machine):

```powershell
dotnet publish PharmacyApp -r win-x64 --self-contained true /p:PublishSingleFile=true -c Release -o publish
```

**Framework-dependent** (~15 MB, requires [.NET 10 Runtime](https://dotnet.microsoft.com/download/dotnet/10.0) on target machine):

```powershell
dotnet publish PharmacyApp -c Release -o publish
```

Zip the `publish/` folder and share. The recipient follows the same steps as above.

---

## Notes

- **Data files** are plain JSON in `Data/` next to the EXE. To reset, clear each file to `[]`.
- **Thread safety** — a single `FileStoreLock` (shared Monitor) ensures all repositories and `StockService` are mutually exclusive. Safe for concurrent HTTP requests.
- **No external dependencies** — no database, no cloud services, no message queue. The app runs entirely offline.
- The app listens on localhost only and is **not exposed to the internet**.
