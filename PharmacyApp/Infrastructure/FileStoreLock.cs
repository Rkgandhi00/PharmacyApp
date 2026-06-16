namespace PharmacyApp.Infrastructure;

// Shared Monitor lock; reentrant on the same thread so StockService can hold it while calling repositories.
public sealed class FileStoreLock
{
    public object Sync { get; } = new();
}
