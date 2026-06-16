namespace PharmacyApp.Models;

/// <summary>A medicine stocked in the pharmacy.</summary>
public class Medicine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}
