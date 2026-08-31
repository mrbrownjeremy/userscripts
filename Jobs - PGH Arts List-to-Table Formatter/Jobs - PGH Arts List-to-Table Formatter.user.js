// ==UserScript==
// @name         Jobs - PGH Arts List-to-Table Formatter
// @namespace    https://github.com/mrbrownjeremy
// @version      1.6.2
// @description  Parses Pittsburgh Arts Council job roundup pages into sortable interactive tables
// @author       Jeremy Brown
// @match        *://www.pittsburghartscouncil.org/blog/*
// @icon         https://www.google.com/s2/favicons?domain=pittsburghartscouncil.org&sz=32
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const JOB_TYPES = new Set(['full-time', 'part-time', 'freelance/contract', 'seasonal/temporary']);

  const FAVICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzFjMWMxZSIvPjxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSIyOCIgaGVpZ2h0PSI4IiByeD0iMiIgZmlsbD0iI2QyODIxOCIvPjxyZWN0IHg9IjIiIHk9IjEyIiB3aWR0aD0iMTMiIGhlaWdodD0iNSIgcng9IjEiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii45Ii8+PHJlY3QgeD0iMTciIHk9IjEyIiB3aWR0aD0iMTMiIGhlaWdodD0iNSIgcng9IjEiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii45Ii8+PHJlY3QgeD0iMiIgeT0iMTkiIHdpZHRoPSIxMyIgaGVpZ2h0PSI1IiByeD0iMSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iLjYiLz48cmVjdCB4PSIxNyIgeT0iMTkiIHdpZHRoPSIxMyIgaGVpZ2h0PSI1IiByeD0iMSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iLjYiLz48cmVjdCB4PSIyIiB5PSIyNiIgd2lkdGg9IjEzIiBoZWlnaHQ9IjQiIHJ4PSIxIiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIuMyIvPjxyZWN0IHg9IjE3IiB5PSIyNiIgd2lkdGg9IjEzIiBoZWlnaHQ9IjQiIHJ4PSIxIiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIuMyIvPjwvc3ZnPg==';

  // ── Parsing ────────────────────────────────────────────────────────────────

  function stripAsterisks(text) {
    return text.replace(/^\*+|\*+$/g, '').trim();
  }

  function parseJobLi(li, section, type) {
    const a = li.querySelector('a');
    if (!a) return null;

    const position = a.textContent.trim();
    const url = a.href;
    const fullText = li.textContent;

    const atMatch = fullText.match(/\s+at\s+([\s\S]+?)\s*(?:Salary|Compensation)\s*:/i);
    const employer = atMatch ? atMatch[1].replace(/\s+/g, ' ').trim() : '';

    const compMatch = fullText.match(/(?:Salary|Compensation)\s*:\s*([^\n\r]+)/i);
    const compensation = compMatch ? compMatch[1].trim() : '';

    return { section, type, position, employer, compensation, url };
  }

  function parseOpportunityLi(li, section, type) {
    const a = li.querySelector('a');
    if (!a) return null;

    const opportunityType = a.textContent.trim();
    const url = a.href;
    const fullText = li.textContent;

    // Everything after the linked text, stripping a trailing asterisk
    const afterLink = fullText.slice(opportunityType.length).replace(/^\*\s*/, '').trim();

    // Deadline: last parenthetical in the entry
    const dueMatch = afterLink.match(/\(([^)]+)\)\s*$/);
    const due = dueMatch ? dueMatch[1].trim() : '';
    const description = dueMatch
      ? afterLink.slice(0, dueMatch.index).trim()
      : afterLink;

    return { section, type, opportunityType, description, due, url };
  }

  function parseRoundupPage() {
    const content =
      document.querySelector('.entry-content, .blog-item-content, [class*="blog"][class*="content"], article') ||
      document.body;

    const jobs = [];
    const opportunities = [];

    let currentSection = '';
    let currentType = '';
    let currentTypeIsJob = false;

    for (const node of content.querySelectorAll('h2, h3, h4, ul')) {
      const tag = node.tagName.toLowerCase();

      if (tag === 'h2') {
        currentSection = stripAsterisks(node.textContent);
        currentType = '';
        currentTypeIsJob = false;

      } else if (tag === 'h3' || tag === 'h4') {
        const text = stripAsterisks(node.textContent);
        currentTypeIsJob = JOB_TYPES.has(text.toLowerCase().trim());
        currentType = text;

      } else if (tag === 'ul') {
        for (const li of node.querySelectorAll(':scope > li')) {
          if (currentTypeIsJob) {
            const job = parseJobLi(li, currentSection, currentType);
            if (job) jobs.push(job);
          } else if (currentType) {
            const opp = parseOpportunityLi(li, currentSection, currentType);
            if (opp) opportunities.push(opp);
          }
        }
      }
    }

    return { jobs, opportunities };
  }

  // ── HTML output ────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function compSortKey(comp) {
    const m = comp.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : -1;
  }

  function dueSortKey(due) {
    const m = due.match(/(\d{1,2})\/(\d{1,2})/);
    return m ? parseInt(m[1], 10) * 100 + parseInt(m[2], 10) : 9999;
  }

  function sectionHeader(id, title, count, clearId, jumpHref, jumpLabel) {
    return `
<div id="${id}" class="section-header">
  <div class="section-left">
    <span class="section-title">${esc(title)}</span>
    <span class="row-count">${count}</span>
  </div>
  <div class="section-right">
    <a href="${jumpHref}" class="jump-link">${esc(jumpLabel)}</a>
    <span>&nbsp;·&nbsp;</span>
    <span class="sort-hint">Click a column to sort &nbsp;·&nbsp; Shift+click to add a secondary sort</span>
    <span>&nbsp;·&nbsp;</span>
    <a id="${clearId}" class="clear-sort" role="button">Clear Sort</a>
  </div>
</div>`;
  }

  function buildOutputHTML(pageTitle, pageUrl, jobs, opportunities) {
    const jobRows = jobs.map(j => `
      <tr>
        <td title="${esc(j.section)}">${esc(j.section)}</td>
        <td title="${esc(j.type)}">${esc(j.type)}</td>
        <td><a href="${esc(j.url)}" target="_blank" rel="noopener">${esc(j.position)}</a></td>
        <td>${esc(j.employer)}</td>
        <td data-sort="${compSortKey(j.compensation)}">${esc(j.compensation)}</td>
      </tr>`).join('');

    const oppRows = opportunities.map(o => {
      const dueDisplay = o.due.replace(/^Due\s+/i, '');
      return `
      <tr>
        <td title="${esc(o.section)}">${esc(o.section)}</td>
        <td title="${esc(o.type)}">${esc(o.type)}</td>
        <td><a href="${esc(o.url)}" target="_blank" rel="noopener">${esc(o.opportunityType)}</a></td>
        <td>${esc(o.description)}</td>
        <td data-sort="${dueSortKey(o.due)}">${esc(dueDisplay)}</td>
      </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc('TBL: ' + pageTitle)}</title>
<link rel="icon" type="image/svg+xml" href="${esc(FAVICON)}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, sans-serif;
    font-size: 14px;
    color: #1a1a1a;
    background: #f0f0f0;
    padding: 28px 24px;
  }

  .page-title {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: 20px;
  }
  .page-title a { color: inherit; text-decoration: none; }
  .page-title a:hover { text-decoration: underline; }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 8px;
  }
  .section-left {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #444; }
  .row-count { font-size: 12px; color: #999; }
  .section-right {
    display: flex;
    align-items: baseline;
    gap: 10px;
    font-size: 12px;
    color: #999;
    white-space: nowrap;
  }
  .sort-hint { color: #999; }
  .clear-sort { text-decoration: underline; cursor: pointer; visibility: hidden; }
  .clear-sort:hover { color: #555; }

  .table-wrap {
    overflow-x: auto;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,.12);
    margin-bottom: 28px;
  }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  thead th {
    background: #1c1c1e;
    color: #fff;
    padding: 10px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .06em;
    text-transform: uppercase;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
  }
  thead th:hover { background: #333; }
  thead th .sort-indicator { opacity: .8; margin-left: 3px; font-size: 10px; }
  tbody td {
    padding: 9px 14px;
    border-bottom: 1px solid #ebebeb;
    vertical-align: top;
    line-height: 1.45;
  }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: #f7f7f7; }
  td:nth-child(1) { font-size: 12px; color: #666; }
  td:nth-child(2) { font-size: 12px; }
  #jobs-table td:nth-child(5) { white-space: nowrap; }
  td a { color: #0055cc; text-decoration: none; }
  td a:hover { text-decoration: underline; }
  .jump-link { color: #a8ccdf; text-decoration: none; }
  .jump-link:hover { color: #6aa3c0; }
</style>
</head>
<body>

<div class="page-title">
  <a href="${esc(pageUrl)}" target="_blank" rel="noopener">${esc(pageTitle)}</a>
</div>

${sectionHeader('jobs-section', 'Jobs', jobs.length, 'jobs-clear-sort', '#opps-section', 'Go to Opportunities ↓')}
<div class="table-wrap">
  <table id="jobs-table">
    <colgroup>
      <col style="width:10%">
      <col style="width:9%">
      <col style="width:35%">
      <col style="width:33%">
      <col style="width:13%">
    </colgroup>
    <thead>
      <tr>
        <th data-col="0"><span class="th-label">Section</span></th>
        <th data-col="1"><span class="th-label">Type</span></th>
        <th data-col="2"><span class="th-label">Position</span></th>
        <th data-col="3"><span class="th-label">Employer</span></th>
        <th data-col="4"><span class="th-label">Compensation</span></th>
      </tr>
    </thead>
    <tbody id="jobs-body">${jobRows}</tbody>
  </table>
</div>

${sectionHeader('opps-section', 'Opportunities', opportunities.length, 'opps-clear-sort', '#jobs-section', '↑ Go to Jobs')}
<div class="table-wrap">
  <table id="opps-table">
    <colgroup>
      <col style="width:9%">
      <col style="width:11%">
      <col style="width:14%">
      <col style="width:54%">
      <col style="width:12%">
    </colgroup>
    <thead>
      <tr>
        <th data-col="0"><span class="th-label">Section</span></th>
        <th data-col="1"><span class="th-label">Type</span></th>
        <th data-col="2"><span class="th-label">Opportunity</span></th>
        <th data-col="3"><span class="th-label">Description</span></th>
        <th data-col="4"><span class="th-label">Due</span></th>
      </tr>
    </thead>
    <tbody id="opps-body">${oppRows}</tbody>
  </table>
</div>

<script>
(function () {
  function cellValue(cell) {
    if (cell.hasAttribute('data-sort')) return parseFloat(cell.dataset.sort);
    return cell.textContent.trim().toLowerCase();
  }

  function compareValues(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  }

  function makeTableSort(tableId, bodyId, clearBtnId) {
    const thead = document.querySelector('#' + tableId + ' thead');
    const tbody = document.getElementById(bodyId);
    const clearBtn = document.getElementById(clearBtnId);
    let sortState = [];

    function applySort() {
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        for (const {col, asc} of sortState) {
          const result = compareValues(cellValue(a.cells[col]), cellValue(b.cells[col]));
          if (result !== 0) return asc ? result : -result;
        }
        return 0;
      });
      rows.forEach(r => tbody.appendChild(r));
    }

    function updateHeaders() {
      thead.querySelectorAll('th[data-col]').forEach(th => {
        const col = parseInt(th.dataset.col, 10);
        const existing = th.querySelector('.sort-indicator');
        if (existing) existing.remove();
        const entry = sortState.find(s => s.col === col);
        if (entry) {
          const span = document.createElement('span');
          span.className = 'sort-indicator';
          const arrow = entry.asc ? '↑' : '↓';
          span.textContent = sortState.length > 1 ? arrow + (sortState.indexOf(entry) + 1) : arrow;
          th.appendChild(span);
        }
      });
      clearBtn.style.visibility = sortState.length ? 'visible' : 'hidden';
    }

    clearBtn.addEventListener('click', function () {
      sortState = [];
      updateHeaders();
    });

    thead.addEventListener('click', function (e) {
      const th = e.target.closest('th[data-col]');
      if (!th) return;
      const col = parseInt(th.dataset.col, 10);
      const existing = sortState.find(s => s.col === col);

      if (e.shiftKey) {
        if (existing) {
          if (!existing.asc) { sortState = sortState.filter(s => s.col !== col); }
          else { existing.asc = false; }
        } else {
          sortState.push({ col, asc: true });
        }
      } else {
        if (sortState.length === 1 && sortState[0].col === col) {
          if (!sortState[0].asc) { sortState = []; }
          else { sortState[0].asc = false; }
        } else {
          sortState = [{ col, asc: true }];
        }
      }

      updateHeaders();
      if (sortState.length) applySort();
    });
  }

  makeTableSort('jobs-table', 'jobs-body', 'jobs-clear-sort');
  makeTableSort('opps-table', 'opps-body', 'opps-clear-sort');
})();
<\/script>
</body>
</html>`;
  }

  // ── Button injection ───────────────────────────────────────────────────────

  function injectButton() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pac-btn-pulse {
        0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,.3), 0 0 0 0 rgba(210,130,24,.6); }
        50%       { box-shadow: 0 2px 8px rgba(0,0,0,.3), 0 0 0 10px rgba(210,130,24,0); }
      }
      #pac-table-btn { animation: pac-btn-pulse 2.4s ease-in-out infinite; }
      #pac-table-btn:hover {
        animation: none;
        background: #b8711a !important;
        box-shadow: 0 3px 10px rgba(0,0,0,.4) !important;
      }
    `;
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.id = 'pac-table-btn';
    btn.textContent = 'Open as Table';
    btn.title = 'Parse this roundup into sortable tables';
    Object.assign(btn.style, {
      position:     'fixed',
      bottom:       '24px',
      left:         '50%',
      transform:    'translateX(-50%)',
      zIndex:       '2147483647',
      padding:      '9px 18px',
      background:   '#d28218',
      color:        '#fff',
      border:       '1px solid #000',
      borderRadius: '20px',
      fontSize:     '13px',
      fontWeight:   '600',
      fontFamily:   '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      cursor:       'pointer',
      whiteSpace:   'nowrap',
    });

    btn.addEventListener('click', () => {
      const { jobs, opportunities } = parseRoundupPage();
      if (!jobs.length && !opportunities.length) {
        alert('No listings found on this page.');
        return;
      }

      const titleEl = document.querySelector('h1, .entry-title');
      const title = titleEl ? titleEl.textContent.trim() : document.title;
      const html = buildOutputHTML(title, location.href, jobs, opportunities);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');

      if (!win) {
        URL.revokeObjectURL(url);
        alert('Popup blocked. Allow popups for this site and try again.');
        return;
      }

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });

    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }
})();
