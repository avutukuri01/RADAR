TARGET_SIZE = 1024

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
