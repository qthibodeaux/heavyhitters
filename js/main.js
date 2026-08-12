(function(){
  'use strict';

  /* ---------- Sticky header shadow ---------- */
  var header = document.getElementById('siteHeader');
  function onScroll(){
    header.classList.toggle('scrolled', window.scrollY > 20);
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', function(){
    var isOpen = mainNav.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  mainNav.querySelectorAll('a').forEach(function(link){
    link.addEventListener('click', function(){
      mainNav.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Scroll-reveal animations ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in-view'); });
  }

  /* ---------- Countdown ticker ---------- */
  var countdownEl = document.getElementById('countdown');
  if(countdownEl){
    var target = new Date(countdownEl.getAttribute('data-target')).getTime();
    var elDays = document.getElementById('cdDays');
    var elHours = document.getElementById('cdHours');
    var elMinutes = document.getElementById('cdMinutes');
    var elSeconds = document.getElementById('cdSeconds');

    function pad(n){ return String(n).padStart(2, '0'); }

    function tick(){
      var diff = target - Date.now();
      if(diff <= 0){
        elDays.textContent = elHours.textContent = elMinutes.textContent = elSeconds.textContent = '00';
        clearInterval(timer);
        return;
      }
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var minutes = Math.floor((diff % 3600000) / 60000);
      var seconds = Math.floor((diff % 60000) / 1000);
      elDays.textContent = pad(days);
      elHours.textContent = pad(hours);
      elMinutes.textContent = pad(minutes);
      elSeconds.textContent = pad(seconds);
    }
    tick();
    var timer = setInterval(tick, 1000);
  }

  /* ---------- Past events modal ---------- */
  var eventData = {
    '1': {
      date: 'June 14, 2025',
      title: 'Night of Champions',
      result: 'Marcus Reyes def. Diego Ortiz — TKO Round 7',
      desc: 'A sold-out crowd at Toyota Center watched Reyes retain his title with a devastating body-shot stoppage in the seventh. Full fight recap and photo gallery coming soon.'
    },
    '2': {
      date: 'February 22, 2025',
      title: 'Winter Brawl',
      result: 'Dante Cole def. Rafael Vasquez — Unanimous Decision',
      desc: 'A grueling twelve-round battle that went the distance, with Cole taking the nod on all three scorecards in a close, fan-friendly war.'
    },
    '3': {
      date: 'November 9, 2024',
      title: 'Homecoming Showdown',
      result: 'Marcus Reyes def. Jamal Blackwell — KO Round 3',
      desc: 'Reyes announced himself on the local scene with a highlight-reel knockout in front of his hometown crowd.'
    },
    '4': {
      date: 'August 3, 2024',
      title: 'Summer Slugfest',
      result: 'Dante Cole def. Kevin Nguyen — TKO Round 5',
      desc: 'A relentless body-attack forced the stoppage in round five, launching Cole into title contention.'
    }
  };

  var modal = document.getElementById('eventModal');
  var modalDate = document.getElementById('modalDate');
  var modalTitle = document.getElementById('modalTitle');
  var modalResult = document.getElementById('modalResult');
  var modalDesc = document.getElementById('modalDesc');
  var lastFocused = null;

  function openModal(id){
    var data = eventData[id];
    if(!data) return;
    modalDate.textContent = data.date;
    modalTitle.textContent = data.title;
    modalResult.textContent = data.result;
    modalDesc.textContent = data.desc;
    lastFocused = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close').focus();
  }

  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if(lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('.event-card').forEach(function(card){
    card.addEventListener('click', function(){
      openModal(card.getAttribute('data-event'));
    });
  });

  modal.querySelectorAll('[data-close-modal]').forEach(function(el){
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  /* ---------- Contact form validation (UI only — no backend wired yet) ---------- */
  var form = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');

  function validateField(field){
    var row = field.closest('.form-row');
    var valid = field.checkValidity();
    row.classList.toggle('invalid', !valid);
    return valid;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    formSuccess.classList.remove('show');

    var fields = form.querySelectorAll('input, select, textarea');
    var allValid = true;
    fields.forEach(function(field){
      if(!validateField(field)) allValid = false;
    });

    if(allValid){
      formSuccess.classList.add('show');
      form.reset();
      fields.forEach(function(field){
        field.closest('.form-row').classList.remove('invalid');
      });
    } else {
      var firstInvalid = form.querySelector('.form-row.invalid input, .form-row.invalid select, .form-row.invalid textarea');
      if(firstInvalid) firstInvalid.focus();
    }
  });

  form.querySelectorAll('input, select, textarea').forEach(function(field){
    field.addEventListener('blur', function(){ validateField(field); });
  });

})();
