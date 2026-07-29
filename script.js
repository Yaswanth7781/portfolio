document.addEventListener('DOMContentLoaded', () => {
  // Initialize Systems
  initClock();
  initWindowManager();
  initDock();
});

// 1. DYNAMIC SYSTEM CLOCK
function initClock() {
  const clockElement = document.getElementById('system-clock');
  if (!clockElement) return;

  function updateClock() {
    const now = new Date();
    
    // Format options: "Wed, Jul 29 6:21 PM"
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dateNum = now.getDate();
    
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    const timeString = `${dayName}, ${monthName} ${dateNum}  ${hours}:${minutes} ${ampm}`;
    clockElement.textContent = timeString;
  }

  updateClock();
  setInterval(updateClock, 1000); // Update every second for precision
}

// 2. WINDOW MANAGER SYSTEM
let highestZIndex = 10;
const windowPositions = {}; // Store non-maximized coordinates for recovery

function initWindowManager() {
  const windows = document.querySelectorAll('.window');
  
  windows.forEach((win) => {
    const header = win.querySelector('.window-header');
    const btnClose = win.querySelector('.btn-close');
    const btnMinimize = win.querySelector('.btn-minimize');
    const btnMaximize = win.querySelector('.btn-maximize');
    const id = win.id;

    // Center window initially
    centerWindow(win);
    
    // Make window draggable
    if (header) {
      makeDraggable(win, header);
    }

    // Close button click
    if (btnClose) {
      btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeWindow(id);
      });
    }

    // Minimize button click
    if (btnMinimize) {
      btnMinimize.addEventListener('click', (e) => {
        e.stopPropagation();
        minimizeWindow(id);
      });
    }

    // Maximize button click
    if (btnMaximize) {
      btnMaximize.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMaximize(id);
      });
    }

    // Focus on window click
    win.addEventListener('mousedown', () => {
      focusWindow(win);
    });
  });

  // Folder double-click / click handlers
  const folders = document.querySelectorAll('.folder-item');
  folders.forEach((folder) => {
    folder.addEventListener('click', () => {
      const winId = folder.getAttribute('data-window');
      if (winId) {
        openWindow(winId);
      }
    });
  });

  // Top Menu click handlers to open corresponding windows
  const menuLinks = document.querySelectorAll('[data-menu-window]');
  menuLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const winId = link.getAttribute('data-menu-window');
      if (winId) {
        openWindow(winId);
      }
    });
  });
}

// Center Window inside the Desktop area
function centerWindow(win) {
  const desktop = document.querySelector('.desktop');
  const desktopWidth = desktop.clientWidth;
  const desktopHeight = desktop.clientHeight;
  const winWidth = win.clientWidth || 680;
  const winHeight = win.clientHeight || 480;

  const left = Math.max(20, (desktopWidth - winWidth) / 2 + (Math.random() * 40 - 20));
  const top = Math.max(50, (desktopHeight - winHeight) / 2 + (Math.random() * 40 - 20));

  win.style.left = `${left}px`;
  win.style.top = `${top}px`;
  
  // Save initial position
  windowPositions[win.id] = { left: `${left}px`, top: `${top}px`, width: `${winWidth}px`, height: `${winHeight}px` };
}

// Make Element Draggable (mouse & touch support)
function makeDraggable(el, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  const dragStart = (e) => {
    // Prevent drag if maximized
    if (el.classList.contains('maximized')) return;
    
    // Only support left-click drag
    if (e.type === 'mousedown' && e.button !== 0) return;

    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    pos3 = clientX;
    pos4 = clientY;

    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('touchend', dragEnd);

    focusWindow(el);
  };

  const dragMove = (e) => {
    e.preventDefault(); // Prevent text selection / scrolling while dragging
    
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    pos1 = pos3 - clientX;
    pos2 = pos4 - clientY;
    pos3 = clientX;
    pos4 = clientY;

    // Calculate new position
    let newTop = el.offsetTop - pos2;
    let newLeft = el.offsetLeft - pos1;

    // Simple bounds check (keep header bar readable)
    if (newTop < 32) newTop = 32;

    el.style.top = `${newTop}px`;
    el.style.left = `${newLeft}px`;
  };

  const dragEnd = () => {
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('touchend', dragEnd);
  };

  handle.addEventListener('mousedown', dragStart);
  handle.addEventListener('touchstart', dragStart, { passive: true });
}

// Bring active window to front
function focusWindow(win) {
  if (win.classList.contains('active-window')) return;

  document.querySelectorAll('.window').forEach((w) => {
    w.classList.remove('active-window');
  });

  highestZIndex += 1;
  win.style.zIndex = highestZIndex;
  win.classList.add('active-window');
}

// Open Window
function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  // If minimized, restore it
  if (win.classList.contains('minimized')) {
    win.classList.remove('minimized');
  }

  win.classList.add('show');
  focusWindow(win);
}

// Close Window
function closeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.remove('show');
}

// Minimize Window
function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.add('minimized');
}

// Toggle Maximize / Unmaximize
function toggleMaximize(id) {
  const win = document.getElementById(id);
  if (!win) return;

  if (win.classList.contains('maximized')) {
    // Restore size and position
    win.classList.remove('maximized');
    const pos = windowPositions[id];
    if (pos) {
      win.style.top = pos.top;
      win.style.left = pos.left;
      win.style.width = pos.width;
      win.style.height = pos.height;
    }
  } else {
    // Save current size/position first
    windowPositions[id] = {
      top: win.style.top,
      left: win.style.left,
      width: win.style.width,
      height: win.style.height
    };
    
    // Maximize
    win.classList.add('maximized');
    win.style.top = '';
    win.style.left = '';
    win.style.width = '';
    win.style.height = '';
  }
}

// 3. DOCK CONTROLLER
function initDock() {
  const dockItems = document.querySelectorAll('.dock-item');
  
  dockItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      // Add custom click bounce effect (macOS style)
      item.classList.add('bounce');
      setTimeout(() => {
        item.classList.remove('bounce');
      }, 500);
      
      const link = item.getAttribute('data-link');
      if (link) {
        if (link.startsWith('mailto:') || link.startsWith('tel:')) {
          window.location.href = link;
        } else {
          window.open(link, '_blank');
        }
      }
    });
  });
}
