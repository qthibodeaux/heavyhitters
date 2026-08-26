(function(){
  'use strict';

  var SILHOUETTE_SVG = '<svg class="silhouette-icon" viewBox="0 0 64 76" fill="currentColor" aria-hidden="true"><circle cx="32" cy="12" r="8.5"/><path d="M20 24c0-3 5-4.5 12-4.5s12 1.5 12 4.5l3 17c1 4-6 7-15 7s-16-3-15-7z"/><circle cx="16" cy="28" r="6.5"/><path d="M22 26 13 23 10 29 18 33Z"/><circle cx="48" cy="28" r="6.5"/><path d="M42 26 51 23 54 29 46 33Z"/><path d="M23 42l-6 24h8l5-20z"/><path d="M41 42l6 24h-8l-5-20z"/></svg>';

  /* Generic placeholder icons for media slots without an org/community equivalent to the fighter silhouette above. */
  var ORG_SVG = '<svg class="silhouette-icon" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><rect x="10" y="26" width="44" height="30" rx="2"/><path d="M32 6 8 22h48z"/><rect x="20" y="34" width="6" height="8" fill="#101010"/><rect x="29" y="34" width="6" height="8" fill="#101010"/><rect x="38" y="34" width="6" height="8" fill="#101010"/><rect x="20" y="46" width="6" height="8" fill="#101010"/><rect x="29" y="46" width="6" height="8" fill="#101010"/><rect x="38" y="46" width="6" height="8" fill="#101010"/></svg>';
  var COMMUNITY_SVG = '<svg class="silhouette-icon" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><circle cx="18" cy="20" r="8"/><circle cx="46" cy="20" r="8"/><path d="M4 52c0-10 7-16 14-16s14 6 14 16z"/><path d="M32 52c0-10 7-16 14-16s14 6 14 16z"/></svg>';

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

  /* ---------- Media slot resolver ----------
     Renders whichever of videoFile / youtubeUrl / image is present on a
     Decap "Media" object (fields always exist; whichever one is filled in
     wins, checked in that priority order), or a designed pending-state
     placeholder when none are. Reused by Mission, About, and Interviews. */
  function getYouTubeId(url){
    if(!url) return '';
    var m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return m ? m[1] : '';
  }

  function renderMediaSlot(el, media, placeholderSvg, altText){
    if(!el) return;
    media = media || {};
    var alt = escapeHtml(altText || '');
    var hasMedia = true;
    var inner;
    if(media.videoFile){
      inner = '<video src="' + escapeHtml(media.videoFile) + '" controls playsinline preload="metadata"></video>';
    } else if(media.youtubeUrl && getYouTubeId(media.youtubeUrl)){
      inner = '<iframe src="https://www.youtube.com/embed/' + getYouTubeId(media.youtubeUrl) + '" title="' + alt + '" allowfullscreen loading="lazy"></iframe>';
    } else if(media.image){
      inner = '<img src="' + escapeHtml(media.image) + '" alt="' + alt + '">';
    } else {
      hasMedia = false;
      inner = '<div class="media-slot-placeholder">' + placeholderSvg + '<span class="media-pending-chip">Media Pending</span></div>';
    }
    if(hasMedia && media.caption){
      inner += '<span class="media-slot-caption">' + escapeHtml(media.caption) + '</span>';
    }
    el.innerHTML = inner;
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
    if(eyebrowEl) eyebrowEl.textContent = hero.eyebrow || '';
    if(titleEl) titleEl.innerHTML = escapeHtml(hero.titleLine1 || '') + '<br>' + escapeHtml(hero.titleLine2 || '');
    if(subEl) subEl.textContent = hero.subhead || '';

    var heroMediaEl = document.getElementById('heroMedia');
    if(heroMediaEl){
      var heroInner;
      if(hero.videoFile){
        heroInner = '<video src="' + escapeHtml(hero.videoFile) + '" autoplay muted loop playsinline' + (hero.image ? ' poster="' + escapeHtml(hero.image) + '"' : '') + '></video>';
      } else if(hero.youtubeUrl && getYouTubeId(hero.youtubeUrl)){
        heroInner = '<iframe src="https://www.youtube.com/embed/' + getYouTubeId(hero.youtubeUrl) + '?autoplay=1&mute=1&loop=1&playlist=' + getYouTubeId(hero.youtubeUrl) + '&controls=0&showinfo=0&modestbranding=1&rel=0" title="" allow="autoplay" tabindex="-1"></iframe>';
      } else {
        heroInner = '<img src="' + escapeHtml(hero.image || 'img/hero-ring.png') + '" alt="">';
      }
      heroMediaEl.innerHTML = heroInner;
    }

    var phoneEl = document.getElementById('contactPhone');
    var salesEmailEl = document.getElementById('contactSalesEmail');
    var partnershipsEmailEl = document.getElementById('contactPartnershipsEmail');
    var officeEl = document.getElementById('contactOffice');
    if(phoneEl) phoneEl.textContent = contact.phone || '';
    if(salesEmailEl) salesEmailEl.textContent = contact.salesEmail || '';
    if(partnershipsEmailEl) partnershipsEmailEl.textContent = contact.partnershipsEmail || '';
    if(officeEl) officeEl.textContent = contact.office || '';
  }

  /* ---------- Section visibility (from content/settings.json "sections") ----------
     Lets the client hide/show whole sections from Decap without any code
     changes — nothing is deleted, the section's content stays saved and
     just stops rendering on the page. Also hides any nav/footer link
     pointing at a hidden section so there's nothing dead to click. */
  function applySectionVisibility(sections){
    sections = sections || {};
    Object.keys(sections).forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.classList.toggle('is-hidden', sections[id] === false);
    });
    document.querySelectorAll('.main-nav a[href^="#"], .footer-links a[href^="#"]').forEach(function(link){
      var id = link.getAttribute('href').slice(1);
      var hidden = Object.prototype.hasOwnProperty.call(sections, id) && sections[id] === false;
      link.classList.toggle('is-hidden', hidden);
    });
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
    fightListEl.innerHTML = fightCardsHtml || '<p class="empty-state reveal">No fights scheduled yet — check back soon.</p>';

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
    resultsGridEl.innerHTML = resultsHtml || '<p class="empty-state reveal">No past results yet — this section fills in after the first event.</p>';

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

  /* ---------- Render: mission from content/mission.json ---------- */
  function renderMission(data){
    data = data || {};
    var beneficiary = data.beneficiary || {};
    var eyebrowEl = document.getElementById('missionEyebrow');
    var headingEl = document.getElementById('missionHeading');
    var bodyEl = document.getElementById('missionBody');
    if(eyebrowEl) eyebrowEl.textContent = data.eyebrow || '';
    if(headingEl) headingEl.textContent = data.heading || '';
    if(bodyEl) bodyEl.textContent = data.body || '';

    var labelEl = document.getElementById('beneficiaryEventLabel');
    var orgEl = document.getElementById('beneficiaryOrgName');
    var descEl = document.getElementById('beneficiaryDescription');
    var spokespersonEl = document.getElementById('beneficiarySpokesperson');
    if(labelEl) labelEl.textContent = beneficiary.eventLabel || '';
    if(orgEl) orgEl.textContent = beneficiary.orgName || '';
    if(descEl) descEl.textContent = beneficiary.description || '';
    if(spokespersonEl) spokespersonEl.textContent = beneficiary.spokesperson || '';

    renderMediaSlot(document.getElementById('beneficiaryMedia'), beneficiary.media, ORG_SVG, beneficiary.orgName);
  }

  /* ---------- Render: about from content/about.json ---------- */
  function renderAbout(data){
    data = data || {};
    var eyebrowEl = document.getElementById('aboutEyebrow');
    var headingEl = document.getElementById('aboutHeading');
    var bodyEl = document.getElementById('aboutBody');
    if(eyebrowEl) eyebrowEl.textContent = data.eyebrow || '';
    if(headingEl) headingEl.textContent = data.heading || '';
    if(bodyEl) bodyEl.textContent = data.body || '';

    renderMediaSlot(document.getElementById('aboutMedia'), data.media, ORG_SVG, data.heading);
  }

  /* ---------- Render: interviews from content/interviews.json ---------- */
  function renderInterviews(list){
    var el = document.getElementById('interviewGrid');
    if(!el) return;
    list = list || [];
    el.innerHTML = list.map(function(item, i){
      return (
        '<article class="interview-card reveal">' +
          '<div class="media-slot" id="interviewMedia' + i + '"></div>' +
          '<div class="interview-card-body">' +
            '<span class="interview-label">' + escapeHtml(item.label || '') + '</span>' +
            '<p class="interview-quote">' + escapeHtml(item.quote || '') + '</p>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    list.forEach(function(item, i){
      var label = (item.label || '').toLowerCase();
      var placeholder = ORG_SVG;
      if(label.indexOf('fight') > -1) placeholder = SILHOUETTE_SVG;
      else if(label.indexOf('commun') > -1) placeholder = COMMUNITY_SVG;
      renderMediaSlot(document.getElementById('interviewMedia' + i), item.media, placeholder, item.label);
    });
  }

  /* ---------- Render: partner logos from content/partners.json ---------- */
  function renderPartners(list){
    var el = document.getElementById('partnerGrid');
    if(!el) return;
    list = list || [];
    if(!list.length){
      el.innerHTML = '<p class="empty-state reveal">Partner logos coming soon.</p>';
      return;
    }
    el.innerHTML = list.map(function(p){
      var inner = p.logo
        ? '<img src="' + escapeHtml(p.logo) + '" alt="' + escapeHtml(p.name || '') + '">'
        : '<span class="partner-tile-placeholder">' + escapeHtml(p.name || 'Partner') + '</span>';
      if(p.link) inner = '<a href="' + escapeHtml(p.link) + '" target="_blank" rel="noopener">' + inner + '</a>';
      return '<div class="partner-tile reveal">' + inner + '</div>';
    }).join('');
  }

  /* ---------- Render: sponsorship pitch, stats, offerings, tiers, testimonials from content/sponsorship.json ---------- */
  function renderSponsorship(data){
    var pitch = data.pitch || {};
    var eyebrowEl = document.getElementById('sponsorEyebrow');
    var headingEl = document.getElementById('sponsorHeading');
    var bodyEl = document.getElementById('sponsorBody');
    if(eyebrowEl) eyebrowEl.textContent = pitch.eyebrow || '';
    if(headingEl) headingEl.textContent = pitch.heading || '';
    if(bodyEl) bodyEl.textContent = pitch.body || '';

    var statStripEl = document.getElementById('statStrip');
    if(statStripEl){
      var stats = data.stats || [];
      statStripEl.innerHTML = stats.map(function(stat){
        return (
          '<div class="stat-tile reveal">' +
            '<span class="stat-tile-value">' + escapeHtml(stat.value) + '</span>' +
            '<span class="stat-tile-label">' + escapeHtml(stat.label) + '</span>' +
          '</div>'
        );
      }).join('');
    }

    var offeringsEl = document.getElementById('offeringsGrid');
    if(offeringsEl){
      var offerings = data.offerings || [];
      offeringsEl.innerHTML = offerings.map(function(offering){
        return (
          '<article class="offering-card reveal">' +
            '<h4 class="offering-title">' + escapeHtml(offering.title) + '</h4>' +
            '<p class="offering-desc">' + escapeHtml(offering.description || '') + '</p>' +
          '</article>'
        );
      }).join('');
    }

    var categoriesEl = document.getElementById('packageCategories');
    if(categoriesEl){
      var packages = data.packages || [];
      var categoryOrder = ['Ring & Event Branding', 'Core Sponsorship', 'VIP & Corporate Hospitality'];
      var grouped = {};
      packages.forEach(function(pkg){
        var cat = pkg.category || 'Other';
        (grouped[cat] = grouped[cat] || []).push(pkg);
      });
      var categories = categoryOrder.filter(function(c){ return grouped[c] && grouped[c].length; });
      Object.keys(grouped).forEach(function(c){
        if(categories.indexOf(c) === -1) categories.push(c);
      });

      categoriesEl.innerHTML = categories.map(function(cat){
        var cards = grouped[cat].map(function(pkg){
          var featuredClass = pkg.featured ? ' package-card--featured' : '';
          var benefitsHtml = (pkg.benefits || []).map(function(b){
            return '<li>' + escapeHtml(b) + '</li>';
          }).join('');
          return (
            '<article class="package-card' + featuredClass + ' reveal">' +
              (pkg.featured ? '<span class="status-chip status-chip--accent package-badge">Featured</span>' : '') +
              '<h4 class="package-name">' + escapeHtml(pkg.name) + '</h4>' +
              (pkg.availability ? '<span class="package-availability">' + escapeHtml(pkg.availability) + '</span>' : '') +
              '<ul class="package-benefits">' + benefitsHtml + '</ul>' +
              '<a href="#contact" class="package-inquire-link">Inquire &rarr;</a>' +
            '</article>'
          );
        }).join('');
        return (
          '<div class="package-category reveal">' +
            '<h3 class="package-category-title">' + escapeHtml(cat) + '</h3>' +
            '<div class="package-grid">' + cards + '</div>' +
          '</div>'
        );
      }).join('');
    }

    var customEl = document.getElementById('customPartnerships');
    if(customEl){
      var custom = data.customPartnerships || {};
      var areasHtml = (custom.areas || []).map(function(area){
        return '<span class="custom-area-pill">' + escapeHtml(area) + '</span>';
      }).join('');
      customEl.innerHTML =
        '<h3>' + escapeHtml(custom.heading || '') + '</h3>' +
        '<p>' + escapeHtml(custom.body || '') + '</p>' +
        '<div class="custom-area-list">' + areasHtml + '</div>' +
        '<a href="#contact" class="btn btn-outline">Discuss A Custom Partnership</a>';
    }

    var testimonialEl = document.getElementById('testimonialGrid');
    if(testimonialEl){
      var testimonials = data.testimonials || [];
      testimonialEl.innerHTML = testimonials.map(function(t){
        return (
          '<figure class="testimonial-card reveal">' +
            '<blockquote>&ldquo;' + escapeHtml(t.quote) + '&rdquo;</blockquote>' +
            '<figcaption>' + escapeHtml(t.name) + ', ' + escapeHtml(t.title) + ' &mdash; ' + escapeHtml(t.company) + '</figcaption>' +
          '</figure>'
        );
      }).join('');
    }
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

  /* ---------- Demo content overrides ----------
     admin/demo.html (the sandboxed test-repo CMS demo) writes saved entries
     here on Publish, keyed by content file path, so a customer can go from
     the demo editor back to this page in the same browser and see the
     change — without a real backend. This never touches the real
     content/*.json files; it's a per-browser localStorage layer only. */
  var DEMO_OVERRIDE_PREFIX = 'hh-demo-override:';

  function getDemoOverride(path){
    try{
      var raw = localStorage.getItem(DEMO_OVERRIDE_PREFIX + path);
      return raw ? JSON.parse(raw) : null;
    } catch(e){ return null; }
  }

  function clearDemoOverrides(){
    var keys = [];
    for(var i = 0; i < localStorage.length; i++){
      var key = localStorage.key(i);
      if(key && key.indexOf(DEMO_OVERRIDE_PREFIX) === 0) keys.push(key);
    }
    keys.forEach(function(key){ localStorage.removeItem(key); });
  }

  function setupDemoBanner(hasOverrides){
    var banner = document.getElementById('demoBanner');
    if(!banner) return;
    banner.hidden = !hasOverrides;
    document.body.classList.toggle('has-demo-banner', hasOverrides);
    var resetBtn = document.getElementById('demoBannerReset');
    if(resetBtn){
      resetBtn.addEventListener('click', function(){
        clearDemoOverrides();
        window.location.reload();
      });
    }
  }

  /* ---------- Boot: fetch all content, render, then wire up behavior ---------- */
  function fetchJson(path){
    var override = getDemoOverride(path);
    if(override) return Promise.resolve(override);
    return fetch(path).then(function(res){
      if(!res.ok) throw new Error('Failed to load ' + path + ' (' + res.status + ')');
      return res.json();
    });
  }

  var CONTENT_PATHS = ['content/settings.json', 'content/fights.json', 'content/fighters.json', 'content/news.json', 'content/sponsorship.json', 'content/mission.json', 'content/about.json', 'content/interviews.json', 'content/partners.json'];

  Promise.all(CONTENT_PATHS.map(fetchJson)).then(function(results){
    var settings = results[0];
    var fightsData = results[1];
    var fightersData = results[2];
    var newsData = results[3];
    var sponsorshipData = results[4];
    var missionData = results[5];
    var aboutData = results[6];
    var interviewsData = results[7];
    var partnersData = results[8];

    setupDemoBanner(CONTENT_PATHS.some(function(p){ return !!getDemoOverride(p); }));
    renderSettings(settings);
    applySectionVisibility(settings.sections);
    renderMission(missionData);
    renderAbout(aboutData);
    renderSponsorship(sponsorshipData);
    renderInterviews(interviewsData.interviews || []);
    renderPartners(partnersData.partners || []);
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
