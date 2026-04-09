namespace BorrowingSystem.Models
{
    public class BorrowRecord
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ItemId { get; set; }
        public DateTime BorrowDate { get; set; } = DateTime.UtcNow;
        public DateTime? ReturnDate { get; set; }
        public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(14);
        public string Status { get; set; } = "Active"; // Active, Returned, Overdue

        public User? User { get; set; }
        public Item? Item { get; set; }
    }
}
