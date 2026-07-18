# Pricing accuracy is only provable against real completed CES workbooks

**Type:** confirmed approach

Synthetic test data validated nothing. Extracting five real jobs (POs 30050,
30059, 30078, 30089, 30134) from completed workbook zips and asserting the app
matched each Cash Price to $0.00 is what surfaced a real bug: permit costs are
pass-through and must be excluded from totalProfit. The 8-test suite at
/dev/accuracy-test is the permanent regression gate — new pricing scenarios
(redeck, 3-story, F-Wave, second overhead-cap job) get added there from real
workbooks, never invented. Also confirmed from real data: markup is per-job
(27–37% observed), not a fixed 30%.
