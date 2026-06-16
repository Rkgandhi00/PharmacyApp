using Microsoft.AspNetCore.Mvc;
using Moq;
using PharmacyApp.Controllers;
using PharmacyApp.Models;
using PharmacyApp.Models.DTOs;
using PharmacyApp.Repositories;
using PharmacyApp.Services;

namespace PharmacyApp.Tests.Controllers;

public class SalesControllerTests
{
    private readonly Mock<ISaleRepository> _repo = new();
    private readonly Mock<IStockService> _stock = new();
    private readonly SalesController _sut;

    public SalesControllerTests() => _sut = new SalesController(_repo.Object, _stock.Object);

    // ── GET (list) ────────────────────────────────────────────────────────────

    [Fact]
    public void Get_ReturnsAllSales()
    {
        _repo.Setup(r => r.GetAll()).Returns(new List<Sale> { MakeSale(), MakeSale() });
        Assert.Equal(2, _sut.Get().Value!.Count);
    }

    [Fact]
    public void Get_ReturnsEmptyList_WhenNoSales()
    {
        _repo.Setup(r => r.GetAll()).Returns(new List<Sale>());
        Assert.Empty(_sut.Get().Value!);
    }

    // ── GET by id ─────────────────────────────────────────────────────────────

    [Fact]
    public void GetById_ReturnsOk_WhenFound()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetById(id)).Returns(MakeSale());
        Assert.IsType<OkObjectResult>(_sut.GetById(id).Result);
    }

    [Fact]
    public void GetById_ReturnsNotFound_WhenMissing()
    {
        _repo.Setup(r => r.GetById(It.IsAny<Guid>())).Returns((Sale?)null);
        Assert.IsType<NotFoundResult>(_sut.GetById(Guid.NewGuid()).Result);
    }

    // ── POST ──────────────────────────────────────────────────────────────────

    [Fact]
    public void Post_ReturnsCreated_WhenSaleSucceeds()
    {
        var id = Guid.NewGuid();
        _stock.Setup(s => s.RecordSale(id, 2, "Alice")).Returns((true, string.Empty, MakeSale()));

        var result = _sut.Post(new SaleRequest { MedicineId = id, Quantity = 2, CustomerName = "Alice" });

        Assert.IsType<CreatedAtActionResult>(result.Result);
    }

    [Fact]
    public void Post_ReturnsNotFound_WhenMedicineNotFound()
    {
        _stock.Setup(s => s.RecordSale(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<string>()))
            .Returns((false, "Medicine not found.", (Sale?)null));

        Assert.IsType<NotFoundObjectResult>(
            _sut.Post(new SaleRequest { MedicineId = Guid.NewGuid(), Quantity = 1, CustomerName = "Bob" }).Result);
    }

    [Fact]
    public void Post_ReturnsBadRequest_WhenInsufficientStock()
    {
        _stock.Setup(s => s.RecordSale(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<string>()))
            .Returns((false, "Insufficient stock. Available: 5.", (Sale?)null));

        var result = _sut.Post(new SaleRequest { MedicineId = Guid.NewGuid(), Quantity = 100, CustomerName = "Carol" });

        var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(bad.Value);
    }

    [Fact]
    public void Post_ReturnsBadRequest_WhenModelInvalid()
    {
        _sut.ModelState.AddModelError("Quantity", "Must be at least 1");
        Assert.IsType<BadRequestObjectResult>(_sut.Post(new SaleRequest()).Result);
    }

    [Fact]
    public void Post_DelegatesToStockService_WithCorrectArgs()
    {
        var id = Guid.NewGuid();
        _stock.Setup(s => s.RecordSale(id, 3, "Dave")).Returns((true, string.Empty, MakeSale()));

        _sut.Post(new SaleRequest { MedicineId = id, Quantity = 3, CustomerName = "Dave" });

        _stock.Verify(s => s.RecordSale(id, 3, "Dave"), Times.Once);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Sale MakeSale() => new()
    {
        MedicineId = Guid.NewGuid(),
        MedicineName = "Aspirin",
        CustomerName = "Test",
        Quantity = 2,
        UnitPrice = 5.00m
    };
}
