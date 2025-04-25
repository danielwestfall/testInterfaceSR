document.addEventListener("DOMContentLoaded", () => {
  // --- Tooltip Handling ---
  const tooltipTriggers = document.querySelectorAll(".tooltip-trigger");
  tooltipTriggers.forEach((button) => {
    const tooltipId = button.getAttribute("aria-describedby");
    const tooltip = document.getElementById(tooltipId);
    if (!tooltip) return;
    const positionTooltip = () => {
      // Basic positioning logic (adjust as needed)
      const rect = button.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      tooltip.style.left = `${
        rect.left + window.scrollX + rect.width / 2 - tooltipRect.width / 2
      }px`;
      tooltip.style.top = `${
        rect.top + window.scrollY - tooltipRect.height - 8
      }px`; // 8px gap
      if (tooltip.offsetLeft < 0) {
        tooltip.style.left = "5px";
      }
      let viewportWidth =
        window.innerWidth || document.documentElement.clientWidth;
      if (tooltip.offsetLeft + tooltip.offsetWidth > viewportWidth) {
        tooltip.style.left = `${viewportWidth - tooltip.offsetWidth - 5}px`;
      }
      if (tooltip.offsetTop < 0) {
        tooltip.style.top = `${rect.bottom + window.scrollY + 8}px`;
      }
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
    if (tooltip.getAttribute("aria-hidden") === "false") {
      positionTooltip();
    }
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
  const previewCloseBtn = previewPane.querySelector(".close-preview");
  let currentlySelectedListItem = null;

  // Function to show the preview pane
  const showPreview = (itemButton) => {
    const itemId = itemButton.dataset.id;
    const itemName = itemButton.dataset.name;
    if (!previewPane.hidden && previewPane.dataset.currentItemId === itemId) {
      hidePreview();
      return;
    }
    previewName.textContent = itemName;
    previewThumb.src = `placeholder-thumb-${itemId}.png`;
    previewThumb.alt = `Thumbnail for ${itemName}`;
    previewDesc.textContent = `This is a short description for ${itemName} (ID: ${itemId}). More details could go here.`;
    previewPane.dataset.currentItemId = itemId;
    if (currentlySelectedListItem) {
      currentlySelectedListItem.classList.remove("is-selected");
    }
    itemButton.classList.add("is-selected");
    currentlySelectedListItem = itemButton;
    previewPane.removeAttribute("hidden");
  };

  // Function to hide the preview pane
  const hidePreview = () => {
    previewPane.setAttribute("hidden", "");
    previewPane.removeAttribute("data-current-item-id");
    if (currentlySelectedListItem) {
      currentlySelectedListItem.classList.remove("is-selected");
      currentlySelectedListItem = null;
    }
  };

  // Add click listener to the list container (event delegation) - CORRECTED LOGIC
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
              checkboxInput.closest(".content-item").dataset.name
            } state: ${checkboxInput.checked}`
          );
        }
      }, 0);
      return; // Prevent preview logic
    }

    // If click was on the item button but NOT the checkbox group, show preview.
    if (itemButton) {
      showPreview(itemButton);
    }
  });

  // Listener for the preview pane's close button
  previewCloseBtn.addEventListener("click", hidePreview);

  // --- End Content Item Selection & Preview ---

  // --- Modal Dialog Handling ---
  const modal = document.getElementById("select-modal");
  const modalOverlay = document.getElementById("modal-overlay");
  const modalCloseButton = document.getElementById("modal-close-button");
  const modalCancelButton = document.getElementById("modal-cancel-button");
  const modalItemList = document.getElementById("modal-item-list");
  let currentModalTrigger = null;
  let focusedElementBeforeModal;

  // Focus trap logic (simplified for brevity, assume functions exist)
  const keydownHandler = (e) => {
    if (e.key !== "Tab") return; /* ... trap logic ... */
  };
  const trapFocus = (element) => {
    /* ... get focusable elements, add listener ... */ document.addEventListener(
      "keydown",
      keydownHandler
    );
  };
  const removeTrapFocus = () => {
    /* ... remove listener ... */ document.removeEventListener(
      "keydown",
      keydownHandler
    );
  };

  // Function to open the modal
  const openModal = (triggerButton) => {
    focusedElementBeforeModal = document.activeElement;
    currentModalTrigger = triggerButton;
    modal.removeAttribute("hidden");
    modalOverlay.removeAttribute("hidden");
    modal.focus();
    const firstFocusable = modal.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="option"]'
    );
    if (firstFocusable) firstFocusable.focus();
    else modalCloseButton.focus();
    trapFocus(modal);
  };

  // Function to close the modal
  const closeModal = () => {
    modal.setAttribute("hidden", "");
    modalOverlay.setAttribute("hidden", "");
    if (focusedElementBeforeModal) {
      focusedElementBeforeModal.focus();
    }
    currentModalTrigger = null;
    removeTrapFocus();
  };

  // Attach listeners to the STATIC "Select" buttons
  document.querySelectorAll(".select-modal-trigger").forEach((button) => {
    button.addEventListener("click", () => openModal(button));
  });

  // Handle selecting an item within the modal
  modalItemList.addEventListener("click", (e) => {
    if (e.target.matches('[role="option"]')) {
      const selectedValue = e.target.dataset.value;
      const selectedText = e.target.textContent;
      if (currentModalTrigger) {
        const targetSpanId = currentModalTrigger.dataset.targetid;
        const targetSpan = document.getElementById(targetSpanId);
        if (targetSpan) {
          targetSpan.textContent = selectedText;
          const clearButton =
            currentModalTrigger.parentElement.querySelector(".clear-selection");
          if (clearButton) {
            clearButton.removeAttribute("hidden");
          }
        }
      }
      closeModal();
    }
  });
  // Allow selecting with Enter/Space key in modal
  modalItemList.addEventListener("keydown", (e) => {
    if (
      e.target.matches('[role="option"]') &&
      (e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      e.target.click();
    }
    // Arrow key nav can be added here
  });

  // Modal Close Listeners
  modalCloseButton.addEventListener("click", closeModal);
  modalCancelButton.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hasAttribute("hidden")) {
      closeModal();
    }
  });
  // --- End Modal Handling ---

  // --- Clear Selection Button Handling ---
  document.querySelectorAll(".clear-selection").forEach((button) => {
    button.addEventListener("click", () => {
      const targetSpanId = button.dataset.targetid;
      const targetSpan = document.getElementById(targetSpanId);
      if (targetSpan) {
        targetSpan.textContent = "";
      }
      button.setAttribute("hidden", "");
      const selectButton = button.parentElement.querySelector(
        ".select-modal-trigger"
      );
      if (selectButton) {
        selectButton.focus();
      }
    });
  });
  // --- End Clear Selection ---

  // --- Placeholder Thumbnail Setup (Example) ---
  // This just ensures image src is set dynamically in showPreview
  // Make sure placeholder files exist (placeholder-thumb-item1.png etc.)

  // --- Form Submission ---
  const form = document.getElementById("main-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Form Submitted");
    alert("Form data logged to console. Add real submission logic.");
  }); // --- End Form Submission ---
}); // End DOMContentLoaded
