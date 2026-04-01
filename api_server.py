import base64
import math
from typing import List

import cv2
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.cluster import KMeans


app = Flask(__name__)
CORS(app)


def decode_image(file_bytes: bytes) -> np.ndarray:
    buffer = np.frombuffer(file_bytes, dtype=np.uint8)
    bgr = cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Invalid image data")
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


def pixel_data(image_rgb: np.ndarray) -> np.ndarray:
    return np.float32(image_rgb.reshape((-1, 3)))


def compress_image(image_rgb: np.ndarray, k: int) -> tuple[np.ndarray, float]:
    pixels = pixel_data(image_rgb)
    model = KMeans(n_clusters=k, random_state=0, n_init=10)
    labels = model.fit_predict(pixels)
    centers = np.uint8(model.cluster_centers_)
    compressed = centers[labels].reshape(image_rgb.shape)
    return compressed, float(model.inertia_)


def mse_value(original: np.ndarray, compressed: np.ndarray) -> float:
    return float(np.mean((original.astype(np.float32) - compressed.astype(np.float32)) ** 2))


def encode_image(image_rgb: np.ndarray, fmt: str, jpeg_quality: int) -> tuple[bytes, str]:
    bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    if fmt == "png":
        ok, encoded = cv2.imencode(".png", bgr)
        mime = "image/png"
    else:
        ok, encoded = cv2.imencode(".jpg", bgr, [int(cv2.IMWRITE_JPEG_QUALITY), int(jpeg_quality)])
        mime = "image/jpeg"

    if not ok:
        raise RuntimeError("Image encoding failed")

    return encoded.tobytes(), mime


def get_elbow_points(image_rgb: np.ndarray, max_k: int) -> List[dict]:
    max_allowed = min(max_k, image_rgb.shape[0] * image_rgb.shape[1])
    points = []
    pixels = pixel_data(image_rgb)

    for k in range(1, max_allowed + 1):
        model = KMeans(n_clusters=k, random_state=0, n_init=10)
        model.fit(pixels)
        points.append({"k": k, "inertia": float(model.inertia_)})

    return points


@app.post("/api/analyze")
def analyze():
    image_file = request.files.get("image")
    if image_file is None:
        return jsonify({"error": "image file is required"}), 400

    k_values_raw = request.form.get("k_values", "4,8,16,32")
    output_format = request.form.get("output_format", "jpg").lower()
    jpeg_quality = int(request.form.get("jpeg_quality", "90"))
    include_elbow = request.form.get("include_elbow", "true").lower() == "true"
    elbow_max_k = int(request.form.get("elbow_max_k", "10"))

    try:
        k_values = [int(v.strip()) for v in k_values_raw.split(",") if v.strip()]
    except ValueError:
        return jsonify({"error": "Invalid k_values"}), 400

    if not k_values:
        return jsonify({"error": "At least one k value is required"}), 400

    data = image_file.read()
    original_size = len(data)

    try:
        image_rgb = decode_image(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    results = []

    for k in k_values:
        if k < 1:
            continue
        compressed, inertia = compress_image(image_rgb, k)
        mse = mse_value(image_rgb, compressed)

        encoded_bytes, mime = encode_image(compressed, output_format, jpeg_quality)
        compressed_size = len(encoded_bytes)
        ratio = float(original_size / max(compressed_size, 1))

        results.append(
            {
                "k": k,
                "mse": mse,
                "inertia": inertia,
                "compression_ratio": ratio,
                "compressed_size_bytes": compressed_size,
                "compressed_image_base64": base64.b64encode(encoded_bytes).decode("utf-8"),
                "mime": mime,
            }
        )

    elbow = []
    if include_elbow:
        elbow = get_elbow_points(image_rgb, max(2, elbow_max_k))

    return jsonify(
        {
            "original_size_bytes": original_size,
            "image_shape": {
                "height": int(image_rgb.shape[0]),
                "width": int(image_rgb.shape[1]),
                "channels": int(image_rgb.shape[2]),
            },
            "results": results,
            "elbow": elbow,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
