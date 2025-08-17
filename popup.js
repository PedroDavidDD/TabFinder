document.addEventListener('DOMContentLoaded', () => {
  const tabList = document.getElementById('tabList');
  let scrollTimeout;
  let scrollAccumulator = 0;
  const SCROLL_THRESHOLD = 100;
  let queryOptions = { currentWindow: true, active: true }

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
      navigateToTab(direction);
    }
  }

  function navigateToTab(direction) {
    chrome.tabs.query(queryOptions, async (tabs) => {
      if (tabs.length === 0) return;
      // Pestaña activa actual
      const currentTab = tabs[0];
      // Obtener todas las pestañas
      const allTabs = await chrome.tabs.query({ currentWindow: true });
      // Obtener la pestaña actual entre todos
      const currentIndex = allTabs.findIndex(tab => tab.id === currentTab.id);
      // indice [0,1,2] -> [1] +1 -> [2]
      const newIndex = currentIndex + direction;
      // navegacion mutable;
      let currentTabId = 0;

      if (newIndex >= 0 && newIndex < allTabs.length) {
        currentTabId = allTabs[newIndex].id;
      } else if (newIndex >= allTabs.length) {
        currentTabId = allTabs[0].id;
      } else if (newIndex < 0) {
        currentTabId = allTabs[allTabs.length - 1].id;
      }

      chrome.tabs.update(currentTabId, { active: true });
    });
  }

});