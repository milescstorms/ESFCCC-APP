# Fun and Function Daycare website (draft)

One-page website for Fun and Function Daycare, 6 Thayer Rd, Highland Mills, NY 10930.
It is plain HTML with no build step: `index.html`, `logo.webp`, the `photo-*.webp` files and the icon files.

## Confirm with the provider before launch

These details are samples and need the provider's real information:

- Contact details are the provider's real ones: (646) 589-3055 and funandfunctionfdc@gmail.com
- Ages served (6 weeks to 12 years)
- Hours: Mon–Fri, 8:00 am–5:00 pm (confirmed)
- License: the "Are you licensed?" card and the footer link to the provider's NYS OCFS listing
  (program 957405). Check that the program type, ages and capacity there match the site
- The daily schedule now comes from the provider's printed schedule (14 parts of the day, shortened
  for the picture-schedule cards). The clothespin follows the real time in Highland Mills
- CPR/First Aid, monthly fire drills, meals (USDA/CACFP), parent app, and Orange County DSS subsidy
- Photos on the fridge: the reading corner, art table, play room and backyard are all in
  (`photo-*.webp`). The play room and backyard photos are small (214×320), so larger copies would
  look sharper
- The "Is it fun, or is it function?" flip cards: swap in the provider's own favorite activities if they like
- The logo: swap `logo.webp` for the final logo (same file name, square image). The browser-tab and
  phone home-screen icons (`favicon.ico`, `favicon-32.png`, `icon-192.png`, `apple-touch-icon.png`)
  are made from the same logo, so remake them too if the logo changes

## Map

The "How to find us" card shows a live Google Map of 6 Thayer Rd on the published site, and also
when you download `index.html` and `logo.webp` into one folder and open `index.html` in a browser. In Claude's preview it shows a drawn placeholder instead, because the preview blocks maps
from other sites. To use Google's official embed instead, open the address in Google Maps, choose
Share → Embed a map, and paste the `src` link into the `data-src` of `#map-frame` in `index.html`.

## Publishing

Either drag the site folder onto app.netlify.com/drop, or create a new Netlify site from this
repository with the base directory set to `provider-sites/fun-and-function`. The member app's
Netlify site does not serve this folder.

### Tour requests by email

On Netlify, the tour slip uses Netlify Forms. Requests are saved in the site's Forms page, and are
emailed only after you set that up:

1. In the site's Forms settings, turn on form detection, then deploy the folder again.
2. Go to Site configuration → Notifications → Emails and webhooks → Form submission notifications.
3. Add notification → Email notification, choose the `tour` form, and enter
   funandfunctionfdc@gmail.com.
4. Send a test request. If it lands in Gmail's spam folder, mark it "Not spam".

If the site isn't on Netlify, or Netlify doesn't accept the request (for example, form detection is
off), the slip opens the parent's email app with a message to funandfunctionfdc@gmail.com, already
filled in with their answers. They press Send. So a request is never lost, but on Netlify finish
the steps above so requests arrive without the parent having to send an email.
