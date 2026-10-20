/* PDF.js-based viewer with text highlighting.
 * Renders the target page to a canvas, overlays a text layer, and
 * highlights the section heading so it's easy to spot.
 *
 * Loaded as a regular (non-module) script after pdf.min.js and pdf-data.js.
 * Exposes window.renderPdfPage().
 *
 * The PDFs are embedded as base64 in pdf-data.js (window.PDF_DATA)
 * so the demo works on file:// protocol where XHR/fetch are blocked.
 */
(function () {
  "use strict";

  // pdfjsLib is exposed as a global by pdf.min.js (v3.11.174 UMD build)
  if (typeof pdfjsLib === "undefined") {
    console.error("pdf.min.js must be loaded before pdf-viewer.js");
    return;
  }

  // Set workerSrc to the local file. PDF.js will try to create a Web Worker
  // from this URL. On file://, if the Worker can't be created, PDF.js
  // automatically falls back to a "fake worker" that loads the same file
  // via a <script> tag (allowed on file://) and runs in the main thread.
  pdfjsLib.GlobalWorkerOptions.workerSrc = "pdf.worker.min.js";

  // Decode a base64 string to a Uint8Array (for PDF.js getDocument)
  function decodeBase64(b64) {
    var binaryString = atob(b64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // Map a PDF filename to its key in window.PDF_DATA
  function pdfKeyForFile(pdfUrl) {
    if (pdfUrl.indexOf("pcs") !== -1) return "pcs";
    return "cm";
  }

  // Cache loaded PDF documents by key (avoid re-parsing base64)
  var pdfCache = {};

  /**
   * Render a PDF page into a container, highlighting search text.
   *
   * @param {string} pdfUrl  — filename of the PDF (used to look up embedded data)
   * @param {number} pageNum — 1-based page number to render
   * @param {string} searchText — text to find and highlight on the page
   * @param {HTMLElement} container — the DOM element to render into
   */
  window.renderPdfPage = async function renderPdfPage(pdfUrl, pageNum, searchText, container) {
    container.innerHTML = '<div class="pdf-loading">Loading PDF…</div>';

    try {
      var key = pdfKeyForFile(pdfUrl);
      var pdf;

      if (pdfCache[key]) {
        pdf = pdfCache[key];
      } else {
        // Decode the embedded base64 PDF data
        if (!window.PDF_DATA || !window.PDF_DATA[key]) {
          throw new Error("PDF data not found for key: " + key);
        }
        var pdfBytes = decodeBase64(window.PDF_DATA[key]);
        var loadingTask = pdfjsLib.getDocument({
          data: pdfBytes,
          disableRange: true,
          disableAutoFetch: true,
        });
        pdf = await loadingTask.promise;
        pdfCache[key] = pdf;
      }

      var page = await pdf.getPage(pageNum);

      // Fit the page width to the container width (100% zoom)
      var containerWidth = container.clientWidth - 32; // account for padding
      var viewport0 = page.getViewport({ scale: 1 });
      var scale = Math.max(0.5, containerWidth / viewport0.width);
      var viewport = page.getViewport({ scale: scale });

      // Render the page to a canvas
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.className = "pdf-canvas";
      container.innerHTML = "";
      container.appendChild(canvas);

      await page.render({ canvasContext: ctx, viewport: viewport }).promise;

      // Build the text layer for highlighting
      var textContent = await page.getTextContent();

      var textLayer = document.createElement("div");
      textLayer.className = "pdf-text-layer";
      textLayer.style.width = viewport.width + "px";
      textLayer.style.height = viewport.height + "px";
      container.appendChild(textLayer);

      // Collect all text items and render them as positioned spans
      var items = textContent.items;
      var itemMap = []; // {span, text} — one entry per item

      items.forEach(function (item) {
        var tx = pdfjsLib.Util.transform(viewport.transform, item.transform);

        var span = document.createElement("span");
        span.textContent = item.str;
        span.style.position = "absolute";
        span.style.left = tx[4] + "px";
        var fontHeight = item.height * scale;
        span.style.top = (tx[5] - fontHeight) + "px";
        span.style.fontSize = fontHeight + "px";
        span.style.fontFamily = item.fontName || "sans-serif";
        span.style.whiteSpace = "pre";
        span.style.color = "transparent";
        span.style.pointerEvents = "auto";
        span.style.cursor = "text";
        textLayer.appendChild(span);

        itemMap.push({ span: span, text: item.str });
      });

      // Search for the text and highlight matching items
      if (searchText) {
        var normSearch = searchText.replace(/\s+/g, " ").toLowerCase().trim();
        if (normSearch) {
          // Build a normalized text string with spaces between items,
          // tracking each item's position in that string.
          var normFull = "";
          var itemPositions = []; // {itemIdx, normStart, normEnd, normText}

          itemMap.forEach(function (entry, idx) {
            var normText = entry.text.replace(/\s+/g, " ").trim().toLowerCase();
            if (normText.length === 0) return;

            // Add a space separator between items
            if (normFull.length > 0 && !normFull.endsWith(" ")) {
              normFull += " ";
            }
            var normStart = normFull.length;
            normFull += normText;
            itemPositions.push({
              itemIdx: idx,
              normStart: normStart,
              normEnd: normFull.length,
              normText: normText,
            });
          });

          var firstHighlight = null;

          // Pass 1: Look for a standalone item whose text starts with the
          // search text (or equals it). This finds section headings even
          // when the same phrase appears earlier in body text.
          var headingMatch = null;
          itemPositions.forEach(function (pos) {
            if (pos.normText === normSearch || pos.normText.indexOf(normSearch) === 0) {
              if (!headingMatch) headingMatch = pos;
            }
          });

          if (headingMatch) {
            // Highlight just the heading item(s) that match
            itemPositions.forEach(function (pos) {
              if (pos.normText === normSearch || pos.normText.indexOf(normSearch) === 0) {
                itemMap[pos.itemIdx].span.classList.add("pdf-highlight");
                if (!firstHighlight) firstHighlight = itemMap[pos.itemIdx].span;
              }
            });
          } else {
            // Pass 2: Search the concatenated text (for multi-item headings)
            var searchStart = normFull.indexOf(normSearch);
            var matchLen = normSearch.length;
            if (searchStart === -1) {
              // Try progressively shorter prefixes of the search text
              var words = normSearch.split(" ");
              for (var w = words.length - 1; w >= 1; w--) {
                var prefix = words.slice(0, w).join(" ");
                searchStart = normFull.indexOf(prefix);
                if (searchStart !== -1) {
                  matchLen = prefix.length;
                  break;
                }
              }
            }

            if (searchStart !== -1) {
              var searchEnd = searchStart + matchLen;

              // Highlight items whose normalized position overlaps the match
              itemPositions.forEach(function (pos) {
                if (pos.normEnd > searchStart && pos.normStart < searchEnd) {
                  itemMap[pos.itemIdx].span.classList.add("pdf-highlight");
                  if (!firstHighlight) firstHighlight = itemMap[pos.itemIdx].span;
                }
              });
            }
          }

          if (firstHighlight) {
            setTimeout(function () {
              firstHighlight.scrollIntoView({ block: "center", behavior: "smooth" });
            }, 100);
          }
        }
      }
    } catch (err) {
      container.innerHTML = '<div class="pdf-error">Error loading PDF: ' + err.message + "</div>";
    }
  };
})();
