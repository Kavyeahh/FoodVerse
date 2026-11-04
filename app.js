// FoodVerse frontend behaviour: rendering, filters, local persistence and demo checkout.
(() => {
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const money = value => `₹${Math.round(value).toLocaleString("en-IN")}`;
  const readStore = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const saveStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const state = {
    cart: readStore("fv_cart", []), favorites: readStore("fv_favorites", []),
    user: readStore("fv_user", null), cuisine: "All", search: "", sort: "recommended",
    vegOnly: false, under500: false, promo: false, authMode: "login"
  };
  const cuisines = ["All", "Italian", "Chinese", "Indian", "Mexican", "Japanese", "Thai"];
  const menuGrid = $("#menuGrid");

  function toast(message, success=true) {
    const node=document.createElement("div"); node.className=`toast ${success?"success":""}`; node.textContent=message;
    $("#toastRegion").append(node); setTimeout(()=>node.remove(),3000);
  }
  function persist() {
    saveStore("fv_cart",state.cart); saveStore("fv_favorites",state.favorites);
    saveStore("fv_user",state.user); updateCartCount();
  }
  function renderCuisineFilters() {
    $("#cuisineFilters").innerHTML=cuisines.map(c=>`<button class="filter-chip ${state.cuisine===c?"active":""}" data-cuisine="${c}">${c==="All"?"✳ All cuisines":c}</button>`).join("");
  }
  function filteredMenu() {
    let items=FOODVERSE_MENU.filter(item=>{
      const q=state.search.toLowerCase();
      const matchesSearch=!q || [item.name,item.cuisine,item.description].join(" ").toLowerCase().includes(q);
      return (state.cuisine==="All"||item.cuisine===state.cuisine) && matchesSearch &&
        (!state.vegOnly||item.vegetarian) && (!state.under500||item.price<500);
    });
    if(state.sort==="rating") items.sort((a,b)=>b.rating-a.rating);
    if(state.sort==="price-low") items.sort((a,b)=>a.price-b.price);
    if(state.sort==="price-high") items.sort((a,b)=>b.price-a.price);
    return items;
  }
  function renderMenu() {
    const items=filteredMenu();
    $("#resultCount").textContent=`Showing ${items.length} ${items.length===1?"dish":"dishes"}`;
    $("#emptyState").classList.toggle("hidden",items.length>0);
    menuGrid.innerHTML=items.map(item=>`
      <article class="food-card">
        <div class="food-image"><img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=75'">
          <span class="food-tag">${item.vegetarian?'<i class="veg-dot"></i> Veg':"Non-veg"} · ${item.tag}</span>
          <button class="heart-button ${state.favorites.includes(item.id)?"saved":""}" data-favorite="${item.id}" aria-label="Save ${item.name}">${state.favorites.includes(item.id)?"♥":"♡"}</button>
        </div>
        <div class="food-card-body"><div class="food-meta"><span>${item.cuisine} · ${item.prep}</span><span class="food-rating">★ ${item.rating}</span></div>
          <h3>${item.name}</h3><p class="food-description">${item.description}</p>
          <div class="food-card-bottom"><span class="food-price">${money(item.price)} <small>/ serving</small></span><button class="add-button" data-add="${item.id}">+ Add</button></div>
        </div>
      </article>`).join("");
  }
  function updateCartCount() {
    const count=state.cart.reduce((sum,line)=>sum+line.qty,0);
    $("#cartCount").textContent=count; $("#drawerCount").textContent=`(${count})`;
  }
  function cartTotals() {
    const subtotal=state.cart.reduce((sum,line)=>sum+line.price*line.qty,0);
    const delivery=subtotal===0||subtotal>=499?0:39;
    const discount=state.promo&&subtotal>=499?Math.round(subtotal*.10):0;
    const tax=Math.round((subtotal-discount)*.05);
    return {subtotal,delivery,discount,tax,total:subtotal+delivery+tax-discount};
  }
  function renderCart() {
    const host=$("#cartContents"), summary=$("#cartSummary");
    if(!state.cart.length) {
      host.innerHTML='<div class="empty-drawer"><span>🥡</span><h3>Your bag is taking a break.</h3><p>Find something delicious and add it here.</p></div>';
      summary.innerHTML=""; return;
    }
    host.innerHTML=state.cart.map(line=>`
      <div class="drawer-line"><img src="${line.image}" alt="${line.name}">
        <div><h4>${line.name}</h4><small>${money(line.price)} / serving</small>
          <div class="quantity-control"><button data-qty="${line.id}" data-change="-1" aria-label="Decrease quantity">−</button><span>${line.qty}</span><button data-qty="${line.id}" data-change="1" aria-label="Increase quantity">+</button></div>
        </div><div><div class="line-price">${money(line.price*line.qty)}</div><button class="remove-link" data-remove="${line.id}">Remove</button></div>
      </div>`).join("");
    const t=cartTotals();
    summary.innerHTML=`<div class="promo-row"><input id="promoInput" placeholder="Promo code (try TASTY10)" aria-label="Promo code"><button id="applyPromo">Apply</button></div>
      <div class="summary-row"><span>Subtotal</span><strong>${money(t.subtotal)}</strong></div>
      <div class="summary-row"><span>Delivery ${t.delivery===0&&t.subtotal>0?"· Free":""}</span><strong>${money(t.delivery)}</strong></div>
      ${t.discount?`<div class="summary-row"><span>Promo discount</span><strong>−${money(t.discount)}</strong></div>`:""}
      <div class="summary-row"><span>Estimated tax (5%)</span><strong>${money(t.tax)}</strong></div>
      <div class="summary-row total"><span>Total</span><strong>${money(t.total)}</strong></div>
      <button class="primary-button full-button" id="checkoutButton">Continue to checkout ↗</button><p class="summary-note">Free delivery on orders over ₹499 · Demo checkout only</p>`;
  }
  function renderFavorites() {
    const items=state.favorites.map(id=>FOODVERSE_MENU.find(x=>x.id===id)).filter(Boolean);
    $("#favoritesContents").innerHTML=items.length?items.map(item=>`
      <div class="drawer-line"><img src="${item.image}" alt="${item.name}"><div><h4>${item.name}</h4><small>${money(item.price)} · ${item.cuisine}</small><button class="remove-link" data-unfavorite="${item.id}">Remove from saved</button></div><button class="add-button" data-add="${item.id}">+ Add</button></div>`).join(""):'<div class="empty-drawer"><span>♡</span><h3>No favourites just yet.</h3><p>Tap the heart on a dish to save it for next time.</p></div>';
  }
  function addToCart(id) {
    const item=FOODVERSE_MENU.find(x=>x.id===id); if(!item)return;
    const line=state.cart.find(x=>x.id===id);
    if(line)line.qty++;else state.cart.push({...item,qty:1});
    persist();renderCart();toast(`${item.name} added to your bag.`);
  }
  function toggleFavorite(id) {
    state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];
    persist();renderMenu();renderFavorites();
    toast(state.favorites.includes(id)?"Saved to your favourites.":"Removed from favourites.");
  }
  function changeQty(id,delta) {
    const line=state.cart.find(x=>x.id===id);if(!line)return;
    line.qty+=delta;if(line.qty<=0)state.cart=state.cart.filter(x=>x.id!==id);
    persist();renderCart();
  }
  function showDrawer(id) {
    closeLayers();$("#overlay").classList.add("show");$(id).classList.add("open");$(id).setAttribute("aria-hidden","false");
  }
  function closeLayers() {
    $$(".drawer").forEach(d=>{d.classList.remove("open");d.setAttribute("aria-hidden","true")});
    $$(".modal-wrap").forEach(m=>m.classList.remove("show"));
    $("#overlay").classList.remove("show");
  }
  function showModal(id) {closeLayers();$(id).classList.add("show");}
  function updateAccount() {
    $("#accountLabel").textContent=state.user?`Hi, ${state.user.name.split(" ")[0]}`:"Sign in";
  }
  function setAuthMode(mode) {
    state.authMode=mode;$$("[data-auth-tab]").forEach(b=>b.classList.toggle("active",b.dataset.authTab===mode));
    $("#nameField").classList.toggle("hidden",mode!=="signup");
    $("#authName").required=mode==="signup";$("#authTitle").textContent=mode==="signup"?"Join the table.":"Good to see you.";
    $("#authSubmit").textContent=mode==="signup"?"Create account ↗":"Sign in ↗";
    $("#authPassword").autocomplete=mode==="signup"?"new-password":"current-password";
  }
  function openAuth() {
    if(state.user){if(confirm(`Signed in as ${state.user.email}. Sign out?`)){state.user=null;persist();updateAccount();toast("You have signed out.");}return;}
    setAuthMode("login");showModal("#authModal");
  }
  function startCheckout() {
    if(!state.cart.length){toast("Your bag is empty.",false);return;}
    closeLayers();$("#checkoutTotal").innerHTML=`<span>Order total</span><span>${money(cartTotals().total)}</span>`;
    if(state.user){$("#deliveryName").value=state.user.name;}
    showModal("#checkoutModal");
  }
  function placeOrder(event) {
    event.preventDefault();if(!state.cart.length)return;
    const orderId="FV-"+Math.random().toString(36).slice(2,8).toUpperCase();
    const order={id:orderId,createdAt:new Date().toISOString(),items:state.cart,total:cartTotals().total,customer:$("#deliveryName").value};
    const history=readStore("fv_orders",[]);history.unshift(order);saveStore("fv_orders",history);
    state.cart=[];state.promo=false;persist();renderCart();closeLayers();
    $("#orderReference").textContent=`Order reference: ${orderId}`;
    $("#orderMessage").textContent=`Thanks, ${order.customer}. Your demo order has been recorded in this browser. No restaurant or delivery partner has been notified.`;
    showModal("#orderModal");
  }
  function clearFilters() {
    state.cuisine="All";state.search="";state.vegOnly=false;state.under500=false;state.sort="recommended";
    $("#searchInput").value="";$("#vegOnly").checked=false;$("#under500").checked=false;$("#sortSelect").value="recommended";
    renderCuisineFilters();renderMenu();
  }
  document.addEventListener("click",e=>{
    const add=e.target.closest("[data-add]");if(add)addToCart(Number(add.dataset.add));
    const fav=e.target.closest("[data-favorite]");if(fav)toggleFavorite(Number(fav.dataset.favorite));
    const cuisine=e.target.closest("[data-cuisine]");if(cuisine){state.cuisine=cuisine.dataset.cuisine;renderCuisineFilters();renderMenu();}
    const qty=e.target.closest("[data-qty]");if(qty)changeQty(Number(qty.dataset.qty),Number(qty.dataset.change));
    const remove=e.target.closest("[data-remove]");if(remove){state.cart=state.cart.filter(x=>x.id!==Number(remove.dataset.remove));persist();renderCart();}
    const unfav=e.target.closest("[data-unfavorite]");if(unfav)toggleFavorite(Number(unfav.dataset.unfavorite));
    if(e.target.closest("[data-close]"))closeLayers();
    if(e.target.id==="overlay")closeLayers();
    const tab=e.target.closest("[data-auth-tab]");if(tab)setAuthMode(tab.dataset.authTab);
    if(e.target.id==="checkoutButton")startCheckout();
    if(e.target.id==="applyPromo"){
      const code=$("#promoInput").value.trim().toUpperCase();
      if(code==="TASTY10"&&cartTotals().subtotal>=499){state.promo=true;renderCart();toast("10% discount applied.");}
      else toast("Use TASTY10 on a subtotal of ₹499 or more.",false);
    }
  });
  $("#searchInput").addEventListener("input",e=>{state.search=e.target.value;renderMenu();});
  $("#sortSelect").addEventListener("change",e=>{state.sort=e.target.value;renderMenu();});
  $("#vegOnly").addEventListener("change",e=>{state.vegOnly=e.target.checked;renderMenu();});
  $("#under500").addEventListener("change",e=>{state.under500=e.target.checked;renderMenu();});
  $("#clearFilters").addEventListener("click",clearFilters);$("#emptyReset").addEventListener("click",clearFilters);
  $("#openCart").addEventListener("click",()=>{renderCart();showDrawer("#cartDrawer");});
  $("#favoritesShortcut").addEventListener("click",()=>{renderFavorites();showDrawer("#favoritesDrawer");});
  $("#accountButton").addEventListener("click",openAuth);
  $("#authForm").addEventListener("submit",e=>{
    e.preventDefault();const fd=new FormData(e.currentTarget);
    if(state.authMode==="signup"&&!fd.get("name").trim())return;
    state.user={name:state.authMode==="signup"?fd.get("name").trim():(fd.get("email").split("@")[0]),email:fd.get("email")};
    persist();updateAccount();closeLayers();toast(state.authMode==="signup"?"Your demo account is ready.":"Welcome back.");
  });
  $("#checkoutForm").addEventListener("submit",placeOrder);
  $("#finishOrder").addEventListener("click",closeLayers);
  $("#newsletterForm").addEventListener("submit",e=>{e.preventDefault();e.currentTarget.reset();toast("Thanks! You are on the demo updates list.");});
  $("#mobileMenuButton").addEventListener("click",()=>$("#mobileNav").classList.toggle("open"));
  $$("#mobileNav a").forEach(a=>a.addEventListener("click",()=>$("#mobileNav").classList.remove("open")));
  document.addEventListener("keydown",e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#searchInput").focus();}
    if(e.key==="Escape")closeLayers();
  });
  $("#year").textContent=new Date().getFullYear();
  renderCuisineFilters();renderMenu();renderCart();renderFavorites();updateAccount();updateCartCount();
})();