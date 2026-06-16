namespace PharmacyApp.Models;

/// <summary>
/// An immutable record of a completed sale.
/// Name and price are snapshotted at sale time so the record is accurate
/// even if the medicine is later edited or deleted.
/// </summary>
public class Sale
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid MedicineId { get; init; }
    public string MedicineName { get; init; } = string.Empty;   // snapshot at time of sale
    public string CustomerName { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }                     // snapshot at time of sale
    public decimal TotalAmount => UnitPrice * Quantity;          // always derived, never stored
    public DateTime SaleDate { get; init; } = DateTime.UtcNow;
}
