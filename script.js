let orig = document.getElementsByTagName("canvas").item(0);
let histOrig = document.getElementsByTagName("canvas").item(1);
let bright = document.getElementsByTagName("canvas").item(2);
let histBright = document.getElementsByTagName("canvas").item(3);
let satur = document.getElementsByTagName("canvas").item(4);
let histSatur = document.getElementsByTagName("canvas").item(5);
let cont = document.getElementsByTagName("canvas").item(6);
let histCont = document.getElementsByTagName("canvas").item(7);
let brightSlider = document.getElementById("brightness");
let saturationSlider = document.getElementById("saturation");
let contrastSlider = document.getElementById("contrast");
let upload = document.getElementById("upload");

let imageGlobal = new Image();

function downloadImage(canvasType) {
  let canvas;
  switch (canvasType) {
    case "brightness":
      canvas = bright;
      break;
    case "saturation":
      canvas = satur;
      break;
    case "contrast":
      canvas = cont;
      break;
    default:
      canvas = orig;
      break;
  }
  let link = document.createElement("a");
  link.download = "image.png";
  link.href = canvas.toDataURL();
  link.click();
}

window.onload = async () => {
  let canvases = document.getElementsByTagName("canvas");
  for (let i = 0; i < canvases.length; i++) {
    let canvas = canvases.item(i);
    let bounds = canvas.getBoundingClientRect();
    canvas.width = bounds.width;
    canvas.height = bounds.height;
  }

  await uploadImage("./pic.jpeg");
};

brightSlider.oninput = () => {
  calculate(orig, bright, histBright, brightSlider.value / 100, "brightness");
};

saturationSlider.oninput = () => {
  calculate(orig, satur, histSatur, saturationSlider.value / 100, "saturation");
};

contrastSlider.oninput = () => {
  calculate(orig, cont, histCont, contrastSlider.value, "contrast");
};

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(file);
  });
}

async function calculate(origCanvas, canvas, histCanvas, value, type) {
  let ctx = canvas.getContext("2d");
  let ctxOrig = origCanvas.getContext("2d");
  let imageData = ctxOrig.getImageData(
    0,
    0,
    origCanvas.width,
    origCanvas.height
  );
  let data = imageData.data;

  let contrast = value * (255 / 100);
  var factor = (255 + contrast) / (255.01 - contrast);

  for (let i = 0; i < data.length; i += 4) {
    if (type === "contrast") {
      data[i] = factor * (data[i] - 128) + 128;
      data[i + 1] = factor * (data[i + 1] - 128) + 128;
      data[i + 2] = factor * (data[i + 2] - 128) + 128;
      continue;
    }

    let rgb = {
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    };

    let hsv = RGBtoHSV(rgb);
    if (type === "brightness") hsv.v *= value;
    if (type === "saturation") hsv.s *= value;

    rgb = HSVtoRGB(hsv);
    data[i] = rgb.r;
    data[i + 1] = rgb.g;
    data[i + 2] = rgb.b;
  }

  ctx.putImageData(imageData, 0, 0);
  processImage(
    ctx.getImageData(0, 0, canvas.width, canvas.height).data,
    histCanvas
  );
}

async function uploadImage(image) {
  let img = new Image();
  if (image instanceof File) {
    const url = await readAsDataURL(image);
    img.src = url;
  } else img.src = image;
  await img.decode();

  imageGlobal.src = img.src;

  loadImage(img, orig, histOrig);
  calculate(orig, bright, histBright, brightSlider.value / 100, "brightness");
  calculate(orig, satur, histSatur, saturationSlider.value / 100, "saturation");
  calculate(orig, cont, histCont, contrastSlider.value, "contrast");
}

function loadImage(img, canvas, histCanvas) {
  let ctx = canvas.getContext("2d");
  drawImageProp(ctx, img, 0, 0, canvas.width, canvas.height);
  processImage(
    ctx.getImageData(0, 0, canvas.width, canvas.height).data,
    histCanvas
  );
}

function processImage(data, histCanvas) {
  let histR = new Array(256).fill(0);
  let histG = new Array(256).fill(0);
  let histB = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    histR[data[i]]++;
    histG[data[i + 1]]++;
    histB[data[i + 2]]++;
  }

  let maxBrightness = 0;

  for (let i = 0; i < 256; i++) {
    if (maxBrightness < histR[i]) maxBrightness = histR[i];
    else if (maxBrightness < histG[i]) maxBrightness = histG[i];
    else if (maxBrightness < histB[i]) maxBrightness = histB[i];
  }

  const canvas = histCanvas;
  const ctx = canvas.getContext("2d");
  let dx = canvas.width / 256;
  let dy = canvas.height / maxBrightness;
  ctx.lineWidth = dx;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 256; i++) {
    let x = i * dx;

    // Red
    ctx.strokeStyle = "rgba(255,0,0,0.5)";
    ctx.beginPath();
    ctx.moveTo(x, canvas.height);
    ctx.lineTo(x, canvas.height - histR[i] * dy);
    ctx.closePath();
    ctx.stroke();
    // Green
    ctx.strokeStyle = "rgba(0,255,0,0.5)";
    ctx.beginPath();
    ctx.moveTo(x, canvas.height);
    ctx.lineTo(x, canvas.height - histG[i] * dy);
    ctx.closePath();
    ctx.stroke();
    // Blue
    ctx.strokeStyle = "rgba(0,0,255,0.5)";
    ctx.beginPath();
    ctx.moveTo(x, canvas.height);
    ctx.lineTo(x, canvas.height - histB[i] * dy);
    ctx.closePath();
    ctx.stroke();
  }
}

function HSVtoRGB(h, s, v) {
  var r, g, b, i, f, p, q, t;
  if (arguments.length === 1) {
    (s = h.s), (v = h.v), (h = h.h);
  }
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function RGBtoHSV(r, g, b) {
  if (arguments.length === 1) {
    (g = r.g), (b = r.b), (r = r.r);
  }
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    h,
    s = max === 0 ? 0 : d / max,
    v = max / 255;

  switch (max) {
    case min:
      h = 0;
      break;
    case r:
      h = g - b + d * (g < b ? 6 : 0);
      h /= 6 * d;
      break;
    case g:
      h = b - r + d * 2;
      h /= 6 * d;
      break;
    case b:
      h = r - g + d * 4;
      h /= 6 * d;
      break;
  }

  return {
    h: h,
    s: s,
    v: v,
  };
}

function drawImageProp(ctx, img, x, y, w, h, offsetX, offsetY) {
  if (arguments.length === 2) {
    x = y = 0;
    w = ctx.canvas.width;
    h = ctx.canvas.height;
  }

  // default offset is center
  offsetX = typeof offsetX === "number" ? offsetX : 0.5;
  offsetY = typeof offsetY === "number" ? offsetY : 0.5;

  // keep bounds [0.0, 1.0]
  if (offsetX < 0) offsetX = 0;
  if (offsetY < 0) offsetY = 0;
  if (offsetX > 1) offsetX = 1;
  if (offsetY > 1) offsetY = 1;

  var iw = img.width,
    ih = img.height,
    r = Math.min(w / iw, h / ih),
    nw = iw * r, // new prop. width
    nh = ih * r, // new prop. height
    cx,
    cy,
    cw,
    ch,
    ar = 1;

  // decide which gap to fill
  if (nw < w) ar = w / nw;
  if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh; // updated
  nw *= ar;
  nh *= ar;

  // calc source rectangle
  cw = iw / (nw / w);
  ch = ih / (nh / h);

  cx = (iw - cw) * offsetX;
  cy = (ih - ch) * offsetY;

  // make sure source rectangle is valid
  if (cx < 0) cx = 0;
  if (cy < 0) cy = 0;
  if (cw > iw) cw = iw;
  if (ch > ih) ch = ih;

  // fill image in dest. rectangle
  ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}
