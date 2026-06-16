namespace PharmacyApp.Models;

public enum StockChangeReason { Sale, Restock, Adjustment }

/// <summary>
/// Immutable audit record of a single stock movement.
/// Negative <see cref="QuantityChange"/> = stock out; positive = stock in.
/// </summary>
public class StockTransaction
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid MedicineId { get; init; }
    public int QuantityChange { get; init; }
    public StockChangeReason Reason { get; init; }
    public Guid? ReferenceId { get; init; }     // the SaleId when Reason = Sale
    public string Notes { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
}
