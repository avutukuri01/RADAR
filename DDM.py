import pandas as pd
import numpy as np

TARGET_SIZE = 1024  

def extract_annotations(json_data: dict, target_size: int = TARGET_SIZE) -> pd.DataFrame:
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

def ddm(payload: dict, iou_threshold: float = 0.0) -> list:
    pred_df = pd.DataFrame(payload.get("predictions", []))
    ann_df = extract_annotations(payload)
    if pred_df.empty:
        return []
    return remove_overlapping_predictions(pred_df, ann_df, iou_threshold)

# Example usage
if __name__ == "__main__":
    import json

    # Load a JSON file or dictionary with the expected structure
    with open("input.json", "r") as f:
        payload = json.load(f)

    filtered_predictions = ddm(payload)
    print(json.dumps({"filtered_predictions": filtered_predictions}, indent=2))
