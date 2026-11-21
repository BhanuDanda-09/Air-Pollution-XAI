# Live Verification & Demonstration Checklist

**Platform**: AirIQ India (Version 2.0.0)  
**Live Frontend**: [https://air-pollution-xai.vercel.app](https://air-pollution-xai.vercel.app)  
**Live Backend API**: [https://air-pollution-xai.onrender.com](https://air-pollution-xai.onrender.com)  

Use this step-by-step verification checklist during capstone presentations, viva voce examinations, or project evaluations.

---

## Step 1: Backend System Health & Model Audit
1. Open a browser tab to `https://air-pollution-xai.onrender.com/api/health`.
2. Confirm the JSON response:
   - `"status": "healthy"`
   - `"version": "2.0.0"`
   - `"models_loaded": true`
3. Open `https://air-pollution-xai.onrender.com/api/cities`.
4. Verify all 45 Indian cities are returned with their respective geographical regions (North, South, West, East, Central, Northeast).

---

## Step 2: Home Page & Quick Air Quality Assessment
1. Navigate to [https://air-pollution-xai.vercel.app/](https://air-pollution-xai.vercel.app/).
2. Confirm the hero section loads with the *"Check Your Air Now"* interactive card.
3. Click on the **Connaught Place, Delhi** quick preset:
   - Verify the location coordinates populate ($28.6315^\circ\text{ N}, 77.2167^\circ\text{ E}$).
   - Verify the live assessment card updates with CAMS reference values and model telemetry.
4. Toggle the theme button in the top navbar (Sun/Moon icon):
   - Confirm instant, smooth transition between Light Clean-Air theme and Dark mode.

---

## Step 3: Live Assessment & Multi-Pollutant Sub-Indices
1. Click **Check My Air** in the primary navigation (`/live-assessment`).
2. Select any city from the 45-city dropdown or enter coordinates.
3. Observe the **6 Criteria Pollutants** grid:
   - Particulate Matter ($PM_{2.5}$ and $PM_{10}$).
   - Gases ($NO_2, SO_2, CO, O_3$).
   - Verify each card shows its individual CPCB sub-index, color badge, and governing pollutant indicator.
4. Inspect the **Coverage Badge**:
   - Confirm it states *"Directly trained & validated for..."* for catalogued cities with distance in kilometers.

---

## Step 4: Health-Personalised Relocation Advisor (Core Feature)
1. Click **Relocation Advisor** in the navigation (`/relocation`).
2. **Step 1 (Places)**:
   - Origin: Delhi (pre-selected).
   - Candidate Destinations: Add **Bengaluru** and **Pune**.
   - Click *Continue to Health Profile*.
3. **Step 2 (Health Profile)**:
   - Select **Adult**.
   - Under Preexisting Health Conditions, select **Asthma (Hyper-reactive airways)**.
   - Set daily outdoor hours (e.g., 5 hours) and commute mode.
   - Click *Continue to Household & Consent*.
4. **Step 3 (Household & Consent)**:
   - Select Household category (**Children under 5** or **Elderly**).
   - Check the **DPDP Act 2023 Explicit Consent** checkbox.
   - Click **Generate Relocation Decision Report**.
5. **Step 4 (Decision Report)**:
   - Verify the side-by-side comparison report renders.
   - Check the **Personal Exposure Risk Score** for Delhi vs. Bengaluru.
   - Observe the **Verdict**: Bengaluru should be marked *"Highly Recommended"* with $>65\%$ risk reduction.
   - Read the clinical narrative and practical N95/HEPA actionable advice.
   - Click **Export Report / Print Summary** to test PDF/print readiness.

---

## Step 5: National Hotspot Rankings Table
1. Click **Insights** $\to$ **Hotspot Rankings** (`/hotspots`).
2. Confirm the 45-city national leaderboard renders with rankings:
   - Observe Faridabad and Delhi at the top (Severe Persistent Basin).
   - Observe Bengaluru and Mysuru near the bottom (Clean Sanctuary).
3. Test the **Regional Filter**: Select *South* — confirm only southern cities display.
4. Test the **Vulnerability Tier Filter**: Select *Severe Persistent Basin* — confirm Northern basin cities filter properly.
5. Use the search bar: Type *"Varanasi"* — confirm instantaneous table row filtering.

---

## Step 6: User Persistence, Saved Places & DPDP Act Data Rights
1. Click **Sign In** in the top navbar:
   - Sign in with user credentials or create a new test account.
   - Confirm the user avatar appears in the navbar with their initials.
2. Navigate to **Saved Places** (`/saved-places`):
   - Add a new bookmark (e.g., *"Work"* at custom coordinates).
   - Click **Export CSV** — verify the browser downloads the formatted CSV file.
3. Navigate to **Privacy & DPDP** (`/privacy`):
   - Click **Download My Complete Data Bundle** — verify JSON payload export containing user profile, health settings, and bookmarks.
   - Confirm the **Permanently Delete My Account** section is clearly visible with statutory warnings.
4. Click user menu $\to$ **Sign Out**:
   - Confirm the session terminates immediately and the *"Sign In"* button reappears in the header.
