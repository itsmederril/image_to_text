// Handle paste event (Ctrl+V)
document.addEventListener("paste", function (event) {
  const items = event.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf("image") === 0) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function () {
          document.getElementById("image-container").innerHTML = "";
          document.getElementById("image-container").appendChild(img);
          processImage(img);
        };
      };
      reader.readAsDataURL(file);
    }
  }
});

// drag and drop
const dropArea = document.getElementById("drop-area");
const imageContainer = document.getElementById("image-container");
const resultDiv = document.getElementById("result");
const progressBar = document.getElementById("progress-bar");
const copyBtn = document.getElementById("copy-btn");
const copiedPopup = document.getElementById("copied-popup");
const statsDiv = document.getElementById("stats");
const downloadBtn = document.getElementById("download-btn");

// State awal
if (statsDiv) {
  statsDiv.textContent = "Belum ada teks yang dihasilkan.";
}
if (copyBtn) copyBtn.disabled = true;
if (downloadBtn) downloadBtn.disabled = true;

copyBtn.addEventListener("click", () => {
  const text = resultDiv.textContent;
  navigator.clipboard.writeText(text);
  copiedPopup.classList.add("show");
  setTimeout(() => {
    copiedPopup.classList.remove("show");
  }, 1200);
});

downloadBtn.addEventListener("click", () => {
  const text = resultDiv.textContent;
  if (!text || !text.trim()) return;

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ocr-result.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Tambahkan input file tersembunyi
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

// Klik area drop untuk membuka file picker
dropArea.addEventListener("click", () => {
  fileInput.click();
});

// Handle file dari file picker
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length) {
    handleImage(e.target.files[0]);
  }
});

// Prevent default drag behaviors
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, (e) => e.preventDefault());
  dropArea.addEventListener(eventName, (e) => e.stopPropagation());
});

// Highlight drop area on dragover
dropArea.addEventListener("dragover", () => {
  dropArea.classList.add("highlight");
});
dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("highlight");
});
dropArea.addEventListener("drop", handleDrop);

// Handle paste event
window.addEventListener("paste", function (e) {
  const items = e.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const file = items[i].getAsFile();
      handleImage(file);
    }
  }
});

// Handle drop event
function handleDrop(e) {
  dropArea.classList.remove("highlight");
  const dt = e.dataTransfer;
  const files = dt.files;
  if (files.length) {
    handleImage(files[0]);
  }
}

// Handle image file
function handleImage(file) {
  if (!file.type.startsWith("image/")) {
    resultDiv.textContent = "Please upload a valid image file.";
    if (statsDiv) statsDiv.textContent = "";
    if (copyBtn) copyBtn.disabled = true;
    if (downloadBtn) downloadBtn.disabled = true;
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    imageContainer.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image" style="max-width:100%;"/>`;
    resultDiv.textContent = "Processing...";
    progressBar.style.width = "0%";
    if (statsDiv) statsDiv.textContent = "";
    if (copyBtn) copyBtn.disabled = true;
    if (downloadBtn) downloadBtn.disabled = true;
    runOCR(e.target.result);
  };
  reader.readAsDataURL(file);
}

// Run OCR using Tesseract.js
function runOCR(imageSrc) {
  Tesseract.recognize(imageSrc, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text") {
        progressBar.style.width = Math.round(m.progress * 100) + "%";
      }
    },
  })
    .then(({ data: { text } }) => {
      const cleanText = (text || "").trim();

      if (cleanText) {
        resultDiv.textContent = cleanText;
        progressBar.style.width = "100%";

        const charCount = cleanText.length;
        const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

        if (statsDiv) {
          statsDiv.textContent = `Kata: ${wordCount} | Karakter: ${charCount}`;
        }
        if (copyBtn) copyBtn.disabled = false;
        if (downloadBtn) downloadBtn.disabled = false;
      } else {
        resultDiv.textContent = "No text detected.";
        progressBar.style.width = "0%";
        if (statsDiv) statsDiv.textContent = "";
        if (copyBtn) copyBtn.disabled = true;
        if (downloadBtn) downloadBtn.disabled = true;
      }
    })
    .catch((err) => {
      resultDiv.textContent = "Error: " + err.message;
      progressBar.style.width = "0%";
      if (statsDiv) statsDiv.textContent = "";
      if (copyBtn) copyBtn.disabled = true;
      if (downloadBtn) downloadBtn.disabled = true;
    });
}
