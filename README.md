# ESFCCC Members App

A phone-friendly member app for the **Empire State Family Child Care Collaborative**
at the Child Care Council of Orange County. Members can add it to their home screen
like a regular app — no app store needed.

## What's in it

| Tab | What members see |
|---|---|
| 🏠 Home | Welcome, quick buttons, the latest update from the coach, and a getting-started checklist with a progress bar |
| ⭐ Benefits | Brightwheel, Playground, CSEA VOICE, Optima stipend, staff telehealth, retirement, tax prep, My Food Program, coaching |
| 💬 Coach | "Message my coach" form, a personal business-goals list, and coaching topics |
| 📰 News | Updates from the coach (with a NEW badge), newsletter issues, and upcoming events (past dates hide automatically) |
| ❓ Help | Searchable FAQ, Council contact info, and a link to share the application |

Checklist and goals are saved on the member's own device only — nothing is sent anywhere.

## Updating the app

All wording, benefits, events and FAQ answers live in **`content.js`**.
Edit that file on GitHub (pencil icon), commit, and the app updates.

- **Add an event:** copy one `{ ... },` block in `events` and change the title, date (`"2026-10-15"`), time and link.
- **Post an update:** copy one block at the top of `updates`, give it a new `id`, and change the date, title and text. Members see a red badge on the News tab until they read it.
- **Add a newsletter:** add `{ title: "...", date: "2026-10-01", link: "https://..." },` to the top of `newsletter.issues`.
- **Messages:** the "Message my coach" form opens the member's email app addressed to `coach.email`.
  To have messages send straight from the app instead, create a free form at formspree.io and paste its
  address into `coach.messageFormEndpoint`.
- **Turn on "Book a session":** fill in `coach.bookingLink`.

## Publishing

The workflow in `.github/workflows/pages.yml` publishes the app with GitHub Pages
whenever `main` changes. In the repo on GitHub go to **Settings → Pages** and set
**Source** to **GitHub Actions** (one time).

## Try it locally

```
python3 -m http.server 8000
```
Then open http://localhost:8000.
