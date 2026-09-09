# HSC Question Bank (Web App Version)

A Next.js web app for uploading and browsing HSC practice questions by subject
and module, with a practice paper generator. Files are stored in Firebase
Storage, question metadata in Firestore. No login is required, anyone with
the link can upload or browse.

## Tech stack

- Next.js (React), hosted free on Vercel
- Firebase Storage (files) and Firestore (metadata), free tier
- pdf-lib for generating practice paper PDFs server-side

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.local` (already included with your Firebase config) or create
   your own using the values from Firebase Console > Project settings >
   Your apps
3. Run locally: `npm run dev`, then open http://localhost:3000

## Firebase setup (already done if you followed along)

1. Firestore Database created, in test mode initially
2. Storage created, in test mode initially
3. Before going properly live, replace the default test-mode rules with the
   ones in `firestore.rules` and `storage.rules` in this project. In the
   Firebase Console, go to Firestore Database > Rules (or Storage > Rules),
   paste in the matching file's contents, and click Publish. Test mode rules
   expire automatically after 30 days and lock everything out, so this step
   matters for anything beyond short-term testing.

## Deploying to Vercel

1. Push this project to a GitHub repository (see steps below if you haven't
   already)
2. Go to vercel.com, sign in (GitHub sign-in is easiest), click **Add New >
   Project**
3. Import the GitHub repository you just pushed
4. Vercel will auto-detect it as a Next.js project, no build settings need
   changing
5. Before deploying, add your Firebase environment variables: in the import
   screen (or later under Project Settings > Environment Variables), add
   each of the following as a separate variable, using the values from your
   `.env.local` file:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
6. Click **Deploy**
7. Once deployed, Vercel gives you a live URL (something like
   `hsc-webapp.vercel.app`). That is the link to share.

Every time you push a change to the GitHub repository's main branch, Vercel
automatically rebuilds and redeploys, so updating the live site later is just
a normal git push, no manual redeploy steps needed.

## Adding the remaining subjects

Edit `src/lib/subjects.ts`. Each subject is a key in the `SUBJECTS` object
with an array of module names as its value. The 12 subjects still marked
`["General"]` are placeholders, replace that array with the real NESA
modules once confirmed, save, commit, and push, Vercel handles the rest.

## Notes on syllabus accuracy

All modules reflect the CURRENT (pre-2027 reform) NESA syllabus, which is
what the 2026 HSC cohort is examined on. Reform rollout years vary by
subject, so check each subject's specific timeline when filling in the
remaining placeholders rather than assuming a single date applies everywhere.

## Known limitations

- No login means there is no way to verify who uploaded what beyond the
  free-text name field, and no built-in moderation queue before questions go
  live. The "Flag for review" button lets anyone mark a question as needing
  a second look without removing it.
- Practice paper generation embeds images directly into the PDF. Non-image
  question files (e.g. a PDF uploaded as the question itself) get a link
  line instead, since merging arbitrary PDFs page-by-page is out of scope
  for this lightweight generator.
- This is currently built under a personal Google account's Firebase
  project, not a school-owned one. If the school wants to take ownership
  later, Firebase projects can be transferred to another Google account
  (or a Workspace-owned one) from Firebase Console > Project settings >
  Users and permissions, without needing to rebuild anything.
