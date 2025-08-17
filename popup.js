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
    chrome.tabs.query({ currentWindow: true }, (allTabs) => {
      if (allTabs.length === 0) return;

      chrome.tabs.query({ active: true, currentWindow: true }, ([currentTab]) => {
        if (!currentTab) return;

        const currentIndex = allTabs.findIndex(tab => tab.id === currentTab.id);
        // Valida -1 significa que no se encontró la pestaña
        if (currentIndex === -1) return;
        // [0,1,2] -> [0]-1 = [-1] -> [0]+1 = [1] -> [1]+1 = [2] -> [2]+1 = [3]
        let newIndex = currentIndex + direction;
        // Ajuste circular sin condicionales: [-1 1 2 3] + 3 % 3 = [2 1 2 0];
        // Facilita la navegacion entre pestañas por usar el operador % y el tamaño del array.
        newIndex = (newIndex + allTabs.length) % allTabs.length;
        // Actualiza la pestaña activa
        chrome.tabs.update(allTabs[newIndex].id, { active: true });

        loadTabs();
      });
    });
  }

});