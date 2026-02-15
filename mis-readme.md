# INKredible MIS (Phase 1)

Single-file MIS app: `mis.html`  
Architecture: pure HTML/CSS/JS + `localStorage` (no build step, no backend).

## Modules (Top Tabs)
1. **Home**
   - Active pipeline counts by stage
   - Revenue this month (from Paid jobs)
   - Floor graphics revenue share
   - Recent activity + upcoming deadlines (next 7 days)

2. **Jobs (Job Tracker)**
   - Kanban pipeline: Lead → Quote → Booked → Production → Delivered → Paid
   - Drag/drop cards between stages
   - Prev/Next stage buttons on each card
   - Job detail modal with stage history log
   - Mark Lost + lost reason tracking
   - Filters: job type, priority, customer, search
   - Add new jobs with **quick-add new customer inline**

3. **Customers (CRM)**
   - Searchable customer list
   - Detail/edit form (contact + company + source + segment + tags)
   - Auto lifetime value from paid jobs
   - Auto repeat-customer flag (>= 2 paid jobs)
   - Job history table
   - Communication log with follow-up date

4. **Quotes**
   - Quote-stage queue with 3-tier pricing:
     - Opening = base +25%
     - Target = base +10%
     - Floor = base
   - One-click book from selected tier

5. **Calendar**
   - Upcoming event timeline from jobs
   - Due-date visibility for production planning

6. **Finance**
   - Paid revenue, open pipeline, floor graphics share
   - Revenue by job type bars
   - Top customers by lifetime value

## Data Storage
Uses these localStorage keys:
- `mis_jobs`
- `mis_customers`
- `mis_communications`

All records include `id`, `created_at`, `updated_at`.

## Seed Data Included
On first load, app seeds realistic sample data:
- 5 customers (including Lux Events, Messi Law, corporate, walk-in, referral)
- 8 jobs across stages (including **$10,000 “25ft x 88ft dance floor wrap”** in Production)
- Communication log entries

## Backup / Restore
- **Export JSON** button: downloads complete MIS backup
- **Import JSON** button: restores from exported backup

## Run
Open directly in browser:
- `inkredible-tools/public/mis.html`

Works as static file (including GitHub Pages).