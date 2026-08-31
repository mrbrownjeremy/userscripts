// ==UserScript==
// @name         RHDN Download Buttons
// @namespace    https://www.romhacking.net/
// @version      1.1
// @description  Replaces download links with prominent red DOWNLOAD buttons on romhacking.net
// @author       Jeremy
// @match        https://www.romhacking.net/*
// @icon         https://www.romhacking.net/favicon.ico
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    GM_addStyle(`
        @keyframes rhdn-pulse-glow {
            0%,  100% { box-shadow: 0 4px 10px rgba(180, 0, 0, 0.35), 0 2px 4px rgba(0,0,0,0.4); }
            50%        { box-shadow: 0 4px 22px rgba(220, 0, 0, 0.75), 0 2px 6px rgba(0,0,0,0.4); }
        }

        @keyframes rhdn-bounce {
            0%,  100% { transform: translateY(0)    scale(1);    }
            50%        { transform: translateY(-2px) scale(1.03); }
        }

        .rhdn-dl-btn {
            display:          inline-block;
            padding:          12px 30px;
            background:       linear-gradient(180deg, #e82222 0%, #aa0000 60%, #880000 100%);
            color:            #fff !important;
            font-weight:      bold;
            font-size:        21px;
            letter-spacing:   1.5px;
            text-decoration:  none !important;
            border-radius:    6px;
            border-top:       1px solid rgba(255,255,255,0.25);
            border-bottom:    3px solid #550000;
            border-left:      1px solid #770000;
            border-right:     1px solid #770000;
            cursor:           pointer;
            text-shadow:      0 1px 2px rgba(0,0,0,0.5);

            animation:
                rhdn-pulse-glow 3s ease-in-out infinite,
                rhdn-bounce      4s ease-in-out infinite;
        }

        .rhdn-dl-btn:hover {
            background: linear-gradient(180deg, #ff3333 0%, #cc0000 60%, #aa0000 100%);
            animation:
                rhdn-pulse-glow 1s ease-in-out infinite,
                rhdn-bounce      4s ease-in-out infinite;
        }
    `);

    document.querySelectorAll('a[href^="/download/"]').forEach(link => {
        link.textContent = 'DOWNLOAD';
        link.classList.add('rhdn-dl-btn');
    });

    const entryinfo = document.querySelector('.entryinfo');
    if (entryinfo) {
        const downloadLink = document.querySelector('a[href^="/download/"]');
        if (downloadLink) {
            const buttonClone = downloadLink.cloneNode(true);
            const wrapper = document.createElement('div');
            wrapper.style.marginTop = '15px';
            wrapper.style.textAlign = 'center';
            wrapper.appendChild(buttonClone);
            entryinfo.parentNode.insertBefore(wrapper, entryinfo.nextSibling);
        }
    }
})();