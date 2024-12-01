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

# DataLoader

class x_ray(Dataset):
    def __init__(self, labelsfile, imagedir):
        self.imagedir = imagedir
        self.labelsfile = pd.read_csv('D:\\preprocessed.csv')
    def __len__(self):
        return len(self.labelsfile["image_id"].unique())
    def __getitem__(self, id):
        unique_id = list(self.labelsfile["image_id"].unique())
        imageid = unique_id[id]
        print(imageid)
        dicom_path = 'D:\\Downloads\\vinbigdata-chest-xray-abnormalities-detection (1)\\train\\' + '936fd5cff1c058d39817a08f58b72cae' + '.dicom'
        dicom_image = pydicom.dcmread(dicom_path)
        image_data = dicom_image.pixel_array
        #print(image_data.shape)
        image_resize = cv2.resize(image_data,(512,512))
        labels_rows = self.labelsfile[self.labelsfile['image_id'] == imageid]
        labels = np.unique(labels_rows['class_id'].values)
        
        labels_list = []
        bounding_boxes_rows = self.labelsfile[self.labelsfile['image_id'] == imageid]
        bounding_boxes = bounding_boxes_rows.loc[:,('class_id', 'x_min', 'y_min', 'x_max', 'y_max')]
        templist = np.zeros(15)
        # print("test")
        for index, row in bounding_boxes.iterrows():
            vals = tuple(row[1:4].values)
            class_id = int(row[0])
            labels_list.append((str(class_id) + "/" + str(id), vals))
            templist[int(class_id)] = 1
        return torch.tensor(image_resize), imageid
    
    def getlabels(self, id):
        labels_list = []
        for i in id:
            labels_dict = {}
            templist = np.zeros(15)
            imageid = i
            bounding_boxes_rows = self.labelsfile[self.labelsfile['image_id'] == imageid]
            bounding_boxes = bounding_boxes_rows.loc[:,('class_id', 'x_min', 'y_min', 'x_max', 'y_max')]
            tempvar = 0
            for index, row in bounding_boxes.iterrows():
                vals = tuple(row[1:4].values)
                class_id = int(row[0])
                labels_dict[str(class_id) + "/" + str(tempvar)] = vals
                #templist[int(class_id)] = 1
                tempvar += 1
            labels_list.append(labels_dict)
        return labels_list

# Algorithm 1

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
    
