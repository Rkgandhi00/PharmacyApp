using Microsoft.AspNetCore.Mvc;
using PharmacyApp.Models;
using PharmacyApp.Models.DTOs;
using PharmacyApp.Repositories;
using PharmacyApp.Services;

namespace PharmacyApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly ISaleRepository _repo;
    private readonly IStockService _stock;

    public SalesController(ISaleRepository repo, IStockService stock)
    {
        _repo = repo;
        _stock = stock;
    }

    [HttpGet]
    public ActionResult<List<Sale>> Get() => _repo.GetAll();

    [HttpGet("{id:guid}")]
    public ActionResult<Sale> GetById(Guid id)
    {
        var sale = _repo.GetById(id);
        return sale is null ? NotFound() : Ok(sale);
    }

    [HttpPost]
    public ActionResult<Sale> Post([FromBody] SaleRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, error, sale) = _stock.RecordSale(request.MedicineId, request.Quantity, request.CustomerName);
        if (!success)
        {
            // "not found" is a 404; any other failure (e.g. insufficient stock) is a 400
            return error.Contains("not found", StringComparison.OrdinalIgnoreCase)
                ? NotFound(new { error })
                : BadRequest(new { error });
        }

        return CreatedAtAction(nameof(GetById), new { id = sale!.Id }, sale);
    }
}
