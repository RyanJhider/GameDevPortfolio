(function () {
  // Mapping between pathname segment and the data-page value on links.
  function currentPage() {
    var path = (location.pathname || '').toLowerCase();
    if (path.indexOf('projects') !== -1) return 'projects';
    if (path.indexOf('about') !== -1) return 'about';
    return 'home';
  }

  function positionIndicatorOn(link) {
    var indicator = document.querySelector('.site-nav__indicator');
    if (!indicator || !link) return;
    indicator.style.transition = 'none';
    indicator.style.width = link.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    indicator.style.opacity = '1';
    // force reflow then restore transition for hover
    void indicator.offsetWidth;
    indicator.style.transition = '';
  }

  function placeActive() {
    var active = document.querySelector('.site-nav__link.is-active');
    if (active) positionIndicatorOn(active);
  }

  function setActive(page) {
    var links = document.querySelectorAll('.site-nav__link');
    var matched = null;
    links.forEach(function (l) {
      var match = l.getAttribute('data-page') === page;
      l.classList.toggle('is-active', match);
      if (match) matched = l;
    });
    // Two RAFs: wait for fonts/layout, then measure
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { placeActive(); });
    });
  }

  function wireScrollShadow() {
    var header = document.getElementById('site-header');
    if (!header) return;
    function update() {
      var scrolled = window.scrollY > 10;
      header.classList.toggle('is-scrolled', scrolled);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function wireHover() {
    var nav = document.querySelector('.site-nav');
    var indicator = document.querySelector('.site-nav__indicator');
    if (!nav || !indicator) return;
    nav.querySelectorAll('.site-nav__link').forEach(function (link) {
      link.addEventListener('mouseenter', function () { positionIndicatorOn(link); });
    });
    nav.addEventListener('mouseleave', function () { placeActive(); });
  }

  function init() {
    setActive(currentPage());
    wireHover();
    wireScrollShadow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', placeActive);
  window.addEventListener('resize', placeActive);
})();
