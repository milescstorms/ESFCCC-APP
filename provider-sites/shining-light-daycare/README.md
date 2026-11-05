# Shining Light Daycare: new contact page

`contact.html` is a complete, single-file replacement for shininglightdaycare.com/contact.html.
Everything (styles, form, mobile layout) is inside that one file. Upload it in place of the old page.

## What it does for the provider

- **Turns visits into tour requests.** The page is built around one action: book a tour.
- **Screens families up front.** The form asks for child's birthday, start month, days, schedule
  and how they'll pay (private, DSS assistance, other), so the provider knows if there's a fit before calling back.
- **Protects her day.** It tells parents to text or use the form during care hours and gives call-back times,
  so the phone isn't ringing during lunch and activities.
- **Protects her home.** It shows the town only. The street address goes out once a tour is booked.
- **Tracks marketing.** "How did you hear about us?" shows which outreach is working.
- **Works on phones.** Big tap targets, tap-to-text and tap-to-call, and a bottom bar with Text / Call / Book a tour.
- **Builds trust.** OCFS license #946417, capacity of 8, and a link to the state license lookup.
- **Helps Google.** It includes local business data (name, town, phone, hours) for local search.

## Fill in before publishing

A yellow reminder bar shows at the top of the page until the phone number and email are replaced.

1. **Phone number:** Find & Replace each of these with the real number:
   - `8455550100` (tap-to-call/text links)
   - `(845) 555-0100` (shown on the page)
   - `845-555-0100` (Google data near the top of the file)
2. **Email:** in the `CONFIG` block near the bottom of the file, change `email@example.com`.
3. **Hours:** the "Hours" card and `opens`/`closes` near the top of the file. These are samples (7:00 am to 5:30 pm).
4. **Call-back times:** the "During the day we're with the children..." note (sample: nap time 1 to 3 pm and after 6 pm).
5. **Tour times:** the three choices under "Good times for a tour".
6. **Openings card:** "Now enrolling for 2026 / Limited spots available". Keep this current.
7. **Menu links:** `index.html` and `about.html` in the header. Match the site's real page names.

Search the file for `EDIT` to find each spot.

## Getting the tour requests

Set `formMode` in the `CONFIG` block:

| Mode | Setup | How it works |
|---|---|---|
| `mailto` (default) | None | Opens the parent's email app with the request filled in. The parent has to press Send. |
| `formspree` (recommended) | Free account at formspree.io, paste the form URL into `formspreeUrl` | Requests go straight to the provider's inbox. The free plan covers 50 a month. |
| `netlify` | Only if the site is hosted on Netlify | Requests appear in Netlify under Forms and can be emailed. |

## Strongly recommended

Add 2 or 3 real photos of the play space (no children's faces without written permission).
A photo of the actual room is the strongest trust builder on a family day care site.
