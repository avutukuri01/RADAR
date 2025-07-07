# RADAR (Radiologist-AI Diagnostic Assistance and Review)

## Abstract

Chest radiography remains a cornerstone of diagnostic imaging, yet interpretive errors—particularly perceptual errors, in which visible abnormalities
are overlooked—continue to undermine diagnostic accuracy. These errors
are frequent, persistent, and are not adequately addressed in current clinical
workflows or artificial intelligence (AI) systems. Although recent AI models
show promise in automated image interpretation, they are often designed
to function independently of the radiologist, providing little support for retrospective error detection or collaborative decision-making. In this work,
we present RADAR (Radiologist-AI Diagnostic Assistance and Review), a
novel post-interpretation companion system designed to assist radiologists in
identifying and correcting perceptual errors in chest x-ray (CXR) interpretation. RADAR operates after the initial read of the radiologist, analyzing
both the finalized annotations and the image features to identify potentially
missed abnormalities through regional-level referrals. Rather than replacing clinical judgment, RADAR complements it, supporting a second look
review while respecting diagnostic autonomy. Importantly, the system is designed to account for interobserver variability by suggesting plausible regions
of interest (ROIs) rather than enforcing fixed abnormality labels. RADAR
demonstrates promising performance, achieving an F1 score of 0.56 and a
median Intersection over Union (IoU) of 0.78 for predicted ROIs, underscoring its potential to improve error detection in real-world radiology workflows.
To support broader research and validation, we release a fully open-source
web-based implementation of RADAR alongside a simulated error dataset
containing visual misses.

------------------------------------------------------------------------

## Web Application

To try out our web application, click the link below and download some sample Chest X-Ray (CXR) images from the Google Drive link. Refer to our video demonstration of the application for information on its usage.  

### Link

https://radiologistai.netlify.app/ 

### Some CXR images to try our application 

These images are selected from our synthetic error dataset.

https://drive.google.com/drive/folders/1990-n_1OiC9Wb-PXwQFLdsdQ_Hb5XbBk?usp=drive_link

### Video Demonstration: How to Use Our Application in a Clinical Setting

https://www.notion.so/RADAR-Radiologist-AI-Diagnostic-Assistance-and-Review-215ca80949e980c3bb79e1984955eba1?source=copy_link

---

### Running the Web Application Locally

You can run the RADAR web application locally by following these steps:

#### 1. Start the Flask Backend

```bash
cd Web\ Application
python RADARflaskbackend.py
```
By default, the Flask app will run on `http://127.0.0.1:5000`.

#### 2. Expose the Backend with ngrok

- [Sign up for a free ngrok account](https://ngrok.com/) and install ngrok on your system.
- Authenticate ngrok with your token (see ngrok docs).
- In a new terminal, run:

```bash
ngrok http 5000
```
- Copy the HTTPS forwarding URL provided by ngrok (e.g., `https://xxxxxx.ngrok.io`).

#### 3. Update the Frontend BASE_URL

- Open `Web Application/web_application_frontend/src/App.tsx`.
- Find the line with `const BASE_URL = ...` and replace its value with your ngrok HTTPS URL, e.g.:
  ```js
  const BASE_URL = "https://xxxxxx.ngrok.io";
  ```

#### 4. Start the Frontend

```bash
cd Web\ Application/web_application_frontend
npm install
npm run dev
```
- The frontend will be available at `http://localhost:5173` (or the port shown in your terminal).

#### 5. Use the App

- Open your browser to the frontend URL.
- The frontend will communicate with your Flask backend via the ngrok URL you set in `BASE_URL`.

---

## Synthetic Error Dataset

This synthetic dataset replicates the perceptual misses that RADAR is built to detect. It contains a single images/ folder and two accompanying CSV files—one with simulated radiologist annotations and another with simulated visual misses. Each CSV includes the columns image_id, rad_id, x_min, y_min, x_max, y_max, and label; every row represents an individual bounding box.

https://drive.google.com/drive/folders/1pf7hHusFz4UE9Hy-Bq3tJPSSD9CxdEdF?usp=sharing

------------------------------------------------------------------------

## Folder Structure

```text
RADAR/
├── README.md
├── requirements.txt
│
├── preprocessing.ipynb           # ① build train/val/test + PNGs
├── training.ipynb                # ② train YOLO-v11x (skip if using pretrained weights)
├── errordatasetcreation.ipynb    # ③ simulate visual-miss dataset
├── evaluationscript.ipynb        # ④ evaluate RADAR on the miss set
│
├── adm.py                        # Abnormality-Detection module
├── ddm.py                        # Differential-Detection module
│
└── Web_Application/
    ├── RADARflaskbackend.py      # Flask backend for RADAR web app
    └── web_application_frontend/ # Frontend files for the web app
```

Files & folders created automatically by the notebooks

| Notebook                     | Auto-generated folders / files                                                                                           |
|------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| `preprocessing.ipynb`        | `images/`, `YOLODataset/train/…`, `YOLODataset/val/…`, `Testing1024/`, `training.csv`, `validation.csv`, `testing.csv`, `preprocessed_1024.csv` |
| `training.ipynb`             | `runs/train/YOLOExperiment/…`                                                                                            |
| `errordatasetcreation.ipynb` | `Error Dataset/images/`, `visual_misses.csv`, `radiologist_annotations.csv`                                              |

## Usage

### ▶️ Full Pipeline (Reproduce Everything)

```bash
git clone https://github.com/adhrithv/RADAR.git
cd RADAR
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**1. Download VinDr-CXR from Kaggle and unzip so you have:**
```
RADAR/vinbigdata-chest-xray-abnormalities-detection/train/*.dicom
RADAR/vinbigdata-chest-xray-abnormalities-detection/train.csv
```

**2. Run the notebooks in order:**

- **Step 1:** Preprocessing  
  Open `preprocessing.ipynb` in Jupyter Lab/Notebook and run all cells.  
  _Outputs:_ Preprocessed images and CSVs for training, validation, and testing.

- **Step 2:** Training  
  Open `training.ipynb` and run all cells.  
  _Inputs:_ Preprocessed data from Step 1.  
  _Outputs:_ Trained YOLO model weights and logs.

- **Step 3:** Error Dataset Creation  
  Open `errordatasetcreation.ipynb` and run all cells.  
  _Inputs:_ Preprocessed CSVs from Step 1.  
  _Outputs:_ `visual_misses.csv` and `remaining_annotations.csv`.

- **Step 4:** Evaluation  
  Open `evaluationscript.ipynb` and run all cells.  
  _Inputs:_ Trained model weights from Step 2, error dataset from Step 3.  
  _Outputs:_ Evaluation metrics, confusion matrix, and plots.


### ⚡ Quick-Evaluate (Skip Heavy Steps)

```bash
git clone https://github.com/adhrithv/RADAR.git
cd RADAR
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Download pretrained weights and synthetic error pack:**

- [YOLO-v11x pretrained weights](https://drive.google.com/file/d/1FKhAvw2mS-C_eklsaLYqmhVpEhcHV_Cx)  
  Save as `model.pt` in the repo root.

- [Synthetic error dataset](https://drive.google.com/drive/folders/1pf7hHusFz4UE9Hy-Bq3tJPSSD9CxdEdF)  
  Unzip into `RADAR/Error Dataset/`.

**Run only the evaluation notebook:**

- Open `evaluationscript.ipynb` and run all cells.

---

### 🖥️ Web Application

See the [Web Application section above](#web-application) for instructions on running the Flask backend and frontend.

---

**Troubleshooting:**
- If a notebook fails due to missing files, check that you have run all previous notebooks in order and that all required files are present.
- For any package errors, ensure your environment is activated and run `pip install -r requirements.txt`.
