# Use the official .NET 8.0 runtime image as the base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Use the official .NET 8.0 SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the solution file and restore dependencies
COPY ["website test.sln", "./"]
COPY ["BorrowingSystem/BorrowingSystem.csproj", "BorrowingSystem/"]
COPY ["DatabaseTest/DatabaseTest.csproj", "DatabaseTest/"]
RUN dotnet restore "BorrowingSystem/BorrowingSystem.csproj"

# Copy the rest of the source code
COPY . .

# Build the application
WORKDIR "/src/BorrowingSystem"
RUN dotnet build "BorrowingSystem.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "BorrowingSystem.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Create the final runtime image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BorrowingSystem.dll"]