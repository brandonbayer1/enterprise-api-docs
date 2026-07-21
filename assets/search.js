(function () {
  /** @type {{ title: string, url: string, content: string }[] | null} */
  let index = null;

  const dialog = document.createElement('dialog');
  dialog.id = 'search-dialog';
  dialog.innerHTML = `
    <div class="search-panel">
      <input type="search" placeholder="Search documentation…" aria-label="Search documentation" />
      <ul class="search-results"></ul>
    </div>`;
  document.body.appendChild(dialog);

  const input = dialog.querySelector('input');
  const results = dialog.querySelector('.search-results');

  async function loadIndex() {
    if (index) return index;
    const resp = await fetch('/search-index.json');
    index = await resp.json();
    return index;
  }

  function renderResults(query) {
    if (!index || !results) return;
    const q = query.trim().toLowerCase();
    results.innerHTML = '';
    if (!q) return;

    const hits = index
      .filter(
        (entry) =>
          entry.title.toLowerCase().includes(q) ||
          entry.content.toLowerCase().includes(q),
      )
      .slice(0, 12);

    for (const hit of hits) {
      const li = document.createElement('li');
      li.innerHTML = `<a href="${hit.url}"><strong>${escapeHtml(hit.title)}</strong><small>${escapeHtml(hit.content.slice(0, 120))}</small></a>`;
      li.querySelector('a')?.addEventListener('click', () => dialog.close());
      results.appendChild(li);
    }

    if (!hits.length) {
      results.innerHTML = '<li><span>No results found.</span></li>';
    }
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function openSearch() {
    loadIndex().then(() => {
      dialog.showModal();
      input?.focus();
      renderResults(input?.value ?? '');
    });
  }

  document.querySelectorAll('[data-search-open]').forEach((btn) => {
    btn.addEventListener('click', openSearch);
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
    }
  });

  input?.addEventListener('input', () => renderResults(input.value));
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
})();
