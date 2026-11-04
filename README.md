# FoodVerse — Frontend Prototype

A polished, responsive global-cuisine ordering storefront built with **HTML, CSS and vanilla JavaScript**.

## Run it
1. Extract the ZIP.
2. Open `index.html` in a modern browser.
3. For the best local development experience, serve the folder with VS Code Live Server or `python -m http.server 8000`, then visit `http://localhost:8000`.

No build step or package installation is required.

## Included features
- Responsive landing page and mobile navigation
- 12 sample dishes across six cuisines
- Search by dish, cuisine or description
- Cuisine filters, vegetarian-only and under-₹500 filters
- Sort by recommended, rating and price
- Persistent favourites and shopping bag using localStorage
- Quantity controls, remove item and cart totals
- Delivery fee, estimated tax and `TASTY10` demo promo code
- Demo sign-in/sign-up flow
- Checkout form with delivery details and order confirmation
- Demo order history stored in localStorage (`fv_orders`)
- Newsletter interaction and toast notifications
- Keyboard shortcut: `Ctrl/Cmd + K` focuses search

## HTML, CSS and JavaScript responsibilities
- `index.html`: semantic page structure, accessible labels, forms, dialogs, navigation and content regions.
- `css/styles.css`: design tokens, layout, typography, responsive breakpoints, states, transitions and visual components.
- `js/data.js`: sample catalogue data kept separate from UI logic.
- `js/app.js`: application state, rendering, filtering, cart/favourites, local persistence, form handling and checkout simulation.


