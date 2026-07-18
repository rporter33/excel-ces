# pptxgenjs: 6-digit hex only, fresh shadow objects, never merge decks post-hoc

**Type:** confirmed approach

Three quirks that produced broken slides. (1) 8-digit hex like "ED113222" is
rejected and silently becomes black — use solid 6-digit fills. (2) Shadow
options are mutated in place; use a factory function returning a fresh object
per shape. (3) Merging two .pptx files with python-pptx strips image
relationships (icons vanish) — build the full deck in one script instead.
Grid math: col = i % COLS, row = floor(i / COLS); mismatched divisors scatter
cards.
