# listings — fetched 2026-08-28

12 rows · 8 kept · 4 new · 1 changed · 6 unchanged · 1 gone

Raw fetch cache plus the diff's `state` column. Not a result file: never scored,
never ticked, never read by a next step. `kept: no` rows are held and never
deleted — a drop you cannot see is a drop you cannot disagree with.

| issuer | item | location | url | date | salary | state | kept | source |
|---|---|---|---|---|---|---|---|---|
| Northwind Robotics | Machine Learning Engineer | Amsterdam, NL | https://boards.example.com/northwind/ml-engineer | 2026-08-27 | — | new | yes | Northwind Robotics |
| Northwind Robotics | Data Platform Engineer | Berlin, DE | https://boards.example.com/northwind/data-platform | 2026-08-26 | — | new | yes | Northwind Robotics |
| Northwind Robotics | Site Reliability Engineer | Amsterdam, NL | https://boards.example.com/northwind/sre | 2026-07-14 | — | unchanged | yes | Northwind Robotics |
| Northwind Robotics | Research Engineer, Perception | Utrecht, NL | https://boards.example.com/northwind/research-perception | 2026-06-02 | — | gone | yes | Northwind Robotics |
| Northwind Robotics | VP of Engineering | Amsterdam, NL | https://boards.example.com/northwind/vp-engineering | 2026-08-11 | — | unchanged | no:exclude | Northwind Robotics |
| Northwind Robotics | Office Manager | Amsterdam, NL | https://boards.example.com/northwind/office-manager | 2026-08-19 | — | unchanged | no:title | Northwind Robotics |
| Halcyon Analytics | Solutions Engineer | Remote (EU) | https://boards.example.com/halcyon/solutions-engineer | 2026-08-25 | 78000–92000 EUR | new | yes | Halcyon Analytics |
| Halcyon Analytics | Analytics Engineer | Rotterdam, NL | https://boards.example.com/halcyon/analytics-engineer | 2026-08-24 | 72000–88000 EUR | changed:title,date | yes | Halcyon Analytics |
| Halcyon Analytics | Support Engineer | Remote (EU) | https://boards.example.com/halcyon/support-engineer | 2026-05-30 | 55000–65000 EUR | unchanged | yes | Halcyon Analytics |
| Halcyon Analytics | Senior Staff Engineer | Seattle, US | https://boards.example.com/halcyon/senior-staff-engineer | 2026-08-20 | — | unchanged | no:location+exclude | Halcyon Analytics |

## page sources — read by hand, appended after the script

`prefilter.py` handles feeds only. A `page` source is read by hand and its
survivors go here. The script preserves everything below this marker across runs
and does not treat it as cache, so hand-added rows survive a `--refetch`.

| issuer | item | location | url | date | salary | state | kept | source |
|---|---|---|---|---|---|---|---|---|
| Cobalt Freight | Backend Engineer, Logistics AI | Rotterdam, NL | https://jobs.example.org/listings/4821 | 2026-08-27 | — | new | yes | Meridian City Jobs Board |
| Aurora Health | Ward Nurse, Night Shift | Utrecht, NL | https://jobs.example.org/listings/4830 | 2026-08-22 | — | unchanged | no:title | Meridian City Jobs Board |

read and nothing survived: —
