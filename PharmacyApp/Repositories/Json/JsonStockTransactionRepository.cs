using PharmacyApp.Infrastructure;
using PharmacyApp.Models;

namespace PharmacyApp.Repositories.Json;

public class JsonStockTransactionRepository : JsonRepositoryBase<StockTransaction>, IStockTransactionRepository
{
    public JsonStockTransactionRepository(IWebHostEnvironment env, FileStoreLock fileLock)
        : base(env, fileLock, "stock-transactions.json") { }

    public StockTransaction Add(StockTransaction transaction)
    {
        lock (LockSync)
        {
            var list = ReadAll();
            list.Add(transaction);
            WriteAll(list);
            return transaction;
        }
    }
}
