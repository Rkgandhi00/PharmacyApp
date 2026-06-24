using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
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

app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
{
    var error = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
    logger.LogError(error, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);

    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
    context.Response.ContentType = "application/problem+json";
    await context.Response.WriteAsJsonAsync(new ProblemDetails
    {
        Status  = StatusCodes.Status500InternalServerError,
        Title   = "An unexpected error occurred.",
        Detail  = error?.Message ?? "Please try again or contact support."
    });
}));

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
