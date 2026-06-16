using Microsoft.AspNetCore.Hosting;
using Moq;
using PharmacyApp.Infrastructure;
using PharmacyApp.Models;
using PharmacyApp.Repositories.Json;

namespace PharmacyApp.Tests.Repositories;

public class JsonMedicineRepositoryTests : IDisposable
{
    private readonly string _tempDir;
    private readonly JsonMedicineRepository _sut;

    public JsonMedicineRepositoryTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        var env = new Mock<IWebHostEnvironment>();
        env.Setup(e => e.ContentRootPath).Returns(_tempDir);
        _sut = new JsonMedicineRepository(env.Object, new FileStoreLock());
    }

    public void Dispose() => Directory.Delete(_tempDir, recursive: true);

    // ── GetAll ────────────────────────────────────────────────────────────────

    [Fact]
    public void GetAll_ReturnsEmpty_Initially()
    {
        Assert.Empty(_sut.GetAll());
    }

    [Fact]
    public void GetAll_ReturnsAllAdded()
    {
        _sut.Add(Med("Aspirin"));
        _sut.Add(Med("Ibuprofen"));
        Assert.Equal(2, _sut.GetAll().Count);
    }

    [Fact]
    public void GetAll_FiltersBy_FullName()
    {
        _sut.Add(Med("Amoxicillin"));
        _sut.Add(Med("Ibuprofen"));
        var result = _sut.GetAll("amoxi");
        Assert.Single(result);
        Assert.Equal("Amoxicillin", result[0].FullName);
    }

    [Fact]
    public void GetAll_FiltersBy_Brand()
    {
        _sut.Add(Med("Paracetamol", brand: "Boots"));
        _sut.Add(Med("Ibuprofen", brand: "Nurofen"));
        var result = _sut.GetAll("Boots");
        Assert.Single(result);
    }

    [Fact]
    public void GetAll_Search_IsCaseInsensitive()
    {
        _sut.Add(Med("Paracetamol"));
        Assert.Single(_sut.GetAll("PARACETAMOL"));
    }

    // ── GetById ───────────────────────────────────────────────────────────────

    [Fact]
    public void GetById_ReturnsNull_WhenNotFound()
    {
        Assert.Null(_sut.GetById(Guid.NewGuid()));
    }

    [Fact]
    public void GetById_ReturnsCorrectMedicine()
    {
        var added = _sut.Add(Med("Aspirin"));
        var found = _sut.GetById(added.Id);
        Assert.NotNull(found);
        Assert.Equal("Aspirin", found!.FullName);
    }

    // ── Add ───────────────────────────────────────────────────────────────────

    [Fact]
    public void Add_PersistsToDisk()
    {
        _sut.Add(Med("Aspirin", price: 3.99m));
        var loaded = _sut.GetAll();
        Assert.Single(loaded);
        Assert.Equal(3.99m, loaded[0].Price);
    }

    [Fact]
    public void Add_UsesIdFromEntity()
    {
        var medicine = Med("Aspirin");
        var added = _sut.Add(medicine);
        Assert.Equal(medicine.Id, added.Id);
        Assert.Equal(medicine.Id, _sut.GetById(medicine.Id)!.Id);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    [Fact]
    public void Update_ReturnsNull_WhenNotFound()
    {
        var result = _sut.Update(Guid.NewGuid(), m => m.FullName = "Changed");
        Assert.Null(result);
    }

    [Fact]
    public void Update_AppliesChangesAndPersists()
    {
        var added = _sut.Add(Med("Aspirin", qty: 20));
        _sut.Update(added.Id, m => m.Quantity -= 5);
        Assert.Equal(15, _sut.GetById(added.Id)!.Quantity);
    }

    [Fact]
    public void Update_DoesNotAffectOtherMedicines()
    {
        var a = _sut.Add(Med("Aspirin"));
        var b = _sut.Add(Med("Ibuprofen", qty: 100));
        _sut.Update(a.Id, m => m.Quantity = 0);
        Assert.Equal(100, _sut.GetById(b.Id)!.Quantity);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    [Fact]
    public void Delete_ReturnsFalse_WhenNotFound()
    {
        Assert.False(_sut.Delete(Guid.NewGuid()));
    }

    [Fact]
    public void Delete_RemovesMedicineAndPersists()
    {
        var added = _sut.Add(Med("Aspirin"));
        Assert.True(_sut.Delete(added.Id));
        Assert.Null(_sut.GetById(added.Id));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Medicine Med(string name, int qty = 50, decimal price = 5.00m, string brand = "Brand") => new()
    {
        FullName = name,
        Brand = brand,
        ExpiryDate = DateTime.UtcNow.AddDays(365),
        Quantity = qty,
        Price = price
    };
}
