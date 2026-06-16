using PharmacyApp.Models;

namespace PharmacyApp.Services;

/// <summary>
/// Orchestrates multi-step stock operations that must be atomic:
/// deducting stock and writing the sale/transaction record in one lock.
/// </summary>
public interface IStockService
{
    /// <summary>
    /// Records a sale, deducts stock, and writes a stock-transaction audit entry.
    /// Returns <c>Success = false</c> with an error message if the medicine is not
    /// found or stock is insufficient.
    /// </summary>
    (bool Success, string Error, Sale? Sale) RecordSale(Guid medicineId, int quantity, string customerName);

    /// <summary>
    /// Adds <paramref name="quantity"/> units to the medicine's stock and writes
    /// a stock-transaction audit entry.
    /// Returns <c>Success = false</c> if the medicine is not found.
    /// </summary>
    (bool Success, string Error, Medicine? Medicine) Restock(Guid medicineId, int quantity, string notes);
}
