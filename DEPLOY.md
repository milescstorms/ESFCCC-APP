# Putting the ESFCCC member app online

> **Before you publish:** make the GitHub repository **private** (GitHub → Settings → General →
> Danger Zone → Change visibility). `netlify/staff.js` and `netlify/roster.js` hold logins.
> Then sign in as staff (`miles` / `change-me-101`) and change your password right away.

One-time setup, then nobody touches code again.

## What you need
- A free Netlify account (netlify.com)
- The project folder, downloaded from here

## Step 1: upload
1. Sign in to Netlify, go to **Sites**.
2. Drag the whole project folder onto the page.
3. Wait for the green "Published" line. You now have a web address like `merry-otter-12ab.netlify.app`.

## Step 2: hand out staff logins
Every staff member has their own login and password in `staff-logins.csv`. They sign in on the same screen members use, the app recognises a staff login and opens the portal instead of the member app.

Nothing to configure. Whoever publishes is recorded by name.

## Step 3: name the site
**Site configuration → Change site name**: something like `esfccc-members`, giving you `esfccc-members.netlify.app`. Or point a subdomain like `esfccc.childcarecounciloc.org` at it under **Domain management**.


## How posting works now

1. Staff fills in the training or newsletter form and saves → it becomes a **Draft**, visible only in the staff portal.
2. They review it, tap **Publish**.
3. Every member sees it the next time they open the app. No file editing, no redeploy, no waiting on anyone.

Drafts are safe. Nothing reaches members until someone taps Publish.

## Managing members

All of it happens in the staff portal, live, with no redeploy:

- **Add a member**: fill in name, program, level and expiration date. The app assigns the next ID and generates a password like `kayak-window-967`, then shows both so you can copy them into a welcome note. They can sign in immediately, from any device.
- **Renew a member**: tap their name, then **Renew this membership**. Either "One more year from today" or pick an exact date.
- **Reset a password**: tap their name, then **Reset their password**. A new one is generated and shown on the spot.
- **Fix a detail or end a membership**: same menu on the member record.

Expiration status is worked out from the date every time the app loads, so nothing goes stale between deploys.

Only admins (listed in `netlify/staff.js`) can see or reset passwords and manage renewal emails. All other staff can add facilities, post trainings, manage sign-ups and approve questions. Every change is stamped with who made it.

## Sign-up emails (optional, about 15 minutes with IT)

When a member registers for or cancels a training, the app sends two emails:
- **To the trainer** listed on the training (Jennie if the trainer is not on staff): who signed up, their program, email and phone. Reply goes to the member.
- **To the member**, if they have an email on file: a confirmation with the date, place and trainer. Reply goes to the trainer.

Pick one of the options below. The Gmail app password option is the quickest.

### Easiest: Google script in the new Gmail (no app password, 10 minutes)

Use this if App passwords is not available on the account.

1. Signed in as the new Gmail, go to **script.google.com** and click **New project**.
2. Delete everything in the editor. Open `Gmail Sender Script.txt` from this folder, copy all of it, and paste it in.
3. On the first line, replace `PASTE-YOUR-SECRET-WORD-HERE` with a made-up secret, for example `maple-river-4821`. Keep the quotes.
4. Click the save icon. Name the project `ESFCCC app mailer`.
5. In the function dropdown at the top pick **testSend**, click **Run**, and allow the permissions (Advanced, Go to ESFCCC app mailer, Allow). Check the Gmail inbox for the test email.
6. Click **Deploy, New deployment**. Click the gear, pick **Web app**. Execute as: **Me**. Who has access: **Anyone**. Click **Deploy** and copy the **Web app URL**.
7. In Netlify, Site configuration, Environment variables, add:
   - `APPS_SCRIPT_URL` = the Web app URL
   - `APPS_SCRIPT_KEY` = the same secret from step 3
   - `MAIL_FROM_NAME` = `ESFCCC`
8. Deploys, Trigger deploy.

Free Gmail accounts can send about 100 emails a day this way, which is plenty for sign-ups. Sent copies show in the Gmail Sent folder.

### Other option: Gmail app password (no IT, 5 minutes)

1. Create a free Gmail, for example `esfccc.members@gmail.com`.
2. In that account go to myaccount.google.com, Security, and turn on **2-Step Verification**.
3. Search the Security page for **App passwords**. Create one named "ESFCCC app" and copy the 16 letters.
4. In Netlify, Site configuration, Environment variables, add:
   - `GMAIL_USER` = the new Gmail address
   - `GMAIL_APP_PASSWORD` = the 16 letters
   - `MAIL_FROM_NAME` = `ESFCCC`
5. Deploys, Trigger deploy.

Members see "ESFCCC" as the sender. Sent copies are in that Gmail's Sent folder. Save the Gmail login somewhere the office can find it.

### Alternative: send from your Microsoft 365 mailbox (needs IT)

Use this only if you want emails to come from an @childcarecounciloc.org address.

**Step 1: IT sets up the app in Microsoft (about 10 minutes, needs a Microsoft 365 admin)**

Send this to whoever manages the Council's Microsoft 365:

> Please create an app registration so our member app can send email from miles@childcarecounciloc.org.
> 1. Microsoft Entra admin center, App registrations, New registration. Name: "ESFCCC Member App". Single tenant. No redirect URI.
> 2. API permissions, Add, Microsoft Graph, Application permissions, **Mail.Send**. Then Grant admin consent.
> 3. Certificates and secrets, New client secret, 24 months. Copy the Value.
> 4. Recommended: limit the app to Miles's mailbox only, using an Exchange application access policy (New-ApplicationAccessPolicy, RestrictAccess, scoped to a group containing only miles@childcarecounciloc.org).
> 5. Send me the Directory (tenant) ID, Application (client) ID, and the secret Value.

**Step 2: add them to Netlify.** Site configuration, Environment variables:
- `MS_TENANT_ID` = Directory (tenant) ID
- `MS_CLIENT_ID` = Application (client) ID
- `MS_CLIENT_SECRET` = the secret Value
- `MAIL_SENDER` = miles@childcarecounciloc.org

**Step 3:** Deploys, Trigger deploy.

**Step 4: test.** Sign in as a member with your own email on file and register for a training. You should get the confirmation, and the trainer copy should be in your Sent folder.

Good to know:
- The secret expires in 24 months. Put a reminder on your calendar to have IT make a new one and paste it into Netlify.
- If a trainer hits Reply, it goes to the member. If a member hits Reply, it goes to the trainer.
- To send from a different mailbox later, change `MAIL_SENDER` and have IT add that mailbox to the access policy.

Until this is set up, registrations still save and show in the portal. The email just does not go out.

## What still needs a redeploy

Only design changes: colours, wording of the app itself, new tabs, staff directory changes. Content is all live: trainings, newsletters and members.

## Backups

Once a month, open the staff portal and export the member list to keep a copy in Excel. Netlify's free plan doesn't back up automatically.

### Certificate backups by email

Every certificate a member uploads is also emailed, with the file attached, to the app's sending account (the Gmail running the Google script). Subject lines start with **Certificate backup:** and include the attendee, training and facility, so the inbox is searchable. Deleting a certificate in the app does not delete the email.

- If you already set up the Google script before this change: open it at script.google.com, paste in the new `Gmail Sender Script.txt`, put your secret word back on the first line, save, then **Deploy, Manage deployments**, click the pencil, set Version to **New version**, and click **Deploy**. The Web app URL stays the same.
- To send backups to a different inbox, add `CERT_BACKUP_EMAIL` in Netlify environment variables and trigger a deploy.
- Tip: in that Gmail, make a filter for `subject:"Certificate backup"` that skips the inbox and applies a label called Certificates.
- Free Gmail sends about 100 emails a day. Uploads and sign-up emails share that limit.
- Free Gmail gives you 15 GB of storage. At about 1 MB per certificate, that holds roughly 10,000 certificates.

## If something looks wrong

- **"Not connected to Netlify storage"** in the portal, the site is being viewed as a local file instead of the Netlify address, or the deploy didn't finish.
- **"Could not publish. Sign in with your staff login first"**: they are viewing the portal without signing in, or the login was mistyped.
- **A member can't sign in**: search their name in the staff portal and use **Read out their login**, or reset their password. Expired members are not blocked; they get in and see a renewal banner.


## Automatic renewal emails

Starts OFF at launch. A director turns it on in Settings when ready.

The function renewal-reminders runs every day at 10 AM Eastern (14:00 UTC). It uses the same Gmail setup as the training emails.

Members with an email on file get one email at each step: 30 days before they expire, 7 days before, and on the day they expire (up to 3 days after). Each step is sent once per expiration date, so renewing resets it.

Non-members and anyone without an email are skipped. Staff can see the last email sent on each member record, and can tap "Check who is due today" in the Members tab to preview and send early.

Optional: set REMINDER_REPLY_TO in Netlify to the address replies should go to.


## Anonymous questions (member perk)

**Status: hidden until approved.** To turn it on: in `ESFCCC Member App.dc.html` change `ASK_ENABLED = false` to `true`, and in Netlify add the environment variable `ASK_ENABLED` set to `true`. Then redeploy.

Current members can ask Council staff questions from the Team tab without sharing their name. Staff answer in the portal under **Questions**.

- Members show up only as a number, like "Member 4821". Nobody at the Council can see who asked, directors included.
- Every conversation is one member and the Council. There is no group chat and members never talk to each other.
- Phone numbers and emails typed into a message are removed automatically.
- Members can report a message. Staff can remove any message, close a conversation, or pause chat for a member.
- Members with an expired membership, and non-members, cannot use it.
- Before launch: in Netlify, go to Site configuration, Environment variables, and add `ASK_SECRET` with any long random phrase. This keeps the member numbers from being traced back. Set it once and never change it, or members lose their past conversations.

