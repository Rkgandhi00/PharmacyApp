using Microsoft.AspNetCore.Mvc;
using PharmacyApp.Models;
using PharmacyApp.Models.DTOs;
using PharmacyApp.Repositories;
using PharmacyApp.Services;

namespace PharmacyApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MedicinesController : ControllerBase
{
    private readonly IMedicineRepository _repo;
    private readonly IStockService _stock;

    public MedicinesController(IMedicineRepository repo, IStockService stock)
    {
        _repo = repo;
        _stock = stock;
    }

    [HttpGet]
    public ActionResult<List<Medicine>> Get([FromQuery] string? search)
        => _repo.GetAll(search);

    [HttpGet("{id:guid}")]
    public ActionResult<Medicine> GetById(Guid id)
    {
        var medicine = _repo.GetById(id);
        return medicine is null ? NotFound() : Ok(medicine);
    }

    [HttpPost]
    public ActionResult<Medicine> Post([FromBody] CreateMedicineRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var created = _repo.Add(request.ToMedicine());
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public ActionResult<Medicine> Put(Guid id, [FromBody] UpdateMedicineRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var updated = _repo.Update(id, m =>
        {
            if (request.FullName is not null)      m.FullName = request.FullName;
            if (request.Brand is not null)         m.Brand = request.Brand;
            if (request.ExpiryDate.HasValue)       m.ExpiryDate = request.ExpiryDate.Value;
            if (request.Quantity.HasValue)         m.Quantity = request.Quantity.Value;
            if (request.Price.HasValue)            m.Price = request.Price.Value;
            if (request.Notes is not null)         m.Notes = request.Notes;
        });
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
        => _repo.Delete(id) ? NoContent() : NotFound();

    [HttpPost("{id:guid}/restock")]
    public ActionResult<Medicine> Restock(Guid id, [FromBody] RestockRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (success, error, medicine) = _stock.Restock(id, request.Quantity, request.Notes);
        if (!success) return NotFound(new { error });
        return Ok(medicine);
    }
}
