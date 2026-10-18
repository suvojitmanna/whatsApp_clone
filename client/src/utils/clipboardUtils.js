export async function copyImageToClipboard(imageUrl) {
  if (!imageUrl) throw new Error("No image URL provided");

  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    throw new Error("Clipboard writing is not supported in this browser");
  }
  let rawBlob = null;
  try {
    const res = await fetch(imageUrl, { mode: "cors" });
    if (res.ok) {
      rawBlob = await res.blob();
    }
  } catch (e) {
    console.log(e);
  }

  let pngBlob = null;

  if (rawBlob && rawBlob.type === "image/png") {
    pngBlob = rawBlob;
  } else if (rawBlob && typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(rawBlob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0);
      pngBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
    } catch (err) {
      console.warn(
        "createImageBitmap failed, falling back to Image element:",
        err,
      );
    }
  }

  if (!pngBlob) {
    pngBlob = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const srcToUse = rawBlob ? URL.createObjectURL(rawBlob) : imageUrl;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          if (rawBlob) URL.revokeObjectURL(srcToUse);
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error("Canvas conversion to PNG failed"));
          }, "image/png");
        } catch (e) {
          if (rawBlob) URL.revokeObjectURL(srcToUse);
          reject(e);
        }
      };
      img.onerror = (e) => {
        if (rawBlob) URL.revokeObjectURL(srcToUse);
        reject(e);
      };
      img.src = srcToUse;
    });
  }

  if (!pngBlob) {
    throw new Error("Could not process image as PNG");
  }

  const itemToCopy = new ClipboardItem({
    "image/png": pngBlob,
  });

  await navigator.clipboard.write([itemToCopy]);
}
