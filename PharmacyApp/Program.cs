using PharmacyApp.Infrastructure;
using PharmacyApp.Repositories;
using PharmacyApp.Repositories.Json;
using PharmacyApp.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();

builder.Services.AddSingleton<FileStoreLock>();
builder.Services.AddSingleton<IMedicineRepository, JsonMedicineRepository>();
builder.Services.AddSingleton<ISaleRepository, JsonSaleRepository>();
builder.Services.AddSingleton<IStockTransactionRepository, JsonStockTransactionRepository>();
builder.Services.AddSingleton<IStockService, StockService>();

var app = builder.Build();
app.UseStaticFiles();
app.MapControllers();
app.MapGet("/api/config", (IConfiguration cfg) => new
{
    currencySymbol    = cfg["Currency:Symbol"]                                   ?? "₹",
    currencyCode      = cfg["Currency:Code"]                                     ?? "INR",
    expiryWarningDays = int.TryParse(cfg["App:ExpiryWarningDays"], out var e) ? e : 30,
    lowStockThreshold = int.TryParse(cfg["App:LowStockThreshold"],  out var l) ? l : 10,
    dateLocale        = cfg["App:DateLocale"]                                    ?? "en-IN"
});
app.MapFallbackToFile("index.html");
app.Run();
