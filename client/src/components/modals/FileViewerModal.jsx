import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoClose,
  IoChevronBack,
  IoChevronForward,
} from "react-icons/io5";
import {
  LuUndo,
  LuRedo,
  LuWand,
  LuPencil,
  LuSquare,
  LuCircle,
  LuMoveUpRight,
  LuMinus,
  LuDownload,
  LuCopy,
  LuRotateCw,
  LuFlipHorizontal,
  LuTrash2,
} from "react-icons/lu";
import {
  TbGridDots,
  TbSticker,
} from "react-icons/tb";
import { BsEmojiSmile } from "react-icons/bs";
import { MdCropRotate } from "react-icons/md";
import { toast } from "react-toastify";

const FILTERS = [
  { id: "normal", name: "Normal", filter: "none" },
  { id: "pop", name: "Pop", filter: "contrast(1.25) saturate(1.35) brightness(1.05)" },
  { id: "bw", name: "B&W", filter: "grayscale(1) contrast(1.15)" },
  { id: "cool", name: "Cool", filter: "hue-rotate(170deg) saturate(1.15) brightness(1.05)" },
  { id: "warm", name: "Warm", filter: "sepia(0.35) saturate(1.25) brightness(1.02)" },
  { id: "chrome", name: "Chrome", filter: "contrast(1.4) brightness(1.05) saturate(1.2)" },
  { id: "film", name: "Film", filter: "contrast(0.92) brightness(1.08) sepia(0.18)" },
  { id: "sepia", name: "Sepia", filter: "sepia(0.85) contrast(1.05)" },
  { id: "vivid", name: "Vivid", filter: "saturate(1.75) contrast(1.1)" },
];

const COLORS = [
  "#ffffff",
  "#000000",
  "#ea4335",
  "#ff9800",
  "#fbbc04",
  "#00a884",
  "#25d366",
  "#007bfc",
  "#a855f7",
  "#ec4899",
];

const QUICK_EMOJIS = [
  "😀", "😂", "😍", "😎", "🥳", "🔥", "❤️", "👍",
  "💯", "🙈", "🍕", "🎉", "🚀", "🐶", "⭐", "💡",
  "👏", "🙌", "✨", "🙏", "🤩", "💪", "🎂", "🎈"
];

const QUICK_STICKERS = [
  { id: "s1", label: "Heart", emoji: "💖" },
  { id: "s2", label: "Fire", emoji: "🔥" },
  { id: "s3", label: "100", emoji: "💯" },
  { id: "s4", label: "Party", emoji: "🎉" },
  { id: "s5", label: "Star", emoji: "⭐" },
  { id: "s6", label: "Crown", emoji: "👑" },
  { id: "s7", label: "Rocket", emoji: "🚀" },
  { id: "s8", label: "Thumbs Up", emoji: "👍" },
  { id: "s9", label: "Sparkles", emoji: "✨" },
  { id: "s10", label: "Cool", emoji: "🕶️" },
  { id: "s11", label: "Rainbow", emoji: "🌈" },
  { id: "s12", label: "Target", emoji: "🎯" },
];

const FileViewerModal = ({
  isOpen,
  onClose,
  file,
  items = [],
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [activeFilter, setActiveFilter] = useState("normal");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [isHd, setIsHd] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [penColor, setPenColor] = useState("#00a884");
  const [penSize, setPenSize] = useState(6);
  const [strokes, setStrokes] = useState([]);
  const [selectedShape, setSelectedShape] = useState("rect");
  const [shapeColor, setShapeColor] = useState("#00a884");
  const [shapes, setShapes] = useState([]);
  const [blurs, setBlurs] = useState([]);
  const [blurStyle, setBlurStyle] = useState("mosaic");
  const [blurMode, setBlurMode] = useState("box");
  const [blurStrength, setBlurStrength] = useState(14);
  const [textOverlays, setTextOverlays] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState("md");
  const [textHasBg, setTextHasBg] = useState(true);
  const [emojiOverlays, setEmojiOverlays] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef([]);
  const currentDragRef = useRef(null);

  const mediaList = useMemo(() => {
    if (Array.isArray(items) && items.length > 0) return items;
    if (file) {
      if (Array.isArray(file.items) && file.items.length > 0) return file.items;
      return [file];
    }
    return [];
  }, [items, file]);

  useEffect(() => {
    if (file && mediaList.length > 0) {
      const targetUrl = file.url || file.imageOrVideoUrl || file.docUrl;
      const foundIdx = mediaList.findIndex((m) => {
        const u = m.url || m.imageOrVideoUrl || m.docUrl;
        return (
          (u && targetUrl && u === targetUrl) ||
          (m._id && file._id && String(m._id) === String(file._id)) ||
          (m.messageId && file.messageId && String(m.messageId) === String(file.messageId))
        );
      });
      if (foundIdx !== -1) {
        setCurrentIndex(foundIdx);
        return;
      }
    }
    if (typeof initialIndex === "number") {
      setCurrentIndex(initialIndex);
    }
  }, [file, initialIndex, mediaList]);

  const resetEdits = useCallback(() => {
    setZoomLevel(1);
    setActiveTool(null);
    setActiveFilter("normal");
    setRotation(0);
    setFlipH(false);
    setStrokes([]);
    setShapes([]);
    setBlurs([]);
    setBlurStyle("mosaic");
    setBlurMode("box");
    setBlurStrength(14);
    setTextOverlays([]);
    setEmojiOverlays([]);
    setUndoStack([]);
    setRedoStack([]);
    setIsComparing(false);
  }, []);

  useEffect(() => {
    resetEdits();
  }, [currentIndex, resetEdits]);

  const currentItem = mediaList[currentIndex] || mediaList[0] || file;
  const currentUrl =
    currentItem?.url ||
    currentItem?.imageOrVideoUrl ||
    currentItem?.docUrl ||
    currentItem?.fileUrl ||
    "";
  const currentName =
    currentItem?.name ||
    currentItem?.fileName ||
    currentItem?.docName ||
    "Media";

  const isVideo =
    currentItem?.type === "video" ||
    currentItem?.type === "video/mp4" ||
    currentItem?.mediaType === "video" ||
    /\.(mp4|webm|mov|mkv)($|\?)/i.test(currentUrl);

  const isPdf =
    currentItem?.type === "pdf" ||
    currentItem?.type === "application/pdf" ||
    currentName.toLowerCase().endsWith(".pdf") ||
    currentUrl.toLowerCase().includes(".pdf");

  const pushAction = useCallback((action) => {
    setUndoStack((prev) => [...prev, action]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, lastAction]);

    switch (lastAction.type) {
      case "stroke":
        setStrokes((prev) => prev.slice(0, -1));
        break;
      case "shape":
        setShapes((prev) => prev.filter((s) => s.id !== lastAction.data.id));
        break;
      case "blur":
        setBlurs((prev) => prev.filter((b) => b.id !== lastAction.data.id));
        break;
      case "text":
        setTextOverlays((prev) => prev.filter((t) => t.id !== lastAction.data.id));
        break;
      case "emoji":
        setEmojiOverlays((prev) => prev.filter((e) => e.id !== lastAction.data.id));
        break;
      case "filter":
        setActiveFilter(lastAction.prev);
        break;
      case "rotate":
        setRotation(lastAction.prev);
        break;
      case "flip":
        setFlipH(lastAction.prev);
        break;
      default:
        break;
    }
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextAction = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, nextAction]);

    switch (nextAction.type) {
      case "stroke":
        setStrokes((prev) => [...prev, nextAction.data]);
        break;
      case "shape":
        setShapes((prev) => [...prev, nextAction.data]);
        break;
      case "blur":
        setBlurs((prev) => [...prev, nextAction.data]);
        break;
      case "text":
        setTextOverlays((prev) => [...prev, nextAction.data]);
        break;
      case "emoji":
        setEmojiOverlays((prev) => [...prev, nextAction.data]);
        break;
      case "filter":
        setActiveFilter(nextAction.next);
        break;
      case "rotate":
        setRotation(nextAction.next);
        break;
      case "flip":
        setFlipH(nextAction.next);
        break;
      default:
        break;
    }
  }, [redoStack]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (activeTool) {
          setActiveTool(null);
        } else {
          onClose?.();
        }
      } else if (e.key === "ArrowLeft") {
        if (mediaList.length > 1) {
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
        }
      } else if (e.key === "ArrowRight") {
        if (mediaList.length > 1) {
          setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeTool, mediaList.length, handleUndo, handleRedo, onClose]);

  const renderBlurArea = useCallback(
    (ctx, img, blur, bx, by, bw, bh, totalW, totalH) => {
      if (bw <= 0 || bh <= 0) return;
      const natW = img?.naturalWidth || totalW;
      const natH = img?.naturalHeight || totalH;
      const normX = Math.max(0, Math.min(1, bx / totalW));
      const normY = Math.max(0, Math.min(1, by / totalH));
      const normW = Math.max(0, Math.min(1 - normX, bw / totalW));
      const normH = Math.max(0, Math.min(1 - normY, bh / totalH));
      const srcX = normX * natW;
      const srcY = normY * natH;
      const srcW = normW * natW;
      const srcH = normH * natH;

      const style = blur.style || "mosaic";

      if (style === "smooth") {
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx, by, bw, bh);
        ctx.clip();
        let drawn = false;
        if (img && img.complete && srcW > 1 && srcH > 1) {
          try {
            ctx.filter = `blur(${Math.max(8, blur.strength || 14)}px)`;
            ctx.drawImage(img, srcX, srcY, srcW, srcH, bx - 6, by - 6, bw + 12, bh + 12);
            drawn = true;
          } catch (e) {
            console.log(e);
            drawn = false;
          }
        }
        if (!drawn) {
          ctx.fillStyle = "rgba(18, 28, 34, 0.9)";
          ctx.fillRect(bx, by, bw, bh);
        }
        ctx.restore();
      } else {
        const blockSize = Math.max(6, blur.strength || 14);
        const sampleW = Math.max(2, Math.round(bw / blockSize));
        const sampleH = Math.max(2, Math.round(bh / blockSize));

        let drawn = false;
        if (img && img.complete && srcW > 1 && srcH > 1) {
          try {
            const tinyCanvas = document.createElement("canvas");
            tinyCanvas.width = sampleW;
            tinyCanvas.height = sampleH;
            const tinyCtx = tinyCanvas.getContext("2d");
            tinyCtx.imageSmoothingEnabled = false;
            tinyCtx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, sampleW, sampleH);

            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tinyCanvas, 0, 0, sampleW, sampleH, bx, by, bw, bh);
            ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
            ctx.lineWidth = 1;
            const stepX = bw / sampleW;
            const stepY = bh / sampleH;
            for (let x = bx; x < bx + bw; x += stepX) {
              ctx.beginPath();
              ctx.moveTo(x, by);
              ctx.lineTo(x, by + bh);
              ctx.stroke();
            }
            for (let y = by; y < by + bh; y += stepY) {
              ctx.beginPath();
              ctx.moveTo(bx, y);
              ctx.lineTo(bx + bw, y);
              ctx.stroke();
            }
            ctx.restore();
            drawn = true;
          } catch (e) {
            console.log(e);
            drawn = false;
          }
        }

        if (!drawn) {
          ctx.save();
          ctx.fillStyle = "rgba(18, 28, 34, 0.9)";
          ctx.fillRect(bx, by, bw, bh);
          const step = Math.max(8, Math.round(bw / 10));
          ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
          ctx.lineWidth = 1;
          for (let x = bx; x < bx + bw; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, by);
            ctx.lineTo(x, by + bh);
            ctx.stroke();
          }
          for (let y = by; y < by + bh; y += step) {
            ctx.beginPath();
            ctx.moveTo(bx, y);
            ctx.lineTo(bx + bw, y);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
    },
    []
  );

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isComparing) return;

    const w = canvas.width;
    const h = canvas.height;

    blurs.forEach((blur) => {
      if (blur.mode === "brush" && blur.points && blur.points.length > 0) {
        const r = blur.radius || 18;
        blur.points.forEach((pt) => {
          const bx = Math.max(0, pt.x * w - r);
          const by = Math.max(0, pt.y * h - r);
          const bw = Math.min(w - bx, r * 2);
          const bh = Math.min(h - by, r * 2);
          renderBlurArea(ctx, img, blur, bx, by, bw, bh, w, h);
        });
      } else {
        const bx = blur.x * w;
        const by = blur.y * h;
        const bw = blur.w * w;
        const bh = blur.h * h;
        renderBlurArea(ctx, img, blur, bx, by, bw, bh, w, h);
      }
    });

    shapes.forEach((shape) => {
      const sx = shape.x * w;
      const sy = shape.y * h;
      const sw = shape.w * w;
      const sh = shape.h * h;
      ctx.save();
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.width || 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (shape.type === "rect") {
        ctx.strokeRect(sx, sy, sw, sh);
      } else if (shape.type === "circle") {
        ctx.beginPath();
        ctx.ellipse(
          sx + sw / 2,
          sy + sh / 2,
          Math.abs(sw / 2),
          Math.abs(sh / 2),
          0,
          0,
          2 * Math.PI
        );
        ctx.stroke();
      } else if (shape.type === "line") {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + sw, sy + sh);
        ctx.stroke();
      } else if (shape.type === "arrow") {
        const fromX = sx;
        const fromY = sy;
        const toX = sx + sw;
        const toY = sy + sh;
        const headlen = 16;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
          toX - headlen * Math.cos(angle - Math.PI / 6),
          toY - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          toX - headlen * Math.cos(angle + Math.PI / 6),
          toY - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = shape.color;
        ctx.fill();
      }
      ctx.restore();
    });

    strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * w, stroke.points[0].y * h);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * w, stroke.points[i].y * h);
      }
      ctx.stroke();
      ctx.restore();
    });
  }, [blurs, shapes, strokes, isComparing]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    const handleResize = () => redrawCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [redrawCanvas]);

  const getNormCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    };
  };

  const handlePointerDown = (e) => {
    if (!activeTool || ["crop", "filter"].includes(activeTool)) return;
    const coords = getNormCoords(e);
    isDrawingRef.current = true;

    if (activeTool === "pen") {
      currentPathRef.current = [coords];
    } else if (activeTool === "blur") {
      currentDragRef.current = {
        id: `blur_${Date.now()}`,
        startX: coords.x,
        startY: coords.y,
        x: coords.x,
        y: coords.y,
        w: 0.01,
        h: 0.01,
      };
    } else if (activeTool === "shape") {
      currentDragRef.current = {
        id: `shape_${Date.now()}`,
        type: selectedShape,
        color: shapeColor,
        width: 3,
        startX: coords.x,
        startY: coords.y,
        x: coords.x,
        y: coords.y,
        w: 0.01,
        h: 0.01,
      };
    }
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current) return;
    const coords = getNormCoords(e);
    if (activeTool === "pen") {
      currentPathRef.current.push(coords);
      const canvas = canvasRef.current;
      if (canvas && currentPathRef.current.length > 1) {
        const ctx = canvas.getContext("2d");
        const w = canvas.width;
        const h = canvas.height;
        const pts = currentPathRef.current;
        const p1 = pts[pts.length - 2];
        const p2 = pts[pts.length - 1];

        ctx.save();
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
        ctx.restore();
      }
    } else if (activeTool === "blur" && currentDragRef.current) {
      if (currentDragRef.current.mode === "box") {
        const d = currentDragRef.current;
        const x = Math.min(d.startX, coords.x);
        const y = Math.min(d.startY, coords.y);
        const w = Math.abs(coords.x - d.startX);
        const h = Math.abs(coords.y - d.startY);
        currentDragRef.current = { ...d, x, y, w, h };
        redrawCanvas();
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          const img = imageRef.current;
          renderBlurArea(
            ctx,
            img,
            currentDragRef.current,
            x * canvas.width,
            y * canvas.height,
            w * canvas.width,
            h * canvas.height,
            canvas.width,
            canvas.height
          );
          ctx.save();
          ctx.strokeStyle = "#00a884";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(x * canvas.width, y * canvas.height, w * canvas.width, h * canvas.height);
          ctx.restore();
        }
      } else if (currentDragRef.current.mode === "brush") {
        currentPathRef.current.push(coords);
        currentDragRef.current.points.push(coords);
        redrawCanvas();
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          const img = imageRef.current;
          const r = currentDragRef.current.radius || 18;
          const bx = Math.max(0, coords.x * canvas.width - r);
          const by = Math.max(0, coords.y * canvas.height - r);
          const bw = Math.min(canvas.width - bx, r * 2);
          const bh = Math.min(canvas.height - by, r * 2);
          renderBlurArea(ctx, img, currentDragRef.current, bx, by, bw, bh, canvas.width, canvas.height);
        }
      }
    } else if (activeTool === "shape" && currentDragRef.current) {
      const d = currentDragRef.current;
      const x = Math.min(d.startX, coords.x);
      const y = Math.min(d.startY, coords.y);
      const w = coords.x - d.startX;
      const h = coords.y - d.startY;
      currentDragRef.current = { ...d, x, y, w, h };
      redrawCanvas();
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (activeTool === "pen") {
      if (currentPathRef.current.length > 1) {
        const newStroke = {
          color: penColor,
          size: penSize,
          points: [...currentPathRef.current],
        };
        setStrokes((prev) => [...prev, newStroke]);
        pushAction({ type: "stroke", data: newStroke });
      }
      currentPathRef.current = [];
    } else if (activeTool === "blur" && currentDragRef.current) {
      const item = { ...currentDragRef.current };
      currentDragRef.current = null;
      currentPathRef.current = [];

      if (item.mode === "box") {
        if (item.w <= 0.015 && item.h <= 0.015) {
          item.x = Math.max(0, Math.min(0.74, item.startX - 0.13));
          item.y = Math.max(0, Math.min(0.86, item.startY - 0.07));
          item.w = 0.26;
          item.h = 0.14;
        }
        setBlurs((prev) => [...prev, item]);
        pushAction({ type: "blur", data: item });
        toast.success("Blur box applied! Drag to reposition.", { autoClose: 1500 });
      } else if (item.mode === "brush") {
        if (item.points && item.points.length > 1) {
          setBlurs((prev) => [...prev, item]);
          pushAction({ type: "blur", data: item });
        }
      }
      redrawCanvas();
    } else if (activeTool === "shape" && currentDragRef.current) {
      const item = { ...currentDragRef.current };
      currentDragRef.current = null;
      if (Math.abs(item.w) > 0.02 || Math.abs(item.h) > 0.02) {
        setShapes((prev) => [...prev, item]);
        pushAction({ type: "shape", data: item });
      }
      redrawCanvas();
    }
  };

  const handleAddText = () => {
    if (!textInput.trim()) return;
    const newText = {
      id: `text_${Date.now()}`,
      text: textInput.trim(),
      color: textColor,
      size: textSize,
      hasBg: textHasBg,
      x: 0.5,
      y: 0.5,
    };
    setTextOverlays((prev) => [...prev, newText]);
    pushAction({ type: "text", data: newText });
    setTextInput("");
  };

  const handleAddEmoji = (emoji) => {
    const newEmoji = {
      id: `emoji_${Date.now()}`,
      emoji,
      x: 0.5,
      y: 0.5,
      size: 40,
    };
    setEmojiOverlays((prev) => [...prev, newEmoji]);
    pushAction({ type: "emoji", data: newEmoji });
  };

  const handleStartDragOverlay = (type, id, startEvent) => {
    startEvent.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const onMove = (moveEvent) => {
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const newX = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
      const newY = Math.max(0.05, Math.min(0.95, (clientY - rect.top) / rect.height));

      if (type === "text") {
        setTextOverlays((prev) =>
          prev.map((t) => (t.id === id ? { ...t, x: newX, y: newY } : t))
        );
      } else if (type === "emoji") {
        setEmojiOverlays((prev) =>
          prev.map((em) => (em.id === id ? { ...em, x: newX, y: newY } : em))
        );
      }
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
  };
  const handleStartMoveBlur = (id, startEvent) => {
    startEvent.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const targetBlur = blurs.find((b) => b.id === id);
    if (!targetBlur) return;

    const initialX = targetBlur.x;
    const initialY = targetBlur.y;
    const startClientX = startEvent.touches ? startEvent.touches[0].clientX : startEvent.clientX;
    const startClientY = startEvent.touches ? startEvent.touches[0].clientY : startEvent.clientY;

    const onMove = (moveEvent) => {
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const deltaX = (clientX - startClientX) / rect.width;
      const deltaY = (clientY - startClientY) / rect.height;

      const newX = Math.max(0, Math.min(1 - targetBlur.w, initialX + deltaX));
      const newY = Math.max(0, Math.min(1 - targetBlur.h, initialY + deltaY));

      setBlurs((prev) =>
        prev.map((b) => (b.id === id ? { ...b, x: newX, y: newY } : b))
      );
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
  };

  const handleStartResizeBlur = (id, direction, startEvent) => {
    startEvent.stopPropagation();
    startEvent.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const targetBlur = blurs.find((b) => b.id === id);
    if (!targetBlur) return;

    const initialX = targetBlur.x;
    const initialY = targetBlur.y;
    const initialW = targetBlur.w;
    const initialH = targetBlur.h;
    const startClientX = startEvent.touches ? startEvent.touches[0].clientX : startEvent.clientX;
    const startClientY = startEvent.touches ? startEvent.touches[0].clientY : startEvent.clientY;
    const minSize = 0.03;

    const onMove = (moveEvent) => {
      const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const deltaX = (clientX - startClientX) / rect.width;
      const deltaY = (clientY - startClientY) / rect.height;
      let newX = initialX;
      let newY = initialY;
      let newW = initialW;
      let newH = initialH;

      if (direction.includes("e")) {
        newW = Math.max(minSize, Math.min(1 - initialX, initialW + deltaX));
      } else if (direction.includes("w")) {
        const proposedX = initialX + deltaX;
        const rightEdge = initialX + initialW;
        if (rightEdge - proposedX >= minSize) {
          newX = Math.max(0, proposedX);
          newW = rightEdge - newX;
        } else {
          newX = rightEdge - minSize;
          newW = minSize;
        }
      }

      if (direction.includes("s")) {
        newH = Math.max(minSize, Math.min(1 - initialY, initialH + deltaY));
      } else if (direction.includes("n")) {
        const proposedY = initialY + deltaY;
        const bottomEdge = initialY + initialH;
        if (bottomEdge - proposedY >= minSize) {
          newY = Math.max(0, proposedY);
          newH = bottomEdge - newY;
        } else {
          newY = bottomEdge - minSize;
          newH = minSize;
        }
      }

      setBlurs((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, x: newX, y: newY, w: newW, h: newH } : b
        )
      );
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
  };

  const toggleTool = (toolName) => {
    setActiveTool((prev) => (prev === toolName ? null : toolName));
  };
  const toggleHd = () => {
    setIsHd((prev) => {
      const next = !prev;
      toast.info(next ? "Quality: High Definition (HD)" : "Quality: Standard (SD)", { autoClose: 1500, });
      return next;
    });
  };

  const toggleCompare = () => {
    setIsComparing((prev) => {
      const next = !prev;
      toast.info(next ? "Viewing Original" : "Viewing Edited", { autoClose: 1200 });
      return next;
    });
  };

  const handleRotate90 = () => {
    const prevRot = rotation;
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    pushAction({ type: "rotate", prev: prevRot, next: nextRot });
  };

  const handleFlipH = () => {
    const prevFlip = flipH;
    setFlipH(!prevFlip);
    pushAction({ type: "flip", prev: prevFlip, next: !prevFlip });
  };

  const handleSelectFilter = (filterId) => {
    const prev = activeFilter;
    setActiveFilter(filterId);
    pushAction({ type: "filter", prev, next: filterId });
  };

  const handleDownload = async () => {
    if (!currentUrl) return;
    setDownloading(true);

    if (isVideo || isPdf) {
      try {
        const response = await fetch(currentUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = currentName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        toast.success("Download completed");
      } catch (err) {
        const link = document.createElement("a");
        link.href = currentUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.download = currentName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log(err);
      } finally {
        setDownloading(false);
      }
      return;
    }

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = currentUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const natW = img.naturalWidth || 1280;
      const natH = img.naturalHeight || 720;
      const exportCanvas = document.createElement("canvas");
      const isRotated90or270 = rotation % 180 !== 0;
      exportCanvas.width = isRotated90or270 ? natH : natW;
      exportCanvas.height = isRotated90or270 ? natW : natH;
      const ctx = exportCanvas.getContext("2d");

      ctx.save();
      ctx.translate(exportCanvas.width / 2, exportCanvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, 1);

      const activeFilterObj = FILTERS.find((f) => f.id === activeFilter);
      if (activeFilterObj && activeFilterObj.filter !== "none") {
        ctx.filter = activeFilterObj.filter;
      }

      ctx.drawImage(img, -natW / 2, -natH / 2, natW, natH);
      ctx.restore();

      const W = exportCanvas.width;
      const H = exportCanvas.height;

      blurs.forEach((blur) => {
        if (blur.mode === "brush" && blur.points && blur.points.length > 0) {
          const r = (blur.radius || 18) * (W / 600);
          blur.points.forEach((pt) => {
            const bx = Math.max(0, pt.x * W - r);
            const by = Math.max(0, pt.y * H - r);
            const bw = Math.min(W - bx, r * 2);
            const bh = Math.min(H - by, r * 2);
            renderBlurArea(ctx, img, blur, bx, by, bw, bh, W, H);
          });
        } else {
          const bx = blur.x * W;
          const by = blur.y * H;
          const bw = blur.w * W;
          const bh = blur.h * H;
          renderBlurArea(ctx, img, blur, bx, by, bw, bh, W, H);
        }
      });

      shapes.forEach((shape) => {
        const sx = shape.x * W;
        const sy = shape.y * H;
        const sw = shape.w * W;
        const sh = shape.h * H;
        ctx.save();
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = (shape.width || 3) * (W / 600);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (shape.type === "rect") {
          ctx.strokeRect(sx, sy, sw, sh);
        } else if (shape.type === "circle") {
          ctx.beginPath();
          ctx.ellipse(
            sx + sw / 2,
            sy + sh / 2,
            Math.abs(sw / 2),
            Math.abs(sh / 2),
            0,
            0,
            2 * Math.PI
          );
          ctx.stroke();
        } else if (shape.type === "line") {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + sw, sy + sh);
          ctx.stroke();
        } else if (shape.type === "arrow") {
          const fromX = sx;
          const fromY = sy;
          const toX = sx + sw;
          const toY = sy + sh;
          const headlen = 24 * (W / 600);
          const angle = Math.atan2(toY - fromY, toX - fromX);

          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(toX, toY);
          ctx.lineTo(
            toX - headlen * Math.cos(angle - Math.PI / 6),
            toY - headlen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            toX - headlen * Math.cos(angle + Math.PI / 6),
            toY - headlen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = shape.color;
          ctx.fill();
        }
        ctx.restore();
      });

      strokes.forEach((stroke) => {
        if (!stroke.points || stroke.points.length < 2) return;
        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * (W / 600);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * W, stroke.points[0].y * H);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x * W, stroke.points[i].y * H);
        }
        ctx.stroke();
        ctx.restore();
      });

      textOverlays.forEach((t) => {
        const tx = t.x * W;
        const ty = t.y * H;
        const fontSize = Math.round(
          (t.size === "sm" ? 18 : t.size === "lg" ? 38 : 26) * (W / 600)
        );
        ctx.save();
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (t.hasBg) {
          const textMetrics = ctx.measureText(t.text);
          const padX = fontSize * 0.4;
          const padY = fontSize * 0.3;
          ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
          ctx.beginPath();
          ctx.roundRect(
            tx - textMetrics.width / 2 - padX,
            ty - fontSize / 2 - padY,
            textMetrics.width + padX * 2,
            fontSize + padY * 2,
            8
          );
          ctx.fill();
        }

        ctx.fillStyle = t.color;
        ctx.fillText(t.text, tx, ty);
        ctx.restore();
      });

      emojiOverlays.forEach((em) => {
        const ex = em.x * W;
        const ey = em.y * H;
        const emojiSize = Math.round((em.size || 40) * (W / 600));
        ctx.save();
        ctx.font = `${emojiSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(em.emoji, ex, ey);
        ctx.restore();
      });

      const blob = await new Promise((resolve) =>
        exportCanvas.toBlob(resolve, "image/png", isHd ? 1.0 : 0.85)
      );
      if (blob) {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `WhatsApp_Image_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        toast.success("Image saved successfully");
      }
    } catch (err) {
      console.warn("Export failed, falling back to original URL:", err);
      const link = document.createElement("a");
      link.href = currentUrl;
      link.download = currentName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }
  };

  const activeFilterStyle = useMemo(() => {
    if (isComparing) return "none";
    const found = FILTERS.find((f) => f.id === activeFilter);
    return found ? found.filter : "none";
  }, [activeFilter, isComparing]);

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex flex-col bg-[#0b141a] text-[#d1d7db] select-none overflow-hidden">
        <div className="h-14 px-3 sm:px-6 flex items-center justify-between bg-[#111b21] border-b border-[#222e35] shrink-0 z-30 select-none">
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-2 rounded-full hover:bg-white/10 text-[#aebac1] hover:text-white transition-colors cursor-pointer"
          >
            <IoClose size={22} />
          </button>

          <div className="flex items-center gap-3 sm:gap-4 ml-3 sm:ml-8">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo (Ctrl+Z)"
              className={`p-2 rounded-full transition-colors ${undoStack.length > 0
                ? "hover:bg-white/10 text-[#aebac1] hover:text-white cursor-pointer"
                : "text-white/20 cursor-not-allowed"
                }`}
            >
              <LuUndo size={19} />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
              className={`p-2 rounded-full transition-colors ${redoStack.length > 0
                ? "hover:bg-white/10 text-[#aebac1] hover:text-white cursor-pointer"
                : "text-white/20 cursor-not-allowed"
                }`}
            >
              <LuRedo size={19} />
            </button>
          </div>

          <div className="flex-1" />
          <div className="flex items-center gap-1 sm:gap-2.5 text-[#aebac1]">
            {!isVideo && !isPdf && (
              <>
                <button
                  type="button"
                  onClick={() => toggleTool("crop")}
                  title="Crop & Rotate"
                  className={`p-2 rounded-full transition-colors cursor-pointer ${activeTool === "crop"
                    ? "bg-[#00a884]/20 text-[#00a884]"
                    : "hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <MdCropRotate size={21} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleTool("filter")}
                  title="Filter & Effects"
                  className={`p-2 rounded-full transition-colors cursor-pointer ${activeTool === "filter"
                    ? "bg-[#00a884]/20 text-[#00a884]"
                    : "hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <LuWand size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleTool("pen")}
                  title="Drawing / Pen"
                  className={`p-2 rounded-full transition-colors cursor-pointer ${activeTool === "pen"
                    ? "bg-[#00a884]/20 text-[#00a884]"
                    : "hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <LuPencil size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleTool("text")}
                  title="Add Text (Aa)"
                  className={`w-9 h-9 rounded-full transition-colors cursor-pointer flex items-center justify-center ${activeTool === "text"
                    ? "bg-[#00a884]/20 text-[#00a884]"
                    : "hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <span className="font-semibold text-[15px] leading-none tracking-tight">
                    Aa
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleTool("shape")}
                  title="Add Shape"
                  className={`p-2 rounded-full transition-colors cursor-pointer ${activeTool === "shape"
                    ? "bg-[#00a884]/20 text-[#00a884]"
                    : "hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <LuSquare size={19} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleTool("blur")}
                  title="Blur / Mosaic"
                  className={`p-2 rounded-full transition-colors cursor-pointer ${activeTool === "blur"
                    ? "bg-[#00a884]/20 text-[#00a884]"
                    : "hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <TbGridDots size={21} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleTool("emoji")}
                  title="Add Emoji"
                  className={`p-2 rounded-full transition-colors cursor-pointer ${activeTool === "emoji"
                    ? "bg-[#00a884]/20 text-[#00a884]"
                    : "hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <BsEmojiSmile size={19} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleTool("sticker")}
                  title="Add Sticker"
                  className={`p-2 rounded-full transition-colors cursor-pointer ${activeTool === "sticker"
                    ? "bg-[#00a884]/20 text-[#00a884]"
                    : "hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <TbSticker size={21} />
                </button>

                <button
                  type="button"
                  onClick={toggleHd}
                  title={isHd ? "Quality: HD (High Definition)" : "Quality: Standard (SD)"}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center ${isHd ? "text-[#00a884]" : "hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <div className="relative flex items-center justify-center">
                    <span
                      className={`border ${isHd ? "border-[#00a884] text-[#00a884]" : "border-current"
                        } rounded-[4px] px-1 py-0.5 text-[10px] font-bold tracking-tight leading-none`}
                    >
                      HD
                    </span>
                    <span className="absolute -bottom-1 -right-1 text-[7px] leading-none opacity-80">
                      ⚙
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={toggleCompare}
                  title={
                    isComparing
                      ? "Viewing original (click to show edits)"
                      : "Compare with original"
                  }
                  className={`p-2 rounded-full transition-colors cursor-pointer ${isComparing
                    ? "bg-amber-500/20 text-amber-400"
                    : "hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <LuCopy size={19} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              title="Download image"
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer disabled:opacity-50 ml-1"
            >
              <LuDownload size={20} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {activeTool && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="bg-[#1f2c34] border-b border-[#313d45] px-4 py-2.5 z-20 flex items-center justify-between gap-3 text-xs overflow-x-auto no-scrollbar shadow-lg"
            >
              {activeTool === "crop" && (
                <div className="flex items-center gap-3 w-full justify-center">
                  <button
                    type="button"
                    onClick={handleRotate90}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#d1d7db] hover:text-white transition-colors cursor-pointer"
                  >
                    <LuRotateCw size={15} />
                    <span>Rotate 90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFlipH}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#d1d7db] hover:text-white transition-colors cursor-pointer"
                  >
                    <LuFlipHorizontal size={15} />
                    <span>Flip Horizontal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRotation(0);
                      setFlipH(false);
                      toast.info("Crop & Rotation reset");
                    }}
                    className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              )}

              {activeTool === "filter" && (
                <div className="flex items-center gap-2 overflow-x-auto py-0.5 mx-auto no-scrollbar">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSelectFilter(f.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${activeFilter === f.id
                        ? "bg-[#00a884] text-white border-[#00a884] shadow-sm"
                        : "bg-white/5 border-white/10 hover:border-white/20 text-[#aebac1]"
                        }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}

              {activeTool === "pen" && (
                <div className="flex items-center justify-between w-full max-w-xl mx-auto gap-3">
                  <div className="flex items-center gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPenColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border border-black/20 cursor-pointer transition-transform ${penColor === c
                          ? "scale-125 ring-2 ring-[#00a884] shadow-md"
                          : "hover:scale-110"
                          }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                    {[3, 6, 12, 20].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setPenSize(sz)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors ${penSize === sz ? "bg-white/20 text-white" : "hover:bg-white/10 text-gray-400"
                          }`}
                        title={`Size ${sz}px`}
                      >
                        <div className="rounded-full bg-current" style={{ width: Math.min(16, sz), height: Math.min(16, sz) }}
                        />
                      </button>
                    ))}
                  </div>
                  {strokes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setStrokes([]);
                        toast.info("Drawings cleared");
                      }}
                      className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-white/5 cursor-pointer ml-auto"
                      title="Clear drawings"
                    >
                      <LuTrash2 size={16} />
                    </button>
                  )}
                </div>
              )}

              {activeTool === "text" && (
                <div className="flex items-center gap-2.5 w-full max-w-xl mx-auto">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddText();
                    }}
                    placeholder="Type text to place on image..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#00a884] text-xs"
                  />
                  <div className="flex items-center gap-1">
                    {COLORS.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTextColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full cursor-pointer ${textColor === c ? "ring-2 ring-[#00a884] scale-110" : ""
                          }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setTextHasBg((p) => !p)}
                    className={`px-2 py-1 rounded text-xs cursor-pointer ${textHasBg ? "bg-[#00a884] text-white" : "bg-white/10 text-gray-400"
                      }`}
                    title="Toggle background tag"
                  >
                    Bg
                  </button>
                  <button
                    type="button"
                    onClick={handleAddText}
                    className="px-3 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#02906f] text-white font-medium cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}
              {activeTool === "shape" && (
                <div className="flex items-center justify-between w-full max-w-lg mx-auto gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedShape("rect")}
                      className={`p-1.5 rounded-lg cursor-pointer ${selectedShape === "rect"
                        ? "bg-[#00a884] text-white"
                        : "hover:bg-white/10 text-gray-400"
                        }`}
                      title="Rectangle"
                    >
                      <LuSquare size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedShape("circle")}
                      className={`p-1.5 rounded-lg cursor-pointer ${selectedShape === "circle"
                        ? "bg-[#00a884] text-white"
                        : "hover:bg-white/10 text-gray-400"
                        }`}
                      title="Circle"
                    >
                      <LuCircle size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedShape("arrow")}
                      className={`p-1.5 rounded-lg cursor-pointer ${selectedShape === "arrow"
                        ? "bg-[#00a884] text-white"
                        : "hover:bg-white/10 text-gray-400"
                        }`}
                      title="Arrow"
                    >
                      <LuMoveUpRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedShape("line")}
                      className={`p-1.5 rounded-lg cursor-pointer ${selectedShape === "line"
                        ? "bg-[#00a884] text-white"
                        : "hover:bg-white/10 text-gray-400"
                        }`}
                      title="Line"
                    >
                      <LuMinus size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {COLORS.slice(0, 7).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setShapeColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full cursor-pointer ${shapeColor === c ? "ring-2 ring-[#00a884] scale-110" : ""
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-400 hidden sm:inline">
                    Drag on image to draw
                  </span>
                </div>
              )}

              {activeTool === "blur" && (
                <div className="flex items-center justify-between w-full max-w-2xl mx-auto gap-2.5 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      const newBlur = {
                        id: `blur_${Date.now()}`,
                        mode: "box",
                        style: blurStyle,
                        strength: blurStrength,
                        x: 0.35,
                        y: 0.35,
                        w: 0.3,
                        h: 0.16,
                      };
                      setBlurs((prev) => [...prev, newBlur]);
                      pushAction({ type: "blur", data: newBlur });
                      toast.success("Blur box added! Drag to move it.", { autoClose: 1800 });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#02906f] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                  >
                    <span>+ Add Blur Box</span>
                  </button>

                  <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setBlurStyle("mosaic");
                        setBlurs((prev) => prev.map((b) => ({ ...b, style: "mosaic" })));
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${blurStyle === "mosaic"
                        ? "bg-[#00a884] text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                        }`}
                    >
                      ▦ Pixelate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBlurStyle("smooth");
                        setBlurs((prev) => prev.map((b) => ({ ...b, style: "smooth" })));
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${blurStyle === "smooth"
                        ? "bg-[#00a884] text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                        }`}
                    >
                      💧 Smooth
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-black/30 p-1 rounded-lg border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setBlurMode("box")}
                      className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${blurMode === "box"
                        ? "bg-[#00a884] text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                        }`}
                    >
                      ▢ Box
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlurMode("brush")}
                      className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${blurMode === "brush"
                        ? "bg-[#00a884] text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                        }`}
                    >
                      ✏️ Brush
                    </button>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-gray-400 mr-1">Intensity:</span>
                    {[
                      { label: "Low", size: 8 },
                      { label: "Med", size: 14 },
                      { label: "High", size: 24 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setBlurStrength(item.size)}
                        className={`px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${blurStrength === item.size
                          ? "bg-white/20 text-white font-semibold"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                          }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {blurs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setBlurs([]);
                        toast.info("Blur masks cleared");
                      }}
                      className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer text-xs flex items-center gap-1 shrink-0 ml-auto"
                    >
                      <LuTrash2 size={13} />
                      <span>Clear ({blurs.length})</span>
                    </button>
                  )}
                </div>
              )}
              {activeTool === "emoji" && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 mx-auto no-scrollbar">
                  {QUICK_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => handleAddEmoji(em)}
                      className="w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-white/10 hover:scale-125 transition-transform cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
              {activeTool === "sticker" && (
                <div className="flex items-center gap-2 overflow-x-auto py-0.5 mx-auto no-scrollbar">
                  {QUICK_STICKERS.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleAddEmoji(st.emoji)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-white transition-colors cursor-pointer text-xs"
                    >
                      <span className="text-base">{st.emoji}</span>
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-6 overflow-hidden select-none">
          {mediaList.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((prev) =>
                  prev > 0 ? prev - 1 : mediaList.length - 1
                )
              }
              title="Previous media"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white flex items-center justify-center transition-all backdrop-blur-xs cursor-pointer shadow-xl"
            >
              <IoChevronBack size={24} />
            </button>
          )}
          {mediaList.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((prev) =>
                  prev < mediaList.length - 1 ? prev + 1 : 0
                )
              }
              title="Next media"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white flex items-center justify-center transition-all backdrop-blur-xs cursor-pointer shadow-xl"
            >
              <IoChevronForward size={24} />
            </button>
          )}
          <div className="w-full h-full max-w-[88vw] max-h-[76vh] flex items-center justify-center overflow-hidden">
            {isVideo ? (
              <video
                key={currentUrl}
                src={currentUrl}
                controls
                autoPlay
                className="max-h-[76vh] max-w-[88vw] object-contain rounded-lg shadow-2xl"
              />
            ) : isPdf ? (
              <iframe
                key={currentUrl}
                src={currentUrl}
                title={currentName}
                className="w-full h-full max-h-[76vh] max-w-[88vw] rounded-lg shadow-2xl border-none bg-white"
              />
            ) : (
              <div
                ref={containerRef}
                className="relative max-h-[76vh] max-w-[88vw] flex items-center justify-center select-none"
                style={{
                  transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                  transition: "transform 0.15s ease",
                }}
              >
                <img
                  ref={imageRef}
                  src={currentUrl}
                  alt={currentName}
                  crossOrigin="anonymous"
                  onLoad={redrawCanvas}
                  style={{
                    filter: activeFilterStyle,
                    transform: `scale(${zoomLevel})`,
                  }}
                  className={`max-h-[76vh] max-w-[88vw] object-contain rounded-lg shadow-2xl select-none pointer-events-none transition-transform duration-150 ${zoomLevel > 1 ? "cursor-zoom-out" : ""
                    }`}
                />
                <canvas
                  ref={canvasRef}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                  className={`absolute inset-0 w-full h-full rounded-lg ${activeTool === "pen"
                    ? "cursor-crosshair pointer-events-auto"
                    : activeTool === "blur"
                      ? "cursor-cell pointer-events-auto"
                      : activeTool === "shape"
                        ? "cursor-crosshair pointer-events-auto"
                        : "pointer-events-none"
                    }`}
                />
                {!isComparing &&
                  textOverlays.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        position: "absolute",
                        left: `${t.x * 100}%`,
                        top: `${t.y * 100}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onMouseDown={(e) => handleStartDragOverlay("text", t.id, e)}
                      onTouchStart={(e) => handleStartDragOverlay("text", t.id, e)}
                      className="group cursor-grab active:cursor-grabbing select-none z-20"
                    >
                      <div
                        className={`px-3 py-1 rounded-lg font-bold shadow-lg flex items-center gap-1.5 ${t.hasBg ? "bg-black/65 backdrop-blur-xs" : ""
                          } ${t.size === "sm"
                            ? "text-xs"
                            : t.size === "lg"
                              ? "text-xl sm:text-2xl"
                              : "text-sm sm:text-base"
                          }`}
                        style={{ color: t.color }}
                      >
                        <span>{t.text}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTextOverlays((prev) =>
                              prev.filter((item) => item.id !== t.id)
                            );
                          }}
                          className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-1"
                          title="Delete text"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                {!isComparing &&
                  emojiOverlays.map((em) => (
                    <div
                      key={em.id}
                      style={{
                        position: "absolute",
                        left: `${em.x * 100}%`,
                        top: `${em.y * 100}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onMouseDown={(e) => handleStartDragOverlay("emoji", em.id, e)}
                      onTouchStart={(e) => handleStartDragOverlay("emoji", em.id, e)}
                      className="group cursor-grab active:cursor-grabbing select-none z-20"
                    >
                      <div className="relative text-3xl sm:text-4xl drop-shadow-lg">
                        <span>{em.emoji}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmojiOverlays((prev) =>
                              prev.filter((item) => item.id !== em.id)
                            );
                          }}
                          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                {!isComparing &&
                  blurs.map((b) => {
                    if (b.mode === "brush") return null;
                    return (
                      <div
                        key={b.id}
                        style={{
                          position: "absolute",
                          left: `${b.x * 100}%`,
                          top: `${b.y * 100}%`,
                          width: `${b.w * 100}%`,
                          height: `${b.h * 100}%`,
                          backdropFilter: b.style === "smooth" ? "blur(22px)" : "blur(12px)",
                          WebkitBackdropFilter: b.style === "smooth" ? "blur(22px)" : "blur(12px)",
                          backgroundColor: "rgba(18, 28, 34, 0.42)",
                          backgroundImage:
                            b.style === "mosaic"
                              ? "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 10px)"
                              : "none",
                          backgroundSize: "10px 10px",
                        }}
                        onMouseDown={(e) => {
                          if (activeTool === "blur") {
                            handleStartMoveBlur(b.id, e);
                          }
                        }}
                        onTouchStart={(e) => {
                          if (activeTool === "blur") {
                            handleStartMoveBlur(b.id, e);
                          }
                        }}
                        className={`rounded select-none z-20 transition-all ${activeTool === "blur"
                          ? "shadow-xl cursor-move pointer-events-auto group"
                          : "border border-transparent pointer-events-none"
                          }`}
                      >
                        {activeTool === "blur" && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBlurs((prev) => prev.filter((item) => item.id !== b.id));
                                toast.info("Blur box removed");
                              }}
                              className="absolute -top-3.5 -right-3.5 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs shadow-md cursor-pointer transition-transform hover:scale-110 z-30"
                              title="Delete blur box"
                            >
                              ✕
                            </button>
                            <div
                              onMouseDown={(e) => handleStartResizeBlur(b.id, "w", e)}
                              onTouchStart={(e) => handleStartResizeBlur(b.id, "w", e)}
                              className="absolute top-0 bottom-0 -left-2 w-4 cursor-ew-resize z-30"
                              title="Resize width"
                            />
                            <div
                              onMouseDown={(e) => handleStartResizeBlur(b.id, "e", e)}
                              onTouchStart={(e) => handleStartResizeBlur(b.id, "e", e)}
                              className="absolute top-0 bottom-0 -right-2 w-4 cursor-ew-resize z-30"
                              title="Resize width"
                            />
                            <div
                              onMouseDown={(e) => handleStartResizeBlur(b.id, "n", e)}
                              onTouchStart={(e) => handleStartResizeBlur(b.id, "n", e)}
                              className="absolute -top-2 left-0 right-0 h-4 cursor-ns-resize z-30"
                              title="Resize height"
                            />
                            <div
                              onMouseDown={(e) => handleStartResizeBlur(b.id, "s", e)}
                              onTouchStart={(e) => handleStartResizeBlur(b.id, "s", e)}
                              className="absolute -bottom-2 left-0 right-0 h-4 cursor-ns-resize z-30"
                              title="Resize height"
                            />
                            <div
                              onMouseDown={(e) => handleStartResizeBlur(b.id, "nw", e)}
                              onTouchStart={(e) => handleStartResizeBlur(b.id, "nw", e)}
                              className="absolute -top-2 -left-2 w-5 h-5 cursor-nwse-resize z-40"
                              title="Resize NW"
                            />
                            <div
                              onMouseDown={(e) => handleStartResizeBlur(b.id, "ne", e)}
                              onTouchStart={(e) => handleStartResizeBlur(b.id, "ne", e)}
                              className="absolute -top-2 -right-2 w-5 h-5 cursor-nesw-resize z-40"
                              title="Resize NE"
                            />
                            <div
                              onMouseDown={(e) => handleStartResizeBlur(b.id, "sw", e)}
                              onTouchStart={(e) => handleStartResizeBlur(b.id, "sw", e)}
                              className="absolute -bottom-2 -left-2 w-5 h-5 cursor-nesw-resize z-40"
                              title="Resize SW"
                            />
                            <div
                              onMouseDown={(e) => handleStartResizeBlur(b.id, "se", e)}
                              onTouchStart={(e) => handleStartResizeBlur(b.id, "se", e)}
                              className="absolute -bottom-2 -right-2 w-5 h-5 cursor-nwse-resize z-40"
                              title="Resize SE"
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {mediaList.length > 1 && (
          <div className="h-[70px] bg-[#111b21]/90 backdrop-blur-sm border-t border-[#222e35] px-4 flex items-center justify-center shrink-0 z-20">
            <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full no-scrollbar">
              {mediaList.map((item, idx) => {
                const thumbUrl =
                  item.url ||
                  item.imageOrVideoUrl ||
                  item.docUrl ||
                  item.fileUrl;
                const isActive = idx === currentIndex;
                const isItemVideo =
                  item.type === "video" ||
                  item.mediaType === "video" ||
                  /\.(mp4|webm)($|\?)/i.test(thumbUrl || "");

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative w-12 h-12 rounded-sm overflow-hidden shrink-0 transition-all cursor-pointer ${isActive
                      ? "border-[2.5px] border-[#00a884] ring-1 ring-[#00a884]/40 scale-105 z-10 opacity-100"
                      : "opacity-60 hover:opacity-100 border border-white/10"
                      }`}
                  >
                    {isItemVideo ? (
                      <video
                        src={thumbUrl}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <img
                        src={thumbUrl}
                        alt=""
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );

  if (!isOpen || mediaList.length === 0) return null;

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default FileViewerModal;
