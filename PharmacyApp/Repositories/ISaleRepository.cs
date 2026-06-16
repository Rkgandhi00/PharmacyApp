using PharmacyApp.Models;

namespace PharmacyApp.Repositories;

/// <summary>Persistence contract for the immutable sale history log.</summary>
public interface ISaleRepository
{
    /// <summary>Returns all recorded sales.</summary>
    List<Sale> GetAll();

    /// <summary>Returns the sale with the given <paramref name="id"/>, or <c>null</c> if not found.</summary>
    Sale? GetById(Guid id);

    /// <summary>Appends a new sale record and returns the saved entity.</summary>
    Sale Add(Sale sale);
}
