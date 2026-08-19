(function(){
  'use strict';

  var DEFAULT_THEME = 'classic';
  var DEFAULT_FONT = 'bigshoulders-worksans';
  var STORAGE_KEY = 'hh-demo-theme';

  var body = document.body;
  var customizer = document.getElementById('customizer');
  var tab = document.getElementById('customizerTab');
  var closeBtn = document.getElementById('customizerClose');
  var resetBtn = document.getElementById('customizerReset');
  var themeSwatches = document.getElementById('themeSwatches');
  var fontList = document.getElementById('fontList');

  function applyState(theme, font){
    body.setAttribute('data-theme', theme);
    body.setAttribute('data-font', font);

    themeSwatches.querySelectorAll('.swatch').forEach(function(el){
      el.classList.toggle('active', el.getAttribute('data-theme') === theme);
    });
    fontList.querySelectorAll('.font-option').forEach(function(el){
      el.classList.toggle('active', el.getAttribute('data-font') === font);
    });
  }

  function save(theme, font){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: theme, font: font }));
    } catch(e){ /* localStorage unavailable — ignore, demo state just won't persist */ }
  }

  function load(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(raw) return JSON.parse(raw);
    } catch(e){ /* ignore */ }
    return null;
  }

  var saved = load();
  applyState(
    (saved && saved.theme) || DEFAULT_THEME,
    (saved && saved.font) || DEFAULT_FONT
  );

  themeSwatches.addEventListener('click', function(e){
    var btn = e.target.closest('.swatch');
    if(!btn) return;
    var theme = btn.getAttribute('data-theme');
    var font = body.getAttribute('data-font');
    applyState(theme, font);
    save(theme, font);
  });

  fontList.addEventListener('click', function(e){
    var btn = e.target.closest('.font-option');
    if(!btn) return;
    var font = btn.getAttribute('data-font');
    var theme = body.getAttribute('data-theme');
    applyState(theme, font);
    save(theme, font);
  });

  resetBtn.addEventListener('click', function(){
    applyState(DEFAULT_THEME, DEFAULT_FONT);
    save(DEFAULT_THEME, DEFAULT_FONT);
  });

  function openPanel(){
    customizer.classList.add('open');
    tab.setAttribute('aria-expanded', 'true');
  }
  function closePanel(){
    customizer.classList.remove('open');
    tab.setAttribute('aria-expanded', 'false');
  }

  tab.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && customizer.classList.contains('open')) closePanel();
  });

})();
