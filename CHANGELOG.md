# Changelog

## 0.1.0

* First release.
* Search box for list custom fields: single-value selects, multiple-value selects and checkbox groups.
* Word-based matching, insensitive to accents, case and punctuation.
* Chips for selected values, click to toggle in multiple-value selects.
* Support for Redmine Depending Custom Fields (state messages for dependent fields).
* Works in the issue form, bulk edit and issue list filters.
* Keep still-valid child selections when a Depending Custom Fields parent changes (works around its per-combination memory).
* Settings: minimum number of options (validated, 2–1000), click to toggle and keep valid selections.
* Configuration passed through a `<meta>` tag (no inline script, CSP-friendly).
* Translations: en, pt-BR, pt, es, fr, it, de, ru, ja, zh.
* Tested on Redmine 4.2, 5.0, 5.1, 6.0 and 6.1.
