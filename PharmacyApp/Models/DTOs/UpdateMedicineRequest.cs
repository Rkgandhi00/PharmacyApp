using System.ComponentModel.DataAnnotations;

namespace PharmacyApp.Models.DTOs;

public class UpdateMedicineRequest
{
    [MaxLength(200)]
    public string? FullName { get; set; }

    [MaxLength(100)]
    public string? Brand { get; set; }

    public DateTime? ExpiryDate { get; set; }

    [Range(0, int.MaxValue)]
    public int? Quantity { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal? Price { get; set; }

    public string? Notes { get; set; }
}
