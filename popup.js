document.addEventListener('DOMContentLoaded', () => {
  const tabList = document.getElementById('tabList');
  const searchInput = document.getElementById('searchInput');

  let scrollTimeout;
  let scrollAccumulator = 0;
  // Umbral de desplazamiento
  const SCROLL_THRESHOLD = 100;

  // Cargar pestañas al abrir
  loadTabs();

  // Configurar el evento de scroll
  // tabList.addEventListener('wheel', handleScroll, { passive: false });
  
  // Actualiza el listado de pestañas
  searchInput.addEventListener("input", handleSearch);

  // Cargar todas las pestañas
  function loadTabs() {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      tabList.innerHTML = tabs.map(tab => `
        <div class="tab-item" data-tab-id="${tab.id}">
          <img src="${tab.favIconUrl || 'icons/icon16.png'}" alt="Favicon">
          <span>${tab.title}</span>
        </div>
      `).join('');

      // Ir al seleccionar una pestaña
      handleSelect();
    });
  }

  // Maneja el scroll para navegar entre pestañas
  function handleScroll(e) {
    e.preventDefault();
    scrollAccumulator += e.deltaY;

    // Verificamos si el movimiento acumulado es SUFICIENTEMENTE GRANDE
    const scrollSuficiente = Math.abs(scrollAccumulator) >= SCROLL_THRESHOLD;

    if (scrollSuficiente) {
      const direction = Math.sign(scrollAccumulator);
      navigateToTab(direction);
      scrollAccumulator = 0;
    }

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      scrollAccumulator = 0;
    }, 200);
  }

  // Navega a la pestaña en la dirección según el scroll
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

  // Maneja la búsqueda de pestañas
  function handleSearch() {
    const query = searchInput.value.toLowerCase();
    const tabItems = document.querySelectorAll(".tab-item");

    tabItems.forEach(item => {
      const title = item.textContent.toLowerCase();
      item.style.display = title.includes(query) ? "block" : "none";
    });
    
    // Maneja la selección de la primera pestaña visible al presionar Enter
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        selectFirstVisibleTab();
      }
    });
  }

  // Maneja la selección de pestañas
  function handleSelect() {
    document.querySelectorAll('.tab-item').forEach(item => {
      item.addEventListener("click", () => {
        const tabId = parseInt(item.dataset.tabId);
        chrome.tabs.update(tabId, { active: true });
      });
    });
  }

  // Selecciona la primera pestaña visible
  function selectFirstVisibleTab() {
    const tabItems = Array.from(document.querySelectorAll(".tab-item"))
      .filter(item => item.style.display !== "none");
    if (tabItems.length > 0) {
      const tabId = parseInt(tabItems[0].dataset.tabId);
      chrome.tabs.update(tabId, { active: true });
    }
  }
});