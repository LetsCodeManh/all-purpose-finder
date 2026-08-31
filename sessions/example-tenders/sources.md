# sources — example-tenders

Last updated: 2026-08-30

| name | type | url | method | status | last checked | manual status | manual checked | why |
|------|------|-----|--------|--------|--------------|---------------|----------------|-----|
| Example Public Register | register | https://procurement.example/notices.json | feed (4) | ok | 2026-08-30 | — | — | mandatory above-threshold notices with a stable reference and closing date |
| Civic Works Bulletin | authority | https://civic.example/opportunities | page | ok | 2026-08-30 | — | — | small local notices absent from the central register |
| Supplier Room | portal | https://supplier.example/login | blocked | blocked | 2026-08-30 | partial | 2026-08-30 | registration wall; manually checked only far enough to confirm one duplicate notice |

## gaps

- school-board purchasing pages were not probed and may contain smaller contracts
- Supplier Room documents remain unread behind registration

## notes

- the register's `submissionDeadline` field was verified as the closing date;
  `publicationDate` is kept separate
- Civic Works Bulletin was read by hand and its surviving row is recorded under
  the page-source marker in `listings.md`
