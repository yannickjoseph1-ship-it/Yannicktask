#!/usr/bin/env bash
# Installation locale d'Aqu.app en une commande (macOS / Linux / WSL).
# Prérequis : Node.js 20+ et soit Docker, soit un PostgreSQL local.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Vérification de Node.js"
command -v node >/dev/null || { echo "Node.js est requis : https://nodejs.org (version 22 conseillée)"; exit 1; }
node -e 'const v=+process.versions.node.split(".")[0]; if(v<20){console.error("Node.js 20+ requis, version actuelle "+process.versions.node); process.exit(1)}'

echo "→ Installation des dépendances"
npm install

if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "→ server/.env créé à partir de l'exemple"
fi

echo "→ Base de données"
if command -v docker >/dev/null && docker info >/dev/null 2>&1; then
  docker compose up -d db
  echo "   PostgreSQL démarré dans Docker (port 5432), attente de disponibilité…"
  for i in $(seq 1 30); do
    docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1 && break
    sleep 1
  done
elif command -v pg_isready >/dev/null && pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
  echo "   PostgreSQL local détecté sur le port 5432 (vérifiez DATABASE_URL dans server/.env)"
else
  echo "   Aucun PostgreSQL disponible : installez Docker Desktop (https://www.docker.com/products/docker-desktop/) ou PostgreSQL 16, puis relancez ce script."
  exit 1
fi

echo "→ Migrations et données de démonstration"
npm run db:generate -w server
npm run db:deploy -w server
npm run db:seed -w server

cat <<'MSG'

✔ Installation terminée.

Lancer l'application :   npm run dev
Puis ouvrir :            http://localhost:5173

Comptes démo (mot de passe : password123)
  client@demo.fr     aquariophile
  aqualyon@demo.fr   magasin premium
  recif@demo.fr      magasin standard
  nord@demo.fr       magasin sans abonnement
MSG
