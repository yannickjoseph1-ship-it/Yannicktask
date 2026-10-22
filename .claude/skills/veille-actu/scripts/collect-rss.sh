#!/usr/bin/env bash
# collect-rss.sh — collecte best-effort des flux RSS pour /veille-actu.
# Sort une liste "[source] titre — lien — date". Les flux injoignables sont ignorés.
# Usage : bash collect-rss.sh [requête Google News supplémentaire ...]
set -u

TIMEOUT="${VEILLE_TIMEOUT:-12}"
UA="Mozilla/5.0 (compatible; veille-actu/1.0)"
MAX_ITEMS="${VEILLE_MAX_ITEMS:-12}"

declare -a FEEDS=(
  "Google News FR|https://news.google.com/rss?hl=fr&gl=FR&ceid=FR:fr"
  "Google Trends FR|https://trends.google.com/trending/rss?geo=FR"
  "Le Figaro|https://www.lefigaro.fr/rss/figaro_actualites.xml"
  "Le Parisien|https://feeds.leparisien.fr/leparisien/rss"
  "BFMTV|https://www.bfmtv.com/rss/news-24-7/"
  "CNews|https://www.cnews.fr/rss.xml"
  "TF1 Info|https://www.tf1info.fr/rss/"
  "Mediapart|https://www.mediapart.fr/articles/feed"
  "franceinfo|https://www.francetvinfo.fr/titres.rss"
  "Le Monde|https://www.lemonde.fr/rss/une.xml"
  "20 Minutes|https://www.20minutes.fr/feeds/rss-une.xml"
)

# Requêtes Google News (thème passé en argument, ou thèmes "mouvance populaire" par défaut)
declare -a QUERIES=("$@")
if [ ${#QUERIES[@]} -eq 0 ]; then
  QUERIES=("grève OR manifestation OR mobilisation" "pétition OR blocage OR colère" "polémique réseaux sociaux OR vidéo virale")
fi
for q in "${QUERIES[@]}"; do
  enc=$(printf '%s' "$q" | jq -sRr @uri)
  FEEDS+=("Google News · ${q}|https://news.google.com/rss/search?q=${enc}&hl=fr&gl=FR&ceid=FR:fr")
done

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

parse_rss() {
  # $1 = source label ; $2 = fichier XML. Python en mode isolé (-I) : n'importe rien du répertoire courant.
  python3 -I "$HERE/parse_rss.py" "$2" "$1" "$MAX_ITEMS"
}

ok=0
for entry in "${FEEDS[@]}"; do
  label="${entry%%|*}"; url="${entry#*|}"
  out="$TMP/feed.xml"
  curl -sS -L -m "$TIMEOUT" -A "$UA" -o "$out" "$url" 2>/dev/null || { echo "## $label : injoignable" >&2; continue; }
  if parse_rss "$label" "$out"; then ok=$((ok+1)); else echo "## $label : flux vide ou illisible" >&2; fi
done

if [ "$ok" -eq 0 ]; then
  echo "aucun flux accessible — collecte à faire entièrement par WebSearch (voir SKILL.md, étape 1)"
  exit 2
fi
echo "## $ok flux lus" >&2
