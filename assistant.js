/* ═══════════════════════════════════════════════════════════════
   ConfHub site assistant

   Answers common questions instantly from the knowledge base below,
   and hands anything else to a person on WhatsApp.

   OPTIONAL — AI answers:
   Set AI_ENDPOINT to your Cloudflare Worker URL (see confhub-ai-worker.js)
   and unmatched questions are answered by Claude instead. Leave it blank
   and the assistant works entirely on its own, at no cost.
   ═══════════════════════════════════════════════════════════════ */
(function(){
  var AI_ENDPOINT = "";            // e.g. "https://confhub-ai.yourname.workers.dev"
  var WA = "2348132149889";

  // ── Knowledge base. Keep answers short, factual and current. ──
  var KB = [
    { k:["price","cost","how much","fee","charge","pricing","naira","afford","expensive"],
      a:"ConfHub is priced per conference:<br><b>Basic</b> ₦399,000 — the event app.<br><b>Standard</b> ₦599,000 — adds QR check-in, abstracts listing, sponsors, feedback and certificates.<br><b>Premium</b> — custom, for large congresses with abstract review and online payment.<br><br>Most associations have a sponsor cover it. <a href=\"pricing.html\">See pricing</a>." },
    { k:["sponsor","who pays","pay for it","budget","funding"],
      a:"In most cases a sponsor pays. An exhibitor or industry partner funds the platform in exchange for placement in the app, so it doesn't come out of association funds. We'll draft that proposal for you." },
    { k:["confhub do","what can confhub","features","platform","services","what is confhub","about confhub"],
      a:"ConfHub runs Nigerian conferences end to end: abstract submission and blind peer review, delegate registration and payment, QR passes and offline check-in, the conference app, and attendance-verified certificates — plus a live dashboard for the organising committee. <a href=\"platform.html\">See the platform</a>." },
    { k:["abstract","submit","submission","paper","research"],
      a:"Authors submit online against your structure and word limit, get an abstract number and a private link to edit until the deadline. Reviewers score blind — they never see authors or institutions — and accepted abstracts flow straight into the programme and the book of abstracts." },
    { k:["review","reviewer","peer","blind","adjudicat"],
      a:"Two reviewers see each abstract and tap Yes or No. If they agree, that's the decision; if they split, an adjudicator decides. Authors and institutions are hidden, and reviewers are never assigned their own institution's work." },
    { k:["register","registration","sign up","how to attend","enrol"],
      a:"If you're a <b>delegate</b>, register through your own conference's page — the link comes from your organisers.<br><br>If you're an <b>organiser</b>, ConfHub gives you an online registration form with member, trainee and early-bird rates, payment by card or transfer, and automatic receipts." },
    { k:["payment","paystack","transfer","card","bank","money","receipt","pay by","paying","pay online"],
      a:"Delegates pay by card through the association's own Paystack account, or by bank transfer with a unique reference. Money goes straight to the association — ConfHub never holds your funds. Receipts are sent automatically." },
    { k:["qr","check-in","checkin","check in","scan","scanner","door","badge","pass"],
      a:"Every delegate gets a QR pass by email. Stewards scan it on their own phones — no hardware to hire — and it works with <b>no internet at all</b>. Printed badges carry the same code, so a dead phone battery doesn't stop anyone getting in." },
    { k:["offline","no network","internet","wifi","signal"],
      a:"Yes — it's built for Nigerian venues. The app, the delegate pass and the door scanner all keep working with no network. Check-ins sync once a connection returns." },
    { k:["certificate","cpd","mdcn","attendance"],
      a:"Delegates check in each day, so certificates go only to people who were actually present — which makes CPD claims defensible. Certificates are numbered and emailed automatically." },
    { k:["app","programme","program","schedule","agenda","speakers"],
      a:"Your conference gets its own web address. Delegates open it once and it works offline: programme, speakers, abstracts, venue, announcements and live stream. Your secretariat edits it from a spreadsheet — no reprints." },
    { k:["dashboard","organiser","organizer","loc","committee","portal","login","log in","sign in","password"],
      a:"There's no password. Each LOC member gets a personal dashboard link by email, and the chairman decides who sees what. Lost yours? Ask your LOC secretariat to resend it, or see the <a href=\"organiser.html\">organiser portal</a>." },
    { k:["lost","can't find","cannot find","forgot","missing link","my pass","my link"],
      a:"Your pass, abstract or dashboard link came by email from your conference organisers. Search your inbox (and spam) for your conference name. Your organisers can resend it in one click." },
    { k:["list","directory","upcoming","add my conference","advertise"],
      a:"We list Nigerian academic conferences free, whether or not they use ConfHub. <a href=\"conferences.html#list\">Send us your details</a>." },
    { k:["how long","time","weeks","setup","set up","quickly","ready"],
      a:"Two weeks is comfortable if you have a draft programme. For abstract submission, allow six months before the meeting so the call can open on time." },
    { k:["data","privacy","ndpa","secure","safe","own"],
      a:"The association owns its data. We hold it to run your conference and hand it over as spreadsheets afterwards. We don't sell it or market to your delegates, and delegate contact details are visible only to people you authorise." },
    { k:["contact","talk","speak","call","phone","email","demo","human","person","agent"],
      a:"Happy to talk. <a href=\"contact.html\">Book a demo</a>, email <a href=\"mailto:hello@confhub.ng\">hello@confhub.ng</a>, or chat with us on WhatsApp below." },
    { k:["hello","hi","hey","good morning","good afternoon","good evening"],
      a:"Hello! I can answer questions about ConfHub — pricing, abstracts, registration, check-in, certificates. What would you like to know?" }
  ];

  var CHIPS = ["How much does it cost?", "How does abstract review work?",
               "Does it work offline?", "I've lost my link", "Talk to a person"];

  // ── Styles ──
  var css = document.createElement('style');
  css.textContent =
    '.ch-btn{position:fixed;right:20px;bottom:88px;z-index:61;width:56px;height:56px;border-radius:50%;' +
      'border:none;cursor:pointer;background:linear-gradient(130deg,#2B46D4,#0E9DE5);color:#fff;' +
      'box-shadow:0 10px 28px rgba(43,70,212,.42);display:flex;align-items:center;justify-content:center;' +
      'transition:transform .18s}' +
    '.ch-btn:hover{transform:translateY(-2px)}' +
    '.ch-panel{position:fixed;right:20px;bottom:156px;z-index:62;width:360px;max-width:calc(100vw - 32px);' +
      'height:520px;max-height:calc(100vh - 190px);background:#fff;border-radius:18px;display:none;' +
      'flex-direction:column;overflow:hidden;box-shadow:0 24px 60px -12px rgba(11,21,36,.4);' +
      'font-family:"Plus Jakarta Sans",-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.ch-panel.open{display:flex}' +
    '.ch-hd{background:linear-gradient(130deg,#2B46D4,#0E9DE5);color:#fff;padding:15px 18px;' +
      'display:flex;align-items:center;gap:11px}' +
    '.ch-hd b{display:block;font-size:.96rem}.ch-hd span{font-size:.76rem;opacity:.9}' +
    '.ch-x{margin-left:auto;background:rgba(255,255,255,.2);border:none;color:#fff;width:30px;height:30px;' +
      'border-radius:50%;cursor:pointer;font-size:1.1rem;line-height:1}' +
    '.ch-log{flex:1;overflow-y:auto;padding:16px 14px;background:#F5F8FC}' +
    '.ch-m{max-width:86%;padding:10px 13px;border-radius:14px;margin-bottom:9px;font-size:.88rem;line-height:1.5}' +
    '.ch-m a{color:#2B46D4;font-weight:700}' +
    '.ch-bot{background:#fff;border:1px solid #E2E8F0;border-bottom-left-radius:4px;color:#0B1524}' +
    '.ch-me{background:#2B46D4;color:#fff;margin-left:auto;border-bottom-right-radius:4px}' +
    '.ch-chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}' +
    '.ch-chip{border:1.5px solid #C9D3F6;background:#fff;color:#1E2F9E;border-radius:999px;' +
      'padding:6px 11px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit}' +
    '.ch-chip:hover{background:#EEF1FE}' +
    '.ch-wa{display:block;background:#25D366;color:#06301A;text-align:center;border-radius:11px;' +
      'padding:10px;font-weight:800;font-size:.86rem;text-decoration:none;margin-top:4px}' +
    '.ch-ft{display:flex;gap:8px;padding:11px;border-top:1px solid #E2E8F0;background:#fff}' +
    '.ch-in{flex:1;border:1.5px solid #E2E8F0;border-radius:11px;padding:10px 12px;font:inherit;font-size:.9rem}' +
    '.ch-in:focus{outline:none;border-color:#2B46D4}' +
    '.ch-send{background:#2B46D4;color:#fff;border:none;border-radius:11px;padding:0 15px;' +
      'font-weight:700;cursor:pointer;font-family:inherit}' +
    '.ch-dots{display:inline-flex;gap:4px}.ch-dots i{width:6px;height:6px;border-radius:50%;' +
      'background:#8A9AAF;animation:chb 1s infinite}.ch-dots i:nth-child(2){animation-delay:.15s}' +
      '.ch-dots i:nth-child(3){animation-delay:.3s}' +
    '@keyframes chb{0%,60%,100%{opacity:.3}30%{opacity:1}}' +
    '@media(max-width:560px){.ch-btn{bottom:84px;right:16px}' +
      '.ch-panel{right:8px;left:8px;width:auto;bottom:150px}}';
  document.head.appendChild(css);

  // ── Markup ──
  var btn = document.createElement('button');
  btn.className = 'ch-btn';
  btn.setAttribute('aria-label', 'Ask ConfHub a question');
  btn.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 ' +
    '2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  var panel = document.createElement('div');
  panel.className = 'ch-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'ConfHub assistant');
  panel.innerHTML =
    '<div class="ch-hd"><div><b>ConfHub assistant</b><span>Usually answers instantly</span></div>' +
      '<button class="ch-x" aria-label="Close">\u00d7</button></div>' +
    '<div class="ch-log" id="chLog"></div>' +
    '<div class="ch-ft"><input class="ch-in" id="chIn" placeholder="Ask a question\u2026" autocomplete="off">' +
      '<button class="ch-send" id="chSend">Send</button></div>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var log = panel.querySelector('#chLog'), input = panel.querySelector('#chIn');
  var history = [], started = false;

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function add(html, who){
    var d = document.createElement('div');
    d.className = 'ch-m ' + (who === 'me' ? 'ch-me' : 'ch-bot');
    d.innerHTML = html;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function chips(){
    var w = document.createElement('div');
    w.className = 'ch-chips';
    CHIPS.forEach(function(c){
      var b = document.createElement('button');
      b.className = 'ch-chip'; b.textContent = c;
      b.addEventListener('click', function(){ ask(c); });
      w.appendChild(b);
    });
    log.appendChild(w);
  }

  function waLink(q){
    return 'https://wa.me/' + WA + '?text=' +
      encodeURIComponent('Hello ConfHub' + (q ? ', I have a question: ' + q : ', I have a question.'));
  }

  function handoff(q){
    add('I don\u2019t have a confident answer to that. Let me put you in touch with the team \u2014 ' +
        'your question will be ready to send:' +
        '<a class="ch-wa" href="' + waLink(q) + '" target="_blank" rel="noopener">Chat with us on WhatsApp</a>',
        'bot');
  }

  function match(q){
    var s = ' ' + q.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').replace(/\s+/g,' ') + ' ';
    var best = null, score = 0;
    KB.forEach(function(item){
      var n = 0;
      item.k.forEach(function(k){
        // whole words only, and allow a plural or -ing on the end
        var re = new RegExp('\\b' + k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(s|es|ing|ed)?\\b');
        if (re.test(s)) n += k.length > 5 ? 2 : 1;
      });
      if (n > score){ score = n; best = item; }
    });
    return score > 0 ? best : null;
  }

  function ask(q){
    q = String(q||'').trim();
    if (!q) return;
    add(esc(q), 'me');
    input.value = '';
    history.push({ role:'user', content:q });

    if (/talk to a person|speak to someone|human|agent|whatsapp/i.test(q)){
      add('Of course \u2014 tap below and your message is ready to send.' +
          '<a class="ch-wa" href="' + waLink('') + '" target="_blank" rel="noopener">Chat with us on WhatsApp</a>', 'bot');
      return;
    }

    var hit = match(q);
    if (hit){
      add(hit.a, 'bot');
      history.push({ role:'assistant', content:hit.a.replace(/<[^>]+>/g,' ') });
      return;
    }

    if (!AI_ENDPOINT){ handoff(q); return; }

    var typing = add('<span class="ch-dots"><i></i><i></i><i></i></span>', 'bot');
    fetch(AI_ENDPOINT, {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ messages: history.slice(-8) })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
      typing.remove();
      if (!d || !d.reply || d.handoff){ handoff(q); return; }
      add(esc(d.reply).replace(/\n/g,'<br>'), 'bot');
      history.push({ role:'assistant', content:d.reply });
    })
    .catch(function(){ typing.remove(); handoff(q); });
  }

  function open(){
    panel.classList.add('open');
    if (!started){
      started = true;
      add('Hello! I\u2019m the ConfHub assistant. Ask me anything about running your conference \u2014 ' +
          'or pick a question below.', 'bot');
      chips();
    }
    setTimeout(function(){ input.focus(); }, 60);
  }

  btn.addEventListener('click', function(){
    panel.classList.contains('open') ? panel.classList.remove('open') : open();
  });
  panel.querySelector('.ch-x').addEventListener('click', function(){ panel.classList.remove('open'); });
  panel.querySelector('#chSend').addEventListener('click', function(){ ask(input.value); });
  input.addEventListener('keydown', function(e){ if (e.key === 'Enter') ask(input.value); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') panel.classList.remove('open');
  });
})();
