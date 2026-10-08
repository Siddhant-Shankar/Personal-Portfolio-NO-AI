/* The public repository excludes the résumé PDF. If it isn't deployed, hide résumé links rather than lead to a 404. */
(() => {
  const links = [...document.querySelectorAll('a[href="resume.pdf"]')];
  if (!links.length || location.protocol === 'file:') return;
  fetch('resume.pdf', { method: 'HEAD', cache: 'no-store' })
    .then(r => {
      if (!r.ok || !/pdf/i.test(r.headers.get('content-type') || '')) throw 0;
    })
    .catch(() =>
      links.forEach(a => {
        a.hidden = true;
        a.style.display = 'none';
      }),
    );
})();
