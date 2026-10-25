(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.dash-tabs [role="tab"]'));
  var panels = document.querySelectorAll('[data-tab-panel]');

  function showTab(tab) {
    var name = tab.getAttribute('data-tab');
    tabs.forEach(function (t) {
      var active = t === tab;
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      t.tabIndex = active ? 0 : -1;
    });
    // Panels are only hidden, never removed, so cards inside still exist
    panels.forEach(function (p) {
      p.hidden = p.getAttribute('data-tab-panel') !== name;
    });
    history.replaceState(null, '', '#' + name);
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { showTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var next;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (next) { next.focus(); showTab(next); }
    });
  });

  // Open the tab named in the URL, e.g. dashboard.html#claims
  var initial = tabs.filter(function (t) {
    return '#' + t.getAttribute('data-tab') === location.hash;
  })[0];
  showTab(initial || tabs[0]);
})();