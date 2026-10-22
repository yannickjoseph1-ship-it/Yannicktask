"""Parse un flux RSS/Atom (fichier passé en argument) et affiche « [source] titre — lien — date »."""
import html
import sys
import xml.etree.ElementTree as ET

path, label, max_items = sys.argv[1], sys.argv[2], int(sys.argv[3])
with open(path, "rb") as fh:
    data = fh.read()
try:
    root = ET.fromstring(data)
except ET.ParseError:
    sys.exit(3)

NS = {"atom": "http://www.w3.org/2005/Atom", "ht": "https://trends.google.com/trending/rss"}
items = root.findall(".//item") or root.findall(".//atom:entry", NS)
count = 0
for it in items[:max_items]:
    title = (it.findtext("title") or it.findtext("atom:title", namespaces=NS) or "").strip()
    link = (it.findtext("link") or "").strip()
    if not link:
        link_el = it.find("atom:link", NS)
        link = (link_el.get("href") if link_el is not None else "") or ""
    date = (it.findtext("pubDate") or it.findtext("atom:updated", namespaces=NS) or "").strip()
    traffic = it.findtext("ht:approx_traffic", namespaces=NS)
    if traffic:
        title = f"{title} ({traffic} recherches)"
    if title:
        print(f"[{label}] {html.unescape(title)} — {link} — {date}")
        count += 1
sys.exit(0 if count else 3)
