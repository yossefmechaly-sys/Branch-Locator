import csv
import json
import os
import time
import urllib.parse
import urllib.request
from pathlib import Path

BASE = Path("/home/franck/leader-branch-locator")
CSV = BASE / "leader-magasins-controle.csv"
OUTPUT = BASE / "leader-geocoding.json"

def get_key():
    for line in (BASE / ".env").read_text().splitlines():
        if line.startswith("GOOGLE_GEOCODING_API_KEY="):
            return line.split("=", 1)[1].strip().strip("\"'")
    raise RuntimeError("Clé Google Geocoding absente")

key = get_key()

with CSV.open(encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))

if len(rows) != 48 or len({r["id_source"] for r in rows}) != 48:
    raise RuntimeError("CSV inattendu : vérification nécessaire")

results = {}
if OUTPUT.exists():
    saved = json.loads(OUTPUT.read_text(encoding="utf-8"))
    if not isinstance(saved, dict):
        raise RuntimeError("Format JSON existant inattendu")
    results = saved

def save():
    temp = OUTPUT.with_suffix(".json.tmp")
    temp.write_text(
        json.dumps(results, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    os.replace(temp, OUTPUT)

for index, row in enumerate(rows, 1):
    store_id = row["id_source"]
    address = row["adresse_he"].strip()

    if store_id in results:
        print(f"[{index}/48] Déjà traité : {row['magasin_he']}", flush=True)
        continue

    query = f"{address}, ישראל"

    # Deux adresses nécessitent le nom du centre commercial.
    if store_id == "121":
        query = "נצבא סנטר, פאואר סנטר, אשקלון, ישראל"
    elif store_id == "356735":
        query = "מתחם מבנה, בארות יצחק, ישראל"

    params = urllib.parse.urlencode({
        "address": query,
        "region": "il",
        "key": key
    })
    url = "https://maps.googleapis.com/maps/api/geocode/json?" + params

    try:
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "LeaderBranchImport/1.0"}
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            data = json.load(response)

        status = data.get("status", "UNKNOWN")
        if status in ("OVER_QUERY_LIMIT", "OVER_DAILY_LIMIT", "REQUEST_DENIED"):
            print(f"Arrêt : Google a retourné {status}", flush=True)
            break

        matches = data.get("results", [])
        if status == "OK" and matches:
            match = matches[0]
            location = match["geometry"]["location"]
            results[store_id] = {
                "magasin_he": row["magasin_he"],
                "adresse_source": address,
                "requete": query,
                "statut": "OK",
                "latitude": location["lat"],
                "longitude": location["lng"],
                "precision": match["geometry"].get("location_type"),
                "adresse_google": match.get("formatted_address"),
                "types": match.get("types", [])
            }
            print(
                f"[{index}/48] OK : {row['magasin_he']} "
                f"({results[store_id]['precision']})",
                flush=True
            )
        else:
            results[store_id] = {
                "magasin_he": row["magasin_he"],
                "adresse_source": address,
                "statut": status
            }
            print(f"[{index}/48] À vérifier : {row['magasin_he']} ({status})", flush=True)

        save()
        time.sleep(0.3)

    except Exception as error:
        print(
            f"[{index}/48] Erreur pour {row['magasin_he']} : "
            f"{type(error).__name__}",
            flush=True
        )
        break

print("\nRésultats enregistrés :", len(results), "/ 48")
print("Fichier :", OUTPUT)
