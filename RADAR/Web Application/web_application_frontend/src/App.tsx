import React, { useState, useRef, useEffect } from "react";
import { Radar, Trash2, Edit, X } from "lucide-react";

// ---------------------------
// Interfaces, Types & Config
// ---------------------------
const BASE_URL = "https://29a4-67-183-210-62.ngrok-free.app";

interface AIRecommendation {
  id: string;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface NormalizedAnnotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface ImageDimensions {
  x: number; // top‑left in canvas space
  y: number;
  scale: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

type DragMode =
  | "move"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | null;

type Corner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

// ---------------------------
// The App Component
// ---------------------------
function App() {
  // — state —
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [admPredictions, setAdmPredictions] = useState<AIRecommendation[]>([]); // raw YOLO from ADM
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]); // filtered by DDM

  const [showSplitView, setShowSplitView] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<
    Partial<Annotation> | null
  >(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(
    null
  );
  const [gettingRecs, setGettingRecs] = useState(false);
  const [processingImage, setProcessingImage] = useState(false); // NEW

  // — refs —
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aiCanvasRef = useRef<HTMLCanvasElement>(null);
  const leftContainerRef = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  // ---------------------------
  // Utility helpers
  // ---------------------------
  const updateCanvasDimensions = (
    img: HTMLImageElement,
    container: HTMLDivElement
  ): ImageDimensions => {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scale = Math.min(
      containerWidth / img.width,
      containerHeight / img.height
    );
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = (containerWidth - scaledWidth) / 2;
    const y = (containerHeight - scaledHeight) / 2;
    return {
      x,
      y,
      scale,
      width: scaledWidth,
      height: scaledHeight,
      originalWidth: img.width,
      originalHeight: img.height,
    };
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageDimensions) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    const imageX = (canvasX - imageDimensions.x) / imageDimensions.scale;
    const imageY = (canvasY - imageDimensions.y) / imageDimensions.scale;
    return { x: imageX, y: imageY };
  };

  const isNearCorner = (
    mx: number,
    my: number,
    ann: Annotation
  ): Corner | null => {
    const cornerSize = 20;
    const corners = {
      topLeft: { x: ann.x, y: ann.y },
      topRight: { x: ann.x + ann.width, y: ann.y },
      bottomLeft: { x: ann.x, y: ann.y + ann.height },
      bottomRight: { x: ann.x + ann.width, y: ann.y + ann.height },
    } as const;
    for (const [corner, pos] of Object.entries(corners)) {
      if (Math.abs(mx - pos.x) < cornerSize && Math.abs(my - pos.y) < cornerSize) {
        return corner as Corner;
      }
    }
    return null;
  };

  // ---------------------------
  // Canvas init & resize
  // ---------------------------
  useEffect(() => {
    const initCanvas = (
      canvas: HTMLCanvasElement | null,
      container: HTMLDivElement | null
    ) => {
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    initCanvas(canvasRef.current, leftContainerRef.current);
    if (showSplitView) initCanvas(aiCanvasRef.current, rightContainerRef.current);
  }, [showSplitView]);

  // Update dimensions when split‑view toggles
  useEffect(() => {
    if (imageRef.current && leftContainerRef.current) {
      const dims = updateCanvasDimensions(imageRef.current, leftContainerRef.current);
      setImageDimensions(dims);
      if (canvasRef.current) {
        canvasRef.current.width = leftContainerRef.current.clientWidth;
        canvasRef.current.height = leftContainerRef.current.clientHeight;
      }
    }
  }, [showSplitView]);

  // ---------------------------
  // Back‑end calls
  // ---------------------------
  const uploadToADM = async (file: File) => {
    setProcessingImage(true); // NEW
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${BASE_URL}/adm`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("ADM request failed");
      const data = await res.json();

      setImage(data.converted_image);
      setAdmPredictions(
        data.predictions.map((p: any) => ({
          ...p,
          id: Date.now().toString() + Math.random(),
        }))
      );

      // Pre‑load image so we know naturalWidth/Height
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        if (leftContainerRef.current) {
          const dims = updateCanvasDimensions(img, leftContainerRef.current);
          setImageDimensions(dims);
          if (canvasRef.current) {
            canvasRef.current.width = leftContainerRef.current.clientWidth;
            canvasRef.current.height = leftContainerRef.current.clientHeight;
          }
        }
      };
      img.src = data.converted_image;
    } catch (err) {
      console.error(err);
      alert("Failed to upload image");
    } finally {
      setProcessingImage(false); // NEW
    }
  };

  const requestDDM = async () => {
    if (!imageDimensions) return;
    setGettingRecs(true);
    try {
      const body = {
        predictions: admPredictions,
        annotations: annotations.map((a) => ({
          id: a.id,
          x: a.x / imageDimensions.originalWidth,
          y: a.y / imageDimensions.originalHeight,
          width: a.width / imageDimensions.originalWidth,
          height: a.height / imageDimensions.originalHeight,
          label: a.label,
        })),
        metadata: {
          originalWidth: imageDimensions.originalWidth,
          originalHeight: imageDimensions.originalHeight,
        },
      };

      const res = await fetch(`${BASE_URL}/ddm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("DDM request failed");
      const data = await res.json();

      setAIRecommendations(
        data.filtered_predictions.map((p: any) => ({
          ...p,
          id: Date.now().toString() + Math.random(),
        }))
      );
      setShowSplitView(true);
    } catch (err) {
      console.error(err);
      alert("Failed to get AI recommendations");
    } finally {
      setGettingRecs(false);
    }
  };

  // ---------------------------
  // Handlers – file upload & buttons
  // ---------------------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // reset state
    setImage(null);
    setAdmPredictions([]);
    setAIRecommendations([]);
    setAnnotations([]);
    setShowSplitView(false);
    setEditMode(false);
    setSelectedBoxId(null);

    setImageFile(file);
    uploadToADM(file);
  };

  const handleDownloadAnnotations = () => {
    if (!imageDimensions || !imageFile) return;

    const normalized: NormalizedAnnotation[] = annotations.map((a) => ({
      id: a.id,
      x: a.x / imageDimensions.originalWidth,
      y: a.y / imageDimensions.originalHeight,
      width: a.width / imageDimensions.originalWidth,
      height: a.height / imageDimensions.originalHeight,
      label: a.label,
    }));

    const data = {
      image,
      annotations: normalized,
      metadata: {
        originalWidth: imageDimensions.originalWidth,
        originalHeight: imageDimensions.originalHeight,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "annotations.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------------------------
  // Canvas mouse events
  // ---------------------------
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageDimensions || !image) return;

    const { x, y } = getMousePos(e);
    if (
      x < 0 ||
      x > imageDimensions.originalWidth ||
      y < 0 ||
      y > imageDimensions.originalHeight
    )
      return;

    if (editMode) {
      const selectionTolerance = 5;
      let found = false;

      for (let i = annotations.length - 1; i >= 0; i--) {
        const ann = annotations[i];
        if (
          x >= ann.x - selectionTolerance &&
          x <= ann.x + ann.width + selectionTolerance &&
          y >= ann.y - selectionTolerance &&
          y <= ann.y + ann.height + selectionTolerance
        ) {
          const corner = isNearCorner(x, y, ann);
          if (corner) {
            setDragMode(corner);
          } else {
            setDragMode("move");
            dragOffset.current = { x: x - ann.x, y: y - ann.y };
          }
          setSelectedBoxId(ann.id);
          startPos.current = { x, y };
          found = true;
          break;
        }
      }
      if (!found) setSelectedBoxId(null);
      return;
    }

    startPos.current = { x, y };
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!startPos.current || !imageDimensions) return;
    const { x, y } = getMousePos(e);

    if (editMode && dragMode && selectedBoxId) {
      const ann = annotations.find((a) => a.id === selectedBoxId);
      if (!ann) return;
      const updated = { ...ann };

      if (dragMode === "move" && dragOffset.current) {
        updated.x = x - dragOffset.current.x;
        updated.y = y - dragOffset.current.y;
      } else {
        switch (dragMode) {
          case "topLeft":
            updated.width += updated.x - x;
            updated.height += updated.y - y;
            updated.x = x;
            updated.y = y;
            break;
          case "topRight":
            updated.width = x - updated.x;
            updated.height += updated.y - y;
            updated.y = y;
            break;
          case "bottomLeft":
            updated.width += updated.x - x;
            updated.height = y - updated.y;
            updated.x = x;
            break;
          case "bottomRight":
            updated.width = x - updated.x;
            updated.height = y - updated.y;
            break;
        }
      }
      if (updated.width > 0 && updated.height > 0) {
        setAnnotations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      }
    } else if (isDrawing) {
      setCurrentAnnotation({
        id: Date.now().toString(),
        x: Math.min(startPos.current.x, x),
        y: Math.min(startPos.current.y, y),
        width: Math.abs(x - startPos.current.x),
        height: Math.abs(y - startPos.current.y),
      });
    }
  };

  const handleMouseUp = () => {
    if (editMode) {
      setDragMode(null);
      startPos.current = null;
      dragOffset.current = null;
      return;
    }

    if (isDrawing && currentAnnotation) {
      const label = window.prompt("Enter label for this annotation:");
      if (label) {
        setAnnotations([...annotations, { ...currentAnnotation, label } as Annotation]);
      }
    }
    setIsDrawing(false);
    setCurrentAnnotation(null);
    startPos.current = null;
  };

  // ---------------------------
  // Annotation utilities
  // ---------------------------
  const deleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    setSelectedBoxId(null);
  };

  const editAnnotationLabel = (id: string) => {
    const ann = annotations.find((a) => a.id === id);
    if (!ann) return;
    const newLabel = window.prompt("Edit label:", ann.label);
    if (newLabel) {
      setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, label: newLabel } : a)));
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    setSelectedBoxId(null);
    setDragMode(null);
  };

  // ---------------------------
  // Accept / Reject AI recs
  // ---------------------------
  const acceptRecommendation = (rec: AIRecommendation) => {
    const newAnn: Annotation = {
      id: Date.now().toString(),
      x: rec.x_min,
      y: rec.y_min,
      width: rec.x_max - rec.x_min,
      height: rec.y_max - rec.y_min,
      label: "AI Suggestion",
    };
    setAnnotations((prev) => [...prev, newAnn]);
    setAIRecommendations((prev) => prev.filter((r) => r.id !== rec.id));
  };

  const rejectRecommendation = (id: string) => {
    setAIRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAICanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!aiCanvasRef.current || !imageDimensions || !rightContainerRef.current || !imageRef.current)
      return;
    const rect = aiCanvasRef.current.getBoundingClientRect();
    const scaleX = aiCanvasRef.current.width / rect.width;
    const scaleY = aiCanvasRef.current.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const dims = updateCanvasDimensions(imageRef.current, rightContainerRef.current);
    const btn = 20;
    const pad = 5;

    aiRecommendations.forEach((rec) => {
      const cX = rec.x_min * dims.scale + dims.x;
      const cY = rec.y_min * dims.scale + dims.y;

      const accept = {
        left: cX,
        right: cX + btn,
        top: cY - btn - pad,
        bottom: cY - pad,
      };
      const reject = {
        left: cX + btn + pad,
        right: cX + btn * 2 + pad,
        top: cY - btn - pad,
        bottom: cY - pad,
      };

      if (clickX >= accept.left && clickX <= accept.right && clickY >= accept.top && clickY <= accept.bottom) {
        acceptRecommendation(rec);
      } else if (clickX >= reject.left && clickX <= reject.right && clickY >= reject.top && clickY <= reject.bottom) {
        rejectRecommendation(rec.id);
      }
    });
  };

  // ---------------------------
  // Drawing loops
  // ---------------------------
  const drawLeftCanvas = () => {
    if (!canvasRef.current || !imageDimensions || !imageRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const img = imageRef.current;
    const dims = updateCanvasDimensions(img, leftContainerRef.current!);
    ctx.drawImage(img, dims.x, dims.y, dims.width, dims.height);

    annotations.forEach((ann) => {
      const selected = editMode && ann.id === selectedBoxId;
      const boxX = ann.x * dims.scale + dims.x;
      const boxY = ann.y * dims.scale + dims.y;
      const boxW = ann.width * dims.scale;
      const boxH = ann.height * dims.scale;

      ctx.strokeStyle = selected ? "#ffff00" : "#00ff00";
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      if (editMode) {
        ctx.fillStyle = "rgba(255,255,0,0.3)";
        ctx.fillRect(boxX, boxY, boxW, 15);
      }
      ctx.fillStyle = selected ? "#ffff00" : "#00ff00";
      ctx.font = "14px Arial";
      ctx.fillText(ann.label, boxX, boxY - 5);

      // draw handles if selected
      if (selected) {
        const size = 8;
        const corners = [
          { x: boxX, y: boxY },
          { x: boxX + boxW, y: boxY },
          { x: boxX, y: boxY + boxH },
          { x: boxX + boxW, y: boxY + boxH },
        ];
        ctx.fillStyle = "#ffff00";
        corners.forEach((c) => ctx.fillRect(c.x - size / 2, c.y - size / 2, size, size));
      }
    });

    // current drawing box
    if (isDrawing && currentAnnotation) {
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 2;
      const boxX = currentAnnotation.x! * dims.scale + dims.x;
      const boxY = currentAnnotation.y! * dims.scale + dims.y;
      const boxW = currentAnnotation.width! * dims.scale;
      const boxH = currentAnnotation.height! * dims.scale;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
    }
  };

  const drawRightCanvas = () => {
    if (!showSplitView || !aiCanvasRef.current || !imageDimensions || !imageRef.current) return;
    const ctx = aiCanvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, aiCanvasRef.current.width, aiCanvasRef.current.height);

    const img = imageRef.current;
    const dims = updateCanvasDimensions(img, rightContainerRef.current!);
    ctx.drawImage(img, dims.x, dims.y, dims.width, dims.height);

    aiRecommendations.forEach((rec) => {
      const cX = rec.x_min * dims.scale + dims.x;
      const cY = rec.y_min * dims.scale + dims.y;
      const cW = (rec.x_max - rec.x_min) * dims.scale;
      const cH = (rec.y_max - rec.y_min) * dims.scale;

      ctx.strokeStyle = "#ff6b6b";
      ctx.lineWidth = 2;
      ctx.strokeRect(cX, cY, cW, cH);

      const btn = 20;
      const pad = 5;

      // accept
      ctx.fillStyle = "#4CAF50";
      ctx.fillRect(cX, cY - btn - pad, btn, btn);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cX + 4, cY - btn / 2 - pad);
      ctx.lineTo(cX + btn / 2, cY - 4 - pad);
      ctx.lineTo(cX + btn - 4, cY - btn + 4 - pad);
      ctx.stroke();

      // reject
      ctx.fillStyle = "#f44336";
      ctx.fillRect(cX + btn + pad, cY - btn - pad, btn, btn);
      ctx.beginPath();
      ctx.moveTo(cX + btn + pad + 4, cY - btn + 4 - pad);
      ctx.lineTo(cX + btn * 2 + pad - 4, cY - 4 - pad);
      ctx.moveTo(cX + btn * 2 + pad - 4, cY - btn + 4 - pad);
      ctx.lineTo(cX + btn + pad + 4, cY - 4 - pad);
      ctx.stroke();
    });
  };

  // repaint
  useEffect(() => {
    requestAnimationFrame(() => {
      drawLeftCanvas();
      drawRightCanvas();
    });
  }, [image, annotations, currentAnnotation, editMode, selectedBoxId, imageDimensions, showSplitView, aiRecommendations, isDrawing]);

  // ---------------------------
  // JSX
  // ---------------------------
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex items-center">
          <Radar className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">RADAR</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CXR Image
            </label>
            <input
              type="file"
              accept="image/*,.dcm,.dicom"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* processing indicator */}
          {processingImage && (
            <div className="flex items-center justify-center mb-6">
              <span className="text-blue-600 font-semibold animate-pulse">
                Processing image…
              </span>
            </div>
          )}

          {/* canvases */}
          {showSplitView ? (
            <div className="flex space-x-4">
              <div className="w-1/2">
                <div className="text-center font-semibold mb-2">Your Annotations</div>
                <div
                  ref={leftContainerRef}
                  className="relative border rounded-lg overflow-hidden h-[600px] flex items-center justify-center"
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="max-w-full max-h-full"
                  />
                </div>
              </div>
              <div className="w-1/2">
                <div className="text-center font-semibold mb-2">AI Recommendations</div>
                <div
                  ref={rightContainerRef}
                  className="relative border rounded-lg overflow-hidden h-[600px] flex items-center justify-center"
                >
                  <canvas
                    ref={aiCanvasRef}
                    onClick={handleAICanvasClick}
                    className="max-w-full max-h-full"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={leftContainerRef}
              className="relative border rounded-lg overflow-hidden h-[600px] flex items-center justify-center w-full"
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="max-w-full max-h-full"
              />
            </div>
          )}

          {/* buttons */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <button
              onClick={toggleEditMode}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
    editMode
      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500"
      : "bg-blue-100 text-blue-800 hover:bg-blue-200 focus:ring-blue-500"
  }`}
            >
              {editMode ? (
                <span className="flex items-center">
                  <X className="h-4 w-4 mr-2" /> Exit Edit Mode
                </span>
              ) : (
                <span className="flex items-center">
                  <Edit className="h-4 w-4 mr-2" /> Edit Annotations
                </span>
              )}
            </button>

            <button
              onClick={handleDownloadAnnotations}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Save Annotations
            </button>

            {!showSplitView && (
              <button
                onClick={requestDDM}
                disabled={gettingRecs || !admPredictions.length || processingImage}
                className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      gettingRecs || !admPredictions.length || processingImage
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
    }`}
              >
                {gettingRecs ? "Loading…" : "Get AI Recommendations"}
              </button>
            )}
          </div>

          {/* annotation list */}
          {annotations.length > 0 && (
            <div className="mt-4 border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Annotations ({annotations.length})
              </h3>
              <div className="space-y-2">
                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="text-sm text-gray-600">{ann.label}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editAnnotationLabel(ann.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit label"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteAnnotation(ann.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete annotation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
