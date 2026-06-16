using System.ComponentModel.DataAnnotations;
using PharmacyApp.Infrastructure;
using PharmacyApp.Models;

namespace PharmacyApp.Models.DTOs;

public class CreateMedicineRequest
{
    [Required, MaxLength(200), NotTestValue]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Brand { get; set; } = string.Empty;

    [Required]
    public DateTime ExpiryDate { get; set; }

    [Range(0, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0.")]
    public decimal Price { get; set; }

    public string Notes { get; set; } = string.Empty;

    public Medicine ToMedicine() => new()
    {
        FullName = FullName,
        Brand = Brand,
        ExpiryDate = ExpiryDate,
        Quantity = Quantity,
        Price = Price,
        Notes = Notes
    };
}
