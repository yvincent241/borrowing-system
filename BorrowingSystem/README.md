# Borrowing System - PostgreSQL + C# Setup

## Quick Start

### 1. Prerequisites
- PostgreSQL installed and running
- .NET 8 SDK
- Visual Studio or VS Code

### 2. Update Connection String
Edit `appsettings.json` and update your PostgreSQL credentials:
```json
"Host=localhost;Port=5432;Database=BorrowingSystemDb;Username=postgres;Password=your_password"
```

### 3. Install Dependencies
```bash
dotnet restore
```

### 4. Create Database
```bash
dotnet ef database update
```
Or manually create the database in PostgreSQL:
```sql
CREATE DATABASE "BorrowingSystemDb";
```

### 5. Run the Application
```bash
dotnet run
```

## Project Structure
- **Models**: Entity classes (User, Item, BorrowRecord)
- **Data**: DbContext configuration
- **Repositories**: Data access layer using repository pattern
- **Controllers**: API endpoints

## API Endpoints (Example)
- `GET /api/items` - Get all items
- `GET /api/items/{id}` - Get single item
- `POST /api/items` - Create new item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item

## Next Steps
1. Update models based on your requirements
2. Create additional controllers (UsersController, BorrowRecordsController)
3. Add authentication/authorization
4. Add business logic layer if needed
