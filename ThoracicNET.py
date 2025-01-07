import os
import pydicom
import numpy as np
import cv2
import h5py
import matplotlib.pyplot as plt
import pandas as pd
from matplotlib.patches import Polygon
import torch
from torch.utils.data import Dataset, DataLoader
import torchvision
import torchvision.models as mod
import torch.nn as nn
from torch.utils.data import random_split
import random
import torch.optim as optim
from torchvision.transforms import functional as F
from torchvision.models.detection import FasterRCNN
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision.transforms import Normalize
from tqdm import tqdm

# DataLoader

class x_ray(Dataset):
    def __init__(self, labelsfile, imagedir):
        self.imagedir = imagedir
        self.labelsfile = pd.read_csv(labelsfile)
    def __len__(self):
        return len(self.labelsfile["image_id"].unique())
    def __getitem__(self, id):
        unique_id = list(self.labelsfile["image_id"].unique())
        imageid =  unique_id[id]
        #dicom_path = 'D:\\Downloads\\vinbigdata-chest-xray-abnormalities-detection (1)\\train\\' + str(imageid) + '.dicom'
        dicom_path = f"{self.imagedir}/{imageid}.dicom"
        dicom_image = pydicom.dcmread(dicom_path)
        image_data = dicom_image.pixel_array
        image_data = cv2.resize(image_data,(224,224))
        image_tensor = torch.from_numpy(image_data).float() 
        image_tensor = (image_tensor - image_tensor.min()) / (image_tensor.max() - image_tensor.min())
        image_tensor = image_tensor.unsqueeze(0)  
        image_tensor = image_tensor.repeat(3, 1, 1)  
        normalize = Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        normalized_image = normalize(image_tensor)
        
        return normalized_image, imageid
    
    def getlabels(self, id):
        targets = []
        for i in id:
            imageid = i
            image_data = self.labelsfile[self.labelsfile['image_id'] == imageid]
            #image_data = self.labelsfile[imageid]
            boxes = image_data[['x_min', 'y_min', 'x_max', 'y_max']].values

            labels = image_data['class_id'].values + 1

            targets.append({
                "boxes": torch.tensor(boxes, dtype=torch.float32),
                "labels": torch.tensor(labels, dtype=torch.int64)
            })

        return targets

# Algorithm 1 (Simple ResNet50 for experimentation)

class RCNN(torch.nn.Module):
    def __init__(self, pretrained):
        self.backbone = mod.resnet50(pretrained = pretrained)[:-1]
        self.classification_head = nn.Sequential(
            nn.linear(in_features=2048, out_features=1024),
            nn.ReLu(),
            nn.linear(in_features=1024, out_features=14),
            nn.Softmax()
        )
    def forward(image):
        features1 = self.backbone(image)
        self.classification_head(image)

train_data = x_ray("D:\\preprocessed.csv", "D:\\Downloads\\vinbigdata-chest-xray-abnormalities-detection (1)\\train")
train_data_loader = DataLoader(train_data, batch_size = 2)

def Train(dataloader):
    device = torch.device('cpu')
    model = RCNN(True)
    model.train()
    for i in train_data_loader:
        labels = train_data.getlabels(i[1])
        output = model(i[0])

# FastRCNN with ResNet50 backbone

dataset = x_ray("/content/filtered_data700.csv", "/content/drive/MyDrive/Subset")
val_dataset = x_ray("/content/filtered_data300.csv", "/content/drive/MyDrive/Subset")
train_data_loader = DataLoader(dataset, batch_size = 32)
val_data_loader = DataLoader(val_dataset, batch_size = 32)

def clean_bounding_boxes(targets):
    cleaned_targets = []
    for target in targets:
        boxes = target["boxes"]
        labels = target["labels"]

        valid_indices = (boxes[:, 2] > boxes[:, 0]) & (boxes[:, 3] > boxes[:, 1])
        valid_boxes = boxes[valid_indices]
        valid_labels = labels[valid_indices]

        cleaned_targets.append({
            "boxes": valid_boxes,
            "labels": valid_labels
        })
    return cleaned_targets

def Train(epochs):
    model = torchvision.models.detection.fasterrcnn_resnet50_fpn(pretrained=True)
    num_classes = 15
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)

    device = torch.device('cuda')
    model.to(device)

    optimizer = optim.SGD(model.parameters(), lr=0.00001, momentum=0.9, weight_decay=0.0001)

    model.train()

    train_losses = []
    val_losses = []
    best_loss = 10000

    for epoch in range(epochs):
        epoch_loss = []
        epoch_val_loss = []
        for batch_idx, (images, ids) in enumerate(tqdm(train_data_loader, desc=f"Training Epoch {epoch + 1}"), 1):
            targets = dataset.getlabels(ids)
            targets = clean_bounding_boxes(targets)

            optimizer.zero_grad()
            targets = [{k: v.to(device) for k, v in t.items()} for t in targets]
            images = images.to(device)
            loss_dict = model(images, targets)
            losses = sum(loss for loss in loss_dict.values())

            # Backward pass
            losses.backward()
            optimizer.step()

            epoch_loss.append(losses)

        train_losses.append(np.mean([loss.item() for loss in epoch_loss]))

        model.train()

        with torch.no_grad():
            for batch_idx, (images, ids) in enumerate(tqdm(val_data_loader, desc=f"Val Epoch {epoch + 1}"), 1):
                targets = val_dataset.getlabels(ids)
                images = images.to(device)
                targets = [{k: v.to(device) for k, v in t.items()} for t in targets]
                output = model(images, targets)
                val_loss = sum(loss for loss in output.values())
                epoch_val_loss.append(val_loss)

        val_losses.append(np.mean(epoch_val_loss))

        if np.mean(epoch_val_loss) < best_loss:
            best_loss = np.mean(epoch_val_loss)
            torch.save(model.state_dict(), "/content/drive/MyDrive/fasterrcnn_model2.pth")
            print("saved")


        print("train loss:", np.mean([loss.item() for loss in epoch_loss]))
        print("val loss:", np.mean(epoch_val_loss))
        print("epoch:", epoch)

    return train_losses, val_losses
