// script.js - Grid Alignment Restore for Column Controls
document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const gameBoard = document.getElementById("game-board");
  const columnControlsContainer = document.getElementById("column-controls");
  const rowControlsContainer = document.getElementById("row-controls");
  const addColBtn = document.getElementById("add-col-btn"); // Button is inside column-controls
  const addRowBtn = document.getElementById("add-row-btn");
  const srAnnouncer = document.getElementById("sr-announcer");

  // Category Modal Elements
  const categoryModal = document.getElementById("category-modal");
  const categoryInput = document.getElementById("category-input");
  const saveCategoryBtn = document.getElementById("save-category-btn");
  const cancelCategoryBtn = document.getElementById("cancel-category-btn");
  const categoryError = document.getElementById("category-error");

  // Question Modal Elements
  const questionModal = document.getElementById("question-modal");
  const questionModalTitle = document.getElementById("question-modal-title");
  const modalPointValue = document.getElementById("modal-point-value");
  const questionText = document.getElementById("question-text");
  const questionTextError = document.getElementById("question-text-error");
  const answerOptionsContainer = document.getElementById("answer-options");
  const answerOptionsFieldset = answerOptionsContainer.closest("fieldset");
  const answerOptionsError = document.getElementById("answer-options-error");
  const correctAnswerError = document.getElementById("correct-answer-error");
  const addAnswerBtn = document.getElementById("add-answer-btn");
  const mediaInput = document.getElementById("media-input");
  const mediaPreview = document.getElementById("media-preview");
  const removeMediaBtn = document.getElementById("remove-media-btn");
  const mediaError = document.getElementById("media-error");
  const saveQuestionBtn = document.getElementById("save-question-btn");
  const cancelQuestionBtn = document.getElementById("cancel-question-btn");
  const deleteQuestionBtn = document.getElementById("delete-question-btn");

  // Delete Confirmation Modal Elements
  const deleteConfirmModal = document.getElementById("delete-confirm-modal");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
  const deleteConfirmError = document.getElementById("delete-confirm-error");

  // --- Configuration ---
  const initialCols = 5;
  const initialRows = 6;
  const minCols = 1;
  const minRows = 2;
  const maxCols = 8;
  const maxRows = 8;
  const maxAnswers = 4;
  const pointValues = [100, 200, 300, 400, 500, 600, 700];

  // --- State ---
  let numCols = initialCols;
  let numRows = initialRows;
  let gameData = {};
  let editingCellId = null;
  let editingCategoryCellElement = null;
  let currentMediaFile = null;
  let currentMediaType = null;
  let lastFocusedElement = null;

  // --- Utility Functions ---

  /**
   * Sends a message to the screen reader announcer region.
   * @param {string} message - The message to announce.
   */
  function announce(message) {
    console.log("Announcing:", message); // Log for debugging
    if (srAnnouncer) {
      srAnnouncer.textContent = message;
      setTimeout(() => {
        if (srAnnouncer.textContent === message) {
          srAnnouncer.textContent = "";
        }
      }, 3000);
    }
  }

  /**
   * Shows an inline error message for a specific input field or related element.
   * @param {string} errorElementId - The ID of the div where the error message should appear.
   * @param {string} relatedElementId - The ID of the input/fieldset/button associated with the error.
   * @param {string} message - The error message text.
   */
  function showError(errorElementId, relatedElementId, message) {
    const errorElement = document.getElementById(errorElementId);
    const relatedElement = document.getElementById(relatedElementId);
    if (errorElement) {
      errorElement.textContent = message;
    }
    if (
      relatedElement &&
      (relatedElement.tagName === "INPUT" ||
        relatedElement.tagName === "FIELDSET" ||
        relatedElement.tagName === "BUTTON")
    ) {
      relatedElement.setAttribute("aria-invalid", "true");
      const describedBy = relatedElement.getAttribute("aria-describedby") || "";
      if (!describedBy.includes(errorElementId)) {
        relatedElement.setAttribute(
          "aria-describedby",
          `${describedBy} ${errorElementId}`.trim()
        );
      }
    }
    const fieldset = relatedElement?.closest("fieldset");
    if (fieldset && fieldset !== relatedElement) {
      fieldset.setAttribute("aria-invalid", "true");
      const fieldsetDescribedBy =
        fieldset.getAttribute("aria-describedby") || "";
      if (!fieldsetDescribedBy.includes(errorElementId)) {
        fieldset.setAttribute(
          "aria-describedby",
          `${fieldsetDescribedBy} ${errorElementId}`.trim()
        );
      }
    }
  }

  /**
   * Clears an inline error message and associated ARIA attributes.
   * @param {string} errorElementId - The ID of the error message div.
   * @param {string} relatedElementId - The ID of the input/fieldset/button.
   */
  function clearError(errorElementId, relatedElementId) {
    const errorElement = document.getElementById(errorElementId);
    const relatedElement = document.getElementById(relatedElementId);
    if (errorElement) {
      errorElement.textContent = "";
    }

    const elementsToClear = [];
    if (relatedElement) elementsToClear.push(relatedElement);
    const fieldset = relatedElement?.closest("fieldset");
    if (fieldset && fieldset !== relatedElement) elementsToClear.push(fieldset);

    elementsToClear.forEach((el) => {
      if (el.hasAttribute("aria-invalid")) {
        const describedBy = el.getAttribute("aria-describedby") || "";
        const errorIds = describedBy
          .split(" ")
          .filter((id) => id && id.endsWith("-error"));
        let hasOtherErrors = false;
        errorIds.forEach((id) => {
          if (
            id !== errorElementId &&
            document.getElementById(id)?.textContent
          ) {
            hasOtherErrors = true;
          }
        });
        if (!hasOtherErrors) {
          el.removeAttribute("aria-invalid");
        }
      }
      const describedBy = el.getAttribute("aria-describedby") || "";
      const newDescribedBy = describedBy
        .replace(errorElementId, "")
        .replace(/\s+/g, " ")
        .trim();
      if (newDescribedBy) {
        el.setAttribute("aria-describedby", newDescribedBy);
      } else {
        el.removeAttribute("aria-describedby");
      }
    });
  }

  /** Clears all error messages and invalid states within a given container. */
  function clearAllErrors(containerElement) {
    const errorMessages = containerElement.querySelectorAll(".error-message");
    const invalidElements = containerElement.querySelectorAll(
      '[aria-invalid="true"]'
    );
    errorMessages.forEach((el) => (el.textContent = ""));
    invalidElements.forEach((el) => {
      el.removeAttribute("aria-invalid");
      const describedBy = el.getAttribute("aria-describedby") || "";
      const errorIds = Array.from(errorMessages)
        .map((e) => e.id)
        .filter(Boolean);
      let newDescribedBy = describedBy;
      errorIds.forEach((id) => {
        newDescribedBy = newDescribedBy.replace(id, "");
      });
      newDescribedBy = newDescribedBy.replace(/\s+/g, " ").trim();
      if (newDescribedBy) {
        el.setAttribute("aria-describedby", newDescribedBy);
      } else {
        el.removeAttribute("aria-describedby");
      }
    });
  }

  /** Generates a unique ID for a cell (e.g., "r1c2"). */
  function generateCellId(r, c) {
    return `r${r}c${c}`;
  }

  /** Extracts row and column indices from a cell ID. */
  function getCellCoords(cellId) {
    const match = cellId?.match(/r(\d+)c(\d+)/);
    return match
      ? { r: parseInt(match[1], 10), c: parseInt(match[2], 10) }
      : null;
  }

  /** Gets the point value for a given question row index (0 is category). */
  function getPointValue(rowIndex) {
    return pointValues[rowIndex - 1] || rowIndex * 100; // Fallback calculation
  }

  // --- Grid Rendering ---
  /** Clears and redraws the entire game board grid and controls based on current state. */
  function renderGrid() {
    // Clear containers
    gameBoard.innerHTML = "";
    columnControlsContainer.innerHTML = ""; // Clear previous column buttons AND the add button
    rowControlsContainer.innerHTML = ""; // Clear previous row buttons AND the add button

    // Set grid columns for the board
    const gridColTemplate = `repeat(${numCols}, minmax(100px, 1fr))`;
    gameBoard.style.gridTemplateColumns = gridColTemplate;

    // --- Create Column Controls ---
    // Set grid columns on the controls container to match the board
    // Add an extra column for the add button if needed
    const controlsColTemplate = `repeat(${numCols}, 1fr) ${
      numCols < maxCols ? "auto" : ""
    }`;
    columnControlsContainer.style.gridTemplateColumns = controlsColTemplate;

    for (let c = 0; c < numCols; c++) {
      if (numCols > minCols) {
        const btn = document.createElement("button");
        btn.className = "control-btn remove-col-btn";
        btn.textContent = "×";
        btn.setAttribute("aria-label", `Remove Column ${c + 1}`);
        btn.dataset.columnIndex = c;
        btn.addEventListener("click", handleRemoveColumn);
        // Append to the grid container - it will flow into the next grid cell
        columnControlsContainer.appendChild(btn);
      } else {
        // Add an empty div to maintain grid structure if only one column
        const placeholder = document.createElement("div");
        columnControlsContainer.appendChild(placeholder);
      }
    }
    // Show/Hide and append the Add Column button to the *end* of the container
    addColBtn.style.display = numCols < maxCols ? "inline-flex" : "none";
    if (numCols < maxCols) {
      // Explicitly set grid column to appear in the last column defined for it
      addColBtn.style.gridColumn = `${numCols + 1}`;
      columnControlsContainer.appendChild(addColBtn);
    }

    // --- Create Row Controls ---
    // Set grid rows for the row controls container
    // Add an extra row definition for the add button if needed
    const controlsRowTemplate = `repeat(${numRows}, auto) ${
      numRows < maxRows ? "auto" : ""
    }`;
    rowControlsContainer.style.gridTemplateRows = controlsRowTemplate;

    // Create placeholders/buttons for each row slot
    for (let r = 0; r < numRows; r++) {
      if (r > 0 && numRows > minRows) {
        // Only add remove buttons for question rows (r > 0)
        const btn = document.createElement("button");
        btn.className = "control-btn remove-row-btn";
        btn.textContent = "×";
        btn.setAttribute("aria-label", `Remove Question Row ${r}`);
        btn.dataset.rowIndex = r;
        btn.addEventListener("click", handleRemoveRow);
        btn.style.gridRow = `${r + 1}`; // Place in correct grid row
        rowControlsContainer.appendChild(btn);
      } else {
        // Add placeholder for category row (r=0)
        const placeholder = document.createElement("div");
        placeholder.style.gridRow = `${r + 1}`;
        placeholder.style.height = "var(--control-size)";
        rowControlsContainer.appendChild(placeholder);
      }
    }
    // Show/Hide and append the Add Row button
    addRowBtn.style.display = numRows < maxRows ? "inline-flex" : "none";
    if (numRows < maxRows) {
      addRowBtn.style.gridRow = `${numRows + 1}`; // Place after last row
      rowControlsContainer.appendChild(addRowBtn);
    }

    // --- Create Grid Cells ---
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const cellId = generateCellId(r, c);
        const cell = document.createElement("div");
        cell.id = cellId;
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.setAttribute("role", "button");
        cell.setAttribute("tabindex", "0");
        if (!gameData[cellId]) {
          if (r === 0) {
            gameData[cellId] = { category: "CATEGORY" };
          } else {
            gameData[cellId] = {
              points: getPointValue(r),
              question: "",
              answers: [],
              correct: -1,
              media: null,
              mediaType: null,
              edited: false,
            };
          }
        }
        const cellData = gameData[cellId];
        if (r === 0) {
          cell.className = "grid-cell category-cell";
          const categorySpan = document.createElement("span");
          categorySpan.textContent = cellData.category;
          cell.appendChild(categorySpan);
          cell.addEventListener("click", handleEditCategoryClick);
          cell.addEventListener("keydown", handleCellKeyDown);
        } else {
          cell.className = "grid-cell question-cell";
          const pointsSpan = document.createElement("span");
          pointsSpan.textContent = `$${cellData.points}`;
          cell.appendChild(pointsSpan);
          cell.addEventListener("click", handleEditQuestionClick);
          cell.addEventListener("keydown", handleCellKeyDown);
          if (cellData.edited) {
            cell.classList.add("edited");
          }
        }
        gameBoard.appendChild(cell);
      }
    }
  }

  // --- Event Handlers for Grid Controls ---
  /** Handles removing a column. */
  function handleRemoveColumn(event) {
    if (numCols <= minCols) return;
    const colToRemove = parseInt(event.target.dataset.columnIndex, 10);
    const colNumber = colToRemove + 1;
    const newData = {};
    for (const key in gameData) {
      const coords = getCellCoords(key);
      if (coords.c === colToRemove) continue;
      if (coords.c < colToRemove) {
        newData[key] = gameData[key];
      } else {
        const newKey = generateCellId(coords.r, coords.c - 1);
        newData[newKey] = gameData[key];
      }
    }
    gameData = newData;
    numCols--;
    renderGrid();
    announce(`Column ${colNumber} removed. ${numCols} columns remaining.`);
  }
  /** Handles adding a column. */
  function handleAddColumn() {
    if (numCols >= maxCols) return;
    numCols++;
    renderGrid();
    announce(`Column added. ${numCols} columns total.`);
  }
  /** Handles removing a row. */
  function handleRemoveRow(event) {
    if (numRows <= minRows) return;
    const rowToRemove = parseInt(event.target.dataset.rowIndex, 10);
    if (rowToRemove === 0) return;
    const questionRowNum = rowToRemove;
    const newData = {};
    for (const key in gameData) {
      const coords = getCellCoords(key);
      if (coords.r === rowToRemove) continue;
      if (coords.r < rowToRemove) {
        newData[key] = gameData[key];
      } else {
        const newRowIndex = coords.r - 1;
        const cellData = gameData[key];
        if (newRowIndex > 0) {
          cellData.points = getPointValue(newRowIndex);
        }
        const newKey = generateCellId(newRowIndex, coords.c);
        newData[newKey] = cellData;
      }
    }
    gameData = newData;
    numRows--;
    renderGrid();
    announce(
      `Question row ${questionRowNum} removed. ${
        numRows - 1
      } question rows remaining.`
    );
  }
  /** Handles adding a row. */
  function handleAddRow() {
    if (numRows >= maxRows) return;
    numRows++;
    renderGrid();
    const questionRowNum = numRows - 1;
    announce(
      `Question row ${questionRowNum} added. ${
        numRows - 1
      } question rows total.`
    );
  }

  // --- Modal Handling ---
  /** Opens a modal dialog and manages focus. */
  function openModal(modal, openerElement) {
    if (modal !== deleteConfirmModal) {
      lastFocusedElement = openerElement || document.activeElement;
    }
    modal.removeAttribute("hidden");
    modal.setAttribute("open", "");
    const focusable = modal.querySelector(
      'input:not([type="hidden"]), button, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) {
      setTimeout(() => focusable.focus(), 50);
    }
    modal.addEventListener("keydown", trapFocus);
  }
  /** Closes a modal dialog and manages focus return. */
  function closeModal(modal) {
    modal.setAttribute("hidden", "true");
    modal.removeAttribute("open");
    modal.removeEventListener("keydown", trapFocus);
    if (modal === deleteConfirmModal) {
      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    } else {
      if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
      }
      if (modal === categoryModal) resetCategoryModal();
      if (modal === questionModal) resetQuestionModal();
    }
    clearAllErrors(modal);
  }
  /** Basic focus trapping within the currently open modal. */
  function trapFocus(e) {
    const modal = e.currentTarget;
    if (e.key !== "Tab") return;
    const focusableElements = Array.from(
      modal.querySelectorAll(
        'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
    if (focusableElements.length === 0) return;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }

  // --- Event Handlers for Cells ---
  /** Handles keydown events on grid cells (Enter or Space to activate). */
  function handleCellKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  }
  /** Handles clicks on category cells to open the edit modal. */
  function handleEditCategoryClick(event) {
    const cell = event.currentTarget;
    editingCellId = cell.id;
    editingCategoryCellElement = cell.querySelector("span");
    const cellData = gameData[editingCellId];
    categoryInput.value = cellData?.category || "CATEGORY";
    clearError("category-error", "category-input");
    openModal(categoryModal, cell);
  }
  /** Handles clicks on question cells to open the edit modal. */
  function handleEditQuestionClick(event) {
    const cell = event.currentTarget;
    editingCellId = cell.id;
    const cellData = gameData[editingCellId];
    if (!cellData) return;
    clearAllErrors(questionModal);
    modalPointValue.textContent = cellData.points;
    questionText.value = cellData.question || "";
    populateAnswerOptions(cellData.answers || [], cellData.correct);
    currentMediaFile = cellData.media;
    currentMediaType = cellData.mediaType;
    renderMediaPreview();
    openModal(questionModal, cell);
  }

  // --- Category Modal Logic ---
  /** Saves the edited category name after validation. */
  function saveCategory() {
    clearError("category-error", "category-input");
    const newCategory = categoryInput.value.trim().toUpperCase();
    if (!newCategory) {
      showError(
        "category-error",
        "category-input",
        "Category name cannot be empty."
      );
      categoryInput.focus();
      return;
    }
    if (editingCellId && editingCategoryCellElement) {
      gameData[editingCellId].category = newCategory;
      editingCategoryCellElement.textContent = newCategory;
      announce(`Category updated to ${newCategory}.`);
    }
    closeModal(categoryModal);
  }
  /** Resets the category modal state when closed or cancelled. */
  function resetCategoryModal() {
    editingCellId = null;
    editingCategoryCellElement = null;
    categoryInput.value = "";
    clearError("category-error", "category-input");
  }

  // --- Question Modal Logic ---
  /** Populates the answer options section in the question modal. */
  function populateAnswerOptions(answers = [], correctIndex = -1) {
    answerOptionsContainer.innerHTML = "";
    answers.forEach((answer, index) => {
      addAnswerOptionInput(answer, index === correctIndex, false);
    });
    if (
      answers.length === 0 &&
      answerOptionsContainer.childElementCount < maxAnswers
    ) {
      addAnswerOptionInput("", false, false);
    }
    updateAddAnswerButtonState();
  }
  /** Adds a single answer option input row to the modal. */
  function addAnswerOptionInput(
    value = "",
    isCorrect = false,
    shouldAnnounce = true
  ) {
    const currentAnswersCount =
      answerOptionsContainer.querySelectorAll(".answer-option").length;
    if (currentAnswersCount >= maxAnswers) return;
    const optionIndex = currentAnswersCount;
    const optionNumber = optionIndex + 1;
    const optionDiv = document.createElement("div");
    optionDiv.className = "answer-option";
    optionDiv.id = `answer-option-${optionIndex}`;
    const radioId = `correct-answer-${optionIndex}`;
    const inputId = `answer-text-${optionIndex}`;
    const errorId = `answer-error-${optionIndex}`;
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "correctAnswer";
    radio.checked = isCorrect;
    radio.value = optionIndex;
    radio.id = radioId;
    radio.setAttribute("aria-label", `Mark answer ${optionNumber} as correct`);
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Answer ${optionNumber}`;
    input.value = value;
    input.id = inputId;
    input.setAttribute("aria-label", `Answer option ${optionNumber}`);
    input.setAttribute("aria-describedby", errorId);
    const errorDiv = document.createElement("div");
    errorDiv.id = errorId;
    errorDiv.className = "error-message";
    errorDiv.setAttribute("aria-live", "assertive");
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.innerHTML = "&times;";
    removeBtn.className = "remove-answer-btn";
    removeBtn.setAttribute("aria-label", `Remove answer ${optionNumber}`);
    removeBtn.addEventListener("click", () => {
      if (
        answerOptionsContainer.querySelectorAll(".answer-option").length > 1
      ) {
        const wasChecked = radio.checked;
        optionDiv.remove();
        updateAddAnswerButtonState();
        renumberAnswerOptions();
        announce(`Answer option ${optionNumber} removed.`);
        if (wasChecked) {
          const remainingRadios = Array.from(
            answerOptionsContainer.querySelectorAll('input[type="radio"]')
          );
          if (
            remainingRadios.length > 0 &&
            !remainingRadios.some((r) => r.checked)
          ) {
            /* Optionally announce */
          }
        }
        clearError("answer-options-error", "answer-options");
        clearError("correct-answer-error", "answer-options");
      } else {
        showError(
          "answer-options-error",
          "answer-options",
          "At least one answer option is required."
        );
      }
    });
    optionDiv.appendChild(radio);
    optionDiv.appendChild(input);
    optionDiv.appendChild(removeBtn);
    optionDiv.appendChild(errorDiv);
    answerOptionsContainer.appendChild(optionDiv);
    if (shouldAnnounce) {
      announce(`Answer option ${optionNumber} added.`);
      input.focus();
    }
    updateAddAnswerButtonState();
  }
  /** Updates the labels, IDs, and ARIA attributes of remaining answer options after one is removed. */
  function renumberAnswerOptions() {
    const options = answerOptionsContainer.querySelectorAll(".answer-option");
    options.forEach((optionDiv, index) => {
      const optionNumber = index + 1;
      const radio = optionDiv.querySelector('input[type="radio"]');
      const input = optionDiv.querySelector('input[type="text"]');
      const removeBtn = optionDiv.querySelector(".remove-answer-btn");
      const errorDiv = optionDiv.querySelector(".error-message");
      optionDiv.id = `answer-option-${index}`;
      radio.id = `correct-answer-${index}`;
      radio.value = index;
      radio.setAttribute(
        "aria-label",
        `Mark answer ${optionNumber} as correct`
      );
      input.id = `answer-text-${index}`;
      input.placeholder = `Answer ${optionNumber}`;
      input.setAttribute("aria-label", `Answer option ${optionNumber}`);
      errorDiv.id = `answer-error-${index}`;
      input.setAttribute("aria-describedby", errorDiv.id);
      removeBtn.setAttribute("aria-label", `Remove answer ${optionNumber}`);
    });
  }
  /** Enables/disables the "Add Answer" button based on the current count. */
  function updateAddAnswerButtonState() {
    const currentCount =
      answerOptionsContainer.querySelectorAll(".answer-option").length;
    addAnswerBtn.disabled = currentCount >= maxAnswers;
  }
  /** Handles the selection of a media file, validates type, and reads the file. */
  function handleMediaUpload(event) {
    clearError("media-error", "media-input");
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("audio/")) {
      showError(
        "media-error",
        "media-input",
        "Invalid file type. Please select an image or audio file."
      );
      mediaInput.value = "";
      removeMedia(false);
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      currentMediaFile = e.target.result;
      currentMediaType = file.type.startsWith("image/") ? "image" : "audio";
      renderMediaPreview();
      announce(`${currentMediaType} file selected and preview updated.`);
    }; // Added semicolon for consistency
    reader.onerror = function () {
      showError("media-error", "media-input", "Error reading file.");
      removeMedia(false);
    }; // Added semicolon for consistency
    reader.readAsDataURL(file);
  }
  /** Updates the media preview area in the modal (shows image/audio player or placeholder). */
  function renderMediaPreview() {
    mediaPreview.innerHTML = "";
    removeMediaBtn.style.display = "none";
    if (currentMediaFile && currentMediaType) {
      if (currentMediaType === "image") {
        const img = document.createElement("img");
        img.src = currentMediaFile;
        img.alt = "Image preview";
        mediaPreview.appendChild(img);
        removeMediaBtn.style.display = "inline-flex";
      } else if (currentMediaType === "audio") {
        const audio = document.createElement("audio");
        audio.src = currentMediaFile;
        audio.controls = true;
        audio.setAttribute("aria-label", "Audio preview player");
        mediaPreview.appendChild(audio);
        removeMediaBtn.style.display = "inline-flex";
      }
    } else {
      const placeholder = document.createElement("span");
      placeholder.textContent = "No media uploaded.";
      mediaPreview.appendChild(placeholder);
    }
  }
  /** Removes the currently selected media file and clears the preview. */
  function removeMedia(shouldAnnounce = true) {
    const mediaTypeRemoved = currentMediaType;
    currentMediaFile = null;
    currentMediaType = null;
    mediaInput.value = "";
    clearError("media-error", "media-input");
    renderMediaPreview();
    if (shouldAnnounce && mediaTypeRemoved) {
      announce(`${mediaTypeRemoved} file removed.`);
    }
  }
  /** Validates all fields in the question modal and saves data if valid. */
  function saveQuestion() {
    let isValid = true;
    clearAllErrors(questionModal);
    const questionValue = questionText.value.trim();
    const answerElements =
      answerOptionsContainer.querySelectorAll(".answer-option");
    const answers = [];
    let correctIndex = -1;
    let firstInvalidElement = null;
    if (!questionValue) {
      showError(
        "question-text-error",
        "question-text",
        "Question text cannot be empty."
      );
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = questionText;
    }
    let hasAnyAnswerText = false;
    let hasEmptyAnswerField = false;
    answerElements.forEach((optionDiv, index) => {
      const input = optionDiv.querySelector('input[type="text"]');
      const radio = optionDiv.querySelector('input[type="radio"]');
      const errorId = `answer-error-${index}`;
      const inputId = input.id;
      const answerText = input.value.trim();
      if (!answerText) {
        hasEmptyAnswerField = true;
        showError(errorId, inputId, "Answer text cannot be empty.");
        if (!firstInvalidElement) firstInvalidElement = input;
      } else {
        hasAnyAnswerText = true;
      }
      answers.push(answerText);
      if (radio && radio.checked) {
        correctIndex = index;
      }
    });
    if (!hasAnyAnswerText && answerElements.length > 0) {
      showError(
        "answer-options-error",
        "answer-options",
        "Please provide at least one answer option."
      );
      isValid = false;
      if (!firstInvalidElement && answerElements.length > 0)
        firstInvalidElement =
          answerElements[0].querySelector('input[type="text"]');
    } else if (hasEmptyAnswerField) {
      isValid = false;
    }
    if (hasAnyAnswerText && !hasEmptyAnswerField && correctIndex === -1) {
      showError(
        "correct-answer-error",
        "answer-options",
        "Please select the correct answer."
      );
      isValid = false;
      if (!firstInvalidElement && answerElements.length > 0)
        firstInvalidElement = answerElements[0].querySelector(
          'input[type="radio"]'
        );
    }
    if (!isValid) {
      announce("Please correct the errors before saving.");
      if (firstInvalidElement) {
        firstInvalidElement.focus();
      }
      return;
    }
    if (editingCellId) {
      const cellData = gameData[editingCellId];
      cellData.question = questionValue;
      const validAnswers = answers.filter((a) => a);
      const originalCorrectAnswerText =
        correctIndex !== -1 && answers[correctIndex]
          ? answers[correctIndex]
          : null;
      const finalCorrectIndex = originalCorrectAnswerText
        ? validAnswers.indexOf(originalCorrectAnswerText)
        : -1;
      cellData.answers = validAnswers;
      cellData.correct = finalCorrectIndex;
      cellData.media = currentMediaFile;
      cellData.mediaType = currentMediaType;
      cellData.edited = true;
      announce(`Question for ${cellData.points} points saved.`);
      closeModal(questionModal);
      renderGrid();
    } else {
      console.error("Error saving: editingCellId is not set.");
      announce("Error saving question. Please try again.");
    }
  }
  /** Opens the delete confirmation modal. */
  function handleDeleteRequest() {
    if (!editingCellId) return;
    clearError("delete-confirm-error", "confirm-delete-btn");
    openModal(deleteConfirmModal, deleteQuestionBtn);
  }
  /** Performs the actual deletion after confirmation, resets cell data. */
  function performDeleteQuestion() {
    if (!editingCellId) return;
    const coords = getCellCoords(editingCellId);
    let points = 0;
    if (coords && coords.r > 0) {
      points = getPointValue(coords.r);
      gameData[editingCellId] = {
        points: points,
        question: "",
        answers: [],
        correct: -1,
        media: null,
        mediaType: null,
        edited: false,
      };
      announce(`Question for ${points} points deleted.`);
      closeModal(deleteConfirmModal);
      closeModal(questionModal);
      renderGrid();
    } else {
      console.error("Error deleting: Invalid cell ID or category cell.");
      showError(
        "delete-confirm-error",
        "confirm-delete-btn",
        "Error deleting question."
      );
      announce("Error deleting question.");
    }
  }
  /** Resets the question modal fields and state variables when closed/cancelled. */
  function resetQuestionModal() {
    editingCellId = null;
    questionText.value = "";
    answerOptionsContainer.innerHTML = "";
    addAnswerOptionInput("", false, false);
    updateAddAnswerButtonState();
    currentMediaFile = null;
    currentMediaType = null;
    mediaInput.value = "";
    renderMediaPreview();
    modalPointValue.textContent = "";
    clearAllErrors(questionModal);
  }

  // --- Initial Setup and Event Listeners ---
  [categoryModal, questionModal, deleteConfirmModal].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal(modal);
    });
    const closeBtn = modal.querySelector(".close-modal-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => closeModal(modal));
    }
  });
  saveCategoryBtn.addEventListener("click", saveCategory);
  cancelCategoryBtn.addEventListener("click", () => closeModal(categoryModal));
  categoryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveCategory();
  });
  saveQuestionBtn.addEventListener("click", saveQuestion);
  cancelQuestionBtn.addEventListener("click", () => closeModal(questionModal));
  deleteQuestionBtn.addEventListener("click", handleDeleteRequest);
  addAnswerBtn.addEventListener("click", () => addAnswerOptionInput());
  mediaInput.addEventListener("change", handleMediaUpload);
  removeMediaBtn.addEventListener("click", () => removeMedia());
  confirmDeleteBtn.addEventListener("click", performDeleteQuestion);
  cancelDeleteBtn.addEventListener("click", () =>
    closeModal(deleteConfirmModal)
  );
  addColBtn.addEventListener("click", handleAddColumn);
  addRowBtn.addEventListener("click", handleAddRow);

  // --- Initial Render ---
  renderGrid();
  announce("Quiz editor loaded.");
}); // End DOMContentLoaded
