// Lab Notebook · v24 (main site): performance. Sheets far from the screen get .off, which pauses
// every CSS animation inside them, so dozens of infinite loops no longer run where nobody can see them.
(function offscreenPause(){
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('off', !e.isIntersecting)),
    {rootMargin: '300px 0px'});
  document.querySelectorAll('.sheet').forEach(s => io.observe(s));
})();
