// ==UserScript==
// @name         eBay - Hide Promote It banners
// @namespace    https://github.com/mrbrownjeremy
// @version      1.0.0
// @description  Hides "Promote it" banners on the eBay Active Listings page
// @author       Jeremy Brown
// @match        https://www.ebay.com/mys/active*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ebay.com
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
    .me-item-card-top-bar.primary {
        display: none !important;
    }
`);
