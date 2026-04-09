---
description: "ASP.NET Core borrowing system with PostgreSQL: Always validate database schema, test API endpoints, use cache-busting, and ensure real-time updates work correctly."
applyTo: "**/*.{cs,cshtml,html,js,json,sql,csproj,sln,md}"
---

# Borrowing System Development Guidelines

## Database Management
- **Always validate database connectivity** before making schema changes
- **Check schema integrity** after migrations or column additions
- **Test data integrity** by querying actual records, not just structure
- **Handle PostgreSQL connection issues** proactively with proper error handling

## Code Changes & Validation
- **Automatically run builds/tests** after substantive code changes
- **Validate functionality** immediately after modifications using appropriate tools
- **Use step-by-step debugging** with tool validation rather than assumptions
- **Test endpoints** after API changes to ensure they respond correctly
- **Maintain application state** - ensure the app stays running and functional

## Web Application Patterns
- **Implement cache-busting** for API calls to prevent stale data display
- **Test real-time updates** between admin and user interfaces
- **Verify static file access** when deploying web applications
- **Check port availability** before starting servers

## Entity Framework & Models
- **Ensure model properties** match database columns exactly
- **Update availability logic** based on quantity fields
- **Validate repository patterns** for data access consistency

## Deployment & Runtime
- **Use proper .NET CLI commands** for building and running applications
- **Specify project files** when multiple exist in directory
- **Test application startup** and verify no port conflicts
- **Validate CORS and hosting configurations** for web APIs
- **Proactively maintain application** - restart if needed, fix issues automatically

## Common Issues to Watch For
- Missing database columns (especially Quantity, IsAvailable)
- Stale browser cache causing display inconsistencies
- Port conflicts preventing application startup
- Incorrect connection strings or database permissions
- Missing static file middleware configuration