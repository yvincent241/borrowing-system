using BorrowingSystem.Models;
using BorrowingSystem.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace BorrowingSystem.Controllers
{
    public class BorrowerStatusUpdate
    {
        public required string Status { get; set; }
    }

    public class BorrowRecordCreateRequest
    {
        public int ItemId { get; set; }
        public DateTime? DueDate { get; set; }
    }

    public class BorrowRecordUpdateRequest
    {
        public int ItemId { get; set; }
        public string? Status { get; set; }
        public DateTime? DueDate { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class BorrowersController : ControllerBase
    {
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<BorrowRecord> _borrowRepository;
        private readonly IRepository<Item> _itemRepository;

        public BorrowersController(
            IRepository<User> userRepository,
            IRepository<BorrowRecord> borrowRepository,
            IRepository<Item> itemRepository)
        {
            _userRepository = userRepository;
            _borrowRepository = borrowRepository;
            _itemRepository = itemRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetBorrowers()
        {
            var borrowers = await _userRepository.GetAllAsync();
            var borrowerDashboard = new List<object>();

            foreach (var borrower in borrowers)
            {
                var activeRecords = await _borrowRepository.FindAsync(br => br.UserId == borrower.Id && br.ReturnDate == null);
                var borrowedItemIds = activeRecords.Select(br => br.ItemId).ToList();
                var borrowedItems = new List<string>();

                foreach (var itemId in borrowedItemIds)
                {
                    var item = await _itemRepository.GetByIdAsync(itemId);
                    if (item != null)
                    {
                        borrowedItems.Add(item.Name);
                    }
                }

                borrowerDashboard.Add(new
                {
                    borrower.IdNumber,
                    borrower.Name,
                    borrower.Email,
                    borrower.Status,
                    ActiveBorrowCount = activeRecords.Count(),
                    BorrowedItems = borrowedItems
                });
            }

            return Ok(borrowerDashboard);
        }

        [HttpGet("{idNumber}")]
        public async Task<ActionResult<object>> GetBorrower(string idNumber)
        {
            var borrower = await _userRepository.FirstOrDefaultAsync(u => u.IdNumber == idNumber);
            if (borrower == null)
                return NotFound();

            var activeRecords = await _borrowRepository.FindAsync(br => br.UserId == borrower.Id && br.ReturnDate == null);
            var borrowedItems = new List<object>();
            foreach (var record in activeRecords)
            {
                var item = await _itemRepository.GetByIdAsync(record.ItemId);
                if (item != null)
                {
                    borrowedItems.Add(new { item.Id, item.Name, record.BorrowDate, record.DueDate, record.Status });
                }
            }

            return Ok(new
            {
                borrower.IdNumber,
                borrower.Name,
                borrower.Email,
                borrower.Status,
                ActiveBorrowCount = activeRecords.Count(),
                BorrowedItems = borrowedItems
            });
        }

        [HttpPut("{idNumber}/status")]
        public async Task<IActionResult> UpdateBorrowerStatus(string idNumber, [FromBody] BorrowerStatusUpdate update)
        {
            var borrower = await _userRepository.FirstOrDefaultAsync(u => u.IdNumber == idNumber);
            if (borrower == null)
                return NotFound();

            var status = update.Status?.Trim();
            if (string.IsNullOrWhiteSpace(status))
                return BadRequest("Status is required.");

            borrower.Status = status;
            await _userRepository.UpdateAsync(borrower);
            await _userRepository.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{idNumber}")]
        public async Task<IActionResult> DeleteBorrowerAccount(string idNumber)
        {
            var borrower = await _userRepository.FirstOrDefaultAsync(u => u.IdNumber == idNumber);
            if (borrower == null)
                return NotFound();

            var activeRecords = await _borrowRepository.FindAsync(br => br.UserId == borrower.Id && br.ReturnDate == null);
            if (activeRecords.Any())
                return BadRequest("Cannot delete account while there are active borrowed items. Return all items first.");

            var allRecords = await _borrowRepository.FindAsync(br => br.UserId == borrower.Id);
            foreach (var record in allRecords)
            {
                await _borrowRepository.DeleteAsync(record.Id);
            }

            await _borrowRepository.SaveChangesAsync();
            await _userRepository.DeleteAsync(borrower.Id);
            await _userRepository.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("history/{userId}")]
        public async Task<ActionResult<object>> GetUserHistory(string userId)
        {
            if (!int.TryParse(userId, out int parsedUserId))
            {
                return BadRequest("Invalid user ID");
            }

            var borrower = await _userRepository.GetByIdAsync(parsedUserId);
            if (borrower == null)
                return NotFound();

            var records = await _borrowRepository.FindAsync(br => br.UserId == parsedUserId);
            var history = new List<object>();
            var activeCount = 0;

            foreach (var record in records)
            {
                var item = await _itemRepository.GetByIdAsync(record.ItemId);
                if (item == null)
                    continue;

                if (record.ReturnDate == null)
                    activeCount++;

                history.Add(new
                {
                    record.Id,
                    ItemId = item.Id,
                    ItemName = item.Name,
                    record.BorrowDate,
                    record.DueDate,
                    record.ReturnDate,
                    record.Status
                });
            }

            return Ok(new
            {
                borrower.Id,
                borrower.Name,
                borrower.IdNumber,
                borrower.Status,
                ActiveBorrowCount = activeCount,
                BorrowHistory = history
            });
        }

        [HttpPut("return/{recordId}")]
        public async Task<IActionResult> ReturnBorrowedItem(int recordId)
        {
            var record = await _borrowRepository.GetByIdAsync(recordId);
            if (record == null)
                return NotFound();

            if (record.ReturnDate != null)
                return BadRequest("This item has already been returned.");

            var item = await _itemRepository.GetByIdAsync(record.ItemId);
            if (item == null)
                return NotFound("Item linked to this record was not found.");

            var borrower = await _userRepository.GetByIdAsync(record.UserId);
            if (borrower == null)
                return NotFound("Borrower linked to this record was not found.");

            record.ReturnDate = DateTime.UtcNow;
            record.Status = "Returned";
            item.Quantity++;
            item.IsAvailable = true;

            var activeRecords = await _borrowRepository.FindAsync(br => br.UserId == borrower.Id && br.ReturnDate == null);
            borrower.Status = activeRecords.Any() ? "CurrentlyBorrowing" : "Good";

            await _borrowRepository.UpdateAsync(record);
            await _itemRepository.UpdateAsync(item);
            await _userRepository.UpdateAsync(borrower);
            await _borrowRepository.SaveChangesAsync();
            await _itemRepository.SaveChangesAsync();
            await _userRepository.SaveChangesAsync();

            return Ok(new
            {
                record.Id,
                record.Status,
                record.ReturnDate
            });
        }
    }
}
