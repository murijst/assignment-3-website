(() => {
  // Configuration
  const CONFIG = {
    BREAKPOINTS: {
      MOBILE: 1023.5,
    },
    SELECTORS: {
      body: 'body',
      navigation: '#cs-navigation',
      hamburger: '#cs-navigation .cs-toggle',
      menuWrapper: '#cs-ul-wrapper',
      dropdownToggle: '.cs-dropdown-toggle',
      dropdown: '.cs-dropdown',
      dropdownMenu: '.cs-drop-ul',
    },
    CLASSES: {
      active: 'cs-active',
      menuOpen: 'cs-open',
      scroll: 'scroll',
    },
  };

  // DOM Elements
  const elements = {
    body: document.querySelector(CONFIG.SELECTORS.body),
    navigation: document.querySelector(CONFIG.SELECTORS.navigation),
    hamburger: document.querySelector(CONFIG.SELECTORS.hamburger),
    menuWrapper: document.querySelector(CONFIG.SELECTORS.menuWrapper),
  };

  // Utilities
  const isMobile = () =>
    window.matchMedia(`(max-width: ${CONFIG.BREAKPOINTS.MOBILE}px)`).matches;

  const toggleAttribute = (
    element,
    attribute,
    value1 = 'true',
    value2 = 'false'
  ) => {
    if (!element) return;
    const current = element.getAttribute(attribute);
    element.setAttribute(attribute, current === value1 ? value2 : value1);
  };

  const toggleInert = element => element && (element.inert = !element.inert);

  // Dropdown Management
  const dropdownManager = {
    close(dropdown, shouldFocus = false) {
      if (!dropdown || !dropdown.classList.contains(CONFIG.CLASSES.active))
        return false;

      dropdown.classList.remove(CONFIG.CLASSES.active);
      const button = dropdown.querySelector(CONFIG.SELECTORS.dropdownToggle);
      const menu = dropdown.querySelector(CONFIG.SELECTORS.dropdownMenu);

      if (button) {
        button.setAttribute('aria-expanded', 'false');
        shouldFocus && button.focus();
      }

      if (menu) {
        menu.inert = true;
      }

      return true;
    },

    toggle(element) {
      element.classList.toggle(CONFIG.CLASSES.active);
      const button = element.querySelector(CONFIG.SELECTORS.dropdownToggle);
      const menu = element.querySelector(CONFIG.SELECTORS.dropdownMenu);

      button && toggleAttribute(button, 'aria-expanded');
      menu && toggleInert(menu);
    },

    closeAll() {
      if (!elements.navigation) return false;
      let closed = false;

      elements.navigation
        .querySelectorAll(
          `${CONFIG.SELECTORS.dropdown}.${CONFIG.CLASSES.active}`
        )
        .forEach(dropdown => {
          this.close(dropdown, true);
          closed = true;
        });

      return closed;
    },
  };

  // Menu Management
  const menuManager = {
    toggle() {
      if (!elements.hamburger || !elements.navigation) return;

      const isClosing = elements.navigation.classList.contains(
        CONFIG.CLASSES.active
      );

      [elements.hamburger, elements.navigation].forEach(el =>
        el.classList.toggle(CONFIG.CLASSES.active)
      );
      elements.body.classList.toggle(CONFIG.CLASSES.menuOpen);
      toggleAttribute(elements.hamburger, 'aria-expanded');

      // Only manage inert state on mobile devices
      if (elements.menuWrapper && isMobile()) {
        toggleInert(elements.menuWrapper);
      }

      // When closing the mobile menu, also close any open dropdowns
      isClosing && dropdownManager.closeAll();
    },
  };

  // Keyboard Management
  const keyboardManager = {
    handleEscape() {
      if (!elements.navigation) return;

      // Close any open dropdown menus first
      const dropdownsClosed = dropdownManager.closeAll();
      if (dropdownsClosed) return;

      // Then close hamburger menu if open
      if (
        elements.hamburger &&
        elements.hamburger.classList.contains(CONFIG.CLASSES.active)
      ) {
        menuManager.toggle();
        elements.hamburger.focus();
      }
    },
  };

  // Event Management
  const eventManager = {
    handleDropdownClick(event) {
      if (!isMobile()) return;

      const button = event.target.closest(CONFIG.SELECTORS.dropdownToggle);
      if (!button) return;

      event.preventDefault();
      const dropdown = button.closest(CONFIG.SELECTORS.dropdown);
      if (dropdown) {
        dropdownManager.toggle(dropdown);
      }
    },

    handleDropdownKeydown(event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;

      const button = event.target.closest(CONFIG.SELECTORS.dropdownToggle);
      if (!button) return;

      event.preventDefault();
      const dropdown = button.closest(CONFIG.SELECTORS.dropdown);
      if (dropdown) {
        dropdownManager.toggle(dropdown);
      }
    },

    handleFocusOut(event) {
      setTimeout(() => {
        if (!event.relatedTarget) return;

        const dropdown = event.target.closest(CONFIG.SELECTORS.dropdown);
        if (
          dropdown?.classList.contains(CONFIG.CLASSES.active) &&
          !dropdown.contains(event.relatedTarget)
        ) {
          dropdownManager.close(dropdown);
        }
      }, 10);
    },

    handleMobileFocus(event) {
      if (
        !isMobile() ||
        !elements.navigation.classList.contains(CONFIG.CLASSES.active)
      )
        return;
      if (
        elements.menuWrapper.contains(event.target) ||
        elements.hamburger.contains(event.target)
      )
        return;

      menuManager.toggle();
    },

    handleDropdownHover(event) {
      if (isMobile()) return; // Only apply hover behavior on desktop

      const dropdown = event.target.closest(CONFIG.SELECTORS.dropdown);
      if (!dropdown) return;

      const menu = dropdown.querySelector(CONFIG.SELECTORS.dropdownMenu);
      if (!menu) return;

      if (event.type === 'mouseenter') {
        menu.inert = false;
      } else if (event.type === 'mouseleave') {
        // Only set inert=true if mouse is leaving the entire dropdown area
        // Use setTimeout to allow mouseleave/mouseenter events to complete
        setTimeout(() => {
          // Check if mouse is still over the dropdown or its menu
          if (!dropdown.matches(':hover')) {
            menu.inert = true;
          }
        }, 1);
      }
    },
  };

  // Scroll Effects Management
  const scrollManager = {
    handleScrollEffects() {
      const scrollPosition = document.documentElement.scrollTop;
      const isScrolled = scrollPosition >= 100;

      elements.body.classList.toggle(CONFIG.CLASSES.scroll, isScrolled);
    },
  };

  // Initialization & Setup
  const init = {
    inertState() {
      if (!elements.menuWrapper) return;

      // On mobile, menu starts closed, so set inert=true
      // On desktop, menu is always visible, so set inert=false
      elements.menuWrapper.inert = isMobile();

      // Initialize dropdown menus - they start closed, so inert=true on all devices
      if (elements.navigation) {
        const dropdownMenus = elements.navigation.querySelectorAll(
          CONFIG.SELECTORS.dropdownMenu
        );
        dropdownMenus.forEach(dropdown => {
          dropdown.inert = true;
        });
      }
    },

    eventListeners() {
      if (!elements.hamburger || !elements.navigation) return;

      // Hamburger menu
      elements.hamburger.addEventListener('click', menuManager.toggle);
      elements.navigation.addEventListener('click', e => {
        if (
          e.target === elements.navigation &&
          elements.navigation.classList.contains(CONFIG.CLASSES.active)
        ) {
          menuManager.toggle();
        }
      });

      // Dropdown delegation
      elements.navigation.addEventListener(
        'click',
        eventManager.handleDropdownClick
      );
      elements.navigation.addEventListener(
        'keydown',
        eventManager.handleDropdownKeydown
      );
      elements.navigation.addEventListener(
        'focusout',
        eventManager.handleFocusOut
      );

      // Desktop hover listeners for inert management
      elements.navigation.addEventListener(
        'mouseenter',
        eventManager.handleDropdownHover,
        true
      );
      elements.navigation.addEventListener(
        'mouseleave',
        eventManager.handleDropdownHover,
        true
      );

      // Global events
      document.addEventListener(
        'keydown',
        e => e.key === 'Escape' && keyboardManager.handleEscape()
      );
      document.addEventListener('focusin', eventManager.handleMobileFocus);
      document.addEventListener('scroll', () =>
        scrollManager.handleScrollEffects()
      );

      // Resize handling
      window.addEventListener('resize', () => {
        this.inertState();
        if (
          !isMobile() &&
          elements.navigation.classList.contains(CONFIG.CLASSES.active)
        ) {
          menuManager.toggle();
        }
      });
    },
  };

  // Initialize navigation system
  init.inertState();
  init.eventListeners();

  // ============================================
  // Additional Custom JS
  // ============================================

  // 1) Smooth scroll for internal anchor links
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // 2) WhatsApp booking popup — triggered by phone link & "Book Appointment" buttons
  const WA_NUMBER = '61198533999';
  const WA_MESSAGE = encodeURIComponent(
    "Hi Pitstop Express, I'd like to book a service via your website."
  );

  const waOverlay = document.createElement('div');
  waOverlay.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;z-index:10000;padding:16px;';

  const waBox = document.createElement('div');
  waBox.style.cssText =
    'background:#fff;border-radius:12px;max-width:380px;width:100%;padding:24px;font-family:Arial,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.3);';

  waBox.innerHTML = `
        <h3 style="margin:0 0 8px 0;color:#1a1a1a;">Book via WhatsApp</h3>
        <p style="margin:0 0 18px 0;font-size:14px;line-height:1.5;color:#4e4b66;">
          We'll open WhatsApp with a pre-filled booking message. Reply to confirm your service date.
        </p>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button type="button" data-wa-cancel style="padding:10px 14px;border:1px solid #ccc;background:#fff;border-radius:8px;cursor:pointer;font-weight:600;">Cancel</button>
            <button type="button" data-wa-send style="padding:10px 14px;border:none;background:#25D366;color:#fff;border-radius:8px;cursor:pointer;font-weight:700;">Send via WhatsApp</button>
        </div>
    `;

  waOverlay.appendChild(waBox);
  document.body.appendChild(waOverlay);

  const openWaPopup = () => {
    waOverlay.style.display = 'flex';
  };

  const closeWaPopup = () => {
    waOverlay.style.display = 'none';
  };

  // Trigger from header phone link AND any "Book Appointment / Book A Service" CTA
  document.addEventListener('click', event => {
    const trigger = event.target.closest(
      '.cs-phone, .cs-price-button, .cs-button1, #pricing-1790 .cs-button-solid'
    );
    if (!trigger) return;

    event.preventDefault();
    openWaPopup();
  });

  waOverlay.addEventListener('click', event => {
    if (
      event.target === waOverlay ||
      event.target.closest('[data-wa-cancel]')
    ) {
      closeWaPopup();
      return;
    }

    if (event.target.closest('[data-wa-send]')) {
      const waUrl = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      closeWaPopup();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeWaPopup();
    }
  });
})();
