using System;
using System.Threading.Tasks;
using Npgsql;

class Program
{
    static async Task Main(string[] args)
    {
        string dbConnectionString = "Host=localhost;Port=5432;Database=Mypostgres;Username=postgres;Password=postgres012345";

        try
        {
            await using var dbConn = new NpgsqlConnection(dbConnectionString);
            await dbConn.OpenAsync();

            Console.WriteLine("✅ Connected to Mypostgres database!");

            // Add Quantity column if it doesn't exist
            await using var alterCmd = new NpgsqlCommand(@"
                ALTER TABLE ""Items"" ADD COLUMN IF NOT EXISTS ""Quantity"" INTEGER DEFAULT 1;
            ", dbConn);
            await alterCmd.ExecuteNonQueryAsync();
            Console.WriteLine("✅ Quantity column added/verified!");

            // Update IsAvailable based on Quantity for existing items
            await using var updateCmd = new NpgsqlCommand(@"
                UPDATE ""Items"" SET ""IsAvailable"" = (""Quantity"" > 0) WHERE ""Quantity"" IS NOT NULL;
            ", dbConn);
            await updateCmd.ExecuteNonQueryAsync();
            Console.WriteLine("✅ Availability status updated!");

            // Check table schema first
            await using var schemaCmd = new NpgsqlCommand(@"
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'Items'
                ORDER BY ordinal_position;
            ", dbConn);
            await using var schemaReader = await schemaCmd.ExecuteReaderAsync();

            Console.WriteLine("\n📋 Items table columns:");
            while (await schemaReader.ReadAsync())
            {
                Console.WriteLine($"  - {schemaReader.GetString(0)}");
            }
            schemaReader.Close();

            // Check current data with correct column names
            await using var dataCmd = new NpgsqlCommand("SELECT \"Id\", \"Name\", \"Description\", \"Quantity\", \"IsAvailable\" FROM \"Items\" ORDER BY \"Id\";", dbConn);
            await using var dataReader = await dataCmd.ExecuteReaderAsync();

            Console.WriteLine("\n📊 Current items data:");
            int count = 0;
            while (await dataReader.ReadAsync() && count < 10)
            {
                Console.WriteLine($"  ID: {dataReader.GetInt32(0)}, Name: {dataReader.GetString(1)}, Quantity: {dataReader.GetInt32(3)}, Available: {dataReader.GetBoolean(4)}");
                count++;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
        }
    }
}