using Moq;
using PharmacyApp.Infrastructure;
using PharmacyApp.Models;
using PharmacyApp.Repositories;
using PharmacyApp.Services;

namespace PharmacyApp.Tests.Services;

public class StockServiceTests
{
    private readonly Mock<IMedicineRepository> _medicines = new();
    private readonly Mock<ISaleRepository> _sales = new();
    private readonly Mock<IStockTransactionRepository> _stockTx = new();
    private readonly StockService _sut;

    public StockServiceTests()
    {
        _sales.Setup(r => r.Add(It.IsAny<Sale>())).Returns<Sale>(s => s);
        _stockTx.Setup(r => r.Add(It.IsAny<StockTransaction>())).Returns<StockTransaction>(t => t);
        _sut = new StockService(_medicines.Object, _sales.Object, _stockTx.Object, new FileStoreLock());
    }

    // ── RecordSale ────────────────────────────────────────────────────────────

    [Fact]
    public void RecordSale_ReturnsError_WhenMedicineNotFound()
    {
        _medicines.Setup(r => r.GetById(It.IsAny<Guid>())).Returns((Medicine?)null);

        var (success, error, sale) = _sut.RecordSale(Guid.NewGuid(), 1, "Alice");

        Assert.False(success);
        Assert.Contains("not found", error, StringComparison.OrdinalIgnoreCase);
        Assert.Null(sale);
    }

    [Fact]
    public void RecordSale_ReturnsError_WhenInsufficientStock()
    {
        _medicines.Setup(r => r.GetById(It.IsAny<Guid>())).Returns(Med(qty: 5));

        var (success, error, sale) = _sut.RecordSale(Guid.NewGuid(), 10, "Alice");

        Assert.False(success);
        Assert.Contains("Insufficient", error, StringComparison.OrdinalIgnoreCase);
        Assert.Null(sale);
    }

    [Fact]
    public void RecordSale_CallsUpdate_ToDeductStock()
    {
        var id = Guid.NewGuid();
        _medicines.Setup(r => r.GetById(id)).Returns(Med(id: id, qty: 20));
        _medicines.Setup(r => r.Update(id, It.IsAny<Action<Medicine>>()))
            .Callback<Guid, Action<Medicine>>((_, action) => { var m = Med(qty: 20); action(m); })
            .Returns(Med(id: id, qty: 15));

        _sut.RecordSale(id, 5, "Alice");

        _medicines.Verify(r => r.Update(id, It.IsAny<Action<Medicine>>()), Times.Once);
    }

    [Fact]
    public void RecordSale_ReturnsSale_WithCorrectFields()
    {
        var id = Guid.NewGuid();
        _medicines.Setup(r => r.GetById(id)).Returns(Med(id: id, qty: 20, price: 4.50m, name: "Aspirin"));
        _medicines.Setup(r => r.Update(id, It.IsAny<Action<Medicine>>())).Returns(Med(id: id, qty: 15));

        var (success, _, sale) = _sut.RecordSale(id, 3, "Bob");

        Assert.True(success);
        Assert.NotNull(sale);
        Assert.Equal("Aspirin", sale!.MedicineName);
        Assert.Equal("Bob", sale.CustomerName);
        Assert.Equal(3, sale.Quantity);
        Assert.Equal(4.50m, sale.UnitPrice);
        Assert.Equal(13.50m, sale.TotalAmount); // computed: 4.50 * 3
    }

    [Fact]
    public void RecordSale_AddsStockTransaction_WithNegativeChange()
    {
        var id = Guid.NewGuid();
        _medicines.Setup(r => r.GetById(id)).Returns(Med(id: id, qty: 20));
        _medicines.Setup(r => r.Update(id, It.IsAny<Action<Medicine>>())).Returns(Med(id: id, qty: 17));

        _sut.RecordSale(id, 3, "Carol");

        _stockTx.Verify(r => r.Add(It.Is<StockTransaction>(t =>
            t.MedicineId == id &&
            t.QuantityChange == -3 &&
            t.Reason == StockChangeReason.Sale)), Times.Once);
    }

    [Fact]
    public void RecordSale_SaleId_IsLinkedInStockTransaction()
    {
        var id = Guid.NewGuid();
        _medicines.Setup(r => r.GetById(id)).Returns(Med(id: id, qty: 20));
        _medicines.Setup(r => r.Update(id, It.IsAny<Action<Medicine>>())).Returns(Med(id: id, qty: 17));

        Guid? capturedSaleId = null;
        _stockTx.Setup(r => r.Add(It.IsAny<StockTransaction>()))
            .Callback<StockTransaction>(t => capturedSaleId = t.ReferenceId)
            .Returns<StockTransaction>(t => t);

        var (_, _, sale) = _sut.RecordSale(id, 3, "Dave");

        Assert.Equal(sale!.Id, capturedSaleId);
    }

    [Fact]
    public void RecordSale_AllowsExactStockQuantity()
    {
        var id = Guid.NewGuid();
        _medicines.Setup(r => r.GetById(id)).Returns(Med(id: id, qty: 10));
        _medicines.Setup(r => r.Update(id, It.IsAny<Action<Medicine>>())).Returns(Med(id: id, qty: 0));

        var (success, _, _) = _sut.RecordSale(id, 10, "Eve");

        Assert.True(success);
    }

    // ── Restock ───────────────────────────────────────────────────────────────

    [Fact]
    public void Restock_ReturnsError_WhenMedicineNotFound()
    {
        _medicines.Setup(r => r.GetById(It.IsAny<Guid>())).Returns((Medicine?)null);

        var (success, error, medicine) = _sut.Restock(Guid.NewGuid(), 50, "Delivery");

        Assert.False(success);
        Assert.Contains("not found", error, StringComparison.OrdinalIgnoreCase);
        Assert.Null(medicine);
    }

    [Fact]
    public void Restock_CallsUpdate_ToAddStock()
    {
        var id = Guid.NewGuid();
        _medicines.Setup(r => r.GetById(id)).Returns(Med(id: id, qty: 10));
        _medicines.Setup(r => r.Update(id, It.IsAny<Action<Medicine>>())).Returns(Med(id: id, qty: 60));

        _sut.Restock(id, 50, "Monthly delivery");

        _medicines.Verify(r => r.Update(id, It.IsAny<Action<Medicine>>()), Times.Once);
    }

    [Fact]
    public void Restock_AddsStockTransaction_WithPositiveChange()
    {
        var id = Guid.NewGuid();
        _medicines.Setup(r => r.GetById(id)).Returns(Med(id: id, qty: 10));
        _medicines.Setup(r => r.Update(id, It.IsAny<Action<Medicine>>())).Returns(Med(id: id, qty: 60));

        _sut.Restock(id, 50, "Monthly delivery");

        _stockTx.Verify(r => r.Add(It.Is<StockTransaction>(t =>
            t.MedicineId == id &&
            t.QuantityChange == 50 &&
            t.Reason == StockChangeReason.Restock &&
            t.Notes == "Monthly delivery")), Times.Once);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Medicine Med(Guid? id = null, int qty = 50, decimal price = 5.00m, string name = "Test") => new()
    {
        Id = id ?? Guid.NewGuid(),
        FullName = name,
        Brand = "TestBrand",
        ExpiryDate = DateTime.UtcNow.AddDays(365),
        Quantity = qty,
        Price = price
    };
}
