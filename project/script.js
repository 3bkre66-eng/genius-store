/* ---------- helpers ---------- */
  function formatMoney(num){
    return Math.round(num).toLocaleString('en-US');
  }

  /* ---------- category tabs ---------- */
  const tabs = document.querySelectorAll('.tab');
  const cards = document.querySelectorAll('.card');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      cards.forEach(c => c.classList.toggle('show', filter === 'all' || c.dataset.cat === filter));
    });
  });

  /* ---------- toast ---------- */
  let toastTimer = null;
  function showToast(msg){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }
  document.querySelectorAll('.ph-link').forEach(el => {
    el.addEventListener('click', () => showToast('هاي الصفحة قيد الإنشاء — التصميم جاهز والربط جاي لاحقاً'));
  });

  /* ---------- promo countdown timer ---------- */
  const PROMO_DURATION_SECONDS = 3 * 60 * 60; // 3 ساعات — عدّلها لأي مدة تريدها
  let promoRemaining = PROMO_DURATION_SECONDS;
  function tickPromo(){
    promoRemaining--;
    if(promoRemaining < 0) promoRemaining = PROMO_DURATION_SECONDS; // يعيد الدورة تلقائياً (تجريبي فقط)
    const h = String(Math.floor(promoRemaining/3600)).padStart(2,'0');
    const m = String(Math.floor((promoRemaining%3600)/60)).padStart(2,'0');
    const s = String(promoRemaining%60).padStart(2,'0');
    document.getElementById('promoCountdown').textContent = `${h}:${m}:${s}`;
  }
  tickPromo();
  setInterval(tickPromo, 1000);

  /* ---------- generic overlay open/close ---------- */
  function openOverlay(id){
    document.getElementById(id).classList.add('open');
    document.body.classList.add('lock-scroll');
  }
  function closeOverlay(id){
    document.getElementById(id).classList.remove('open');
    if(!document.querySelector('.overlay.open') && !document.getElementById('cartDrawer').classList.contains('open')){
      document.body.classList.remove('lock-scroll');
    }
  }

  /* ---------- WhatsApp ordering ---------- */
  const WHATSAPP_NUMBER = '9647742418456'; // 07742418456 بصيغة دولية (964 = العراق، بدون الصفر الأول)

  function buildWhatsAppMessage(){
    let msg = 'مرحباً، أريد أطلب من متجر *عبقري GENIUS* التالي:\n\n';
    let total = 0;
    cart.forEach((i, idx) => {
      const lineTotal = i.price * i.qty;
      total += lineTotal;
      msg += `${idx+1}. ${i.icon} ${i.name}\n   الكمية: ${i.qty}   السعر: ${formatMoney(i.price)} د.ع   الإجمالي: ${formatMoney(lineTotal)} د.ع\n\n`;
    });
    msg += `----------------------\n`;
    msg += `المجموع الكلي: ${formatMoney(total)} د.ع\n\n`;
    msg += 'الرجاء تأكيد الطلب وطريقة الدفع المتاحة. شكراً 🙏';
    return msg;
  }

  function sendCartToWhatsApp(){
    const text = encodeURIComponent(buildWhatsAppMessage());
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
    window.open(url, '_blank');
  }

  function sendSingleProductToWhatsApp(el){
    const name = el.dataset.name, price = el.dataset.price, icon = el.dataset.icon;
    let msg = 'مرحباً، أريد أطلب من متجر *عبقري GENIUS* المنتج التالي:\n\n';
    msg += `${icon} ${name}\nالسعر: ${formatMoney(parseFloat(price))} د.ع\n\n`;
    msg += 'الرجاء تأكيد الطلب وطريقة الدفع المتاحة. شكراً 🙏';
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  /* ---------- cart state ---------- */
  let cart = []; // {name, price, icon}

  function addItem(item){
    const existing = cart.find(i => i.name === item.name);
    if(existing){ existing.qty += 1; } else { cart.push({...item, qty:1}); }
    renderCart();
    document.getElementById('cartDrawer').classList.contains('open') || pulseCartBtn();
  }
  function pulseCartBtn(){
    const btn = document.querySelector('.cart-btn');
    btn.style.transform = 'scale(1.12)';
    setTimeout(() => btn.style.transform = '', 200);
  }
  function addToCart(cardEl){
    addItem({ name: cardEl.dataset.name, price: parseFloat(cardEl.dataset.price), icon: cardEl.dataset.icon });
    showToast(cardEl.dataset.name + ' أُضيف للسلة');
  }
  function changeQty(name, delta){
    const item = cart.find(i => i.name === name);
    if(!item) return;
    item.qty += delta;
    if(item.qty <= 0) cart = cart.filter(i => i.name !== name);
    renderCart();
  }
  function removeItem(name){
    cart = cart.filter(i => i.name !== name);
    renderCart();
  }
  function renderCart(){
    const wrap = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const countEl = document.getElementById('cartCount');
    const totalCount = cart.reduce((s,i)=>s+i.qty,0);
    countEl.textContent = totalCount;
    if(cart.length === 0){
      wrap.innerHTML = '<div class="cart-empty" id="cartEmptyMsg">السلة فاضية — تصفح المنتجات وضيف اللي يعجبك.</div>';
      totalEl.textContent = '0 د.ع';
      return;
    }
    let total = 0;
    wrap.innerHTML = cart.map(i => {
      total += i.price * i.qty;
      return `<div class="cart-item">
        <div class="ic">${i.icon}</div>
        <div class="info"><b>${i.name}</b><span class="mono">${formatMoney(i.price)} د.ع × ${i.qty}</span></div>
        <div class="qty-box">
          <button onclick="changeQty('${i.name.replace(/'/g,"\\'")}',-1)">−</button>
          <span>${i.qty}</span>
          <button onclick="changeQty('${i.name.replace(/'/g,"\\'")}',1)">+</button>
        </div>
        <button class="cart-remove" onclick="removeItem('${i.name.replace(/'/g,"\\'")}')" aria-label="حذف">🗑</button>
      </div>`;
    }).join('');
    totalEl.textContent = formatMoney(total) + ' د.ع';
  }
  function openCart(){
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('open');
    document.body.classList.add('lock-scroll');
  }
  function closeCart(){
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('drawerOverlay').classList.remove('open');
    if(!document.querySelector('.overlay.open')) document.body.classList.remove('lock-scroll');
  }
  function checkoutCart(){
    if(cart.length === 0){ showToast('السلة فاضية لسا'); return; }
    sendCartToWhatsApp();
  }

  /* ---------- product modal ---------- */
  const productOverlay = document.getElementById('productOverlay');
  const modalCardEl = document.getElementById('modalCard');
  let currentProduct = null;
  let priceTimer = null;

  function openProduct(el){
    currentProduct = el;
    document.getElementById('modalIcon').textContent = el.dataset.icon;
    document.getElementById('modalTag').textContent = el.dataset.tag;
    document.getElementById('modalName').textContent = el.dataset.name;
    document.getElementById('modalDesc').textContent = el.dataset.desc;
    document.getElementById('modalDeliver').textContent = el.dataset.deliver;

    const oldPriceEl = document.getElementById('modalOldPrice');
    const discountTagEl = document.getElementById('modalDiscountTag');
    if(el.dataset.oldprice){
      const oldP = parseFloat(el.dataset.oldprice);
      const newP = parseFloat(el.dataset.price);
      const pct = Math.round((oldP-newP)/oldP*100);
      oldPriceEl.textContent = formatMoney(oldP) + ' د.ع';
      oldPriceEl.style.display = 'block';
      discountTagEl.textContent = 'خصم ' + pct + '%';
      discountTagEl.style.display = 'inline-block';
    } else {
      oldPriceEl.style.display = 'none';
      discountTagEl.style.display = 'none';
    }

    modalCardEl.style.animation = 'none'; void modalCardEl.offsetWidth; modalCardEl.style.animation = '';
    document.querySelectorAll('.ad-stage .ring').forEach(r => { r.style.animation='none'; void r.offsetWidth; r.style.animation=''; });
    const icon = document.getElementById('modalIcon'); icon.style.animation='none'; void icon.offsetWidth; icon.style.animation='';
    const tag = document.getElementById('modalTag'); tag.style.animation='none'; void tag.offsetWidth; tag.style.animation='';
    const body = document.querySelector('.modal-body'); body.style.animation='none'; void body.offsetWidth; body.style.animation='';

    openOverlay('productOverlay');

    const target = parseFloat(el.dataset.price);
    const priceEl = document.getElementById('modalPrice');
    priceEl.textContent = '0';
    clearTimeout(priceTimer);
    priceTimer = setTimeout(() => animatePrice(priceEl, target), 950);
  }
  function animatePrice(el, target){
    const duration = 500; const start = performance.now();
    function step(now){
      const t = Math.min((now-start)/duration,1);
      el.textContent = formatMoney(target*t);
      if(t<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function addFromModal(){
    if(currentProduct) addToCart(currentProduct);
    closeOverlay('productOverlay');
  }

  /* ---------- login ---------- */
  function openLogin(){ openOverlay('loginOverlay'); }

  /* ---------- order tracking ---------- */
  function openTracking(){
    document.getElementById('trackSteps').style.display = 'none';
    document.getElementById('trackHint').style.display = 'none';
    document.getElementById('orderNumber').value = '';
    ['ts1','ts2','ts3'].forEach(id => document.getElementById(id).classList.remove('done'));
    openOverlay('trackOverlay');
  }
  function runTracking(){
    document.getElementById('trackSteps').style.display = 'flex';
    document.getElementById('trackSteps').style.flexDirection = 'column';
    document.getElementById('trackHint').style.display = 'block';
    ['ts1','ts2','ts3'].forEach(id => document.getElementById(id).classList.remove('done'));
    setTimeout(()=>document.getElementById('ts1').classList.add('done'), 150);
    setTimeout(()=>document.getElementById('ts2').classList.add('done'), 700);
    setTimeout(()=>document.getElementById('ts3').classList.add('done'), 1300);
  }

  /* ---------- support chat ---------- */
  const chatPanel = document.getElementById('chatPanel');
  function toggleChat(forceOpen){
    if(forceOpen === true){ chatPanel.classList.add('open'); return; }
    chatPanel.classList.toggle('open');
  }
  const botReplies = [
    'تمام، وصلتني رسالتك. بهالنموذج التجريبي الردود جاهزة مسبقاً بس بالنسخة الحقيقية فريق فعلي رح يرد عليك.',
    'ممكن تعطيني رقم الطلب عشان أتابعلك؟ (تجريبي فقط بهاي النسخة)',
    'شكراً لصبرك 🙏 هاد شات توضيحي لعرض شكل الدعم داخل المتجر.'
  ];
  let replyIndex = 0;
  function sendChat(){
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if(!text) return;
    const body = document.getElementById('chatBody');
    body.insertAdjacentHTML('beforeend', `<div class="msg user">${text.replace(/</g,'&lt;')}</div>`);
    input.value = '';
    body.scrollTop = body.scrollHeight;
    setTimeout(() => {
      const reply = botReplies[replyIndex % botReplies.length];
      replyIndex++;
      body.insertAdjacentHTML('beforeend', `<div class="msg bot">${reply}</div>`);
      body.scrollTop = body.scrollHeight;
    }, 700);
  }

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      closeOverlay('productOverlay'); closeOverlay('loginOverlay'); closeOverlay('trackOverlay'); closeCart();
    }
  });