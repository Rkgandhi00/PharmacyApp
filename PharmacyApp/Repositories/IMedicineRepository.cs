using PharmacyApp.Models;

namespace PharmacyApp.Repositories;

/// <summary>Persistence contract for the medicine catalogue.</summary>
public interface IMedicineRepository
{
    /// <summary>Returns all medicines, optionally filtered by <paramref name="search"/> against name or brand.</summary>
    List<Medicine> GetAll(string? search = null);

    /// <summary>Returns the medicine with the given <paramref name="id"/>, or <c>null</c> if not found.</summary>
    Medicine? GetById(Guid id);

    /// <summary>Persists a new medicine and returns the saved entity.</summary>
    Medicine Add(Medicine medicine);

    /// <summary>
    /// Applies <paramref name="applyChanges"/> to the medicine identified by <paramref name="id"/>,
    /// persists, and returns the updated entity; or <c>null</c> if not found.
    /// </summary>
    Medicine? Update(Guid id, Action<Medicine> applyChanges);

    /// <summary>Removes the medicine with the given <paramref name="id"/>. Returns <c>false</c> if not found.</summary>
    bool Delete(Guid id);
}
