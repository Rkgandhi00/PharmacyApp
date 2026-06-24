using System.Text.Json;
using PharmacyApp.Infrastructure;

namespace PharmacyApp.Repositories.Json;

/// <summary>
/// Shared file I/O and locking machinery for all JSON-backed repositories.
/// Derived classes must acquire <see cref="LockSync"/> before calling
/// <see cref="ReadAll"/> or <see cref="WriteAll"/>.
/// </summary>
public abstract class JsonRepositoryBase<T>
{
    private readonly string _path;

    /// <summary>The shared monitor object — reentrant so StockService can hold it across repository calls.</summary>
    protected readonly object LockSync;

    protected JsonRepositoryBase(IWebHostEnvironment env, FileStoreLock fileLock, string fileName)
    {
        var dir = Path.Combine(env.ContentRootPath, "Data");
        Directory.CreateDirectory(dir);
        _path = Path.Combine(dir, fileName);
        LockSync = fileLock.Sync;
        if (!File.Exists(_path)) File.WriteAllText(_path, "[]");
    }

    /// <summary>Deserialises the full collection from disk. Caller must hold <see cref="LockSync"/>.</summary>
    protected List<T> ReadAll()
    {
        try
        {
            return JsonSerializer.Deserialize<List<T>>(File.ReadAllText(_path), JsonOptions.Default) ?? [];
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Data file '{Path.GetFileName(_path)}' contains invalid JSON. Delete or repair the file to recover.", ex);
        }
        catch (IOException ex)
        {
            throw new InvalidOperationException($"Failed to read data file '{Path.GetFileName(_path)}'.", ex);
        }
    }

    /// <summary>Serialises <paramref name="items"/> and overwrites the file. Caller must hold <see cref="LockSync"/>.</summary>
    protected void WriteAll(List<T> items)
    {
        try
        {
            File.WriteAllText(_path, JsonSerializer.Serialize(items, JsonOptions.Default));
        }
        catch (IOException ex)
        {
            throw new InvalidOperationException($"Failed to write data file '{Path.GetFileName(_path)}'.", ex);
        }
    }
}
