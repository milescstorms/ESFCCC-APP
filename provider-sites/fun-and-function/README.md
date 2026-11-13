# Fun and Function Daycare website (draft)

One-page website for Fun and Function Daycare, 6 Thayer Rd, Highland Mills, NY 10930.
It is plain HTML with no build step: `index.html`, `logo.webp`, the `photo-*.webp` files and the icon files.

## Confirm with the provider before launch

These details are samples and need the provider's real information:

- Phone `(845) 555-0142` is still a placeholder (contact section and footer). The email is the
  provider's real one: funandfunctionfdc@gmail.com
- Ages served (6 weeks to 12 years)
- Hours: Mon–Fri, 6:00 am–5:00 pm, read from the provider's printed schedule. The first time on the
  sheet was blurry (6:00 vs 8:00), so confirm the opening time
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

Create a new Netlify site from this repository and set the base directory to
`provider-sites/fun-and-function`. The tour request form uses Netlify Forms, so requests show up
in that site's Forms tab once it's live. The member app's Netlify site does not serve this folder.
