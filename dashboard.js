const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.tab-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.hidden = true);
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).hidden = false;
  });
});