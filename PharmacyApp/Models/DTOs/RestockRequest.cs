using System.ComponentModel.DataAnnotations;

namespace PharmacyApp.Models.DTOs;

public class RestockRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
    public int Quantity { get; set; }

    public string Notes { get; set; } = string.Empty;
}
