namespace BorrowingSystem.Models{
public class User{public int Id { get; set; }public required string Name { get; set; }public required string Email { get; set; }public required string IdNumber { get; set; }public required string PasswordHash { get; set; }public string Status { get; set; } = "Good";public string? Phone { get; set; }public DateTime CreatedAt { get; set; } = DateTime.UtcNow;public ICollection<BorrowRecord> BorrowRecords { get; set; } = new List<BorrowRecord>();}

public class LoginRequest{public required string IdNumber { get; set; }public required string Password { get; set; }}

public class RegisterRequest{public required string Name { get; set; }public required string IdNumber { get; set; }public required string Password { get; set; }}

public class AuthResponse{public int Id { get; set; }public string? Name { get; set; }public string? IdNumber { get; set; }public string Status { get; set; } = "Good";public int ActiveBorrowCount { get; set; }public bool Success { get; set; }public string? Message { get; set; }}
}

