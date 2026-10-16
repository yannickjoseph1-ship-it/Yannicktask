# Installation locale d'Aqu.app sous Windows (PowerShell).
# Prérequis : Node.js 20+ et Docker Desktop (ou un PostgreSQL local sur le port 5432).
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "→ Vérification de Node.js"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Error "Node.js est requis : https://nodejs.org"; exit 1 }

Write-Host "→ Installation des dépendances"
npm install

if (-not (Test-Path "server\.env")) { Copy-Item "server\.env.example" "server\.env"; Write-Host "→ server\.env créé" }

Write-Host "→ Base de données"
if (Get-Command docker -ErrorAction SilentlyContinue) {
  docker compose up -d db
  Start-Sleep -Seconds 8
} else {
  Write-Host "   Docker absent : assurez-vous qu'un PostgreSQL écoute sur localhost:5432 (voir DATABASE_URL dans server\.env)"
}

Write-Host "→ Migrations et données de démonstration"
npm run db:generate -w server
npm run db:deploy -w server
npm run db:seed -w server

Write-Host ""
Write-Host "✔ Installation terminée. Lancer :  npm run dev   puis ouvrir http://localhost:5173"
Write-Host "Comptes démo (mot de passe password123) : client@demo.fr, aqualyon@demo.fr, recif@demo.fr, nord@demo.fr"
