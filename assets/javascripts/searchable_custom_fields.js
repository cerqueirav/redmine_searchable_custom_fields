// Redmine Searchable Custom Fields
// Copyright (C) 2026 Victor Cerqueira <dev.cerqueirav@gmail.com>
// GNU General Public License v3 or later. See the LICENSE file.
//
// Adds a search box to long list custom fields without replacing the native
// <select> or checkbox group. Non-matching options get the `scf-hidden` class;
// the `hidden`/`style` attributes are left alone because cascading plugins
// (e.g. Depending Custom Fields) use them to hide options that are not allowed.
(function () {
  'use strict';

  function readConfig() {
    var meta = document.querySelector('meta[name="searchable-custom-fields"]');
    if (!meta) return {};
    try { return JSON.parse(meta.getAttribute('content')) || {}; } catch (e) { return {}; }
  }

  var config = readConfig();
  var MIN_OPTIONS = config.minOptions || 10;
  var CLICK_TO_TOGGLE = config.clickToToggle !== false;
  var KEEP_SELECTION = config.keepSelection !== false;
  var T = Object.assign({
    search: 'Search…',
    waiting: 'Select the parent field first',
    noOptions: 'No options for the current selection',
    noMatch: 'No matching options',
    remove: 'Remove'
  }, config.i18n || {});

  var SELECT_SELECTORS = [
    'select[id^="issue_custom_field_values_"]',      // issue form
    'select[name^="issue[custom_field_values]"]',    // bulk edit
    '#filters-table select[id^="values_cf_"]',       // issue list filters
    'select[data-searchable="true"]'                 // opt-in for any select
  ].join(',');
  var GROUP_SELECTOR = 'span.check_box_group';

  // Lowercase, without accents, punctuation turned into spaces.
  function normalize(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/['\u2019`]/g, '')        // apostrophes: "d'Água" -> "dagua"
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  // Every word typed must appear in the text, in any order ("campos jose" -> "São José dos Campos").
  function matches(text, words) {
    if (!words.length) return true;
    var haystack = ' ' + normalize(text) + ' ';
    return words.every(function (w) { return haystack.indexOf(w) !== -1; });
  }

  function queryWords(value) {
    var q = normalize(value);
    return q ? q.split(' ') : [];
  }

  function realOptions(select) {
    return Array.prototype.filter.call(select.options, function (o) {
      return o.value !== '' && o.value !== '__none__';
    });
  }

  // Option allowed by a cascading plugin (not hidden/disabled by it)?
  function isAvailable(o) {
    return !o.hidden && !o.disabled && o.style.display !== 'none';
  }

  // For cascading fields: is the parent field still empty?
  // Returns null when the element is not a dependent field.
  // Depending Custom Fields sets data-depending-parent-key="issue:2:issue_custom_field_values_2".
  function parentIsEmpty(el) {
    // Redmine Cascading Custom Fields exposes its state directly.
    if (el.hasAttribute('data-cascade-waiting')) return el.getAttribute('data-cascade-waiting') === '1';
    var key = el.getAttribute('data-depending-parent-key');
    if (!key) return null;
    var parent = document.getElementById(key.split(':').pop());
    if (!parent) return null;
    if (parent.options) { // <select>
      return !Array.prototype.some.call(parent.options, function (o) {
        return o.selected && o.value !== '' && o.value !== '__none__';
      });
    }
    var inputs = parent.querySelectorAll('input[type=checkbox], input[type=radio]');
    if (inputs.length) { // checkbox / radio group
      return !Array.prototype.some.call(inputs, function (i) {
        return i.checked && i.value !== '' && i.value !== '__none__';
      });
    }
    return !parent.value;
  }

  // Visible label of the field (for the search box's accessible name).
  function fieldLabel(el) {
    var label = el.id && document.querySelector('label[for="' + cssEscape(el.id) + '"]');
    if (!label) {
      var p = el.closest('p, .filter, tr');
      label = p && p.querySelector('label');
    }
    return label ? label.textContent.replace(/[*:]/g, '').trim() : '';
  }

  function cssEscape(value) {
    return window.CSS && CSS.escape ? CSS.escape(value) : String(value).replace(/["\\]/g, '\\$&');
  }

  function createSearchInput(field) {
    var input = document.createElement('input');
    var name = fieldLabel(field);
    input.type = 'search';
    input.className = 'scf-search';
    input.placeholder = T.search;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', name ? T.search.replace(/…$/, '') + ': ' + name : T.search);
    if (field.id) input.setAttribute('aria-controls', field.id);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') e.preventDefault(); // do not submit the form
    });
    return input;
  }

  function createEmptyMessage() {
    var div = document.createElement('div');
    div.className = 'scf-empty';
    div.setAttribute('role', 'status');
    div.setAttribute('aria-live', 'polite');
    div.textContent = T.noMatch;
    div.hidden = true;
    return div;
  }

  function createChipsContainer() {
    var div = document.createElement('div');
    div.className = 'scf-chips';
    div.hidden = true;
    return div;
  }

  function renderChips(container, items, onRemove) {
    container.innerHTML = '';
    container.hidden = items.length === 0;
    items.forEach(function (item) {
      var chip = document.createElement('span');
      chip.className = 'scf-chip';
      chip.textContent = item.label;
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'scf-chip-x';
      x.setAttribute('aria-label', T.remove + ' ' + item.label);
      x.textContent = '×';
      x.addEventListener('click', function () { onRemove(item); });
      chip.appendChild(x);
      container.appendChild(chip);
    });
  }

  // Adapts the search box to the field state (waiting for parent / no options / normal).
  function applySearchState(input, waiting, hasOptions) {
    input.disabled = waiting || !hasOptions;
    input.placeholder = waiting ? T.waiting : (hasOptions ? T.search : T.noOptions);
    input.classList.toggle('scf-notice', waiting || !hasOptions);
    if (input.disabled) input.value = '';
  }

  // ---------- <select> ----------
  function enhanceSelect(select) {
    if (select.dataset.scfReady || realOptions(select).length < MIN_OPTIONS) return;
    select.dataset.scfReady = '1';
    select.classList.add('scf-select');

    var input = createSearchInput(select);
    var empty = createEmptyMessage();
    var chips = createChipsContainer();
    select.parentNode.insertBefore(input, select);
    select.parentNode.insertBefore(empty, select.nextSibling);
    select.parentNode.insertBefore(chips, empty.nextSibling);

    function filter() {
      var words = queryWords(input.value);
      var visible = 0;
      realOptions(select).forEach(function (o) {
        var match = matches(o.text, words);
        o.classList.toggle('scf-hidden', !match);
        if (match && isAvailable(o)) visible++;
      });
      empty.hidden = !(words.length && visible === 0);
    }

    // Single-value select: typing selects the first match.
    function selectFirstMatch() {
      if (select.multiple || !input.value.trim()) return;
      var current = select.options[select.selectedIndex];
      if (current && current.value && !current.classList.contains('scf-hidden')) return;
      var first = realOptions(select).find(function (o) {
        return isAvailable(o) && !o.classList.contains('scf-hidden');
      });
      if (first && first !== current) {
        first.selected = true;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    function updateChips() {
      if (!select.multiple) { chips.hidden = true; return; }
      var selected = realOptions(select).filter(function (o) { return o.selected; });
      renderChips(chips, selected.map(function (o) { return { label: o.text, option: o }; }), function (item) {
        if (select.disabled) return;
        item.option.selected = false;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    function updateState() {
      var waiting = parentIsEmpty(select);
      var hasOptions = !select.disabled && realOptions(select).some(isAvailable);
      applySearchState(input, waiting === null ? select.disabled : waiting, hasOptions);
      input.hidden = select.offsetParent === null && select.style.display === 'none';
    }

    input.addEventListener('input', function () { filter(); selectFirstMatch(); });

    if (CLICK_TO_TOGGLE) {
      select.addEventListener('mousedown', function (e) {
        var o = e.target;
        if (!select.multiple || select.disabled || !o || o.tagName !== 'OPTION' || e.shiftKey) return;
        e.preventDefault();
        var top = select.scrollTop;
        o.selected = !o.selected;
        select.focus();
        select.scrollTop = top;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    select.addEventListener('change', function () { updateChips(); filter(); updateState(); });
    select.addEventListener('scf:refresh', function () { filter(); updateState(); });
    new MutationObserver(function () { updateState(); updateChips(); })
      .observe(select, { attributes: true, attributeFilter: ['disabled', 'multiple', 'style'] });

    filter();
    updateChips();
    updateState();
  }

  // ---------- checkbox group ("check box" display style) ----------
  function enhanceGroup(group) {
    var labels = group.querySelectorAll('label');
    if (group.dataset.scfReady || labels.length < MIN_OPTIONS) return;
    group.dataset.scfReady = '1';
    group.classList.add('scf-group');

    var input = createSearchInput(group);
    var empty = createEmptyMessage();
    var chips = createChipsContainer();
    group.parentNode.insertBefore(input, group);
    group.parentNode.insertBefore(empty, group.nextSibling);
    group.parentNode.insertBefore(chips, empty.nextSibling);

    function checkbox(label) { return label.querySelector('input[type=checkbox]'); }
    function isAllowed(label) {
      var c = checkbox(label);
      return c && !c.disabled && !label.hidden && label.style.display !== 'none' && c.style.display !== 'none';
    }

    function filter() {
      var words = queryWords(input.value);
      var visible = 0;
      labels.forEach(function (label) {
        var match = matches(label.textContent, words);
        label.classList.toggle('scf-hidden', !match);
        if (match && isAllowed(label)) visible++;
      });
      empty.hidden = !(words.length && visible === 0);
    }

    function update() {
      var waiting = parentIsEmpty(group);
      if (waiting === null) {
        waiting = !Array.prototype.some.call(labels, function (l) { return checkbox(l) && !checkbox(l).disabled; });
      }
      var hasOptions = Array.prototype.some.call(labels, isAllowed);
      applySearchState(input, waiting, hasOptions);
      group.classList.toggle('scf-no-options', !hasOptions);

      var checked = Array.prototype.filter.call(labels, function (l) { return checkbox(l) && checkbox(l).checked; });
      renderChips(chips, checked.map(function (l) { return { label: l.textContent.trim(), label_el: l }; }), function (item) {
        var c = checkbox(item.label_el);
        if (c.disabled) return;
        c.checked = false;
        c.dispatchEvent(new Event('change', { bubbles: true }));
      });
      filter();
    }

    input.addEventListener('input', filter);
    group.addEventListener('change', update);
    group.addEventListener('scf:refresh', update);
    // Cascading plugins enable/hide checkboxes by changing attributes.
    var scheduled = false;
    new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      setTimeout(function () { scheduled = false; update(); }, 30);
    }).observe(group, { attributes: true, subtree: true, attributeFilter: ['disabled', 'hidden', 'style'] });
    update();
  }

  // ---------- Depending Custom Fields: keep still-valid selections ----------
  // Depending Custom Fields 0.0.14/0.0.15 remembers the child selection per exact
  // combination of parent values, so removing a parent value (or going back to a
  // combination seen before) clears child values that are still valid.
  // Here: snapshot the child before that plugin reacts (capture phase) and, right
  // after it, keep every previous value that is still allowed, plus whatever it
  // added for newly selected parent values (e.g. its default values).
  var lastParentValues = new WeakMap();

  function fieldValues(field) {
    if (field.options) {
      return Array.prototype.filter.call(field.options, function (o) { return o.selected && o.value !== ''; })
        .map(function (o) { return String(o.value); });
    }
    return Array.prototype.filter.call(field.querySelectorAll('input[type=checkbox], input[type=radio]'),
      function (i) { return i.checked && i.value !== ''; }).map(function (i) { return String(i.value); });
  }

  function setFieldValues(field, values) {
    if (field.options) {
      Array.prototype.forEach.call(field.options, function (o) { o.selected = values.indexOf(String(o.value)) !== -1; });
    } else {
      field.querySelectorAll('input[type=checkbox], input[type=radio]').forEach(function (i) {
        i.checked = values.indexOf(String(i.value)) !== -1;
      });
    }
  }

  function notifyChange(field) {
    var target = field.options ? field : field.querySelector('input');
    if (target) target.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function dependingMap(childFieldId) {
    var data = window.DependingCustomFieldData;
    if (!data || typeof data !== 'object') return null;
    var mapping = typeof data.mapping === 'object' ? data.mapping : data;
    var info = mapping && mapping[childFieldId];
    return info && info.map ? info.map : null;
  }

  function union(map, parents) {
    var out = [];
    parents.forEach(function (p) {
      (map[p] || []).forEach(function (v) { v = String(v); if (out.indexOf(v) === -1) out.push(v); });
    });
    return out;
  }

  function isMultiValue(field) {
    return field.options ? field.multiple : !!field.querySelector('input[type=checkbox]');
  }

  function parentFieldOf(target) {
    var el = target.closest && target.closest('[data-depending-child-keys]');
    return el && el.getAttribute('data-depending-key') ? el : null;
  }

  function rememberParent(parent) {
    if (!lastParentValues.has(parent)) lastParentValues.set(parent, fieldValues(parent));
  }

  function onParentChange(e) {
    var parent = parentFieldOf(e.target);
    if (!parent) return;
    var key = parent.getAttribute('data-depending-key');
    var current = fieldValues(parent);
    var previous = lastParentValues.get(parent);
    if (!previous) {
      // Unknown previous state: for a checkbox, revert the toggle that just happened.
      previous = current.slice();
      if (e.target.type === 'checkbox') {
        var v = String(e.target.value);
        if (e.target.checked) previous = previous.filter(function (x) { return x !== v; });
        else previous.push(v);
      }
    }
    lastParentValues.set(parent, current);

    var children = Array.prototype.filter.call(document.querySelectorAll('[data-depending-parent-key]'),
      function (c) { return c.getAttribute('data-depending-parent-key') === key && isMultiValue(c); });
    var snapshots = children.map(function (child) { return { child: child, before: fieldValues(child) }; });
    if (!snapshots.length) return;

    // Runs after the cascading plugin's own (bubbling) change handler.
    setTimeout(function () {
      var added = current.filter(function (p) { return previous.indexOf(p) === -1; });
      snapshots.forEach(function (s) {
        var map = dependingMap(s.child.getAttribute('data-depending-field-id'));
        if (!map) return;
        var allowed = union(map, current);
        var fromAdded = union(map, added);
        var after = fieldValues(s.child);
        var result = s.before.filter(function (v) { return allowed.indexOf(v) !== -1; });
        after.forEach(function (v) {
          if (fromAdded.indexOf(v) !== -1 && result.indexOf(v) === -1) result.push(v);
        });
        var same = result.length === after.length && result.every(function (v) { return after.indexOf(v) !== -1; });
        if (!same) {
          setFieldValues(s.child, result);
          notifyChange(s.child);
        }
      });
    }, 0);
  }

  function initKeepSelection() {
    // Record parent values before the user changes them (selects change value before 'change').
    ['focusin', 'mousedown', 'keydown'].forEach(function (type) {
      document.addEventListener(type, function (e) {
        var parent = parentFieldOf(e.target);
        if (parent) rememberParent(parent);
      }, true);
    });
    document.addEventListener('change', onParentChange, true); // capture: before the cascading plugin
  }

  function enhance(root) {
    root.querySelectorAll(SELECT_SELECTORS).forEach(enhanceSelect);
    root.querySelectorAll(GROUP_SELECTOR).forEach(enhanceGroup);
  }

  function init() {
    enhance(document);
    if (KEEP_SELECTION) initKeepSelection();

    // When a parent field changes, cascading plugins update the children: refresh messages.
    document.addEventListener('change', function () {
      setTimeout(function () {
        document.querySelectorAll('[data-scf-ready]').forEach(function (el) {
          el.dispatchEvent(new CustomEvent('scf:refresh'));
        });
      }, 50);
    });

    // Redmine reloads parts of the page via AJAX (tracker change, new filters...).
    // setTimeout instead of requestAnimationFrame: rAF is paused in background tabs.
    var TARGETS = SELECT_SELECTORS + ',' + GROUP_SELECTOR;
    function isRelevant(node) {
      if (node.nodeType !== 1) return false;
      if (node.tagName === 'OPTION' || node.tagName === 'LABEL') return true; // options added later
      return node.matches(TARGETS) || !!node.querySelector(TARGETS);
    }
    var pending = false;
    new MutationObserver(function (records) {
      if (pending) return;
      var relevant = records.some(function (r) {
        return Array.prototype.some.call(r.addedNodes, isRelevant);
      });
      if (!relevant) return;
      pending = true;
      setTimeout(function () { pending = false; enhance(document); }, 30);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
