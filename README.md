# ESFCCC Member App

The member app for current members of the **Empire State Family Child Care Collaborative**
at the Child Care Council of Orange County. Built from the Council Member App template, so it
works the same way: every provider signs in with their own member ID and password, and staff
sign in on the same screen to open the staff portal.

## What members see (after signing in)

| Tab | What's there |
|---|---|
| Home | Their software (Brightwheel or Playground) with an **Open** button, and announcements |
| Resources | Guides, forms and links (software how-tos, benefit sign-up steps). Staff upload PDFs or photos, or paste links, from the portal |
| Benefits | Member card (name, program, ID, software, membership year) and every ESFCCC benefit |
| Coach | What the coach can help with, and call/email for Miles |
| News | Newsletters staff publish |

## Each member's software (CCMS)

When staff add a member in the portal, they pick **Brightwheel** or **Playground**.
The member's card, Home screen and Benefits list then show only that software, with a
log-in button. To switch someone later: open their record → **Software**.

## Adding members

- **One at a time:** staff portal → Members → Add. The app makes an ID and password to hand out.
- **Many at once:** fill in `member-roster-template.csv` (one row per provider, with a Software
  column) and it can be turned into `netlify/roster.js`. Only do this in a **private** repository.

## Before going live

1. Make this GitHub repository **private**. `netlify/staff.js` and `netlify/roster.js` hold logins.
2. Publish on Netlify (see `DEPLOY.md`).
3. Sign in as staff (`miles` / `change-me-101`) and change the password right away.
4. Optional: set up email (`DEPLOY.md`) for event sign-up confirmations.

Renewal reminder emails start **off**. Turn them on in the staff portal's Settings when ready.

`App Guide.dc.html` is a printable 3-page guide for admins, staff and members.

## First Foods Tracker

`baby-first-foods-tracker.html` is a stand-alone tool for providers and families to log a baby's
first foods (vegetables, fruits, meat, common allergens, dairy, beans, grains): dates tried, how
it went, and reactions. It works for several children and saves on the device it's used on.
Once the site is live, post `https://<your-site>/baby-first-foods-tracker.html` as a link in the
Resources tab.

On iPhone, open the link in Safari and tap Share → **Add to Home Screen**. It then opens like an
app, keeps its log, and works offline (`first-foods.webmanifest`, `first-foods-sw.js`). A file
emailed or AirDropped to an iPhone will not save, so always share the link. **Save backup file**
puts a copy of the log in the Files app, and **Open a backup file** brings it back.
