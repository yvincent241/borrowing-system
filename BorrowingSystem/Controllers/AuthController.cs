using BorrowingSystem.Models;
using BorrowingSystem.Repositories;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;

namespace BorrowingSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IRepository<User> _userRepository;
        private readonly IRepository<BorrowRecord> _borrowRepository;

        public AuthController(
            IRepository<User> userRepository,
            IRepository<BorrowRecord> borrowRepository)
        {
            _userRepository = userRepository;
            _borrowRepository = borrowRepository;
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private bool VerifyPassword(string password, string hash)
        {
            var hashOfInput = HashPassword(password);
            return hashOfInput.Equals(hash);
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name) || 
                string.IsNullOrWhiteSpace(request.IdNumber) || 
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new AuthResponse 
                { 
                    Success = false, 
                    Message = "Name, ID number, and password are required." 
                });
            }

            var existingUser = await _userRepository.FirstOrDefaultAsync(u => u.IdNumber == request.IdNumber);
            if (existingUser != null)
            {
                return BadRequest(new AuthResponse 
                { 
                    Success = false, 
                    Message = "User with this ID number already exists." 
                });
            }

            var user = new User
            {
                Name = request.Name,
                IdNumber = request.IdNumber,
                Email = $"{request.IdNumber}@borrowing.system",
                PasswordHash = HashPassword(request.Password),
                Status = "Good"
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            var activeBorrows = await _borrowRepository.FindAsync(br => br.UserId == user.Id && br.ReturnDate == null);
            
            return Ok(new AuthResponse
            {
                Id = user.Id,
                Name = user.Name,
                IdNumber = user.IdNumber,
                Status = user.Status,
                ActiveBorrowCount = activeBorrows.Count(),
                Success = true,
                Message = "Registration successful!"
            });
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.IdNumber) || 
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new AuthResponse 
                { 
                    Success = false, 
                    Message = "ID number and password are required." 
                });
            }

            var user = await _userRepository.FirstOrDefaultAsync(u => u.IdNumber == request.IdNumber);
            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return Unauthorized(new AuthResponse 
                { 
                    Success = false, 
                    Message = "Invalid ID number or password." 
                });
            }

            var activeBorrows = await _borrowRepository.FindAsync(br => br.UserId == user.Id && br.ReturnDate == null);

            return Ok(new AuthResponse
            {
                Id = user.Id,
                Name = user.Name,
                IdNumber = user.IdNumber,
                Status = user.Status,
                ActiveBorrowCount = activeBorrows.Count(),
                Success = true,
                Message = "Login successful!"
            });
        }

        [HttpGet("profile/{id}")]
        public async Task<ActionResult<AuthResponse>> GetProfile(int id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return NotFound();

            var activeBorrows = await _borrowRepository.FindAsync(br => br.UserId == user.Id && br.ReturnDate == null);

            return Ok(new AuthResponse
            {
                Id = user.Id,
                Name = user.Name,
                IdNumber = user.IdNumber,
                Status = user.Status,
                ActiveBorrowCount = activeBorrows.Count(),
                Success = true
            });
        }
    }
}
