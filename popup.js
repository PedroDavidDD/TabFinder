document.addEventListener('DOMContentLoaded', () => {
  const tabList = document.getElementById('tabList');
  let scrollTimeout;
  let scrollAccumulator = 0;
  const SCROLL_THRESHOLD = 100;

  // Cargar pestañas al abrir
  loadTabs();

  // Configurar el evento de scroll
  tabList.addEventListener('wheel', handleScroll, { passive: false });

  function loadTabs() {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      tabList.innerHTML = tabs.map(tab => `
        <div class="tab-item" data-tab-id="${tab.id}">
          <img src="${tab.favIconUrl || 'icons/icon16.png'}" alt="Favicon">
          <span>${tab.title}</span>
        </div>
      `).join('');
    });
  }

  function handleScroll(e) {
    e.preventDefault();
    scrollAccumulator += e.deltaY;

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      scrollAccumulator = 0;
    }, 200);

    if (Math.abs(scrollAccumulator) >= SCROLL_THRESHOLD) {
      const direction = Math.sign(scrollAccumulator);
      scrollAccumulator = 0;
      moveCurrentTab(direction);
    }
  }

  function moveCurrentTab(direction) {
    let queryOptions = { currentWindow: true, active: true }

    chrome.tabs.query(queryOptions, async (tabs) => {
      if (tabs.length === 0) return;

      const currentTab = tabs[0]; // Pestaña activa actual
      const allTabs = await chrome.tabs.query({ currentWindow: true });
      const currentIndex = allTabs.findIndex(tab => tab.id === currentTab.id);
      const newIndex = currentIndex + direction;

      if (newIndex >= 0 && newIndex < allTabs.length) {
        chrome.tabs.move(currentTab.id, { index: newIndex }, () => {
          loadTabs(); // Recargar la lista
        });
      }
    });
  }

  function ReloadCurrentPage() {
    // Obtener la pestaña activa actual y recargarla
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      const currentTab = tabs[0];

      // Recargar la pestaña
      chrome.tabs.reload(currentTab.id);
    });
  }

});