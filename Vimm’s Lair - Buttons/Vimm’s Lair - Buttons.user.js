// ==UserScript==
// @name         Vimm’s Lair - Buttons
// @namespace    https://vimm.net/
// @version      1.0
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
            padding:         12px 30px !important;
            background:      linear-gradient(180deg, #ffffff 0%, #e8e8e8 50%, #d0d0d0 100%) !important;
            color:           #990000 !important;
            font-weight:     bold !important;
            font-size:       21px !important;
            letter-spacing:  1.5px !important;
            text-decoration: none !important;
            border-radius:   6px !important;
            border-top:      1px solid rgba(255,255,255,0.9) !important;
            border-bottom:   3px solid #aaaaaa !important;
            border-left:     1px solid #cccccc !important;
            border-right:    1px solid #cccccc !important;
            cursor:          pointer !important;
            text-shadow:     0 1px 1px rgba(255,255,255,0.8) !important;
            width:           auto !important;

            animation:
                vimm-pulse-glow 3s ease-in-out infinite,
                vimm-bounce      4s ease-in-out infinite;
        }

        .vimm-dl-btn:hover {
            background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 50%, #dedede 100%) !important;
            color:      #cc0000 !important;
            animation:
                vimm-pulse-glow 1s ease-in-out infinite,
                vimm-bounce      4s ease-in-out infinite;
        }
    `);

    document.querySelectorAll('#dl_form button[type="submit"]').forEach(btn => {
        btn.textContent = 'DOWNLOAD';
        btn.classList.add('vimm-dl-btn');
    });
})();