# GIS Projekat 3: GIS aplikacije za analizu i vizualizaciju geo-podataka

## Preduslovi

- PostgreSQL sa PostGIS ekstenzijom
- Python 3.10+
- Node.js 18+
- SUMO simulator (`paru -S sumo`)
- GDAL biblioteke (`sudo pacman -S gdal`)
- Baza podataka `spatial_db_austria` iz Projekta 1

## Podešavanje baze podataka

Aplikacija očekuje PostgreSQL bazu `spatial_db_austria` na `localhost:5432` sa tabelama:

- `transit_stops`, `transit_routes`, `roads`, `power_towers`, `power_lines`
- `substations`, `landmarks_points`, `buildings`
- `vehicle_positions` (importovano iz SUMO simulacije)

## Pokretanje projekta

### 1. Instalacija Python dependencies

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. SUMO simulacija

```bash
cd sumo_sim

# Generisanje SUMO mreže iz OSM podataka
osmium extract --bbox=16.18,48.12,16.58,48.33 austria-latest.osm.pbf -o vienna_full.osm.pbf --overwrite

osmium cat vienna_full.osm.pbf -o vienna_full.osm

netconvert --osm-files vienna_full.osm -o vienna.net.xml --geometry.remove --roundabouts.guess --ramps.guess --junctions.join --tls.guess-signals --tls.discard-simple --tls.join --output.street-names

# Generisanje saobraćaja
python $SUMO_HOME/tools/randomTrips.py -n vienna.net.xml -o trips.xml -e 7200 -p 1 --route-file routes.xml --fringe-factor 10 --min-distance 800 --intermediate 1 --speed-exponent 3 --trip-attributes="departLane=\"best\" departSpeed=\"max\"" --validate

# Pokretanje simulacije
sumo -c osm.sumocfg -v

# Import FCD u PostGIS
cd ..
python parse_fcd.py
```

### 3. Rasterski podaci

Preuzeti DEM i hillshade podatke sa OpenTopography (Copernicus DEM 30m) za oblast Beča i smestiti u `data/raster/`:

- `vienna_dem.tif` — sirovi DEM (visinski podaci)
- `vienna_hh.tif` — hillshade vizualizacija
- `vienna_color-relief.tif` — kolorirana vizualizacija visina

### 4. Pokretanje servera

```bash
source venv/bin/activate
python run.py
```

Flask server će biti dostupan na `http://localhost:5001`.

### 5. Pokretanje frontend-a

U drugom terminalu:

```bash
cd webapp
npm install
npm run dev
```

Aplikacija će biti dostupna na `http://localhost:5173`.

### 6. Pokretanje Jupyter notebook-a

U trećem terminalu:

```bash
source venv/bin/activate
jupyter notebook
```

Otvoriti `notebook.ipynb` za prostorno-vremensku analizu.

## Funkcionalnosti veb aplikacije

- **Prikaz slojeva** — uključivanje vektorskih slojeva
- **Rasterski slojevi** — DEM, hillshade i vizualizacija visina sa prikazom nadmorske visine na hover
- **Filtriranje po atributima** — korisnik bira sloj, atribut i uslov. Prikazuju se samo objekti koji zadovoljavaju uslov
- **Prostorni upiti** — pronalaženje objekata iz jednog sloja u radijusu od objekata iz drugog sloja
- **Vozila u blizini objekta** — pronalaženje svih vozila koja su prošla u blizini određenog objekta
- **Trajektorija vozila** — vizualizacija putanje pojedinačnog vozila

## Jupyter analiza

Notebook sadrži prostorno-vremensku analizu SUMO podataka o kretanju vozila:

- Ulice sa najgušćim saobraćajem (broj vozila > N)
- Prosečna brzina vozila po ulici
- Trajektorija specifičnog vozila
- Najzagađeniji delovi grada po vremenskim periodima
- Saobraćajne gužve — ulice sa najnižom prosečnom brzinom
- Grafik brzine vozila tokom vremena
- Toplotna mapa gustine saobraćaja

## Tehnologije

| Komponenta | Tehnologija |
|---|---|
| Backend | Python, Flask |
| GIS biblioteke | rasterio, fiona, shapely |
| Baza podataka | PostgreSQL + PostGIS |
| Frontend | React, TypeScript, Vite, Leaflet |
| Simulator | SUMO |
| Analiza | GeoPandas, MovingPandas |
| Vizualizacija | Folium, Matplotlib |
