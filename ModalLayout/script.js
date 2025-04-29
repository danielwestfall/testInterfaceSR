document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  // --- Tooltip Handling ---
  const tooltipTriggers = document.querySelectorAll(".tooltip-trigger");
  console.log(`Found ${tooltipTriggers.length} tooltip triggers.`);

  tooltipTriggers.forEach((button, index) => {
    const tooltipId = button.getAttribute("aria-describedby");
    const tooltip = document.getElementById(tooltipId);
    console.log(
      `Trigger #${
        index + 1
      }: aria-describedby="${tooltipId}". Tooltip element found:`,
      tooltip ? "Yes" : "NO!"
    );
    if (!tooltip) {
      console.warn(
        `Tooltip with ID "${tooltipId}" not found for trigger:`,
        button
      );
      return;
    }
    const positionTooltip = () => {
      if (!button || !tooltip) return;
      const buttonRect = button.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const offsetParent = button.offsetParent || document.body;
      const parentRect = offsetParent.getBoundingClientRect();
      let top = button.offsetTop - tooltipRect.height - 8;
      let left =
        button.offsetLeft + button.offsetWidth / 2 - tooltipRect.width / 2;
      const viewportTop = buttonRect.top - tooltipRect.height - 8;
      const viewportLeft =
        buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2;
      if (viewportTop < 0) {
        console.log(`Tooltip #${tooltipId} collided with top, moving below.`);
        top = button.offsetTop + button.offsetHeight + 8;
      }
      const viewportWidth =
        window.innerWidth || document.documentElement.clientWidth;
      if (viewportLeft < 0) {
        console.log(`Tooltip #${tooltipId} collided with left.`);
        left = -parentRect.left + 5;
      } else if (viewportLeft + tooltipRect.width > viewportWidth) {
        console.log(`Tooltip #${tooltipId} collided with right.`);
        left = viewportWidth - parentRect.left - tooltipRect.width - 5;
      }
      tooltip.style.position = "absolute";
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };
    const showTooltip = () => {
      console.log(`Showing tooltip: #${tooltipId}`);
      tooltip.setAttribute("aria-hidden", "false");
      positionTooltip();
    };
    const hideTooltip = () => {
      console.log(`Hiding tooltip: #${tooltipId}`);
      tooltip.setAttribute("aria-hidden", "true");
    };
    console.log(`Attaching listeners for tooltip #${tooltipId}`);
    button.addEventListener("mouseenter", showTooltip);
    button.addEventListener("focus", showTooltip);
    button.addEventListener("mouseleave", hideTooltip);
    button.addEventListener("blur", hideTooltip);
    button.addEventListener("click", (e) => {
      console.log(`Click event on tooltip trigger #${tooltipId}`);
      e.stopPropagation();
      if (tooltip.getAttribute("aria-hidden") === "false") {
        hideTooltip();
      } else {
        showTooltip();
      }
    });
    button.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        console.log(`Escape key on tooltip trigger #${tooltipId}`);
        hideTooltip();
        button.focus();
      }
    });
    window.addEventListener("resize", () => {
      if (tooltip.getAttribute("aria-hidden") === "false") {
        console.log(`Resizing window, repositioning tooltip #${tooltipId}`);
        positionTooltip();
      }
    });
  }); // --- End Tooltip Handling ---

  // --- Menu Button Handling ---
  const menuButton = document.getElementById("menu-button");
  const mainMenu = document.getElementById("main-menu");
  if (menuButton && mainMenu) {
    const menuItems = mainMenu.querySelectorAll('[role="menuitem"]');
    const openMenu = () => {
      menuButton.setAttribute("aria-expanded", "true");
      mainMenu.setAttribute("aria-hidden", "false");
      menuItems[0]?.focus();
    };
    const closeMenu = (focusTrigger = true) => {
      menuButton.setAttribute("aria-expanded", "false");
      mainMenu.setAttribute("aria-hidden", "true");
      if (focusTrigger) {
        menuButton.focus();
      }
    };
    menuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      if (menuButton.getAttribute("aria-expanded") === "true") {
        closeMenu();
      } else {
        openMenu();
      }
    });
    document.addEventListener("click", (e) => {
      if (!mainMenu.contains(e.target) && !menuButton.contains(e.target)) {
        if (menuButton.getAttribute("aria-expanded") === "true") {
          closeMenu(false);
        }
      }
    });
    mainMenu.addEventListener("keydown", (e) => {
      const currentFocusIndex = Array.from(menuItems).indexOf(
        document.activeElement
      );
      if (e.key === "Escape") {
        closeMenu();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (currentFocusIndex + 1) % menuItems.length;
        menuItems[nextIndex]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex =
          (currentFocusIndex - 1 + menuItems.length) % menuItems.length;
        menuItems[prevIndex]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        menuItems[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        menuItems[menuItems.length - 1]?.focus();
      } else if (e.key === "Tab") {
        closeMenu(false);
      }
    });
    menuItems.forEach((item) => {
      item.addEventListener("click", () => {
        closeMenu();
      });
    });
  } // --- End Menu Button Handling ---

  // --- Content Item Selection & Preview Pane ---
  const contentItemsList = document.querySelector(".contents-list");
  const previewPane = document.getElementById("content-item-preview");
  const previewName = document.getElementById("preview-item-name");
  const previewThumb = document.getElementById("preview-item-thumbnail");
  const previewDesc = document.getElementById("preview-item-description");
  const previewCloseBtn = previewPane?.querySelector(".close-preview");
  let currentlySelectedListItem = null;
  const showPreview = (itemButton) => {
    if (!previewPane || !itemButton) return;
    const itemId = itemButton.dataset.id;
    const itemName = itemButton.dataset.name;
    if (itemButton.getAttribute("aria-pressed") === "true") {
      hidePreview();
      return;
    }
    if (previewName) previewName.textContent = itemName;
    if (previewThumb) {
      previewThumb.src = `placeholder-thumb-${itemId}.png`;
      previewThumb.alt = `Thumbnail for ${itemName}`;
    }
    if (previewDesc)
      previewDesc.textContent = `This is a short description for ${itemName} (ID: ${itemId}). More details could go here.`;
    previewPane.dataset.currentItemId = itemId;
    if (currentlySelectedListItem) {
      currentlySelectedListItem.classList.remove("is-selected");
      currentlySelectedListItem.setAttribute("aria-pressed", "false");
    }
    itemButton.classList.add("is-selected");
    itemButton.setAttribute("aria-pressed", "true");
    currentlySelectedListItem = itemButton;
    previewPane.removeAttribute("hidden");
  };
  const hidePreview = () => {
    if (!previewPane) return;
    previewPane.setAttribute("hidden", "");
    previewPane.removeAttribute("data-current-item-id");
    if (currentlySelectedListItem) {
      currentlySelectedListItem.classList.remove("is-selected");
      currentlySelectedListItem.setAttribute("aria-pressed", "false");
      currentlySelectedListItem = null;
    }
  };
  if (contentItemsList) {
    contentItemsList.addEventListener("click", (e) => {
      const itemButton = e.target.closest(".content-item");
      const checkboxGroupClicked = e.target.closest(".item-checkbox-group");
      if (checkboxGroupClicked) {
        e.stopPropagation();
        const checkboxInput = checkboxGroupClicked.querySelector(
          'input[type="checkbox"]'
        );
        setTimeout(() => {
          if (checkboxInput) {
            console.log(
              `Checkbox for ${
                checkboxInput.closest(".content-item")?.dataset.name
              } state: ${checkboxInput.checked}`
            );
          }
        }, 0);
        return;
      }
      if (itemButton) {
        showPreview(itemButton);
      }
    });
  }
  if (previewCloseBtn) {
    previewCloseBtn.addEventListener("click", hidePreview);
  }
  // --- End Content Item Selection & Preview ---

  // --- Modal Dialog Handling ---
  console.log("Setting up Modal Dialog Handling...");
  const modal = document.getElementById("select-modal");
  const modalCloseButton = document.getElementById("modal-close-button");
  const modalCancelButton = document.getElementById("modal-cancel-button");
  const modalTableBody = document.getElementById("modal-table-body");
  const modalSortButtons = modal?.querySelectorAll(".sort-button"); // Select buttons within the modal context
  const sortAnnouncementRegion = document.getElementById(
    "modal-sort-announcement"
  );
  console.log("Modal element:", modal ? "Found" : "NOT FOUND");
  console.log("Modal Close Button:", modalCloseButton ? "Found" : "NOT FOUND");
  let currentModalTrigger = null;
  let focusedElementBeforeModal;
  let focusableElements = [];
  let firstFocusableElement;
  let lastFocusableElement;
  const keydownHandler = (e) => {
    /* ... focus trap logic ... */
  };
  const trapFocus = (element) => {
    /* ... focus trap setup ... */
  };
  const removeTrapFocus = () => {
    document.removeEventListener("keydown", keydownHandler);
  };
  const openModal = (triggerButton) => {
    if (!modal) {
      console.error("Modal <dialog> element not found!");
      return;
    }
    console.log(
      ">>> openModal function CALLED. Trigger button ID:",
      triggerButton?.id
    );
    focusedElementBeforeModal = document.activeElement;
    currentModalTrigger = triggerButton;
    focusableElements = Array.from(
      modal.querySelectorAll(
        'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), tr[tabindex="0"]'
      )
    ).filter(
      (el) =>
        el.offsetWidth > 0 ||
        el.offsetHeight > 0 ||
        el.getClientRects().length > 0
    );
    if (focusableElements.length > 0) {
      firstFocusableElement = focusableElements[0];
      lastFocusableElement = focusableElements[focusableElements.length - 1];
    } else {
      firstFocusableElement = modalCloseButton;
      lastFocusableElement = modalCloseButton;
    }
    console.log("...Calling modal.showModal()");
    modal.showModal();
    console.log("...Modal should be open.");
  };
  const closeModal = (returnValue = "cancel") => {
    if (!modal) return;
    console.log("<<< closeModal function CALLED. Return value:", returnValue);
    modal.close(returnValue);
    console.log("<<< Modal closed.");
  };
  if (modal) {
    modal.addEventListener("close", () => {
      console.log(
        "Modal 'close' event fired. Dialog returnValue:",
        modal.returnValue
      );
      if (
        focusedElementBeforeModal &&
        typeof focusedElementBeforeModal.focus === "function"
      ) {
        console.log("...Restoring focus to:", focusedElementBeforeModal);
        focusedElementBeforeModal.focus();
      } else {
        console.log(
          "...Original trigger element not focusable or lost, focus not restored."
        );
      }
      currentModalTrigger = null;
    });
  }
  console.log("Attaching modal trigger listeners...");
  const modalTriggers = document.querySelectorAll(
    ".main-select-button.select-modal-trigger"
  );
  console.log(`Found ${modalTriggers.length} modal trigger buttons.`);
  modalTriggers.forEach((button, index) => {
    console.log(
      `Attaching listener to button #${index + 1} (ID: ${button.id})`
    );
    if (!button) {
      console.error(`Button at index ${index} is null!`);
      return;
    }
    const clonedButton = button.cloneNode(true);
    button.parentNode.replaceChild(clonedButton, button);
    clonedButton.addEventListener("click", () => {
      console.log(`--- Click event fired on button: ${clonedButton.id} ---`);
      openModal(clonedButton);
    });
  });
  console.log("Modal trigger listener attachment complete.");

  // Function to handle row selection (used by both click and keydown)
  const handleRowSelection = (selectedRow) => {
    if (!selectedRow) return;
    console.log("Handling row selection for:", selectedRow); // Log selection attempt
    const selectedValue = selectedRow.dataset.value;
    const selectedText = selectedRow.cells[0]?.textContent || "";
    if (currentModalTrigger) {
      currentModalTrigger.textContent = selectedText; // Update main button text
      const labelElement = document.querySelector(
        `label[for="${currentModalTrigger.id}"]`
      );
      const baseLabel = labelElement ? labelElement.textContent.trim() : "Item";
      currentModalTrigger.setAttribute(
        "aria-label",
        `Current value for ${baseLabel}: ${selectedText}`
      );
      console.log("Updated trigger button text and aria-label.");
      const clearButton = currentModalTrigger.nextElementSibling;
      if (clearButton && clearButton.classList.contains("clear-selection")) {
        clearButton.disabled = false;
        console.log("Enabled clear button.");
      }
    } else {
      console.warn("currentModalTrigger is null, cannot update button.");
    }
    closeModal(selectedValue); // Close the modal after selection
  };

  // Handle selecting an item within the modal TABLE via CLICK
  if (modalTableBody) {
    modalTableBody.addEventListener("click", (e) => {
      const selectedRow = e.target.closest("tr");
      console.log("Click event on modal table body, target:", e.target);
      handleRowSelection(selectedRow);
    });
    // Handle selecting an item within the modal TABLE via KEYDOWN (Enter/Space)
    modalTableBody.addEventListener("keydown", (e) => {
      if (!e.target.matches('tr[tabindex="0"]')) return;
      const currentRow = e.target;
      console.log(`Keydown event on modal table row: ${e.key}`, currentRow);
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        console.log("Enter/Space pressed, calling handleRowSelection.");
        handleRowSelection(currentRow);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextRow = currentRow.nextElementSibling;
        console.log("ArrowDown, focusing next row:", nextRow);
        nextRow?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevRow = currentRow.previousElementSibling;
        console.log("ArrowUp, focusing previous row:", prevRow);
        prevRow?.focus();
      }
    });
  }

  // Table Sorting Logic
  let currentSort = { column: null, direction: "none" };
  const sortTable = (column, direction) => {
    if (!modalTableBody) return;
    const rows = Array.from(modalTableBody.querySelectorAll("tr"));
    rows.sort((rowA, rowB) => {
      let valA, valB;
      if (column === "name") {
        valA = rowA.cells[0]?.textContent.trim().toLowerCase() || "";
        valB = rowB.cells[0]?.textContent.trim().toLowerCase() || "";
      } else if (column === "date") {
        valA = rowA.dataset.sortDate || "";
        valB = rowB.dataset.sortDate || "";
      } else {
        return 0;
      }
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return direction === "descending" ? comparison * -1 : comparison;
    });

    // ** Update aria-sort attributes on the buttons currently in the DOM **
    const currentSortButtons = modal?.querySelectorAll(".sort-button"); // Re-select buttons inside function scope
    console.log("Updating aria-sort attributes..."); // Log update attempt
    currentSortButtons?.forEach((button) => {
      const buttonColumn = button.dataset.column;
      const sortValue = buttonColumn === column ? direction : "none";
      button.setAttribute("aria-sort", sortValue);
      console.log(
        `Set aria-sort="${sortValue}" on button for column "${buttonColumn}"`
      ); // Log each update
    });

    if (sortAnnouncementRegion) {
      const columnText = column === "date" ? "Date Created" : "Name";
      sortAnnouncementRegion.textContent = "";
      setTimeout(() => {
        sortAnnouncementRegion.textContent = `Table sorted by ${columnText}, ${direction}.`;
      }, 100);
    }
    const fragment = document.createDocumentFragment();
    rows.forEach((row) => fragment.appendChild(row));
    modalTableBody.innerHTML = "";
    modalTableBody.appendChild(fragment);
  };

  // ** Attach listeners directly to the sort buttons **
  modalSortButtons?.forEach((button) => {
    // Removed cloning logic
    button.addEventListener("click", () => {
      const column = button.dataset.column;
      let newDirection;
      // Use currentSort state to determine next direction
      if (currentSort.column === column) {
        newDirection =
          currentSort.direction === "ascending" ? "descending" : "ascending";
      } else {
        newDirection = "ascending";
      }
      currentSort = { column: column, direction: newDirection };
      console.log(
        `Sort button clicked. Sorting by "${column}", direction "${newDirection}"`
      ); // Log sort trigger
      sortTable(currentSort.column, currentSort.direction);
    });
  });

  // --- End Modal Handling ---

  // --- Clear Selection Button Handling ---
  document.querySelectorAll(".clear-selection").forEach((button) => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
  });
  document.querySelectorAll(".clear-selection").forEach((button) => {
    button.addEventListener("click", () => {
      const mainButtonId = button.dataset.controls;
      const mainButton = document.getElementById(mainButtonId);
      if (mainButton) {
        const defaultText = mainButton.dataset.defaultText || "Select";
        mainButton.textContent = defaultText;
        const labelElement = document.querySelector(
          `label[for="${mainButton.id}"]`
        );
        const baseLabel = labelElement
          ? labelElement.textContent.trim()
          : "Item";
        mainButton.setAttribute("aria-label", `Select value for ${baseLabel}`);
      }
      button.disabled = true;
      if (mainButton) {
        mainButton.focus();
      }
    });
  });
  // --- End Clear Selection ---

  // --- Form Validation & Submission ---
  const form = document.getElementById("main-form");
  const saveButton = document.querySelector('.save-btn[form="main-form"]');
  const validateField = (field) => {
    const errorSpan = document.getElementById(`${field.id}-error`);
    let isValid = true;
    let errorMessage = "";
    if (field.validity.valueMissing) {
      isValid = false;
      errorMessage = `${
        field.labels[0]?.textContent.replace("*:", "").trim() || "This field"
      } is required.`;
    }
    field.setAttribute("aria-invalid", !isValid);
    if (errorSpan) {
      errorSpan.textContent = errorMessage;
      errorSpan.style.display = isValid ? "none" : "block";
    } else {
      console.warn(`Error span not found for field: ${field.id}`);
    }
    return isValid;
  };
  if (form && saveButton) {
    saveButton.addEventListener("click", (e) => {
      console.log("Save button clicked, validating form...");
      let isFormValid = true;
      let firstInvalidField = null;
      form.querySelectorAll("[aria-invalid]").forEach((field) => {
        field.setAttribute("aria-invalid", "false");
        const errorSpan = document.getElementById(`${field.id}-error`);
        if (errorSpan) errorSpan.textContent = "";
      });
      const requiredFields = form.querySelectorAll("[required]");
      requiredFields.forEach((field) => {
        if (!validateField(field)) {
          isFormValid = false;
          if (!firstInvalidField) {
            firstInvalidField = field;
          }
        }
      });
      if (!isFormValid) {
        console.log("Form is invalid.");
        e.preventDefault();
        if (firstInvalidField) {
          console.log("Focusing first invalid field:", firstInvalidField.id);
          firstInvalidField.focus();
        }
      } else {
        console.log("Form is valid. Submitting (simulated)...");
        e.preventDefault();
        alert("Form data would be submitted now (check console).");
      }
    });
  } // --- End Form Validation ---
}); // End DOMContentLoaded
