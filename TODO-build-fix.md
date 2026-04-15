# Fix Build Issues - Deployment & Local

## Plan Steps (Approved ✅)

1. [✅] **Clean build artifacts** (remove net10.0 junk): `cd BorrowingSystem && Remove-Item -Recurse -Force obj, bin`
2. [✅] **Fix Dockerfile** (remove missing sln COPY - restore csproj directly)
3. [✅] **Test local restore/build**: `dotnet restore && dotnet build -c Release` → Succeeded (1 warning fixed)
4. [ ] **Test Docker build**: `docker build -f Dockerfile -t borrowing-system .`
5. [ ] **Deploy to Railway** (should now succeed)
6. [ ] **Run locally**: `cd BorrowingSystem && dotnet run --project BorrowingSystem.csproj --launch-profile https`

## Status
- Root cause: Missing 'website test.sln' in Dockerfile + local multi-project detection
- Local csproj clean, packages ok for net8.0
