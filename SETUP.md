<!-- Latest change: entire deployment path rewritten to remove all CLI/terminal steps — everything now done by clicking around in websites. -->
# Setup Instructions — Get Your App Live

No terminal. No command line. No installing developer tools. Every step below is
you clicking around on a website, the same way you'd set up any online account.

There are two things you're setting up:

1. **The database rules** (who's allowed to see what) — done on the Firebase website.
2. **The actual live app** (the thing people visit in a browser) — done on the Vercel website.

You'll do them in that order.

---

## Part 1: Firebase — your database

### Step 1 — Create your Firebase project

1. Go to https://console.firebase.google.com and sign in with Google.
2. Click **Add project**, give it a name, and finish the setup wizard (you can
   say no to Google Analytics, you don't need it).

### Step 2 — Turn on sign-in methods

1. In your project, left menu → **Build → Authentication**.
2. Click **Get started**, then the **Sign-in method** tab.
3. Turn on **Email/Password** and **Google**.

### Step 3 — Create the database

1. Left menu → **Build → Firestore Database**.
2. Click **Create database**.
3. Choose a location close to you, and pick **Start in production mode**.

### Step 4 — Paste in the security rules (this replaces the old CLI step)

This is the step that used to require installing software. Now it's copy-paste.

1. Still in **Firestore Database**, click the **Rules** tab along the top.
2. You'll see a box with some default text already in it. Select all of that
   text and delete it.
3. Open the `firestore.rules` file (included with this handoff), select
   everything in it, copy it.
4. Paste it into the empty Rules box on the Firebase website.
5. Click **Publish**.

That's it — your database is now locked down so clients, crew, and admins each
only see what they're supposed to. No install, no login screen in a terminal,
nothing to run.

**Why this matters, plainly put:** without this step, your database is either
wide open (anyone on the internet could read or change your data) or completely
locked (your own app can't read anything). This step is what makes the "client
can only see their own wedding" rule actually enforced, not just something the
screen politely hides.

### Step 5 — Get your app's connection details

1. Left menu → the gear icon → **Project settings**.
2. Scroll to **Your apps**, click the **</>** (web) icon to add a web app.
3. Give it any nickname, click **Register app**.
4. You'll see a code block with values like `apiKey`, `authDomain`, etc. Keep
   this tab open — you'll copy these into Vercel in Part 2.

---

## Part 2: Vercel — putting the app online

### Step 6 — Put your project on GitHub

Vercel needs to pull your code from somewhere. GitHub is the standard place.

1. Go to https://github.com and create a free account if you don't have one.
2. Click **New repository**, name it, keep it **Private** if you don't want it
   public, click **Create repository**.
3. On the new repo's page, click **uploading an existing file** and drag your
   whole project folder in. Commit the upload.

(If you're not sure how to get your project folder into GitHub without a
terminal, GitHub Desktop — a free app, not a command line — does this with
drag-and-drop too. Say the word and I'll walk you through that instead.)

### Step 7 — Import into Vercel

1. Go to https://vercel.com and sign in with your GitHub account.
2. Click **Add New → Project**.
3. Find your repo in the list and click **Import**.
4. Before clicking Deploy, open **Environment Variables** and add each of the
   Firebase values from Step 5, one at a time:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | from your Firebase config |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | from your Firebase config |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | from your Firebase config |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | from your Firebase config |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | from your Firebase config |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | from your Firebase config |

5. Click **Deploy**.

Vercel builds and hosts the site for you. In a minute or two you'll get a live
web address anyone can visit.

---

## Part 3: Make yourself an Admin

Every new sign-up defaults to the "client" role. This is on purpose — nobody
can just sign up and grant themselves admin access. You promote yourself
manually, once:

1. Open your live app, sign up normally with your own email.
2. Back in the Firebase Console → **Firestore Database → Data** tab.
3. Open the `users` collection, find the document matching your account.
4. Click into it, find the `role` field, change it from `"client"` to `"admin"`.
5. Refresh your app. You're now Admin.

---

## When you'd actually need the terminal (you probably won't)

Everything above covers launching and running the app. The only time you'd
need the terminal/CLI method again is if you want to test changes on your own
computer before putting them online — that's a "nice to have for later," not
something you need to launch today.

---

# Firestore Schema Reference

Collections (top-level):

|Collection|Purpose|Key fields|
|-|-|-|
|`users`|All accounts|`uid, email, displayName, role (admin/crew/client), createdAt`|
|`projects`|One doc per wedding/event|`clientName, clientUserId, eventDate, location, phase, budget, creativeBrief`|
|`equipment`|Gear inventory|`name, category, serialNumber, bookedDates[]` (bookedDates enables conflict checking)|
|`crewAssignments`|Who's working which project|`projectId, crewUserId, role, shiftStart, shiftEnd, dailyRate`|
|`tasks`|Master to-do items|`projectId, phase (pre-event/event-day/post-event), title, done, assignedTo`|
|`shotLists`|Shot checklist items|`projectId, category, label, done, isTemplate`|
|`editingTasks`|Post-production Kanban cards|`projectId, stage (importing→delivered), assignedTo, deadline`|
|`finances`|Invoices, expenses, payouts|`projectId, type, amount, status, dueDate`|
|`calendarEvents`|Scheduler entries|`projectId, title, date, type`|
|`revisionRequests`|Client feedback on deliverables|`projectId, requestedBy, note, status, createdAt`|

Full TypeScript type definitions matching this schema are in `src/types/index.ts` —
that file is the actual source of truth; this table is a quick-reference summary.

## Design decisions made without explicit spec (flagged per project convention)

1. **New sign-ups default to "client" role.** Promotion to crew/admin is manual,
via Firebase Console, to prevent self-granted admin access. If you want an
invite-code or admin-approval flow instead, that's a real feature to scope next.
2. **Finance records are admin-only**, including crew payout visibility. If crew
should see their own payout status, the security rule for `finances` needs to
change (currently locked to admin-only for both read and write).
3. **Client galleries link externally** (Pixieset/Cloudinary etc., per your
answer) rather than storing files in Firebase — Firestore will only store the
external link/embed reference, not the media itself.
