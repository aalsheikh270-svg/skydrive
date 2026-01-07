// cart.js - Unified cart system for all pages
// Place this file in your project root and include it in all HTML pages

(() => {
  const CART_KEY = 'unified_shop_cart_v1';
  let isProcessing = false; // Prevent duplicate adds
  
  // Load cart from localStorage
  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }
  
  // Save cart to localStorage
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart:updated'));
  }
  
  // Get selected size from container
  function getSelectedSize(containerId) {
    if (!containerId) return null;
    const container = document.getElementById(containerId);
    if (!container) return null;
    const active = container.querySelector('.size.active');
    return active ? active.textContent.trim() : null;
  }
  
  // Find item index in cart
  function findItemIndex(cart, name, size) {
    return cart.findIndex(item => 
      item.name === name && (item.size || '') === (size || '')
    );
  }
  
  // Escape HTML for safe rendering
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  // Add to cart function
  function addToCart(nameOrObj, price, sizeContainerId) {
    // Prevent rapid duplicate clicks
    if (isProcessing) return;
    isProcessing = true;
    setTimeout(() => { isProcessing = false; }, 300);
    
    let item;
    
    // Handle object input
    if (typeof nameOrObj === 'object' && nameOrObj !== null) {
      item = {
        name: nameOrObj.name || 'Item',
        price: Number(nameOrObj.price) || 0,
        size: nameOrObj.size || null,
        qty: 1 // Always add one at a time
      };
    } else {
      // Handle individual parameters
      const size = getSelectedSize(sizeContainerId);
      
      if (sizeContainerId && !size) {
        alert('Please select a size before adding to cart.');
        isProcessing = false;
        return;
      }
      
      item = {
        name: String(nameOrObj || 'Item'),
        price: Number(price) || 0,
        size: size,
        qty: 1 // Always add one at a time
      };
    }
    
    // Load current cart
    const cart = loadCart();
    
    // Find if item exists
    const existingIndex = findItemIndex(cart, item.name, item.size);
    
    if (existingIndex > -1) {
      // Increment quantity by 1
      cart[existingIndex].qty += 1;
    } else {
      // Add new item
      cart.push(item);
    }
    
    // Save and update UI
    saveCart(cart);
    renderCart();
    
    // Show confirmation
    alert(`${item.name}${item.size ? ' (Size ' + item.size + ')' : ''} added to cart`);
  }
  
  // Remove item from cart
  function removeItem(index) {
    const cart = loadCart();
    if (index < 0 || index >= cart.length) return;
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
  }
  
  // Change item quantity
  function changeQty(index, delta) {
    const cart = loadCart();
    if (index < 0 || index >= cart.length) return;
    cart[index].qty = Math.max(1, (cart[index].qty || 1) + delta);
    saveCart(cart);
    renderCart();
  }
  
  // Clear entire cart
  function clearCart() {
    saveCart([]);
    renderCart();
  }
  
  // Checkout
  function checkout() {
    const cart = loadCart();
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    alert('Checkout complete! Thank you for your order. (Demo)');
    clearCart();
  }
  
  // Toggle cart visibility
  function toggleCart() {
    const cartPanel = document.getElementById('cart');
    if (!cartPanel) return;
    cartPanel.style.display = cartPanel.style.display === 'block' ? 'none' : 'block';
  }
  
  // Render cart UI
  function renderCart() {
    const cart = loadCart();
    
    // Update cart items
    const itemsContainer = document.getElementById('cart-items');
    if (itemsContainer) {
      itemsContainer.innerHTML = '';
      
      cart.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #eee';
        
        itemEl.innerHTML = `
          <div style="flex:1">
            <strong>${escapeHtml(item.name)}</strong>
            ${item.size ? `<div style="font-size:12px;color:#666">Size: ${escapeHtml(item.size)}</div>` : ''}
            <div style="font-size:12px;color:#666">$${(item.price || 0).toFixed(2)} × ${item.qty || 1}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
            <div>
              <button onclick="window.changeQty(${index}, -1)" style="padding:4px 8px;margin-right:4px;cursor:pointer">−</button>
              <button onclick="window.changeQty(${index}, 1)" style="padding:4px 8px;cursor:pointer">+</button>
            </div>
            <button onclick="window.removeItem(${index})" style="background:red;color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:16px">×</button>
          </div>
        `;
        
        itemsContainer.appendChild(itemEl);
      });
    }
    
    // Update cart count
    const totalQty = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    document.querySelectorAll('#cart-count').forEach(el => {
      el.textContent = totalQty;
    });
    
    // Update cart badge
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = totalQty || '';
      badge.style.display = totalQty ? 'inline-flex' : 'none';
    }
    
    // Update cart button text
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
      cartBtn.textContent = `🛒 Cart (${totalQty})`;
    }
    
    // Update total price
    const total = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);
    document.querySelectorAll('#cart-total').forEach(el => {
      el.textContent = total.toFixed(2);
    });
  }
  
  // Create cart UI if it doesn't exist
  function createCartUI() {
    // Check if cart UI already exists
    if (document.getElementById('cart-btn')) return;
    
    // Create cart button
    const cartBtn = document.createElement('div');
    cartBtn.id = 'cart-btn';
    cartBtn.innerHTML = '🛒 Cart (<span id="cart-count">0</span>)';
    cartBtn.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: black;
      color: white;
      padding: 10px 15px;
      border-radius: 25px;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    cartBtn.onclick = toggleCart;
    document.body.appendChild(cartBtn);
    
    // Create cart panel
    const cartPanel = document.createElement('div');
    cartPanel.id = 'cart';
    cartPanel.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      width: 320px;
      max-height: 500px;
      overflow-y: auto;
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      padding: 15px;
      display: none;
      z-index: 1000;
    `;
    
    cartPanel.innerHTML = `
      <h3 style="margin:0 0 15px 0">Your Cart</h3>
      <div id="cart-items"></div>
      <hr style="margin:15px 0">
      <div style="display:flex;justify-content:space-between;margin-bottom:15px">
        <strong>Total:</strong>
        <strong>$<span id="cart-total">0.00</span></strong>
      </div>
      <button onclick="window.checkout()" style="width:100%;padding:12px;background:black;color:white;border:none;border-radius:25px;cursor:pointer;margin-bottom:8px">Checkout</button>
      <button onclick="window.clearCart()" style="width:100%;padding:12px;background:#e0e0e0;color:#333;border:none;border-radius:25px;cursor:pointer">Clear Cart</button>
    `;
    
    document.body.appendChild(cartPanel);
  }
  
  // Wire up product buttons
  function wireProductButtons() {
    document.querySelectorAll('.product').forEach(product => {
      const btn = product.querySelector('button');
      if (!btn || btn.dataset.wired) return;
      
      // Mark as wired to prevent duplicate handlers
      btn.dataset.wired = 'true';
      
      // Remove existing onclick
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', () => {
        const name = product.querySelector('h2')?.textContent.trim() || 'Item';
        const priceText = product.querySelector('.price')?.textContent || '0';
        const price = Number(priceText.replace(/[^0-9.]/g, '')) || 0;
        const sizesContainer = product.querySelector('.sizes');
        const sizeContainerId = sizesContainer?.id || null;
        
        addToCart(name, price, sizeContainerId);
      });
    });
  }
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    createCartUI();
    wireProductButtons();
    renderCart();
    
    // Listen for storage changes (for multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === CART_KEY) {
        renderCart();
      }
    });
    
    // Listen for custom cart update events
    window.addEventListener('cart:updated', renderCart);
  }
  
  // Expose API globally
  window.addToCart = addToCart;
  window.removeItem = removeItem;
  window.changeQty = changeQty;
  window.clearCart = clearCart;
  window.checkout = checkout;
  window.toggleCart = toggleCart;
  window.renderCart = renderCart;
})();