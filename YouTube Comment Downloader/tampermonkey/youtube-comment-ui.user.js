// ==UserScript==
// @name         YouTube Comment Downloader
// @namespace    https://github.com/jeremybrown
// @version      1.5.0
// @description  Adds a discreet button to YouTube that downloads comments via local app
// @author       Jeremy Brown
// @match        https://www.youtube.com/*
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+CiAgPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiNGRjAwMzQiLz4KICA8cG9seWdvbiBwb2ludHM9IjE1LDIyIDQ5LDIyIDMyLDQ4IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const BUTTON_ID = 'yt-comment-dl-btn';
  const DIALOG_ID = 'yt-comment-dl-dialog';

  function getChannelName() {
    return (
      document.querySelector('ytd-video-owner-renderer #channel-name a')?.textContent?.trim() ||
      document.querySelector('#owner #channel-name .yt-simple-endpoint')?.textContent?.trim() ||
      ''
    );
  }

  function getCurrentVideoUrl() {
    const url = new URL(location.href);
    const videoId = url.searchParams.get('v');
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : location.href;
  }

  function fireDownload(limit, sort, channel, includeTs, includeVid) {
    const title = document.title.replace(/ - YouTube$/, '').trim();
    let href = `ytcomments://download?url=${encodeURIComponent(getCurrentVideoUrl())}&sort=${sort}`;
    if (limit) href += `&limit=${encodeURIComponent(limit)}`;
    href += `&title=${encodeURIComponent(title)}`;
    href += `&channel=${encodeURIComponent(channel)}`;
    href += `&ts=${includeTs ? '1' : '0'}`;
    href += `&vid=${includeVid ? '1' : '0'}`;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = href;
    document.body.appendChild(iframe);
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }

  function showDialog() {
    if (document.getElementById(DIALOG_ID)) return;

    const overlay = document.createElement('div');
    overlay.id = DIALOG_ID;
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'background:rgba(0,0,0,.6)',
      'z-index:99999', 'display:flex', 'align-items:center', 'justify-content:center',
    ].join(';');

    function el(tag, styles, attrs) {
      const e = document.createElement(tag);
      if (styles) Object.assign(e.style, styles);
      if (attrs) Object.assign(e, attrs);
      return e;
    }

    const box = el('div', {
      background: '#fff', color: '#222', padding: '24px', borderRadius: '10px',
      fontFamily: 'Roboto,sans-serif', fontSize: '14px', width: '280px',
      boxShadow: '0 4px 24px rgba(0,0,0,.3)',
    });

    const heading = el('div', { fontWeight: '600', fontSize: '15px', marginBottom: '16px' });
    heading.textContent = '⬇️ Download Comments';
    box.appendChild(heading);

    const limitLabel = el('label', { display: 'block', marginBottom: '12px' });
    const limitSpan = el('span', { display: 'block', marginBottom: '4px', color: '#555' });
    limitSpan.textContent = 'Limit (blank = all)';
    const limitInput = el('input', {
      width: '100%', boxSizing: 'border-box', padding: '7px 10px',
      border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px',
    }, { id: 'ytdl-limit', type: 'number', min: '1', placeholder: 'e.g. 500' });
    limitLabel.appendChild(limitSpan);
    limitLabel.appendChild(limitInput);
    box.appendChild(limitLabel);

    const sortLabel = el('label', { display: 'block', marginBottom: '20px' });
    const sortSpan = el('span', { display: 'block', marginBottom: '4px', color: '#555' });
    sortSpan.textContent = 'Sort';
    const sortSelect = el('select', {
      width: '100%', boxSizing: 'border-box', padding: '7px 10px',
      border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px', background: '#fff',
    }, { id: 'ytdl-sort' });
    [['0', 'Most popular'], ['1', 'Most recent']].forEach(([val, text]) => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = text;
      sortSelect.appendChild(opt);
    });
    sortLabel.appendChild(sortSpan);
    sortLabel.appendChild(sortSelect);
    box.appendChild(sortLabel);

    const toggleRow = el('div', { display: 'flex', gap: '20px', marginBottom: '20px' });
    function makeCheckbox(id, labelText, defaultChecked) {
      const lbl = el('label', { display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#555' });
      const cb = el('input', {}, { id, type: 'checkbox' });
      cb.checked = defaultChecked;
      const span = document.createElement('span');
      span.textContent = labelText;
      lbl.appendChild(cb);
      lbl.appendChild(span);
      return { lbl, cb };
    }
    const { lbl: tsLabel, cb: tsCheck } = makeCheckbox('ytdl-ts', 'Include date', true);
    const { lbl: vidLabel, cb: vidCheck } = makeCheckbox('ytdl-vid', 'Include video ID', true);
    toggleRow.appendChild(tsLabel);
    toggleRow.appendChild(vidLabel);
    box.appendChild(toggleRow);

    const btnRow = el('div', { display: 'flex', gap: '8px', justifyContent: 'flex-end' });
    const cancelBtn = el('button', {
      padding: '7px 16px', border: '1px solid #ccc', borderRadius: '6px',
      background: '#fff', cursor: 'pointer', fontSize: '13px',
    }, { id: 'ytdl-cancel', type: 'button' });
    cancelBtn.textContent = 'Cancel';
    const okBtn = el('button', {
      padding: '7px 16px', border: 'none', borderRadius: '6px',
      background: '#065fd4', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
    }, { id: 'ytdl-ok', type: 'button' });
    okBtn.textContent = 'Download';
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(okBtn);
    box.appendChild(btnRow);

    overlay.appendChild(box);

    document.body.appendChild(overlay);

    let onKey;
    const close = () => {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
    };

    cancelBtn.onclick = close;
    overlay.onclick = e => { if (e.target === overlay) close(); };
    okBtn.onclick = () => {
      close();
      fireDownload(limitInput.value.trim(), sortSelect.value, getChannelName(), tsCheck.checked, vidCheck.checked);
    };

    onKey = e => {
      if (e.key === 'Escape') close();
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); okBtn.click(); }
    };
    document.addEventListener('keydown', onKey);
    limitInput.focus();
  }

  function createButton() {
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button';
    btn.textContent = '⬇️ Cmts';
    btn.title = 'Download comments';
    Object.assign(btn.style, {
      appearance: 'none',
      WebkitAppearance: 'none',
      background: 'transparent',
      color: 'var(--yt-spec-text-secondary, #aaa)',
      border: 'none',
      padding: '0 8px',
      fontSize: '13px',
      fontWeight: '400',
      cursor: 'pointer',
      marginLeft: '4px',
      filter: 'none',
      boxShadow: 'none',
      lineHeight: '1',
      opacity: '0.75',
    });
    btn.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
    btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.75'; });
    btn.addEventListener('click', showDialog);
    return btn;
  }

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;
    if (!new URL(location.href).searchParams.has('v')) return;

    const anchor =
      document.querySelector('#end ytd-button-renderer') ||
      document.querySelector('#end yt-button-shape') ||
      document.querySelector('ytd-masthead #end') ||
      document.querySelector('#end');

    if (!anchor) return;

    const btn = createButton();
    if (anchor.id === 'end') {
      anchor.prepend(btn);
    } else {
      anchor.parentElement.insertBefore(btn, anchor);
    }
  }

  function tryInject() {
    injectButton();
    setTimeout(injectButton, 800);
  }

  document.addEventListener('yt-navigate-finish', tryInject);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInject);
  } else {
    tryInject();
  }
})();
