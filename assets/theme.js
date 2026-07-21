(function () {
  try {
    const systemMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    document.documentElement.dataset.colorMode = systemMode;
    document.body.classList.add(systemMode + '-mode');
  } catch {}
})();
