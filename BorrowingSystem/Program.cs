using BorrowingSystem.Data;
using BorrowingSystem.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Configure to listen on all network interfaces
builder.WebHost.UseUrls("http://0.0.0.0:5000", "https://0.0.0.0:5001");

// Add services
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddControllers();

var app = builder.Build();

// Ensure schema exists for borrower tracking
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.EnsureCreatedAsync();
    await EnsureBorrowerSchemaAsync(dbContext);
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();
app.UseStaticFiles();
app.MapControllers();
app.MapWhen(context => !context.Request.Path.StartsWithSegments("/api"), 
    app => app.MapFallbackToFile("index.html"));

app.Run();

static async Task EnsureBorrowerSchemaAsync(AppDbContext dbContext)
{
    await dbContext.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""Users"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""Name"" TEXT NOT NULL DEFAULT '',
            ""Email"" TEXT NOT NULL DEFAULT '',
            ""Phone"" TEXT,
            ""CreatedAt"" TIMESTAMPTZ NOT NULL DEFAULT now(),
            ""IdNumber"" TEXT NOT NULL DEFAULT '',
            ""Status"" TEXT NOT NULL DEFAULT 'Good',
            ""PasswordHash"" TEXT NOT NULL DEFAULT ''
        );
        ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""IdNumber"" TEXT NOT NULL DEFAULT '';
        ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""Status"" TEXT NOT NULL DEFAULT 'Good';
        ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""PasswordHash"" TEXT NOT NULL DEFAULT '';
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Users_Email"" ON ""Users"" (""Email"");
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Users_IdNumber"" ON ""Users"" (""IdNumber"") WHERE ""IdNumber"" <> '';
        CREATE TABLE IF NOT EXISTS ""BorrowRecords"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""UserId"" INT NOT NULL,
            ""ItemId"" INT NOT NULL,
            ""BorrowDate"" TIMESTAMPTZ NOT NULL DEFAULT now(),
            ""ReturnDate"" TIMESTAMPTZ,
            ""DueDate"" TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
            ""Status"" TEXT NOT NULL DEFAULT 'Active',
            FOREIGN KEY (""UserId"") REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
            FOREIGN KEY (""ItemId"") REFERENCES ""Items""(""Id"") ON DELETE CASCADE
        );
    ");
}
