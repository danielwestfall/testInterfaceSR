document.addEventListener("DOMContentLoaded", () => {
  // --- Tooltip Handling ---
  const tooltipTriggers = document.querySelectorAll(".tooltip-trigger");
  tooltipTriggers.forEach((button) => {
    const tooltipId = button.getAttribute("aria-describedby");
    const tooltip = document.getElementById(tooltipId);
    if (!tooltip) return;
    const positionTooltip = () => {
      // Basic positioning logic (adjust as needed)
      if (!button || !tooltip) return; // Add check if elements disappear
      const rect = button.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      let top = rect.top + window.scrollY - tooltipRect.height - 8; // 8px gap above
      let left =
        rect.left + window.scrollX + rect.width / 2 - tooltipRect.width / 2;

      // Adjust if off-screen
      if (top < window.scrollY) {
        // Check if cut off at top
        top = rect.bottom + window.scrollY + 8; // Position below instead
      }
      if (left < window.scrollX) {
        // Check left edge
        left = window.scrollX + 5;
      }
      let viewportWidth =
        window.innerWidth || document.documentElement.clientWidth;
      if (left + tooltipRect.width > viewportWidth + window.scrollX) {
        // Check right edge
        left = viewportWidth + window.scrollX - tooltipRect.width - 5;
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };
    const showTooltip = () => {
      tooltip.setAttribute("aria-hidden", "false");
      positionTooltip();
    };
    const hideTooltip = () => {
      tooltip.setAttribute("aria-hidden", "true");
    };
    button.addEventListener("mouseenter", showTooltip);
    button.addEventListener("focus", showTooltip);
    button.addEventListener("mouseleave", hideTooltip);
    button.addEventListener("blur", hideTooltip);
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      if (tooltip.getAttribute("aria-hidden") === "false") {
        hideTooltip();
      } else {
        showTooltip();
      }
    });
    button.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hideTooltip();
        button.focus();
      }
    });
    // Initial position check not strictly needed if hidden by default
    // if (tooltip.getAttribute("aria-hidden") === "false") { positionTooltip(); }
    window.addEventListener("resize", () => {
      if (tooltip.getAttribute("aria-hidden") === "false") {
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
  const previewCloseBtn = previewPane?.querySelector(".close-preview"); // Added safe navigation
  let currentlySelectedListItem = null;

  // Function to show the preview pane
  const showPreview = (itemButton) => {
    if (!previewPane || !itemButton) return; // Safety check

    const itemId = itemButton.dataset.id;
    const itemName = itemButton.dataset.name;

    // If already showing this item, hide it (toggle off)
    if (!previewPane.hidden && previewPane.dataset.currentItemId === itemId) {
      hidePreview();
      return;
    }
    // Update preview content
    if (previewName) previewName.textContent = itemName;
    if (previewThumb) {
      // Ensure placeholder files like placeholder-thumb-item1.png etc. exist or use a default
      previewThumb.src = `placeholder-thumb-${itemId}.png`; // Use unique placeholder per item
      previewThumb.alt = `Thumbnail for ${itemName}`;
    }
    if (previewDesc)
      previewDesc.textContent = `This is a short description for ${itemName} (ID: ${itemId}). More details could go here.`;
    previewPane.dataset.currentItemId = itemId; // Store which item is showing

    // Update selected state in the list
    if (currentlySelectedListItem) {
      currentlySelectedListItem.classList.remove("is-selected");
    }
    itemButton.classList.add("is-selected");
    currentlySelectedListItem = itemButton;
    // Show the pane
    previewPane.removeAttribute("hidden");
  };

  // Function to hide the preview pane
  const hidePreview = () => {
    if (!previewPane) return; // Safety check
    previewPane.setAttribute("hidden", "");
    previewPane.removeAttribute("data-current-item-id");
    if (currentlySelectedListItem) {
      currentlySelectedListItem.classList.remove("is-selected");
      currentlySelectedListItem = null;
    }
  };

  // Add click listener to the list container (event delegation)
  if (contentItemsList) {
    contentItemsList.addEventListener("click", (e) => {
      const itemButton = e.target.closest(".content-item");

      // Check if the click happened ON or INSIDE the checkbox's label/custom span area
      const checkboxGroupClicked = e.target.closest(".item-checkbox-group");

      if (checkboxGroupClicked) {
        // Click was on the checkbox area. Stop propagation to prevent preview.
        e.stopPropagation();
        // Log state (optional debugging)
        const checkboxInput = checkboxGroupClicked.querySelector(
          'input[type="checkbox"]'
        );
        setTimeout(() => {
          // Use timeout to log state *after* default action
          if (checkboxInput) {
            console.log(
              `Checkbox for ${
                checkboxInput.closest(".content-item")?.dataset.name // Added safe navigation
              } state: ${checkboxInput.checked}`
            );
          }
        }, 0);
        return; // Prevent preview logic
      }

      // If the click was on the item button but NOT within the checkbox group area, show the preview.
      if (itemButton) {
        showPreview(itemButton);
      }
    });
  }

  // Listener for the preview pane's close button
  if (previewCloseBtn) {
    previewCloseBtn.addEventListener("click", hidePreview);
  }

  // --- End Content Item Selection & Preview ---

  // --- Modal Dialog Handling ---
  const modal = document.getElementById("select-modal");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalCloseButton = document.getElementById("modal-close-button");
  const modalCancelButton = document.getElementById("modal-cancel-button");
  // ** UPDATED: Target table body instead of list **
  const modalTableBody = document.getElementById("modal-table-body");
  const modalSortButtons = modal?.querySelectorAll(".sort-button"); // Get sort buttons

  let currentModalTrigger = null;
  let focusedElementBeforeModal;
  let focusableElements = [];
  let firstFocusableElement;
  let lastFocusableElement;

  // Focus trap keydown handler
  const keydownHandler = (e) => {
    if (!modal || modal.hasAttribute("hidden")) return; // Only trap when modal is open
    if (e.key !== "Tab") return;

    if (focusableElements.length === 0) {
      // Prevent errors if no focusable elements
      e.preventDefault();
      return;
    }

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus();
        e.preventDefault();
      }
    }
  };

  // Function to set up focus trap
  const trapFocus = (element) => {
    if (!element) return;
    focusableElements = Array.from(
      element.querySelectorAll(
        'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), tr[tabindex="0"]' // Include table rows now
      )
    ).filter(
      (el) =>
        el.offsetWidth > 0 ||
        el.offsetHeight > 0 ||
        el.getClientRects().length > 0
    ); // Filter only visible elements

    if (focusableElements.length > 0) {
      firstFocusableElement = focusableElements[0];
      lastFocusableElement = focusableElements[focusableElements.length - 1];
      // Add listener only once, ensure it's removed on close
      document.removeEventListener("keydown", keydownHandler); // Remove previous if any
      document.addEventListener("keydown", keydownHandler);
    } else {
      // If no focusable elements found, maybe focus the close button as fallback or the container?
      modalCloseButton?.focus();
      document.removeEventListener("keydown", keydownHandler); // Remove previous if any
      document.addEventListener("keydown", keydownHandler); // Still trap to prevent tabbing out
    }
  };

  // Function to remove focus trap
  const removeTrapFocus = () => {
    document.removeEventListener("keydown", keydownHandler);
  };

  // Function to open the modal
  const openModal = (triggerButton) => {
    // Ensure modal elements exist before proceeding
    if (!modal || !modalOverlay || !modalCloseButton) {
      console.error("Modal elements not found in the DOM!");
      return;
    }

    focusedElementBeforeModal = document.activeElement;
    currentModalTrigger = triggerButton;
    modal.removeAttribute("hidden");
    modalOverlay.removeAttribute("hidden");

    // Set up focus trap elements before setting focus
    trapFocus(modal);

    // Set initial focus
    if (focusableElements.length > 0) {
      // Focus the first element found by trapFocus (could be header button or table row)
      firstFocusableElement.focus();
    } else {
      // Fallback focus if no interactive elements found inside
      modalCloseButton.focus();
    }
  };

  // Function to close the modal
  const closeModal = () => {
    // Ensure modal elements exist
    if (!modal || !modalOverlay) return;

    modal.setAttribute("hidden", "");
    modalOverlay.setAttribute("hidden", "");
    removeTrapFocus(); // Remove trap before restoring focus
    if (focusedElementBeforeModal) {
      // Add check to ensure focus target still exists and is visible
      if (
        typeof focusedElementBeforeModal.focus === "function" &&
        (focusedElementBeforeModal.offsetWidth > 0 ||
          focusedElementBeforeModal.offsetHeight > 0)
      ) {
        focusedElementBeforeModal.focus();
      }
    }
    currentModalTrigger = null;
  };

  // Attach listeners to the main "Select" buttons (modal triggers)
  document
    .querySelectorAll(".main-select-button.select-modal-trigger")
    .forEach((button) => {
      button.addEventListener("click", () => openModal(button));
    });

  // ** UPDATED: Handle selecting an item within the modal TABLE **
  if (modalTableBody) {
    modalTableBody.addEventListener("click", (e) => {
      const selectedRow = e.target.closest("tr"); // Find clicked row
      if (selectedRow) {
        // Get value from row's data attribute, text from first cell
        const selectedValue = selectedRow.dataset.value;
        const selectedText = selectedRow.cells[0]?.textContent || ""; // Get Name column text

        if (currentModalTrigger) {
          currentModalTrigger.textContent = selectedText; // Update main button text
          const clearButton = currentModalTrigger.nextElementSibling;
          if (
            clearButton &&
            clearButton.classList.contains("clear-selection")
          ) {
            clearButton.disabled = false; // Enable the X button
          }
        }
        closeModal();
      }
    });

    // ** UPDATED: Keyboard navigation for table rows **
    modalTableBody.addEventListener("keydown", (e) => {
      const currentRow = e.target.closest("tr");
      if (!currentRow) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        currentRow.click(); // Trigger the click handler
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextRow = currentRow.nextElementSibling;
        nextRow?.focus(); // Focus the next row
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevRow = currentRow.previousElementSibling;
        prevRow?.focus(); // Focus the previous row
      }
      // Could add Home/End key support here too
    });
  }

  // ** ADDED: Table Sorting Logic **
  let currentSort = { column: null, direction: "none" }; // Track current sort state

  const sortTable = (column, direction) => {
    if (!modalTableBody) return;
    const rows = Array.from(modalTableBody.querySelectorAll("tr"));

    rows.sort((rowA, rowB) => {
      let valA, valB;

      if (column === "name") {
        valA = rowA.cells[0]?.textContent.trim().toLowerCase() || "";
        valB = rowB.cells[0]?.textContent.trim().toLowerCase() || "";
      } else if (column === "date") {
        // Use data attribute for reliable date sorting
        valA = rowA.dataset.sortDate || "";
        valB = rowB.dataset.sortDate || "";
        // Optional: Convert to Date objects for more robust comparison
        // valA = new Date(rowA.dataset.sortDate || 0);
        // valB = new Date(rowB.dataset.sortDate || 0);
      } else {
        return 0; // No sorting if column unknown
      }

      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }

      return direction === "descending" ? comparison * -1 : comparison;
    });

    // Update aria-sort attributes and visual indicators
    modalSortButtons?.forEach((button) => {
      if (button.dataset.column === column) {
        button.setAttribute("aria-sort", direction);
      } else {
        button.setAttribute("aria-sort", "none");
      }
    });

    // Re-append rows in sorted order
    // Using DocumentFragment for performance is slightly better for large lists
    const fragment = document.createDocumentFragment();
    rows.forEach((row) => fragment.appendChild(row));
    modalTableBody.innerHTML = ""; // Clear existing rows
    modalTableBody.appendChild(fragment); // Append sorted rows
  };

  modalSortButtons?.forEach((button) => {
    // Ensure only one listener per button if script runs multiple times
    const clonedButton = button.cloneNode(true);
    button.parentNode.replaceChild(clonedButton, button);

    clonedButton.addEventListener("click", () => {
      const column = clonedButton.dataset.column;
      let newDirection;

      const currentAriaSort = clonedButton.getAttribute("aria-sort");

      if (currentSort.column === column) {
        // Cycle direction: ascending -> descending -> ascending ...
        // (Start with ascending if currently 'none' or 'descending')
        newDirection =
          currentAriaSort === "ascending" ? "descending" : "ascending";
      } else {
        // Start new column sort with ascending
        newDirection = "ascending";
      }

      currentSort = { column: column, direction: newDirection };
      sortTable(currentSort.column, currentSort.direction);
    });
  });

  // Modal Close Listeners
  if (modalCloseButton) modalCloseButton.addEventListener("click", closeModal);
  if (modalCancelButton)
    modalCancelButton.addEventListener("click", closeModal);
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.hasAttribute("hidden")) {
      closeModal();
    }
  });
  // --- End Modal Handling ---

  // --- Clear Selection Button Handling ---
  // Remove previous listeners before adding new ones (prevents duplicates)
  document.querySelectorAll(".clear-selection").forEach((button) => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
  });
  // Add listeners to the new buttons
  document.querySelectorAll(".clear-selection").forEach((button) => {
    button.addEventListener("click", () => {
      const mainButtonId = button.dataset.controls;
      const mainButton = document.getElementById(mainButtonId);

      if (mainButton) {
        mainButton.textContent = mainButton.dataset.defaultText || "Select"; // Reset text
      }
      button.disabled = true; // Disable the button

      if (mainButton) {
        mainButton.focus(); // Focus the main button
      }
    });
  });
  // --- End Clear Selection ---

  // --- Placeholder Thumbnail Setup (Example) ---
  // Assumes function showPreview handles setting the correct src

  // --- Form Submission ---
  const form = document.getElementById("main-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      console.log("Form Submitted");
      // Add actual form submission logic here (e.g., using fetch)
      // const formData = new FormData(form);
      // for (let [key, value] of formData.entries()) {
      //     console.log(key, value);
      // }
      alert("Form data logged to console. Add real submission logic.");
    });
  } // --- End Form Submission ---
}); // End DOMContentLoaded
