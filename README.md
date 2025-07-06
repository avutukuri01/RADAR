
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

------------------------------------------------------------------------

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
### ▶️ Full pipeline (reproduce everything)
```bash
Copy
Edit
git clone https://github.com/adhrithv/RADAR.git
cd RADAR
pip install -r requirements.txt           # or use conda


# 1) download VinDr-CXR from Kaggle and unzip so you have:
#    RADAR/vinbigdata-chest-xray-abnormalities-detection/train/*.dicom

jupyter lab                               # launch from repo root
# Then run the notebooks in this order:
#   1. preprocessing.ipynb
#   2. training.ipynb      (skip if you use pretrained weights)
#   3. errordatasetcreation.ipynb
#   4. evaluationscript.ipynb
```

### ⚡ Quick-evaluate (skip heavy steps)
```bash
git clone https://github.com/adhrithv/RADAR.git
cd RADAR
pip install -r requirements.txt
```
Download pretrained weights (YOLO-v11x)
https://drive.google.com/file/d/1FKhAvw2mS-C_eklsaLYqmhVpEhcHV_Cx
→ save as yolo11x.pt in the repo root (or update the path in the notebooks).

Download the synthetic-error pack
https://drive.google.com/drive/folders/1pf7hHusFz4UE9Hy-Bq3tJPSSD9CxdEdF
→ unzip into RADAR/Error Dataset/.

Open evaluationscript.ipynb and Run All—no training required.
