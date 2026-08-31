// ==UserScript==
// @name         Job Form Filler
// @namespace    https://github.com/mrbrownjeremy
// @version      1.1.0
// @description  Auto-fills job application forms from your resume_data.yaml file.
// @author       Jeremy Brown
// @icon         data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>
// @match        *://*/*
// @exclude      *://coda.io/*
// @exclude      *://*.coda.io/*
// @exclude      *://docs.google.com/spreadsheets/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
'use strict';

// ============================================================================
// MINIMAL YAML PARSER
// Handles exactly the schema used in resume_data.yaml. Does not aim to be a
// general-purpose parser. Supported constructs:
//   - key: scalar value
//   - key: "quoted value"
//   - key: >-    (folded block scalar, strip trailing newlines)
//   - key:       (followed by a block sequence or block mapping)
//   - - string item   (block sequence of scalars)
//   - - key: val      (block sequence of mappings)
//   - Same-indent sequences (skills section pattern)
// ============================================================================

function parseYaml(text) {
  const lines = text.split('\n');
  let i = 0;

  function indent(line) { return line.match(/^( *)/)[1].length; }
  function isBlank(line) { return !line.trim() || line.trim().startsWith('#'); }

  function skipBlanks() {
    while (i < lines.length && isBlank(lines[i])) i++;
  }

  // Strip surrounding single or double quotes from a scalar value string
  function unquote(s) {
    if (!s) return s;
    s = s.trim();
    if ((s.startsWith('"') && s.endsWith('"')) ||
        (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
    return s;
  }

  // Parse "key: value" from a line. Returns { key, raw } where raw is the
  // string after the colon (trimmed), or null if there's nothing after it.
  // raw may still be a block scalar indicator (">-") or empty.
  function parseKV(line) {
    // Match: optional indent, key (word chars / spaces / & / -), colon, optional value
    const m = line.match(/^(\s*)([\w][\w\s&\-]*?):\s*(.*)?$/);
    if (!m) return null;
    return { key: m[2].trim(), raw: m[3]?.trim() || null };
  }

  // Collect lines of a folded block scalar (>-).
  // baseIndent is the indent of the key that introduced the block.
  function readBlockScalar(baseIndent) {
    const parts = [];
    while (i < lines.length) {
      const line = lines[i];
      if (isBlank(line)) { i++; continue; }
      if (indent(line) <= baseIndent) break;
      parts.push(line.trim());
      i++;
    }
    return parts.join(' ');
  }

  // Read a sequence (list) of items whose "- " markers are at exactly seqIndent.
  // Items are either plain strings or inline mappings ("- key: val").
  // Breaks when a non-blank, non-sequence line appears at seqIndent (another key).
  function readSequence(seqIndent) {
    const items = [];
    skipBlanks();
    while (i < lines.length) {
      const line = lines[i];
      if (isBlank(line)) { i++; continue; }
      const ind = indent(line);
      if (ind < seqIndent) break;
      if (ind > seqIndent) { i++; continue; } // shouldn't occur in well-formed YAML
      const s = line.trim();
      if (!s.startsWith('- ') && s !== '-') break; // non-list item at same level — stop

      const afterDash = s.slice(2).trim();
      i++;

      if (!afterDash) {
        // Empty dash: mapping starts on subsequent indented lines
        skipBlanks();
        if (i < lines.length && indent(lines[i]) > seqIndent) {
          items.push(readMapping(indent(lines[i])));
        }
      } else if (afterDash.includes(':')) {
        // "- key: value" — first property of an inline mapping
        const ci = afterDash.indexOf(':');
        const k  = afterDash.slice(0, ci).trim();
        const v  = afterDash.slice(ci + 1).trim();
        const item = { [k]: unquote(v) };
        // Read remaining key: value properties indented further than the dash
        skipBlanks();
        if (i < lines.length && indent(lines[i]) > seqIndent) {
          Object.assign(item, readMapping(indent(lines[i])));
        }
        items.push(item);
      } else {
        // Plain string item
        items.push(unquote(afterDash));
      }
    }
    return items;
  }

  // Read a block mapping whose keys sit at exactly baseIndent.
  function readMapping(baseIndent) {
    const obj = {};
    skipBlanks();
    while (i < lines.length) {
      const line = lines[i];
      if (isBlank(line)) { i++; continue; }
      const ind = indent(line);
      if (ind < baseIndent) break;  // end of this block
      if (ind > baseIndent) { i++; continue; } // stray deeper line — skip

      const kv = parseKV(line);
      if (!kv) { i++; continue; }

      i++;

      if (kv.raw === '>-' || kv.raw === '>') {
        // Folded block scalar
        obj[kv.key] = readBlockScalar(ind);
      } else if (kv.raw) {
        // Inline scalar (possibly quoted)
        obj[kv.key] = unquote(kv.raw);
      } else {
        // Empty value — could be a sequence or nested mapping
        skipBlanks();
        if (i >= lines.length) { obj[kv.key] = null; continue; }

        const nextLine   = lines[i];
        const nextIndent = indent(nextLine);
        const nextS      = nextLine.trim();

        if (nextS.startsWith('- ')) {
          // Sequence — may be at same indent (skills pattern) or deeper
          obj[kv.key] = readSequence(nextIndent);
        } else if (nextIndent > baseIndent) {
          // Nested mapping
          obj[kv.key] = readMapping(nextIndent);
        } else {
          obj[kv.key] = null;
        }
      }
    }
    return obj;
  }

  return readMapping(0);
}

// ============================================================================
// PROFILE NORMALIZER
// Converts the raw parsed YAML object into the internal profile shape the
// rest of the script works with.
// ============================================================================

function normalizeProfile(yaml) {
  // Flatten skills object (category → string[]) into one string
  function flattenSkills(skillsObj) {
    if (!skillsObj) return '';
    return Object.values(skillsObj).flat().join('; ');
  }

  // Parse "Feb 2020 – May 2025" or "Mar 2014 – Present" style date ranges
  function parseDates(str) {
    if (!str) return { startDate: '', endDate: '', current: false };
    const [startRaw, endRaw = ''] = str.split(/\s*[–\-]\s*/);
    const current = /present/i.test(endRaw);
    return {
      startDate: startRaw.trim(),
      endDate:   current ? '' : endRaw.trim(),
      current,
    };
  }

  const nameParts = (yaml.name || '').trim().split(/\s+/);

  const contact = {
    name:         yaml.name         || '',
    firstName:    nameParts[0]      || '',
    lastName:     nameParts.slice(1).join(' ') || '',
    email:        yaml.email        || '',
    phone:        yaml.phone        || '',
    social:       yaml.social       || '',
    website:      yaml.website      || '',
    linkedin:     yaml.linkedin     || '',
    github:       yaml.github       || '',
    location:     yaml.location     || '',
    currentTitle: yaml.title        || '',
  };

  const jobs = (yaml.experience || []).map(e => {
    const { startDate, endDate, current } = parseDates(e.dates);
    return {
      title:       e.role      || '',
      company:     e.org       || '',
      location:    e.location  || '',
      startDate,
      endDate,
      current,
      description: Array.isArray(e.bullets) ? e.bullets.join('\n') : '',
    };
  });

  const education = (yaml.education || []).map(e => ({
    degree:           e['degree-full'] || e.degree || '',
    degreeShort:      e.degree         || '',
    school:           e.school         || '',
    location:         e.location       || '',
    startDate:        e['start-full']  || e['start-year'] || '',
    endDate:          e['end-full']    || e['end-year']   || '',
    startYear:        e['start-year']  || '',
    endYear:          e['end-year']    || '',
    gpa:              (e.gpa || '').replace(/^GPA:\s*/i, '').trim(),
    activities:       e.notes          || '',
    activitiesShort:  e['notes-short'] || '',
  }));

  return {
    contact,
    summary:   yaml.summary || '',
    jobs,
    education,
    skills: {
      all:        flattenSkills(yaml.skills),
      byCategory: yaml.skills || {},
    },
  };
}

// ============================================================================
// PROFILE STORAGE
// ============================================================================

function loadProfile()  { return GM_getValue('profile', null); }
function saveProfile(p) { GM_setValue('profile', p); }
function clearProfile() { GM_setValue('profile', null); }

// ============================================================================
// UTILITIES
// ============================================================================

const sleep = ms => new Promise(r => setTimeout(r, ms));

function isVisible(el) {
  if (!el) return false;
  try {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.1) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  } catch { return false; }
}

function isInteractable(el) {
  return el && isVisible(el) && !el.disabled && !el.readOnly && el.getAttribute('aria-disabled') !== 'true';
}

// Fires React/Vue/Angular-compatible input events after setting a value
function triggerInput(el, value) {
  el.focus();
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype
    : el.tagName === 'SELECT' ? HTMLSelectElement.prototype
    : HTMLInputElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, 'value');
  if (desc?.set) desc.set.call(el, value); else el.value = value;
  if (el._valueTracker) el._valueTracker.setValue('');
  ['input', 'change', 'blur'].forEach(t => el.dispatchEvent(new Event(t, { bubbles: true })));
}

// Traverses shadow DOM in addition to regular DOM
function querySelectorAllDeep(selector, root = document) {
  const results = [];
  function traverse(node) {
    try { results.push(...node.querySelectorAll(selector)); } catch {}
    if (node.shadowRoot) traverse(node.shadowRoot);
    try { node.querySelectorAll('*').forEach(el => { if (el.shadowRoot) traverse(el.shadowRoot); }); } catch {}
  }
  traverse(root);
  return results;
}

// Extracts a human-readable label for a form element using multiple strategies
function extractLabel(el) {
  if (el.id) {
    try {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl) { const t = lbl.textContent.trim(); if (t && t.length < 200) return t; }
    } catch {}
  }
  const aria = el.getAttribute('aria-label');
  if (aria?.trim()) return aria.trim();

  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const lblEl = document.getElementById(labelledBy);
    if (lblEl) { const t = lblEl.textContent.trim(); if (t) return t; }
  }

  const wrap = el.closest('label');
  if (wrap) {
    const clone = wrap.cloneNode(true);
    clone.querySelectorAll('input,select,textarea,button').forEach(e => e.remove());
    const t = clone.textContent.trim();
    if (t && t.length < 200) return t;
  }

  let parent = el.parentElement;
  for (let i = 0; i < 6 && parent; i++) {
    for (const sel of ['label', '[class*="label" i]', '[class*="field-name" i]', '[class*="question" i]']) {
      try {
        const found = parent.querySelector(sel);
        if (found && !found.contains(el)) {
          const t = found.textContent.trim();
          if (t && t.length < 200) return t;
        }
      } catch {}
    }
    parent = parent.parentElement;
  }

  const ph = el.getAttribute('placeholder');
  if (ph?.trim()) return ph.trim();
  if (el.name) return el.name.replace(/[\[\]\-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
  return null;
}

function normalizeLabel(s) {
  return (s || '').toLowerCase()
    .replace(/^(your|my|the|candidates?'?s?|applicants?'?s?|please\s*(enter|provide)?)\s+/i, '')
    .replace(/[^a-z0-9]/g, '');
}

function escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ============================================================================
// FIELD → PROFILE MAPPINGS
// ============================================================================

const FIELD_MAP = [
  { keys: ['firstname','fname','givenname'],
    get: p => p.contact.firstName },
  { keys: ['lastname','lname','surname','familyname'],
    get: p => p.contact.lastName },
  { keys: ['fullname','legalname','candidatename','applicantname'],
    get: p => p.contact.name },
  { keys: ['yourname'],
    get: p => p.contact.name },
  { keys: ['email','emailaddress','mail'],
    get: p => p.contact.email },
  { keys: ['phone','phonenumber','mobilenumber','cellphone','telephone','contactnumber'],
    get: p => p.contact.phone },
  { keys: ['location','currentlocation','currentcity','city','citystate'],
    get: p => p.contact.location },
  { keys: ['linkedin','linkedinurl','linkedinprofile'],
    get: p => p.contact.linkedin || p.contact.social },
  { keys: ['github','githuburl','githubprofile'],
    get: p => p.contact.github },
  { keys: ['website','portfolio','portfoliourl','personalwebsite','personalsite'],
    get: p => p.contact.website },
  { keys: ['summary','professionalsummary','coverletter','aboutyou','aboutme','intro','introduction','background'],
    get: p => p.summary },
  { keys: ['skills','keyskills','technicalskills','coreproficiencies','coreskills'],
    get: p => p.skills.all },
  { keys: ['currenttitle','jobtitle','currentrole','currentposition'],
    get: p => p.jobs[0]?.title },
  { keys: ['currentcompany','currentemployer','currentorganization'],
    get: p => p.jobs[0]?.company },
];

function matchSimpleField(label, profile) {
  const norm = normalizeLabel(label);
  for (const entry of FIELD_MAP) {
    if (entry.keys.some(k => norm === k || norm.startsWith(k) || norm.endsWith(k))) {
      const val = entry.get(profile);
      if (val) return val;
    }
  }
  if (norm === 'name' || norm === 'fullname') return profile.contact.name;
  return null;
}

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

function detectPlatform() {
  const h = location.hostname.toLowerCase();
  if (/myworkdayjobs\.com|\.myworkday\.com/.test(h))  return 'workday';
  if (/greenhouse\.io|boards\.greenhouse/.test(h))     return 'greenhouse';
  if (/jobs\.lever\.co|lever\.co/.test(h))             return 'lever';
  if (/ashbyhq\.com/.test(h))                          return 'ashby';
  if (/smartrecruiters\.com/.test(h))                  return 'smartrecruiters';
  if (/icims\.com/.test(h))                            return 'icims';
  if (/jobvite\.com/.test(h))                          return 'jobvite';
  if (/bamboohr\.com/.test(h))                         return 'bamboohr';
  if (/taleo\.net/.test(h))                            return 'taleo';
  if (/recruitee\.com/.test(h))                        return 'recruitee';
  if (/workable\.com/.test(h))                         return 'workable';
  return 'generic';
}

function isJobSite() {
  const h = location.hostname.toLowerCase();
  const u = location.href.toLowerCase();
  const platforms = ['myworkdayjobs.com','myworkday.com','greenhouse.io','boards.greenhouse.io',
    'jobs.lever.co','ashbyhq.com','smartrecruiters.com','icims.com','jobvite.com',
    'bamboohr.com','taleo.net','recruitee.com','workable.com'];
  if (platforms.some(p => h.includes(p))) return true;
  return /\/(apply|application|careers?|jobs?)\//.test(u);
}

// ============================================================================
// GENERIC FIELD FILLING
// ============================================================================

async function fillSimpleFields(profile) {
  let filled = 0;
  const inputSel = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea';

  for (const el of querySelectorAllDeep(inputSel)) {
    if (!isInteractable(el)) continue;
    if (el.value?.trim()) continue; // don't overwrite existing values
    const label = extractLabel(el);
    if (!label) continue;
    const value = matchSimpleField(label, profile);
    if (value) {
      triggerInput(el, value);
      filled++;
      await sleep(25);
    }
  }

  for (const el of querySelectorAllDeep('select')) {
    if (!isInteractable(el)) continue;
    const label = extractLabel(el);
    if (!label) continue;
    const value = matchSimpleField(label, profile);
    if (!value) continue;
    const opt = Array.from(el.options).find(o => o.text.toLowerCase().includes(value.toLowerCase()));
    if (opt) {
      el.value = opt.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      filled++;
    }
  }

  return filled;
}

// ============================================================================
// WORK HISTORY FILLING
// ============================================================================

async function fillWorkHistory(profile) {
  if (!profile.jobs?.length) return 0;
  // Workday work history uses non-standard shadow DOM widgets — skip for now
  if (detectPlatform() === 'workday') return 0;

  return fillRepeatableSection(profile.jobs, {
    sectionLabels:      ['employment', 'work history', 'experience', 'work experience', 'positions', 'employers'],
    addButtonTexts:     ['add another', 'add employment', 'add experience', 'add position', 'add work'],
    containerSelectors: ['[class*="employment"]', '[class*="work-history"]', '[class*="work_history"]',
                         '[class*="experience"]', '[data-field="employment"]', 'fieldset'],
    fillEntry:          fillJobEntry,
  });
}

async function fillEducationSection(profile) {
  if (!profile.education?.length) return 0;

  return fillRepeatableSection(profile.education, {
    sectionLabels:      ['education', 'school', 'degree', 'academic'],
    addButtonTexts:     ['add another', 'add education', 'add school', 'add degree'],
    containerSelectors: ['[class*="education"]', '[data-field="education"]', 'fieldset'],
    fillEntry:          fillEduEntry,
  });
}

// Generic repeating-section filler. Finds the add button, clicks once per entry,
// locates the newest container, and fills it.
async function fillRepeatableSection(entries, { sectionLabels, addButtonTexts, containerSelectors, fillEntry }) {
  const addBtn = findAddButton(addButtonTexts, sectionLabels);
  if (!addBtn) return 0;

  let filled = 0;
  const initialCount = countContainers(containerSelectors);

  for (const entry of entries) {
    addBtn.click();
    await sleep(600);

    // Wait for a new container
    let container = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const all = findAllContainers(containerSelectors);
      if (all.length > initialCount + filled) { container = all[all.length - 1]; break; }
      await sleep(200);
    }
    if (!container) continue;

    filled += await fillEntry(container, entry);
  }
  return filled;
}

function findAddButton(buttonTexts, nearSectionLabels) {
  const candidates = Array.from(document.querySelectorAll('a[href="#"], button, [role="button"]'));
  for (const el of candidates) {
    if (!isVisible(el)) continue;
    const t = el.textContent.trim().toLowerCase();
    if (!buttonTexts.some(k => t.includes(k))) continue;
    // Prefer buttons near a section heading that matches sectionLabels
    if (nearSectionLabels) {
      let parent = el.parentElement;
      for (let i = 0; i < 10 && parent; i++) {
        const headings = parent.querySelectorAll('h1,h2,h3,h4,h5,legend,[class*="heading" i],[class*="section-title" i]');
        for (const h of headings) {
          if (nearSectionLabels.some(l => h.textContent.trim().toLowerCase().includes(l))) return el;
        }
        parent = parent.parentElement;
      }
    }
    return el;
  }
  return null;
}

function countContainers(selectors) {
  return selectors.reduce((n, sel) => { try { return n + document.querySelectorAll(sel).length; } catch { return n; } }, 0);
}

function findAllContainers(selectors) {
  const results = [];
  for (const sel of selectors) {
    try { results.push(...document.querySelectorAll(sel)); } catch {}
  }
  return results;
}

async function fillJobEntry(container, job) {
  let filled = 0;
  const inputs = container.querySelectorAll(
    'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea'
  );
  for (const input of inputs) {
    if (!isInteractable(input)) continue;
    const label = (extractLabel(input) || '').toLowerCase();
    let val = '';
    if      (/compan|employer|organization/.test(label))                         val = job.company;
    else if (/job\s*title|position\s*title|\btitle\b|role|designation/.test(label)) val = job.title;
    else if (/\bstart|start\s*date|from/.test(label))                            val = job.startDate;
    else if (/\bend\b|end\s*date|\bto\b|through/.test(label))                   val = job.current ? 'Present' : job.endDate;
    else if (/description|responsib|duties|detail|summary/.test(label))         val = job.description;
    else if (/location|city|where/.test(label))                                  val = job.location;
    if (val) { triggerInput(input, val); filled++; await sleep(25); }
  }
  if (job.current) {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    for (const cb of checkboxes) {
      const lbl = (extractLabel(cb) || '').toLowerCase();
      if (/current|present|still|ongoing/.test(lbl) && !cb.checked) {
        cb.click(); await sleep(100);
      }
    }
  }
  return filled;
}

async function fillEduEntry(container, edu) {
  let filled = 0;
  const inputs = container.querySelectorAll(
    'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea'
  );
  for (const input of inputs) {
    if (!isInteractable(input)) continue;
    const label = (extractLabel(input) || '').toLowerCase();
    let val = '';
    if      (/school|institution|university|college/.test(label))               val = edu.school;
    else if (/degree|qualification|credential/.test(label))                     val = edu.degree;
    else if (/field|major|area|discipline|program|concentration/.test(label))   val = edu.degree;
    else if (/gpa|\bgrade\b|score/.test(label))                                 val = edu.gpa;
    else if (/\bstart|start\s*date|from/.test(label))                           val = edu.startDate;
    else if (/\bend\b|end\s*date|grad|complet|\bto\b/.test(label))             val = edu.endDate;
    else if (/activit|honor|award|achievement|extracurricular/.test(label))     val = edu.activities;
    if (val) { triggerInput(input, val); filled++; await sleep(25); }
  }
  return filled;
}

// ============================================================================
// MAIN FILL
// ============================================================================

async function autoFill() {
  const profile = loadProfile();
  if (!profile) {
    showToast('No resume loaded — open Tampermonkey → Job Form Filler → Manage Profile / Load Resume', 'error');
    return;
  }
  showToast('Filling…', 'info');
  let total = 0;
  total += await fillSimpleFields(profile);
  total += await fillWorkHistory(profile);
  total += await fillEducationSection(profile);
  showToast(
    total > 0 ? `Filled ${total} field${total === 1 ? '' : 's'}` : 'No fields matched — try filling manually',
    total > 0 ? 'success' : 'info'
  );
}

// ============================================================================
// TOAST
// ============================================================================

function showToast(msg, type = 'info') {
  document.getElementById('jff-toast')?.remove();
  const bg = type === 'success' ? '#15803d' : type === 'error' ? '#b91c1c' : '#334155';
  const el = document.createElement('div');
  el.id = 'jff-toast';
  el.textContent = msg;
  el.style.cssText = `position:fixed;top:20px;right:20px;z-index:2147483647;background:${bg};color:white;`
    + `padding:12px 18px;border-radius:8px;font:14px/1.4 system-ui,sans-serif;`
    + `box-shadow:0 4px 16px rgba(0,0,0,.25);max-width:340px;pointer-events:none;`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), type === 'error' ? 6000 : 3000);
}

// ============================================================================
// MANAGEMENT PANEL
// ============================================================================

function buildPanelHtml(profile) {
  const c = profile?.contact || {};

  function contactRow(label, value) {
    if (!value) return '';
    return `<tr><td class="td-label">${escHtml(label)}</td><td>${escHtml(value)}</td></tr>`;
  }

  function jobCard(j) {
    return `
      <div class="entry-card">
        <div class="entry-title">${escHtml(j.title)}</div>
        <div class="entry-meta">${escHtml(j.company)}${j.location ? ` · ${escHtml(j.location)}` : ''} · ${escHtml(j.startDate)} – ${j.current ? 'Present' : escHtml(j.endDate)}</div>
        ${j.description ? `<div class="bullets">${escHtml(j.description)}</div>` : ''}
      </div>`;
  }

  function eduCard(e) {
    return `
      <div class="entry-card">
        <div class="entry-title">${escHtml(e.degree)}</div>
        <div class="entry-meta">${escHtml(e.school)}${e.location ? ` · ${escHtml(e.location)}` : ''} · ${escHtml(e.startDate)} – ${escHtml(e.endDate)}${e.gpa ? ` · GPA ${escHtml(e.gpa)}` : ''}</div>
        ${e.activities ? `<div class="bullets">${escHtml(e.activities)}</div>` : ''}
      </div>`;
  }

  function skillsSection(skills) {
    if (!skills?.byCategory || !Object.keys(skills.byCategory).length) {
      return `<p class="empty">No skills parsed.</p>`;
    }
    return Object.entries(skills.byCategory).map(([cat, items]) => `
      <div style="margin-bottom:14px;">
        <div class="skill-cat">${escHtml(cat)}</div>
        <ul class="skill-list">${(items || []).map(s => `<li>${escHtml(s)}</li>`).join('')}</ul>
      </div>`).join('');
  }

  const profileSection = profile ? `
    <div class="card">
      <h2>Contact</h2>
      <table class="contact-table">
        ${contactRow('Name',          c.name)}
        ${contactRow('Email',         c.email)}
        ${contactRow('Phone',         c.phone)}
        ${contactRow('Location',      c.location)}
        ${contactRow('LinkedIn',      c.linkedin)}
        ${contactRow('Website',       c.website)}
        ${contactRow('GitHub',        c.github)}
        ${contactRow('Social',        c.social)}
        ${contactRow('Current title', c.currentTitle)}
      </table>
    </div>
    <div class="card">
      <h2>Work History <span class="count">${profile.jobs?.length || 0}</span></h2>
      ${profile.jobs?.map(jobCard).join('') || '<p class="empty">No jobs parsed.</p>'}
    </div>
    <div class="card">
      <h2>Education <span class="count">${profile.education?.length || 0}</span></h2>
      ${profile.education?.map(eduCard).join('') || '<p class="empty">No education parsed.</p>'}
    </div>
    <div class="card">
      <h2>Skills</h2>
      ${skillsSection(profile.skills)}
    </div>
  ` : `<div class="card"><p class="empty" style="text-align:center;padding:32px 0;">No resume loaded yet.</p></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Job Form Filler — Profile</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: system-ui,-apple-system,sans-serif; background: #f5f4f2; color: #1c1917; margin: 0; }
  .top-bar { background: #1c1917; color: white; padding: 16px 32px; }
  .top-bar h1 { margin: 0; font-size: 18px; font-weight: 600; }
  .top-bar .sub { font-size: 12px; color: #a8a29e; margin-top: 2px; }
  .main { max-width: 760px; margin: 0 auto; padding: 28px 24px 60px; }
  .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.07); }
  h2 { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .07em; color: #78716c; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
  .count { background: #e7e5e4; color: #57534e; border-radius: 20px; padding: 2px 8px; font-size: 11px; }
  .contact-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .contact-table tr + tr td { border-top: 1px solid #f5f4f2; }
  .td-label { color: #78716c; padding: 6px 16px 6px 0; width: 120px; font-size: 13px; white-space: nowrap; }
  .contact-table td { padding: 6px 0; vertical-align: top; }
  .entry-card { border: 1px solid #e7e5e4; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; }
  .entry-title { font-weight: 600; font-size: 15px; margin-bottom: 3px; }
  .entry-meta { font-size: 13px; color: #78716c; margin-bottom: 6px; }
  .bullets { font-size: 13px; color: #44403c; white-space: pre-wrap; border-left: 3px solid #e7e5e4; padding-left: 12px; margin-top: 8px; line-height: 1.5; }
  .skill-cat { font-size: 12px; font-weight: 600; color: #78716c; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
  .skill-list { margin: 0; padding-left: 20px; }
  .skill-list li { font-size: 13px; color: #44403c; line-height: 1.7; }
  .empty { color: #a8a29e; font-size: 14px; margin: 0; }
  .load-zone { display: block; border: 2px dashed #d6d3d1; border-radius: 8px; padding: 28px 20px; text-align: center; cursor: pointer; transition: border-color .15s, background .15s; }
  .load-zone:hover { border-color: #a8a29e; background: #fafaf9; }
  .load-zone input { display: none; }
  .load-icon { font-size: 28px; margin-bottom: 8px; }
  .load-label { font-size: 15px; font-weight: 500; color: #44403c; margin-bottom: 4px; }
  .load-sub { font-size: 13px; color: #a8a29e; }
  .status { margin-top: 12px; font-size: 13px; color: #78716c; min-height: 20px; }
  .status.ok  { color: #15803d; }
  .status.err { color: #b91c1c; }
  .actions { display: flex; gap: 10px; margin-top: 14px; }
  button { padding: 9px 18px; border: none; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; }
  .btn-clear { background: #fee2e2; color: #b91c1c; }
  .btn-clear:hover { background: #fecaca; }
  .note { font-size: 12px; color: #a8a29e; margin-top: 12px; line-height: 1.5; }
</style>
</head>
<body>
<div class="top-bar">
  <div class="sub">Userscript</div>
  <h1>Job Form Filler</h1>
</div>
<div class="main">
  <div class="card">
    <h2>Resume</h2>
    <label class="load-zone" id="drop-zone">
      <input type="file" id="resume-file" accept=".yaml,.yml">
      <div class="load-icon">📄</div>
      <div class="load-label">Click to load resume_data.yaml</div>
      <div class="load-sub">YAML format (.yaml / .yml)</div>
    </label>
    <div class="status" id="status">${profile
      ? `✓ Loaded: ${escHtml(c.name || 'Unknown')} · ${profile.jobs?.length || 0} jobs · ${profile.education?.length || 0} education`
      : 'No resume loaded yet.'
    }</div>
    <div class="actions">
      <button class="btn-clear" id="clear-btn">Clear Profile</button>
    </div>
    <div class="note">After loading, close this tab and use <strong>Tampermonkey → Fill Form Now</strong> on any application page. The profile persists until you load a new file or clear it.</div>
  </div>

  ${profileSection}
</div>
<script>
  document.getElementById('resume-file').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        window.opener?.postMessage({ type: 'jff-load-yaml', text: ev.target.result }, '*');
        const s = document.getElementById('status');
        s.textContent = '✓ File sent — reopen this panel to see the parsed profile.';
        s.className = 'status ok';
      } catch (err) {
        const s = document.getElementById('status');
        s.textContent = 'Error: ' + err.message;
        s.className = 'status err';
      }
    };
    reader.onerror = () => {
      const s = document.getElementById('status');
      s.textContent = 'Could not read file.';
      s.className = 'status err';
    };
    reader.readAsText(file);
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('Clear all saved profile data?')) {
      window.opener?.postMessage({ type: 'jff-clear-profile' }, '*');
      const s = document.getElementById('status');
      s.textContent = 'Profile cleared.';
      s.className = 'status';
    }
  });
<\/script>
</body>
</html>`;
}

let panelWindow = null;

function openPanel() {
  const profile  = loadProfile();
  const html     = buildPanelHtml(profile);
  const blob     = new Blob([html], { type: 'text/html' });
  const url      = URL.createObjectURL(blob);

  if (panelWindow && !panelWindow.closed) {
    panelWindow.location.href = url;
    panelWindow.focus();
  } else {
    panelWindow = window.open(url, 'jff-panel');
  }

  window.addEventListener('message', function onMsg(e) {
    if (e.source !== panelWindow) return;

    if (e.data?.type === 'jff-load-yaml') {
      try {
        const yaml    = parseYaml(e.data.text);
        const profile = normalizeProfile(yaml);
        saveProfile(profile);
        showToast(`Loaded: ${profile.contact?.name || 'Unknown'} · ${profile.jobs?.length || 0} jobs`, 'success');
      } catch (err) {
        showToast('Failed to parse YAML: ' + err.message, 'error');
      }
    } else if (e.data?.type === 'jff-clear-profile') {
      clearProfile();
      showToast('Profile cleared', 'info');
    }
  });
}

// ============================================================================
// AUTO-FILL ON JOB SITE LOAD
// ============================================================================

async function autoFillOnLoad() {
  if (!isJobSite()) return;
  const profile = loadProfile();
  if (!profile) return;

  // Wait up to 20s for form inputs to appear
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    if (document.querySelector('input:not([type="hidden"]):not([type="submit"])')) break;
  }

  await sleep(300);
  await fillSimpleFields(profile);
}

// ============================================================================
// INIT
// ============================================================================

GM_registerMenuCommand('Fill Form Now', autoFill);
GM_registerMenuCommand('Manage Profile / Load Resume', openPanel);

autoFillOnLoad();

})();
