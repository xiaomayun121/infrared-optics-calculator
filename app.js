const DISPLAY_EMPTY = "--";

const inputs = {
  pixelsH: document.querySelector("#pixelsH"),
  pixelsV: document.querySelector("#pixelsV"),
  pixelSize: document.querySelector("#pixelSize"),
  focalLength: document.querySelector("#focalLength"),
  fNumber: document.querySelector("#fNumber"),
  wavelength: document.querySelector("#wavelength"),
  targetSize: document.querySelector("#targetSize"),
};

const outputs = Object.fromEntries(
  Array.from(document.querySelectorAll("output[id]")).map((output) => [output.id, output]),
);

const parseValue = (input) => {
  const value = Number(input.value);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const format = (value, digits = 2) => {
  if (!Number.isFinite(value)) {
    return DISPLAY_EMPTY;
  }

  const rounded = Number(value.toFixed(digits));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits);
};

const setOutput = (id, value, digits = 2) => {
  outputs[id].value = format(value, digits);
};

const limitDecimalPlaces = (event) => {
  const input = event.target;
  const normalized = input.value.replace(/[^\d.]/g, "");
  const [integer = "", decimal = ""] = normalized.split(".");
  const nextValue = normalized.includes(".")
    ? `${integer}.${decimal.slice(0, 2)}`
    : integer;

  if (input.value !== nextValue) {
    input.value = nextValue;
  }
};

const calculateMtf = (frequency, wavelengthMm, fNumber) => {
  const fc = 1 / (wavelengthMm * fNumber);
  const u = frequency / fc;

  if (u < 0 || u > 1) {
    return 0;
  }

  return (2 / Math.PI) * (Math.acos(u) - u * Math.sqrt(1 - u ** 2));
};

const calculateCutoffFrequency = (wavelengthMm, fNumber) => {
  if (!wavelengthMm || !fNumber) {
    return null;
  }

  return 1 / (wavelengthMm * fNumber);
};

const calculate = () => {
  const pixelsH = parseValue(inputs.pixelsH);
  const pixelsV = parseValue(inputs.pixelsV);
  const pixelSizeUm = parseValue(inputs.pixelSize);
  const focalLength = parseValue(inputs.focalLength);
  const fNumber = parseValue(inputs.fNumber);
  const wavelengthUm = parseValue(inputs.wavelength);
  const targetSize = parseValue(inputs.targetSize);

  const pixelsD = pixelsH && pixelsV ? Math.hypot(pixelsH, pixelsV) : null;
  const pixelSizeMm = pixelSizeUm ? pixelSizeUm / 1000 : null;
  const sizeH = pixelsH && pixelSizeMm ? pixelsH * pixelSizeMm : null;
  const sizeV = pixelsV && pixelSizeMm ? pixelsV * pixelSizeMm : null;
  const sizeD = sizeH && sizeV ? Math.hypot(sizeH, sizeV) : null;

  const fov = (size) => (size && focalLength ? 2 * Math.atan(size / (2 * focalLength)) * (180 / Math.PI) : null);
  const fovH = fov(sizeH);
  const fovV = fov(sizeV);
  const fovD = fov(sizeD);
  const nyquist = pixelSizeMm ? 1 / (2 * pixelSizeMm) : null;
  const wavelengthMm = wavelengthUm ? wavelengthUm / 1000 : null;
  const diffraction = wavelengthMm && fNumber ? calculateCutoffFrequency(wavelengthMm, fNumber) : null;
  const diffractionAtNyquist = nyquist && wavelengthMm && fNumber ? calculateMtf(nyquist, wavelengthMm, fNumber) : null;
  const ifov = pixelSizeMm && focalLength ? pixelSizeMm / focalLength : null;
  const ifovMrad = ifov ? ifov * 1000 : null;
  const distanceKm = (pixelCount) => (targetSize && ifov ? targetSize / (pixelCount * ifov) / 1000 : null);

  setOutput("outPixelsH", pixelsH, 0);
  setOutput("outPixelsV", pixelsV, 0);
  setOutput("outPixelsD", pixelsD, 2);
  setOutput("outSizeH", sizeH);
  setOutput("outSizeV", sizeV);
  setOutput("outSizeD", sizeD);
  setOutput("outFovH", fovH);
  setOutput("outFovV", fovV);
  setOutput("outFovD", fovD);
  setOutput("outHalfFovH", fovH ? fovH / 2 : null);
  setOutput("outHalfFovV", fovV ? fovV / 2 : null);
  setOutput("outHalfFovD", fovD ? fovD / 2 : null);
  setOutput("outHalfSizeH", sizeH ? sizeH / 2 : null);
  setOutput("outHalfSizeV", sizeV ? sizeV / 2 : null);
  setOutput("outHalfSizeD", sizeD ? sizeD / 2 : null);
  setOutput("outNyquist", nyquist, 4);
  setOutput("outDiffraction", diffraction, 4);
  setOutput("outMtf", diffractionAtNyquist, 4);
  setOutput("outIfov", ifovMrad);
  setOutput("outDetect2", distanceKm(2));
  setOutput("outDetect4", distanceKm(4));
  setOutput("outRecognize4", distanceKm(4));
  setOutput("outRecognize8", distanceKm(8));
  setOutput("outIdentify8", distanceKm(8));
  setOutput("outIdentify12", distanceKm(12));
};

Object.values(inputs).forEach((input) => {
  input.addEventListener("input", (event) => {
    limitDecimalPlaces(event);
  });
});

document.querySelector("#calculateButton").addEventListener("click", calculate);

document.querySelector("#resetButton").addEventListener("click", () => {
  Object.values(inputs).forEach((input) => {
    input.value = "";
  });
  Object.values(outputs).forEach((output) => {
    output.value = DISPLAY_EMPTY;
  });
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js");
}

Object.values(outputs).forEach((output) => {
  output.value = DISPLAY_EMPTY;
});
