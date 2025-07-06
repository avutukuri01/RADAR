import json
from io import BytesIO
import base64

import pandas as pd
import numpy as np
import pydicom
from pydicom.pixel_data_handlers.util import apply_voi_lut
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO

TARGET_SIZE = 1024

app = Flask(__name__)
CORS(app)

model = YOLO("/Users/adhrith/Documents/best1.pt")

def read_image_file(image_file):
    """Read DICOM or standard image and return a PIL RGB image."""
    file_bytes = image_file.read()
    fname = image_file.filename.lower()
    if fname.endswith(('.dcm', '.dicom')):
        ds = pydicom.dcmread(BytesIO(file_bytes))
        data = ds.pixel_array
        if 'VOILUTSequence' in ds:
            data = apply_voi_lut(data, ds)
        data = data.astype(np.float32)
        data -= data.min()
        if data.max() != 0:
            data = (data / data.max()) * 255.0
        data = data.astype(np.uint8)
        img = Image.fromarray(data)
        if img.mode != 'RGB':
            img = img.convert('RGB')
    else:
        img = Image.open(BytesIO(file_bytes))
        if img.mode != 'RGB':
            img = img.convert('RGB')
    return img

def resize_image(img: Image.Image, size: int = TARGET_SIZE) -> Image.Image:
    """Resize the image to a square of the specified size."""
    return img.resize((size, size), Image.LANCZOS)

def pil_to_data_url(img: Image.Image) -> str:
    """Convert a PIL image to a base64-encoded PNG data URL."""
    buf = BytesIO()
    img.save(buf, format='PNG')
    img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_b64}"

def extract_annotations(json_data: dict, target_size: int = TARGET_SIZE) -> pd.DataFrame:
    """Convert normalized annotations to absolute coordinates in resized space."""
    meta = json_data.get("metadata", {"originalWidth": 1, "originalHeight": 1})
    scale_x = target_size / meta["originalWidth"]
    scale_y = target_size / meta["originalHeight"]
    rows = []
    for ann in json_data.get("annotations", []):
        x = ann["x"] * meta["originalWidth"] * scale_x
        y = ann["y"] * meta["originalHeight"] * scale_y
        w = ann["width"] * meta["originalWidth"] * scale_x
        h = ann["height"] * meta["originalHeight"] * scale_y
        rows.append({"x_min": x, "y_min": y, "x_max": x + w, "y_max": y + h})
    return pd.DataFrame(rows)

def predict(image: Image.Image) -> pd.DataFrame:
    """Run YOLO on a PIL image and return raw bounding box predictions."""
    arr = np.array(image)
    results = model(arr, iou=0.0)
    preds = []
    for res in results:
        for box in res.boxes.data.tolist():
            x_min, y_min, x_max, y_max, *_ = box
            preds.append({"x_min": x_min, "y_min": y_min, "x_max": x_max, "y_max": y_max})
    return pd.DataFrame(preds)

def compute_iou(b1: dict, b2: dict) -> float:
    xi1 = max(b1["x_min"], b2["x_min"])
    yi1 = max(b1["y_min"], b2["y_min"])
    xi2 = min(b1["x_max"], b2["x_max"])
    yi2 = min(b1["y_max"], b2["y_max"])
    inter_w = max(0, xi2 - xi1)
    inter_h = max(0, yi2 - yi1)
    inter = inter_w * inter_h
    area1 = (b1["x_max"] - b1["x_min"]) * (b1["y_max"] - b1["y_min"])
    area2 = (b2["x_max"] - b2["x_min"]) * (b2["y_max"] - b2["y_min"])
    union = area1 + area2 - inter
    return inter / union if union > 0 else 0

def remove_overlapping_predictions(pred_df: pd.DataFrame, ref_df: pd.DataFrame, iou_threshold: float = 0.0) -> list:
    out = []
    for _, pred in pred_df.iterrows():
        keep = True
        for _, ref in ref_df.iterrows():
            if compute_iou(pred.to_dict(), ref.to_dict()) > iou_threshold:
                keep = False
                break
        if keep:
            out.append(pred.to_dict())
    return out

@app.route('/adm', methods=['POST'])
def adm():
    if 'image' not in request.files:
        return jsonify({"error": "image file required"}), 400
    img = read_image_file(request.files['image'])
    img = resize_image(img)
    converted_image = pil_to_data_url(img)
    preds_df = predict(img)
    return jsonify({
        "converted_image": converted_image,
        "predictions": preds_df.to_dict(orient="records"),
    })

@app.route('/ddm', methods=['POST'])
def ddm():
    payload = request.get_json(force=True)
    pred_df = pd.DataFrame(payload.get("predictions", []))
    ann_df = extract_annotations(payload)
    if pred_df.empty:
        return jsonify({"filtered_predictions": []})
    filtered = remove_overlapping_predictions(pred_df, ann_df, iou_threshold=0.0)
    return jsonify({"filtered_predictions": filtered})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
