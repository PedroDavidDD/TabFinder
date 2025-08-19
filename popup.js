document.addEventListener('DOMContentLoaded', () => {
  const tabList = document.getElementById('tabList');
  const searchInput = document.getElementById('searchInput');

  // Cargar pestañas al abrir
  loadTabs();

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