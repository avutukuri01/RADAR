[This repo is under developement.]
# RADAR
Chest radiography remains a cornerstone of diagnostic imaging, yet inter-
pretive errors—particularly perceptual errors, in which visible abnormalities
are overlooked—continue to undermine diagnostic accuracy. These errors
are frequent, persistent, and are not adequately addressed in current clinical
workflows or artificial intelligence (AI) systems. Although recent AI models
show promise in automated image interpretation, they are often designed
to function independently of the radiologist, providing little support for ret-
rospective error detection or collaborative decision-making. In this work,
we present RADAR (Radiologist-AI Diagnostic Assistance and Review), a
novel post-interpretation companion system designed to assist radiologists in
identifying and correcting perceptual errors in chest x-ray (CXR) interpre-
tation. RADAR operates after the initial read of the radiologist, analyzing
both the finalized annotations and the image features to identify potentially
missed abnormalities through regional-level referrals. Rather than replac-
ing clinical judgment, RADAR complements it, supporting a second look
review while respecting diagnostic autonomy. Importantly, the system is de-
signed to account for interobserver variability by suggesting plausible regions
of interest (ROIs) rather than enforcing fixed abnormality labels. RADAR
demonstrates promising performance, achieving an F1 score of 0.56 and a
median Intersection over Union (IoU) of 0.78 for predicted ROIs, underscor-
ing its potential to improve error detection in real-world radiology workflows.
To support broader research and validation, we release a fully open-source
web-based implementation of RADAR alongside a simulated error dataset
containing visual misses.

# Web Application Link

https://radiologistai.netlify.app/ 

# Video Demonstration: How to Use Our Application in a Clinical Setting

https://tally.so/r/w7EXgZ

# Some CXR images to try our application 

These images are radomly selected from our synthetic error dataset.

https://drive.google.com/drive/folders/19Px-uNFywK4DktVP89-A7LyLEO8OJovx?usp=sharing

