using BorrowingSystem.Models;using BorrowingSystem.Repositories;using Microsoft.AspNetCore.Mvc;

namespace BorrowingSystem.Controllers{
public class BorrowRequest{public int UserId { get; set; }}

[ApiController][Route("api/[controller]")]public class ItemsController : ControllerBase{private readonly IRepository<Item> _itemRepository;private readonly IRepository<User> _userRepository;private readonly IRepository<BorrowRecord> _borrowRepository;

public ItemsController(IRepository<Item> itemRepository,IRepository<User> userRepository,IRepository<BorrowRecord> borrowRepository){_itemRepository = itemRepository;_userRepository = userRepository;_borrowRepository = borrowRepository;}

[HttpGet]public async Task<ActionResult<IEnumerable<Item>>> GetItems(){var items = await _itemRepository.GetAllAsync();return Ok(items);}

[HttpGet("{id}")]public async Task<ActionResult<Item>> GetItem(int id){var item = await _itemRepository.GetByIdAsync(id);if (item == null)return NotFound();return Ok(item);}

[HttpPost]public async Task<ActionResult<Item>> CreateItem(Item item){item.IsAvailable = item.Quantity > 0;await _itemRepository.AddAsync(item);await _itemRepository.SaveChangesAsync();return CreatedAtAction(nameof(GetItem), new { id = item.Id }, item);}

[HttpPut("{id}")]public async Task<IActionResult> UpdateItem(int id, Item item){var existingItem = await _itemRepository.GetByIdAsync(id);if (existingItem == null)return NotFound();existingItem.Name = item.Name;existingItem.Description = item.Description;existingItem.Quantity = item.Quantity;existingItem.IsAvailable = item.Quantity > 0;await _itemRepository.UpdateAsync(existingItem);await _itemRepository.SaveChangesAsync();return NoContent();}

[HttpPost("{id}/borrow")]public async Task<IActionResult> BorrowItem(int id, [FromBody] BorrowRequest request){if (request == null || request.UserId <= 0){return BadRequest("User ID needed");}var existingItem = await _itemRepository.GetByIdAsync(id);if (existingItem == null)return NotFound();if (existingItem.Quantity <= 0)return BadRequest("Out of stock");var borrower = await _userRepository.GetByIdAsync(request.UserId);if (borrower == null){return NotFound("User not found");}if (borrower.Status == "Ineligible"){return BadRequest("Not eligible");}var activeBorrows = await _borrowRepository.FindAsync(br => br.UserId == borrower.Id && br.ReturnDate == null);if (borrower.Status != "Good" && activeBorrows.Count() >= 2){return BadRequest("Max 2 items");}var borrowRecord = new BorrowRecord{UserId = borrower.Id,ItemId = existingItem.Id,DueDate = DateTime.UtcNow.AddDays(14),Status = "Active"};await _borrowRepository.AddAsync(borrowRecord);existingItem.Quantity--;existingItem.IsAvailable = existingItem.Quantity > 0;if (borrower.Status != "Good"){borrower.Status = "CurrentlyBorrowing";}await _itemRepository.UpdateAsync(existingItem);await _userRepository.UpdateAsync(borrower);await _borrowRepository.SaveChangesAsync();await _itemRepository.SaveChangesAsync();await _userRepository.SaveChangesAsync();return Ok(new{Item = existingItem,Borrower = new { borrower.IdNumber, borrower.Status },ActiveBorrowCount = activeBorrows.Count() + 1});}

[HttpDelete("{id}")]public async Task<IActionResult> DeleteItem(int id){await _itemRepository.DeleteAsync(id);await _itemRepository.SaveChangesAsync();return NoContent();}}
}
