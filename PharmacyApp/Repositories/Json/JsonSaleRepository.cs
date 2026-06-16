using PharmacyApp.Infrastructure;
using PharmacyApp.Models;

namespace PharmacyApp.Repositories.Json;

public class JsonSaleRepository : JsonRepositoryBase<Sale>, ISaleRepository
{
    public JsonSaleRepository(IWebHostEnvironment env, FileStoreLock fileLock)
        : base(env, fileLock, "sales.json") { }

    public List<Sale> GetAll()
    {
        lock (LockSync) return ReadAll();
    }

    public Sale? GetById(Guid id)
    {
        lock (LockSync) return ReadAll().FirstOrDefault(s => s.Id == id);
    }

    public Sale Add(Sale sale)
    {
        lock (LockSync)
        {
            var list = ReadAll();
            list.Add(sale);
            WriteAll(list);
            return sale;
        }
    }
}
