# ==============================================================================
# MarcaAí — API .NET 10 (deploy em container, ex.: Render Web Service via Docker)
# Contexto de build = pasta `backend/` (defina "Root Directory: backend" no Render).
# Multi-stage: SDK compila/publica; runtime aspnet roda só o publicado (imagem menor).
# ==============================================================================

# ---- build ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore src/MarcaAi.Api/MarcaAi.Api.csproj
RUN dotnet publish src/MarcaAi.Api/MarcaAi.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# ---- runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Render roteia para a porta 10000 por padrão (env PORT). Bindamos explicitamente nela.
ENV ASPNETCORE_URLS=http://0.0.0.0:10000
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 10000

ENTRYPOINT ["dotnet", "MarcaAi.Api.dll"]
