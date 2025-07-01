[This repo is under development.]
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

- `model/` – YOLO weights
- `preprocessing.ipynb` – Create training, validation, and testing sets for YOLO
- `errordatasetcreation.ipynb` – Script to create simulated perceptual error dataset
- `evaluationscript.ipynb` - Script to evaluate RADAR's ability to correct simulated perceptual error
- `adm.py` - Final script for abnormality detection module (ADM)
- `ddm.py` - Final script for differential detection module (DDM)
