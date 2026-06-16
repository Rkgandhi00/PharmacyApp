using PharmacyApp.Models;

namespace PharmacyApp.Repositories;

/// <summary>Write-only audit log for stock movements. Queries are not needed at runtime.</summary>
public interface IStockTransactionRepository
{
    /// <summary>Appends a new stock movement record.</summary>
    StockTransaction Add(StockTransaction transaction);
}
