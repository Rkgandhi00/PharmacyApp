using PharmacyApp.Infrastructure;
using PharmacyApp.Models;

namespace PharmacyApp.Repositories.Json;

public class JsonMedicineRepository : JsonRepositoryBase<Medicine>, IMedicineRepository
{
    public JsonMedicineRepository(IWebHostEnvironment env, FileStoreLock fileLock)
        : base(env, fileLock, "medicines.json") { }

    public List<Medicine> GetAll(string? search = null)
    {
        lock (LockSync)
        {
            var list = ReadAll();
            return string.IsNullOrWhiteSpace(search)
                ? list
                : list.Where(m =>
                    m.FullName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    m.Brand.Contains(search, StringComparison.OrdinalIgnoreCase))
                  .ToList();
        }
    }

    public Medicine? GetById(Guid id)
    {
        lock (LockSync) return ReadAll().FirstOrDefault(m => m.Id == id);
    }

    public Medicine Add(Medicine medicine)
    {
        lock (LockSync)
        {
            var list = ReadAll();
            list.Add(medicine);
            WriteAll(list);
            return medicine;
        }
    }

    public Medicine? Update(Guid id, Action<Medicine> applyChanges)
    {
        lock (LockSync)
        {
            var list = ReadAll();
            var medicine = list.FirstOrDefault(m => m.Id == id);
            if (medicine is null) return null;
            applyChanges(medicine);
            WriteAll(list);
            return medicine;
        }
    }

    public bool Delete(Guid id)
    {
        lock (LockSync)
        {
            var list = ReadAll();
            var removed = list.RemoveAll(m => m.Id == id);
            if (removed > 0) WriteAll(list);
            return removed > 0;
        }
    }
}
