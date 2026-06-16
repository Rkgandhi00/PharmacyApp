# ABC Pharmacy — Medicine Management System

A lightweight web-based pharmacy management system built with **ASP.NET Core (.NET 9)** and **Vanilla JS / Bootstrap 5**. All data is stored locally in JSON files — no database required.

---

## Features

- Inventory management — add, edit, restock, and delete medicines
- Sales recording — record sales with automatic stock deduction
- Status tracking — colour-coded rows for expiring, low-stock, and out-of-stock items
- Filters & search — filter by status pill + live search by name or brand
- Sortable columns — click any column header to sort ascending/descending
- Pagination — 10 rows per page
- Today's sales strip — click the "Sales Today" card to expand a live card view
- Config-driven — currency, low-stock threshold, and expiry warning window all in `appsettings.json`

---

## Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Backend API | ASP.NET Core 9 Web API                  |
| Frontend    | Vanilla JS, Bootstrap 5, Bootstrap Icons |
| Data store  | JSON files (`Data/`)                    |
| Tests       | xUnit, Moq                              |

---

## Prerequisites (to run from source)

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- Any modern browser (Chrome, Edge, Firefox)

---

## Solution Structure

```
D:\Projects\
├── PharmacyApp.sln           # Open this in Visual Studio or Rider
├── PharmacyApp\              # Web API + frontend
└── PharmacyApp.Tests\        # xUnit test project
```

Open `PharmacyApp.sln` in Visual Studio / Rider to get both projects loaded at once.

---

## Running from Source

```powershell
# from D:\Projects\PharmacyApp
dotnet run
```

Open **http://localhost:5000** in your browser.

### Running the tests

```powershell
# from D:\Projects  (runs all projects in the solution)
dotnet test PharmacyApp.sln
```

---

## Configuration (`appsettings.json`)

No code changes are needed to customise the app — edit these values:

```json
{
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

| Setting                 | Default | Description                                              |
|-------------------------|---------|----------------------------------------------------------|
| `Currency.Symbol`       | `₹`     | Symbol shown next to all prices                          |
| `App.ExpiryWarningDays` | `30`    | Days before expiry to flag a medicine as "Expiring Soon" |
| `App.LowStockThreshold` | `10`    | Quantity below which a medicine is flagged "Low Stock"   |
| `App.DateLocale`        | `en-IN` | Date display locale (`en-GB`, `en-US`, etc.)             |

---

## Project Structure

```
PharmacyApp/
├── Controllers/              # REST API endpoints (medicines, sales)
├── Data/                     # JSON data files — medicines, sales, stock-transactions
├── Infrastructure/           # FileStoreLock, JsonOptions, NotTestValueAttribute
├── Models/                   # Entity models + request DTOs
├── Repositories/             # Interfaces + JSON file implementations
│   └── Json/
│       ├── JsonRepositoryBase.cs   # Shared file I/O + lock wiring
│       ├── JsonMedicineRepository.cs
│       ├── JsonSaleRepository.cs
│       └── JsonStockTransactionRepository.cs
├── Services/                 # StockService (sale recording, restocking)
├── wwwroot/                  # index.html + app.js (single-page frontend)
├── appsettings.json          # All configurable business values
└── Program.cs                # DI registration + minimal API routes

PharmacyApp.Tests/
├── Controllers/              # Controller unit tests
├── Repositories/             # Repository integration tests (temp-file based)
└── Services/                 # StockService unit tests
```

---

## API Endpoints

| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| GET    | `/api/medicines`                | List medicines (optional `?search=`) |
| POST   | `/api/medicines`                | Add a new medicine                 |
| PUT    | `/api/medicines/{id}`           | Update a medicine                  |
| DELETE | `/api/medicines/{id}`           | Delete a medicine                  |
| POST   | `/api/medicines/{id}/restock`   | Add stock to a medicine            |
| GET    | `/api/sales`                    | List all sales                     |
| POST   | `/api/sales`                    | Record a sale                      |
| GET    | `/api/config`                   | Frontend config (currency, thresholds) |

---

## Distribution — How to Share / Email

### Option 1 — Self-contained EXE (recommended)

This bundles .NET inside the EXE so the recipient does **not** need anything installed.

**Step 1 — publish:**
```powershell
dotnet publish D:\Projects\PharmacyApp -r win-x64 --self-contained true /p:PublishSingleFile=true -c Release -o D:\Projects\PharmacyApp\publish
```

**Step 2 — zip the `publish\` folder** using File Explorer (right-click → Send to → Compressed folder) or 7-Zip.

**Step 3 — email the zip.**

**What the recipient does:**
1. Unzip the folder anywhere (e.g. Desktop)
2. Double-click `PharmacyApp.exe`
3. A terminal window opens — wait until it shows `Now listening on: http://0.0.0.0:5000`
4. Open a browser and go to **http://localhost:5000**
5. To close the app, close the terminal window

> The EXE is approximately 60–80 MB (all .NET libraries are bundled inside it).

---

### Option 2 — Smaller package (requires .NET 9 Runtime on recipient's machine)

**Step 1 — publish:**
```powershell
dotnet publish D:\Projects\PharmacyApp -c Release -o D:\Projects\PharmacyApp\publish
```

**Step 2 — zip and send the `publish\` folder.**

**What the recipient does:**
1. Install [.NET 9 Runtime](https://dotnet.microsoft.com/download/dotnet/9.0) (one-time, ~50 MB)
2. Unzip the folder
3. Double-click `PharmacyApp.exe` (or run `dotnet PharmacyApp.dll` in a terminal)
4. Open **http://localhost:5000**

> The publish folder is approximately 10–15 MB zipped.

---

### Option 3 — Share source code (for developers)

Zip the project folder, **excluding** the `bin\` and `obj\` build artifact folders before compressing.

**What the recipient does:**
1. Install [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
2. Unzip the folder
3. Open a terminal in the `PharmacyApp` folder and run `dotnet run`
4. Open **http://localhost:5000**

---

## Notes

- All data is saved in the `Data\` folder next to the EXE as plain JSON files. To reset/wipe all data, delete the contents of those files (keep the files, just clear them to `[]`).
- The port can be changed in `appsettings.json` under the `"Urls"` key.
- The app only listens locally — it is not exposed to the internet.
