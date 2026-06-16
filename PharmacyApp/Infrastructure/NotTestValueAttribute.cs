using System.ComponentModel.DataAnnotations;

namespace PharmacyApp.Infrastructure;

[AttributeUsage(AttributeTargets.Property)]
public sealed class NotTestValueAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        var s = (value as string)?.Trim() ?? string.Empty;
        if (s.Length == 0) return ValidationResult.Success;

        var lower = s.ToLowerInvariant();
        if (lower == "test" || lower == "testing" || lower.StartsWith("test ", StringComparison.Ordinal))
            return new ValidationResult($"'{context.DisplayName}' cannot be a test placeholder.");

        return ValidationResult.Success;
    }
}
