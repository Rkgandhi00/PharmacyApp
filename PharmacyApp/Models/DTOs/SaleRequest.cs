using System.ComponentModel.DataAnnotations;
using PharmacyApp.Infrastructure;

namespace PharmacyApp.Models.DTOs;

public class SaleRequest
{
    [Required]
    public Guid MedicineId { get; set; }

    [Required, Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
    public int Quantity { get; set; }

    [Required, MaxLength(200), NotTestValue]
    public string CustomerName { get; set; } = string.Empty;
}
