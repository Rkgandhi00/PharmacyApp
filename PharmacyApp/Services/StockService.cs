using PharmacyApp.Infrastructure;
using PharmacyApp.Models;
using PharmacyApp.Repositories;

namespace PharmacyApp.Services;

public class StockService : IStockService
{
    private readonly IMedicineRepository _medicines;
    private readonly ISaleRepository _sales;
    private readonly IStockTransactionRepository _stockTransactions;
    private readonly FileStoreLock _lock;

    public StockService(
        IMedicineRepository medicines,
        ISaleRepository sales,
        IStockTransactionRepository stockTransactions,
        FileStoreLock fileLock)
    {
        _medicines = medicines;
        _sales = sales;
        _stockTransactions = stockTransactions;
        _lock = fileLock;
    }

    public (bool Success, string Error, Sale? Sale) RecordSale(Guid medicineId, int quantity, string customerName)
    {
        lock (_lock.Sync)
        {
            var medicine = _medicines.GetById(medicineId);
            if (medicine is null)
                return (false, "Medicine not found.", null);
            if (medicine.Quantity < quantity)
                return (false, $"Insufficient stock. Available: {medicine.Quantity}.", null);

            _medicines.Update(medicineId, m => m.Quantity -= quantity);

            var sale = new Sale
            {
                MedicineId = medicineId,
                MedicineName = medicine.FullName,
                CustomerName = customerName,
                Quantity = quantity,
                UnitPrice = medicine.Price
            };
            _sales.Add(sale);

            _stockTransactions.Add(new StockTransaction
            {
                MedicineId = medicineId,
                QuantityChange = -quantity,
                Reason = StockChangeReason.Sale,
                ReferenceId = sale.Id
            });

            return (true, string.Empty, sale);
        }
    }

    public (bool Success, string Error, Medicine? Medicine) Restock(Guid medicineId, int quantity, string notes)
    {
        lock (_lock.Sync)
        {
            var medicine = _medicines.GetById(medicineId);
            if (medicine is null)
                return (false, "Medicine not found.", null);

            var updated = _medicines.Update(medicineId, m => m.Quantity += quantity);

            _stockTransactions.Add(new StockTransaction
            {
                MedicineId = medicineId,
                QuantityChange = quantity,
                Reason = StockChangeReason.Restock,
                Notes = notes
            });

            return (true, string.Empty, updated);
        }
    }
}
