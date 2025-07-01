import base64
from io import BytesIO
import numpy as np
import pandas as pd
import pydicom
from pydicom.pixel_data_handlers.util import apply_voi_lut
from PIL import Image
from ultralytics import YOLO

# 1) Load model
TARGET_SIZE = 1024
model = YOLO("model.pt")


# 2) Image‐reading
def read_image_file(image_file) -> Image.Image:
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


# 3) Resize helper
def resize_image(img: Image.Image, size: int = TARGET_SIZE) -> Image.Image:
    return img.resize((size, size), Image.LANCZOS)


# 4) Convert to base64‐PNG data URL
def pil_to_data_url(img: Image.Image) -> str:
    buf = BytesIO()
    img.save(buf, format='PNG')
    img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_b64}"


# 5) Run YOLO and collect boxes
def predict(image: Image.Image) -> pd.DataFrame:
    arr = np.array(image)
    results = model(arr, iou=0.0)
    preds = []
    for res in results:
        for box in res.boxes.data.tolist():
            x_min, y_min, x_max, y_max, *_ = box
            preds.append({
                "x_min": x_min,
                "y_min": y_min,
                "x_max": x_max,
                "y_max": y_max,
            })
    return pd.DataFrame(preds)


# 6) ADM Function
def adm(image_file):
    """
    image_file: any file‐like object with .read() -> bytes
                and .filename -> str
    Returns a dict with:
      - "converted_image": base64 PNG data URL of the resized input
      - "predictions": list of {x_min, y_min, x_max, y_max}
    """
    img = read_image_file(image_file)
    img = resize_image(img)
    converted_image = pil_to_data_url(img)
    preds_df = predict(img)
    return {
        "converted_image": converted_image,
        "predictions": preds_df.to_dict(orient="records"),
    }

# Example Usage 
if __name__ == "__main__":
    class ImageFileWrapper:
        def __init__(self, path: str):
            self.path = path
            self.filename = path
        def read(self) -> bytes:
            with open(self.path, "rb") as f:
                return f.read()

    # Replace with your actual image path, e.g. .dcm or .png/.jpg
    example_file = ImageFileWrapper("path/to/example.png")
    result = adm(example_file)
