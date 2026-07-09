import io
import base64
from flask import Blueprint, jsonify, request
import rasterio
from rasterio.warp import transform_bounds
import numpy as np
import pyproj
from app.config import RASTER_DEM_PATH, RASTER_HILLSHADE_PATH, RASTER_COLOR_RELIEF_PATH

RASTER_FILES = {
    'dem': RASTER_DEM_PATH,
    'hillshade': RASTER_HILLSHADE_PATH,
    'color-relief': RASTER_COLOR_RELIEF_PATH,
}

raster_bp = Blueprint("raster", __name__)


@raster_bp.route("/info")
def raster_info():
    try:
        with rasterio.open(RASTER_DEM_PATH) as src:
            bounds = src.bounds
            if src.crs and str(src.crs) != "EPSG:4326":
                bounds = transform_bounds(src.crs, "EPSG:4326", *bounds)

            info = {
                "crs": str(src.crs),
                "width": src.width,
                "height": src.height,
                "bands": src.count,
                "dtype": str(src.dtypes[0]),
                "bounds": {
                    "west": bounds[0],
                    "south": bounds[1],
                    "east": bounds[2],
                    "north": bounds[3],
                },
                "resolution": {
                    "x": src.res[0],
                    "y": src.res[1],
                },
            }
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify(info)


@raster_bp.route("/value")
def raster_value():
    """
    Get the elevation value at a specific coordinate.

    Query params:
      - lat: latitude
      - lon: longitude

    Returns the DEM elevation in meters at that point.
    """
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)

    if lat is None or lon is None:
        return jsonify({"error": "lat and lon required"}), 400

    try:
        with rasterio.open(RASTER_DEM_PATH) as src:
            if str(src.crs) != "EPSG:4326":
                transformer = pyproj.Transformer.from_crs(
                    "EPSG:4326", src.crs, always_xy=True
                )
                x, y = transformer.transform(lon, lat)
            else:
                x, y = lon, lat

            row, col = src.index(x, y)
            value = src.read(1)[row, col]

            return jsonify({
                "lat": lat,
                "lon": lon,
                "value": float(value),
                "unit": "meters",
            })
    except (IndexError, ValueError):
        return jsonify({"error": "Point outside raster extent"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@raster_bp.route("/bounds-image")
def raster_bounds_image():
    from PIL import Image

    layer = request.args.get("layer", "hillshade")
    raster_path = RASTER_FILES.get(layer, RASTER_HILLSHADE_PATH)
    print(layer)

    try:
        with rasterio.open(raster_path) as src:
            bounds = src.bounds

            if src.crs and str(src.crs) != "EPSG:4326":
                bounds = transform_bounds(src.crs, "EPSG:4326", *bounds)

            if src.count >= 3:
                r = src.read(1)
                g = src.read(2)
                b = src.read(3)

                def normalize_band(band):
                    valid = band[band !=
                                 src.nodata] if src.nodata else band.flatten()
                    if len(valid) == 0:
                        return np.zeros_like(band, dtype=np.uint8)
                    vmin, vmax = np.percentile(valid, [2, 98])
                    return np.clip((band - vmin) / (vmax - vmin) * 255, 0, 255).astype(np.uint8)

                r_norm = normalize_band(r)
                g_norm = normalize_band(g)
                b_norm = normalize_band(b)

                rgb = np.dstack([r_norm, g_norm, b_norm])
                img = Image.fromarray(rgb, 'RGB').convert('RGBA')

                if src.nodata is not None:
                    pixels = np.array(img)
                    mask = r == src.nodata
                    pixels[mask] = [0, 0, 0, 0]
                    img = Image.fromarray(pixels)

            else:
                data = src.read(1)
                valid = data[data !=
                             src.nodata] if src.nodata else data.flatten()

                if len(valid) > 0:
                    vmin, vmax = np.percentile(valid, [2, 98])
                    normalized = np.clip((data - vmin) / (vmax - vmin), 0, 1)
                else:
                    normalized = np.zeros_like(data, dtype=float)

                if layer == 'dem':
                    r = np.clip(normalized * 2, 0, 1) * 180 + 50
                    g = np.clip(1 - abs(normalized - 0.4) * 3, 0, 1) * 200 + 50
                    b = np.clip(1 - normalized * 2, 0, 1) * 180 + 50

                    rgb = np.dstack([
                        r.astype(np.uint8),
                        g.astype(np.uint8),
                        b.astype(np.uint8),
                    ])
                    img = Image.fromarray(rgb, 'RGB').convert('RGBA')
                else:
                    gray = (normalized * 255).astype(np.uint8)
                    img = Image.fromarray(gray).convert('RGBA')

                if src.nodata is not None:
                    pixels = np.array(img)
                    mask = data == src.nodata
                    pixels[mask] = [0, 0, 0, 0]
                    img = Image.fromarray(pixels)

            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            b64 = base64.b64encode(buffer.getvalue()).decode()

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "image": f"data:image/png;base64,{b64}",
        "bounds": [[bounds[1], bounds[0]], [bounds[3], bounds[2]]],
    })
