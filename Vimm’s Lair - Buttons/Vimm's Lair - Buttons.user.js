// ==UserScript==
// @name         Vimm's Lair - Buttons
// @namespace    https://vimm.net/
// @version      2.0
// @description  Transforms the download button into a styled button with animations on Vimm's Lair (and eventually more)
// @author       Jeremy
// @match        https://vimm.net/*
// @icon         https://vimm.net/favicon.ico
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    GM_addStyle(`
        @keyframes vimm-pulse-glow {
            0%,  100% { box-shadow: 0 4px 10px rgba(180, 0, 0, 0.25), 0 2px 4px rgba(0,0,0,0.15); }
            50%        { box-shadow: 0 4px 22px rgba(220, 0, 0, 0.6),  0 2px 6px rgba(0,0,0,0.15); }
        }

        @keyframes vimm-bounce {
            0%,  100% { transform: translateY(0)    scale(1);    }
            50%        { transform: translateY(-2px) scale(1.03); }
        }

        .vimm-dl-btn {
            display:         inline-block;
            padding:         14px 40px !important;
            background:      linear-gradient(180deg, #ffeb3b 0%, #fdd835 50%, #f9a825 100%) !important;
            color:           #b71c1c !important;
            font-weight:     bold !important;
            font-size:       22px !important;
            letter-spacing:  2px !important;
            text-decoration: none !important;
            border-radius:   12px !important;
            border-top:      2px solid rgba(255,255,255,0.6) !important;
            border-bottom:   4px solid #b8860b !important;
            border-left:     2px solid #daa520 !important;
            border-right:    2px solid #8b6f47 !important;
            cursor:          pointer !important;
            text-shadow:     0 2px 2px rgba(0,0,0,0.2) !important;
            box-shadow:      inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.3) !important;
            width:           auto !important;

            animation:
                vimm-pulse-glow 3s ease-in-out infinite,
                vimm-bounce      4s ease-in-out infinite;
        }

        .vimm-dl-btn:hover {
            background: linear-gradient(180deg, #ffee58 0%, #ffe082 50%, #fbc02d 100%) !important;
            color:      #d32f2f !important;
            animation:
                vimm-pulse-glow 1s ease-in-out infinite,
                vimm-bounce      4s ease-in-out infinite;
        }

        .vimm-dl-btn:active {
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.2) !important;
            transform: translateY(2px) !important;
        }
    `);

    // Detect page type
    const isManualPage = !!document.querySelector('form[action*="/download/"]');
    const isGamePage = !!document.querySelector('#dl_form');

    // Remove styling from original form button
    document.querySelectorAll('#dl_form button[type="submit"]').forEach(btn => {
        btn.classList.remove('vimm-dl-btn');
        btn.textContent = 'DOWNLOAD';
    });

    // Add download button below the h2 section title
    const h2 = document.querySelector('h2 .sectionTitle')?.closest('h2');
    if (h2) {
        const dlBtn = document.createElement('button');
        dlBtn.type = 'button';
        dlBtn.className = 'vimm-dl-btn';
        dlBtn.textContent = 'DOWNLOAD';
        dlBtn.style.display = 'block';
        dlBtn.style.margin = '10px auto';
        dlBtn.onclick = () => {
            if (isManualPage) {
                // On manual pages, click the "Download pdf" button
                const pdfBtn = Array.from(document.querySelectorAll('button[type="submit"]'))
                    .find(btn => btn.textContent.includes('Download pdf'));
                pdfBtn?.click();
            } else if (isGamePage) {
                // On game pages, click the form submit button
                document.querySelector('#dl_form button[type="submit"]')?.click();
            }
        };
        h2.insertAdjacentElement('afterend', dlBtn);
    }
})();
