using Microsoft.AspNetCore.Mvc;
using Moq;
using PharmacyApp.Controllers;
using PharmacyApp.Models;
using PharmacyApp.Models.DTOs;
using PharmacyApp.Repositories;
using PharmacyApp.Services;

namespace PharmacyApp.Tests.Controllers;

public class MedicinesControllerTests
{
    private readonly Mock<IMedicineRepository> _repo = new();
    private readonly Mock<IStockService> _stock = new();
    private readonly MedicinesController _sut;

    public MedicinesControllerTests() => _sut = new MedicinesController(_repo.Object, _stock.Object);

    // ── GET (list) ────────────────────────────────────────────────────────────

    [Fact]
    public void Get_ReturnsAllMedicines_WhenNoSearch()
    {
        _repo.Setup(r => r.GetAll(null)).Returns(new List<Medicine> { Med("Aspirin"), Med("Ibuprofen") });
        Assert.Equal(2, _sut.Get(null).Value!.Count);
    }

    [Fact]
    public void Get_PassesSearchTermToRepository()
    {
        _repo.Setup(r => r.GetAll("asp")).Returns(new List<Medicine> { Med("Aspirin") });
        var result = _sut.Get("asp");
        Assert.Single(result.Value!);
        _repo.Verify(r => r.GetAll("asp"), Times.Once);
    }

    // ── GET by id ─────────────────────────────────────────────────────────────

    [Fact]
    public void GetById_ReturnsOk_WhenFound()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetById(id)).Returns(Med("Aspirin"));
        Assert.IsType<OkObjectResult>(_sut.GetById(id).Result);
    }

    [Fact]
    public void GetById_ReturnsNotFound_WhenMissing()
    {
        _repo.Setup(r => r.GetById(It.IsAny<Guid>())).Returns((Medicine?)null);
        Assert.IsType<NotFoundResult>(_sut.GetById(Guid.NewGuid()).Result);
    }

    // ── POST ──────────────────────────────────────────────────────────────────

    [Fact]
    public void Post_ReturnsCreated_WithValidRequest()
    {
        var req = new CreateMedicineRequest { FullName = "Aspirin", Brand = "Bayer", ExpiryDate = DateTime.UtcNow.AddDays(365), Quantity = 50, Price = 3.99m };
        _repo.Setup(r => r.Add(It.IsAny<Medicine>())).Returns<Medicine>(m => m);

        Assert.IsType<CreatedAtActionResult>(_sut.Post(req).Result);
    }

    [Fact]
    public void Post_ReturnsBadRequest_WhenModelInvalid()
    {
        _sut.ModelState.AddModelError("FullName", "Required");
        Assert.IsType<BadRequestObjectResult>(_sut.Post(new CreateMedicineRequest()).Result);
    }

    [Fact]
    public void Post_CallsRepoAdd_WithMappedEntity()
    {
        var req = new CreateMedicineRequest { FullName = "Aspirin", Brand = "Bayer", ExpiryDate = DateTime.UtcNow.AddDays(365), Quantity = 50, Price = 3.99m };
        _repo.Setup(r => r.Add(It.IsAny<Medicine>())).Returns<Medicine>(m => m);

        _sut.Post(req);

        _repo.Verify(r => r.Add(It.Is<Medicine>(m => m.FullName == "Aspirin" && m.Brand == "Bayer")), Times.Once);
    }

    // ── PUT ───────────────────────────────────────────────────────────────────

    [Fact]
    public void Put_ReturnsOk_WhenFound()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.Update(id, It.IsAny<Action<Medicine>>())).Returns(Med("Updated"));
        Assert.IsType<OkObjectResult>(_sut.Put(id, new UpdateMedicineRequest { FullName = "Updated" }).Result);
    }

    [Fact]
    public void Put_ReturnsNotFound_WhenMissing()
    {
        _repo.Setup(r => r.Update(It.IsAny<Guid>(), It.IsAny<Action<Medicine>>())).Returns((Medicine?)null);
        Assert.IsType<NotFoundResult>(_sut.Put(Guid.NewGuid(), new UpdateMedicineRequest()).Result);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    [Fact]
    public void Delete_ReturnsNoContent_WhenDeleted()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.Delete(id)).Returns(true);
        Assert.IsType<NoContentResult>(_sut.Delete(id));
    }

    [Fact]
    public void Delete_ReturnsNotFound_WhenMissing()
    {
        _repo.Setup(r => r.Delete(It.IsAny<Guid>())).Returns(false);
        Assert.IsType<NotFoundResult>(_sut.Delete(Guid.NewGuid()));
    }

    // ── Restock ───────────────────────────────────────────────────────────────

    [Fact]
    public void Restock_ReturnsOk_WhenSuccessful()
    {
        var id = Guid.NewGuid();
        _stock.Setup(s => s.Restock(id, 50, "Delivery")).Returns((true, string.Empty, Med("Aspirin")));
        Assert.IsType<OkObjectResult>(_sut.Restock(id, new RestockRequest { Quantity = 50, Notes = "Delivery" }).Result);
    }

    [Fact]
    public void Restock_ReturnsNotFound_WhenMedicineNotFound()
    {
        _stock.Setup(s => s.Restock(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<string>()))
            .Returns((false, "Medicine not found.", (Medicine?)null));
        Assert.IsType<NotFoundObjectResult>(_sut.Restock(Guid.NewGuid(), new RestockRequest { Quantity = 10 }).Result);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Medicine Med(string name) => new() { FullName = name, Brand = "B", ExpiryDate = DateTime.UtcNow.AddDays(365) };
}
