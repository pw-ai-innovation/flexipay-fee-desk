# Flexi Pay Fee Desk – Batch 2024-28: handover guide

The student fee portal for the Flexi Pay (monthly) batch 2024-28. Students see their Sem 1–4 summary, the Sem 5 bifurcation (Sem 5 fee + amount carried forward from Sem 1–4) and can raise tickets. The IOI Team manages concessions, hostel, laptop concessions, bulk updates and tickets.

- **Live portal:** https://flexipay-fee-desk.vercel.app
- **Built:** November 2026, for PW IOI Bangalore (owner: Nadeem Fazal, nadeem.fazal@pw.live)

---

## 1. Where everything lives

| What | Where | Account |
|---|---|---|
| **Master data** (students, scholarships, emails, phone numbers, access codes, every fee change, adjustments, IOI Team list) | Google Sheet **"Flexi Pay Fee Desk - Batch 2024-28 (portal data)"** | Google Drive of aiinnovationteam@pwioi.com |
| **Code + data backups** | Zip files named `flexipay-fee-desk-backup-YYYY-MM-DD.zip`, in the same Drive as the sheet | aiinnovationteam@pwioi.com |
| **Hosting** | Vercel project **flexipay-fee-desk**, team **pw-innovation** | Vercel account pw-ai-innovation |
| **Portal-side records** (tickets and replies, access codes people changed, fee edits made on the portal, students added/removed on the portal, activity log) | Vercel Blob store (private) linked to the project | Vercel account pw-ai-innovation |
| **Secrets** | Vercel project → Settings → Environment Variables: `SESSION_SECRET`, `SYNC_KEY`, `BLOB_READ_WRITE_TOKEN` | Vercel account pw-ai-innovation |

**Important:** whoever takes over needs access to the **aiinnovationteam@pwioi.com** Google account (or the shared drive) and the **pw-ai-innovation** Vercel account.

### Sheet tabs

- **Students:** Enrollment ID, Name, Status (only *Active* students are on the portal), Programme (SOT-1/SOT-2/SOM-1), Scholarship %, Email (student login), Contact Number, Access code, Flexi upto sem (blank = 4), Fee team note (internal; IOI Team only).
- **Changes:** one row per student per semester: Hostel (In/Out), Concession type/value/% or Rs or Fixed, Remark shown to student, Manual course fee, Manual hostel fee, Hostel deferred override, Laptop concession (Rs).
- **Adjustments:** one-off amounts (e.g. hostel balance recovered on exit). The Settles column clears that much of the deferred hostel balance.
- **Team:** Email, Name, Access code, Permission (Full / Tickets / View).

---

## 2. Fee rules built into the portal

| Item | Amount |
|---|---|
| Full course fee | Rs 1,23,825 per semester |
| Full hostel fee | Rs 73,900 per semester |
| Flexi Pay course fee (Sem 1–4) | Rs 92,869 (75%) |
| Flexi Pay hostel fee (Sem 1–4) | Rs 55,425 (75%) |
| Admission fee | Rs 50,000 |
| Monthly mandate | Semester total ÷ 6. Shown only from Sem 5. |

- **Scholarship %** applies to the course fee only.
- **Carried forward.** The 25% not billed in Sem 1–4 is added equally to Sem 5–8:
  - Course part: (1,23,825 − 92,869) × (1 − scholarship) per Flexi semester.
  - Hostel part: from hostel semesters only.
  - Any hostel balance already recovered or waived is taken off.
- **Sem 5 internship concession** (Career Service approved): the academic fee is fixed at Rs 20,000. If the student stays in the hostel, the hostel fee is Rs 93,900 (Sem 5 fee Rs 1,13,900). The carried-forward amount is still added.
- **Laptop concession** (IOI Team only): deducted in the chosen semester. Any amount above that semester's fee rolls into the next semesters.
- **Flexi upto sem:** a student who moved to Direct Pay earlier (e.g. 2) has the balance recovered in the following semesters instead.

---

## 3. Logins and permissions

| Who | How they log in | Can do |
|---|---|---|
| Student | Email from the Students tab + access code | See own statement, download PDF, raise tickets, change own code |
| IOI Team – View | Email from Team tab + code | See all students |
| IOI Team – Tickets | same | + reply to tickets |
| IOI Team – Full | same | + edit fees, Semester 5 setup, laptop concession, bulk upload, add students, downloads |
| Superadmin | login id `superadmin` + the Superadmin code | Everything, plus: manual fees and adjustments, remove/restore students, see all access codes, Activity log, IOI Team tab |

The Superadmin code is `adminCode` in `api/_data.json`, unless it was changed on the portal. Changed codes are kept in the Blob store (`codes.json`); the Superadmin can see students' and team members' current codes on the portal.

---

## 4. How to make common changes

**Without touching code:**
- **Fee changes for one student:** log in as Full/Superadmin, open the student, then use *Edit fees* or *Semester 5 setup*.
- **Many students:** use *Bulk update*. Download the template, fill in Hostel (In/Out) and Internship (Yes/No), then upload.
- **New IOI Team member:** add a row in the Team tab, then redeploy (see 5) so the portal picks it up.

**Changes made in the sheet** (Students / Changes / Adjustments / Team) only reach the portal after `api/_data.json` and `api/_team.json` are regenerated from the sheet and the project is redeployed. Before regenerating, read the portal-side changes first:

`GET https://flexipay-fee-desk.vercel.app/api/portal?sync=<SYNC_KEY>`

This returns students added or removed on the portal, changed access codes and portal fee edits. Copy them into the sheet so nothing is lost. A portal fee edit is dropped if that student's sheet data changes underneath it.

**Health check:** `GET https://flexipay-fee-desk.vercel.app/api/portal` returns the version fingerprints and the student count.

---

## 5. Code layout and deploying

| File | Purpose |
|---|---|
| `index.html` | Base page: login, student statement, fee engine (`computeFees`) |
| `build.js` … `build15.js` | Build steps run in order by Vercel (`vercel.json` → buildCommand). Each patches `index.html` → `public/index.html` and the API files. **Later features are in later build steps.** |
| `editor.inc.js`, `more.inc.js`, `sum.inc.js` | Page code inserted by the build steps (fee editor, bulk/log/search, Sem 1–4 summary) |
| `api/portal.js` | Serverless API: login, load, tickets, edits, add/remove students, change code, sync |
| `api/_extra.js` | Activity log, bulk updates, manual-fee rules |
| `api/_data.json` | Students, changes and adjustments (generated from the sheet) |
| `api/_team.json` | IOI Team list (generated from the Team tab) |
| `api/_sheetlog.json` | Activity-log entries for changes made through the sheet |
| `package.json` | Dependency: `@vercel/blob` |

**To deploy a change:**
1. Edit the files.
2. Test locally if possible: `node build.js && … && node build15.js`. Run this on a fresh copy, because the build steps patch `api/portal.js` and `api/_extra.js` in place.
3. Deploy with the Vercel CLI from this folder: `vercel --prod`, logged in as pw-ai-innovation, scope pw-innovation. You can also push to the connected Git repository if one is set up.
4. Check the health URL.

**Rollback:** Vercel dashboard → project → Deployments → pick an earlier deployment → *Promote to Production*.

---

## 6. Things still to confirm (as of 25 Nov 2026)

- Hostel semesters assumed for Ronak Jain, Tamanna, Madhumitha; Kashish's ERP reading; Nirmal Goyal's Sem 5 hostel.
- Rushikesh Bankar's hostel status (blank in the Sem 5 list; kept In).
- Vivek Sahu's Sem 4 concession reason.
- 2401010009 and 2401010016 are on the ERP list but not on the portal.
- Sem 6–8: internship and hostel changes so far apply to Sem 5 only.
