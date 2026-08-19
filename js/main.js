(function(){
  'use strict';

  var SILHOUETTE_SVG = '<svg class="silhouette-icon" viewBox="0 0 64 76" fill="currentColor" aria-hidden="true"><circle cx="32" cy="12" r="8.5"/><path d="M20 24c0-3 5-4.5 12-4.5s12 1.5 12 4.5l3 17c1 4-6 7-15 7s-16-3-15-7z"/><circle cx="16" cy="28" r="6.5"/><path d="M22 26 13 23 10 29 18 33Z"/><circle cx="48" cy="28" r="6.5"/><path d="M42 26 51 23 54 29 46 33Z"/><path d="M23 42l-6 24h8l5-20z"/><path d="M41 42l6 24h-8l-5-20z"/></svg>';

  function escapeHtml(str){
    return String(str == null ? '' : str).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function photoOrSilhouette(photoUrl, altText){
    if(photoUrl){
      return '<img src="' + escapeHtml(photoUrl) + '" alt="' + escapeHtml(altText) + '" style="width:100%;height:100%;object-fit:cover;">';
    }
    return SILHOUETTE_SVG;
  }

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

  /* ---------- Scroll-reveal animations (call after content is rendered) ---------- */
  function setupReveal(){
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
  }

  /* ---------- Countdown ticker (call after the fight card with #countdown exists) ---------- */
  function setupCountdown(){
    var countdownEl = document.getElementById('countdown');
    if(!countdownEl) return;
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

  /* ---------- Past results modal (call after event-cards are rendered) ---------- */
  function setupModal(eventData){
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
  }

  /* ---------- Render: hero + contact (from content/settings.json) ---------- */
  function renderSettings(settings){
    var hero = settings.hero || {};
    var contact = settings.contact || {};

    var eyebrowEl = document.getElementById('heroEyebrow');
    var titleEl = document.getElementById('heroTitle');
    var subEl = document.getElementById('heroSub');
    var imgEl = document.getElementById('heroImg');
    if(eyebrowEl) eyebrowEl.textContent = hero.eyebrow || '';
    if(titleEl) titleEl.innerHTML = escapeHtml(hero.titleLine1 || '') + '<br>' + escapeHtml(hero.titleLine2 || '');
    if(subEl) subEl.textContent = hero.subhead || '';
    if(imgEl && hero.image) imgEl.src = hero.image;

    var phoneEl = document.getElementById('contactPhone');
    var emailEl = document.getElementById('contactEmail');
    var officeEl = document.getElementById('contactOffice');
    if(phoneEl) phoneEl.textContent = contact.phone || '';
    if(emailEl) emailEl.textContent = contact.email || '';
    if(officeEl) officeEl.textContent = contact.office || '';
  }

  /* ---------- Render: fights (schedule + past results) from content/fights.json ---------- */
  function renderFights(fights){
    var fightListEl = document.getElementById('fightList');
    var resultsGridEl = document.getElementById('resultsGrid');
    if(!fightListEl || !resultsGridEl) return;

    var upcoming = fights.filter(function(f){ return f.status === 'upcoming'; })
      .sort(function(a, b){ return new Date(a.date) - new Date(b.date); });
    var completed = fights.filter(function(f){ return f.status === 'completed'; })
      .sort(function(a, b){ return new Date(b.date) - new Date(a.date); });

    var fightCardsHtml = upcoming.map(function(fight, i){
      var badge = fight.badge || 'Upcoming';
      var accentClass = badge.toLowerCase() === 'upcoming' ? '' : ' status-chip--accent';
      var a = fight.fighterA || {};
      var b = fight.fighterB || {};

      var countdownHtml = '';
      if(i === 0 && fight.date){
        countdownHtml =
          '<div class="countdown" id="countdown" data-target="' + escapeHtml(fight.date) + '">' +
            '<div class="countdown-unit"><span class="countdown-num" id="cdDays">00</span><span class="countdown-label">Days</span></div>' +
            '<div class="countdown-unit"><span class="countdown-num" id="cdHours">00</span><span class="countdown-label">Hours</span></div>' +
            '<div class="countdown-unit"><span class="countdown-num" id="cdMinutes">00</span><span class="countdown-label">Minutes</span></div>' +
            '<div class="countdown-unit"><span class="countdown-num" id="cdSeconds">00</span><span class="countdown-label">Seconds</span></div>' +
          '</div>';
      }

      return (
        '<article class="fight-card reveal">' +
          '<div class="fight-card-info">' +
            '<span class="status-chip' + accentClass + '">' + escapeHtml(badge) + '</span>' +
            '<h3 class="fight-card-title">' + escapeHtml(fight.title) + '</h3>' +
            '<div class="fight-card-meta">' +
              '<span class="meta-item">' + escapeHtml(fight.dateLabel) + '</span>' +
              '<span class="meta-item">' + escapeHtml(fight.venue || '') + '</span>' +
            '</div>' +
            countdownHtml +
            '<a href="' + escapeHtml(fight.ticketLink || '#contact') + '" class="btn btn-primary">Buy Tickets</a>' +
          '</div>' +
          '<div class="fight-card-matchup">' +
            '<div class="fight-fighter">' +
              '<div class="silhouette-box"><div class="silhouette-box-inner">' + photoOrSilhouette(a.photo, a.name) + '</div></div>' +
              '<h4>' + escapeHtml(a.name) + '</h4>' +
              '<span class="fight-record">' + escapeHtml(a.record || '') + '</span>' +
            '</div>' +
            '<span class="vs-badge">VS</span>' +
            '<div class="fight-fighter">' +
              '<div class="silhouette-box"><div class="silhouette-box-inner">' + photoOrSilhouette(b.photo, b.name) + '</div></div>' +
              '<h4>' + escapeHtml(b.name) + '</h4>' +
              '<span class="fight-record">' + escapeHtml(b.record || '') + '</span>' +
            '</div>' +
          '</div>' +
          '<span class="fight-card-class">' + escapeHtml(fight.weightClass || '') + '</span>' +
        '</article>'
      );
    }).join('');
    fightListEl.innerHTML = fightCardsHtml;

    var eventData = {};
    var resultsHtml = completed.map(function(fight, i){
      var id = String(i + 1);
      eventData[id] = {
        date: fight.dateLabel,
        title: fight.title,
        result: fight.result || '',
        desc: fight.recap || ''
      };
      return (
        '<button class="event-card reveal" data-event="' + id + '">' +
          '<div class="event-card-media" aria-hidden="true"></div>' +
          '<div class="event-card-body">' +
            '<span class="event-date">' + escapeHtml(fight.dateLabel) + '</span>' +
            '<h3>' + escapeHtml(fight.title) + '</h3>' +
            '<p>' + escapeHtml(fight.result || '') + '</p>' +
          '</div>' +
        '</button>'
      );
    }).join('');
    resultsGridEl.innerHTML = resultsHtml;

    return { eventData: eventData };
  }

  /* ---------- Render: roster from content/fighters.json ---------- */
  function renderRoster(fighters){
    var el = document.getElementById('rosterList');
    if(!el) return;
    el.innerHTML = fighters.map(function(f){
      return (
        '<article class="roster-row reveal">' +
          '<div class="roster-photo">' + photoOrSilhouette(f.photo, f.name) + '</div>' +
          '<div class="roster-row-body">' +
            '<span class="roster-row-division">' + escapeHtml(f.division || '') + ' Division</span>' +
            '<h3 class="roster-row-name">' + escapeHtml(f.name) + '</h3>' +
            '<div class="roster-stats">' +
              '<div class="stat"><span class="stat-num">' + escapeHtml(f.wins) + '</span><span class="stat-label">Wins</span></div>' +
              '<div class="stat"><span class="stat-num">' + escapeHtml(f.losses) + '</span><span class="stat-label">Losses</span></div>' +
              '<div class="stat"><span class="stat-num">' + escapeHtml(f.draws) + '</span><span class="stat-label">Draws</span></div>' +
              '<div class="stat"><span class="stat-num">' + escapeHtml(f.kos) + '</span><span class="stat-label">KOs</span></div>' +
            '</div>' +
            '<p class="roster-row-bio">' + escapeHtml(f.bio || '') + '</p>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  /* ---------- Render: news from content/news.json ---------- */
  function renderNews(posts){
    var el = document.getElementById('newsList');
    if(!el) return;
    el.innerHTML = posts.map(function(p){
      return (
        '<a class="news-row reveal" href="' + escapeHtml(p.link || '#') + '">' +
          '<span class="news-row-date">' + escapeHtml(p.dateLabel) + '</span>' +
          '<span class="news-row-main">' +
            '<span class="news-row-tag">' + escapeHtml(p.tag || '') + '</span>' +
            '<h3 class="news-row-title">' + escapeHtml(p.title) + '</h3>' +
            '<span class="news-row-excerpt">' + escapeHtml(p.excerpt || '') + '</span>' +
          '</span>' +
          '<span class="news-row-arrow" aria-hidden="true">&rarr;</span>' +
        '</a>'
      );
    }).join('');
  }

  /* ---------- Boot: fetch all content, render, then wire up behavior ---------- */
  function fetchJson(path){
    return fetch(path).then(function(res){
      if(!res.ok) throw new Error('Failed to load ' + path + ' (' + res.status + ')');
      return res.json();
    });
  }

  Promise.all([
    fetchJson('content/settings.json'),
    fetchJson('content/fights.json'),
    fetchJson('content/fighters.json'),
    fetchJson('content/news.json')
  ]).then(function(results){
    var settings = results[0];
    var fightsData = results[1];
    var fightersData = results[2];
    var newsData = results[3];

    renderSettings(settings);
    var fightsResult = renderFights(fightsData.fights || []);
    renderRoster(fightersData.fighters || []);
    renderNews(newsData.posts || []);

    setupReveal();
    setupCountdown();
    setupModal(fightsResult.eventData);
  }).catch(function(err){
    console.error('Heavy Hitters: failed to load site content', err);
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
