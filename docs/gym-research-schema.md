# Gym Research Schema — Gemini Deep Research Package

The single structured format Gemini Deep Research must return for one prospect
gym. Kiro maps this package directly onto the data files listed in
[`gym-customization-manifest.md`](./gym-customization-manifest.md).

Format: **Markdown wrapper + one YAML block per section.** YAML because every
factual field is a three-key object (`value` / `source` / `status`) and YAML
stays readable for a human operator while parsing deterministically.

---

## 1. Hard rules

1. **Every factual field is an object**, never a bare string:
   ```yaml
   phone:
     value: "+91XXXXXXXXXX"
     source: "https://maps.google.com/..."
     status: VERIFIED_OFFICIAL
   ```
2. **Never invent a value.** If it cannot be found:
   ```yaml
   email:
     value: null
     source: null
     status: NOT_FOUND
   ```
3. **Preserve conflicts. Never silently pick a winner.**
   ```yaml
   phone:
     value: "+91XXXXXXXXXX"
     source: "https://<official-site>/contact"
     status: CONFLICTING_SOURCES
     conflict:
       - value: "+91XXXXXXXXXX"
         source: "https://<official-site>/contact"
       - value: "+91YYYYYYYYYY"
         source: "https://maps.google.com/..."
   ```
4. **Quote, never paraphrase**, review text and any wording that will render
   verbatim.
5. **No pricing invention.** A price absent from a credible public source is
   `NOT_FOUND`. Kiro then keeps the template value or switches the plan to
   `priceStatus: "contact"`.
6. **Excluded from this package** — do not research, do not include:
   - transformation / before-after / member-result data of any kind
   - hero headlines, hero athlete artwork, rolling-strip copy, hero CTA labels
   - Training Intelligence and Between Sessions educational copy
   - any section heading, eyebrow, numeral or CTA label rendered by a component
   - discount percentages or promotional terms (owner-approved only)
7. **No medical, nutritional or physiological claims.** Not one numeric health
   figure anywhere in this package.
8. **Images**: report URLs and opportunities only. The operator collects and
   approves every file manually.

## 2. Status vocabulary

| Status | Meaning | Downstream treatment |
|---|---|---|
| `VERIFIED_OFFICIAL` | stated on the gym's own site or its Google Business Profile | usable in a prospect demo |
| `PUBLICLY_REPORTED` | appears on a third-party directory, listing or social post, not independently confirmed | usable, **flagged `OWNER VERIFICATION REQUIRED`** |
| `CONFLICTING_SOURCES` | two or more credible sources disagree | **do not publish** until resolved; populate `conflict[]` |
| `NOT_FOUND` | not discoverable from any public source | keep template value or hide the feature |
| `INFERRED` | composed by the researcher from sourced wording (e.g. a tagline assembled from bio text) | **never publish as a business claim without owner sign-off** |

Any field that is not `VERIFIED_OFFICIAL` carries an implicit
`OWNER VERIFICATION REQUIRED`.

## 3. Source priority

Cite the highest-priority source available, and record lower-priority sources in
`SOURCE_LOG` when they disagree.

1. Official gym website
2. Google Business Profile / Google Maps
3. Official Instagram
4. Official Facebook or other official social page
5. Official booking / class-platform profile
6. Reputable business directories (Justdial, Sulekha, Yellow Pages, local
   equivalents)
7. Other public sources (news, blogs, aggregators)

A higher-priority source does not erase a lower-priority one. Record both,
`status: CONFLICTING_SOURCES`, and let the owner settle it.

---

## 4. Package format

````markdown
# GYM RESEARCH PACKAGE — <Gym Name>
Researched: <YYYY-MM-DD>   Researcher: Gemini Deep Research
Phase: PROSPECT_DEMO

```yaml
BUSINESS:
  name:            { value: null, source: null, status: NOT_FOUND }
  tagline:         { value: null, source: null, status: NOT_FOUND }
  description:     { value: null, source: null, status: NOT_FOUND }   # 2-4 sentences, factual, no superlatives
  category:        { value: null, source: null, status: NOT_FOUND }   # context only - no field in the template
  primary_locality:{ value: null, source: null, status: NOT_FOUND }
  branch_count:    { value: null, source: null, status: NOT_FOUND }   # context only - template is single-location
  year_established:{ value: null, source: null, status: NOT_FOUND }   # context only - no field in the template
```

```yaml
CONTACT:
  phone:            { value: null, source: null, status: NOT_FOUND }  # E.164, e.g. "+9140..."
  whatsapp:         { value: null, source: null, status: NOT_FOUND }  # E.164; note if identical to phone
  email:            { value: null, source: null, status: NOT_FOUND }
  website:          { value: null, source: null, status: NOT_FOUND }
  instagram_url:    { value: null, source: null, status: NOT_FOUND }
  instagram_handle: { value: null, source: null, status: NOT_FOUND }  # with leading @
  facebook_url:     { value: null, source: null, status: NOT_FOUND }  # collected; not renderable today
  youtube_url:      { value: null, source: null, status: NOT_FOUND }  # collected; not renderable today
  booking_url:      { value: null, source: null, status: NOT_FOUND }  # collected; no field in the template
```

```yaml
LOCATION:
  address_line:  { value: null, source: null, status: NOT_FOUND }   # street / building / floor
  locality:      { value: null, source: null, status: NOT_FOUND }   # neighbourhood, e.g. "Attapur"
  city:          { value: null, source: null, status: NOT_FOUND }
  state:         { value: null, source: null, status: NOT_FOUND }
  postal_code:   { value: null, source: null, status: NOT_FOUND }
  landmark:      { value: null, source: null, status: NOT_FOUND }   # ONLY if publicly stated
  map_url:       { value: null, source: null, status: NOT_FOUND }   # canonical Google Maps / g.page URL
  latitude:      { value: null, source: null, status: NOT_FOUND }   # collected; needs a code change to render
  longitude:     { value: null, source: null, status: NOT_FOUND }
```

```yaml
HOURS:
  # One entry per day. open/close as displayed strings, e.g. "05:00 AM".
  # A closed day -> open: "", close: "". Unknown day -> status NOT_FOUND.
  monday:    { open: null, close: null, source: null, status: NOT_FOUND }
  tuesday:   { open: null, close: null, source: null, status: NOT_FOUND }
  wednesday: { open: null, close: null, source: null, status: NOT_FOUND }
  thursday:  { open: null, close: null, source: null, status: NOT_FOUND }
  friday:    { open: null, close: null, source: null, status: NOT_FOUND }
  saturday:  { open: null, close: null, source: null, status: NOT_FOUND }
  sunday:    { open: null, close: null, source: null, status: NOT_FOUND }
  split_shifts_reported: { value: false, source: null, status: NOT_FOUND }  # note in VERIFICATION_NOTES if true
  # No special/holiday-hours field exists in the template. Report findings in
  # VERIFICATION_NOTES only.
```

```yaml
ABOUT:
  short_description: { value: null, source: null, status: NOT_FOUND }  # -> business.description
  positioning:       { value: null, source: null, status: NOT_FOUND }  # one line, factual
  story:             { value: null, source: null, status: NOT_FOUND }  # only where publicly documented
  # Facility zones -> aboutConfiguration.zones. icon MUST be one of:
  # strength | cardio | coaching | equipment | floor
  zones:
    - id: null
      label: null
      detail: null
      icon: null
      source: null
      status: NOT_FOUND
  # Support attributes -> aboutConfiguration.attributes (unisex, AC floor,
  # parking, locker, shower, steam, BMI check, supplement advice, ...)
  attributes:
    - id: null
      label: null
      value: null
      source: null
      status: NOT_FOUND
```

```yaml
PROGRAMS:
  # -> lib/services.ts. id: lowercase-hyphenated, stable.
  - id: null
    name: null
    description: null            # 1-2 factual sentences
    category: null               # strength | conditioning | personal | group | other
    image_opportunity: null      # URL or description; operator collects manually
    source: null
    status: NOT_FOUND
  special_training:
    name:        { value: null, source: null, status: NOT_FOUND }
    description: { value: null, source: null, status: NOT_FOUND }
```

```yaml
WHY_CHOOSE_US:
  # -> lib/why-choose-us.ts. 4-6 entries. title <= ~40 chars,
  # description one factual sentence. NO superlatives, NO unsourced counts.
  - title: null
    description: null
    basis: null            # facilities | equipment | differentiator | environment |
                           # coaching | amenities | specialization | unique_service
    source: null
    status: NOT_FOUND
```

```yaml
REVIEWS:
  google_rating:       { value: null, source: null, status: NOT_FOUND }  # number, e.g. 4.6
  google_review_count: { value: null, source: null, status: NOT_FOUND }  # integer
  google_profile_url:  { value: null, source: null, status: NOT_FOUND }
  rating_read_on:      { value: null, source: null, status: NOT_FOUND }  # date; ratings drift
  selected_reviews:
    # 3-5 genuine reviews, text QUOTED VERBATIM, never edited or composed.
    - reviewer_name: null
      text: null
      rating: null            # 1-5, only if the individual review shows one
      source: null
      status: NOT_FOUND
  sentiment_summary: { value: null, source: null, status: NOT_FOUND }
    # One line describing what reviewers actually mention most. Becomes
    # googleReviews.tagline. Must be derived from the reviews read, and marked
    # INFERRED.
```

```yaml
PRICING:
  # Only publicly listed prices from credible sources. Otherwise NOT_FOUND.
  currency: { value: "INR", source: null, status: INFERRED }
  publishes_pricing_publicly: { value: null, source: null, status: NOT_FOUND }
  plans:
    daily:     { value: null, source: null, status: NOT_FOUND }
    weekly:    { value: null, source: null, status: NOT_FOUND }
    monthly:   { value: null, source: null, status: NOT_FOUND }
    quarterly: { value: null, source: null, status: NOT_FOUND }   # 3 months
    half_year: { value: null, source: null, status: NOT_FOUND }   # 6 months
    annual:    { value: null, source: null, status: NOT_FOUND }   # 12 months
    special_training: { value: null, source: null, status: NOT_FOUND }  # personal coaching / month
  other_listed_prices:
    - label: null
      value: null
      source: null
      status: NOT_FOUND
  admission_or_joining_fee: { value: null, source: null, status: NOT_FOUND }
  # Plan keys match PricingConfiguration.plans[].id exactly. Do NOT report
  # discounts, offers or promotional terms - those are owner-approved only.
```

```yaml
INSTAGRAM:
  profile_url: { value: null, source: null, status: NOT_FOUND }
  handle:      { value: null, source: null, status: NOT_FOUND }
  follower_count: { value: null, source: null, status: NOT_FOUND }   # context only
  items:
    # 3-4 public Reel URLs, most relevant to training/facility/people.
    - url: null
      type: reel            # "reel" only - the template supports no other type
      posted_on: null       # if visible; no field in the template, operator context
      subject: null         # what the reel actually shows
      source: null
      status: NOT_FOUND
```

```yaml
FAQ:
  # Only questions with a real, publicly sourced answer. Omit the rest.
  # Topics: booking/trial, joining fee, parking, timings, membership terms,
  # payment methods, facilities, guest policy, women-only hours.
  - question: null
    answer: null
    topic: null
    source: null
    status: NOT_FOUND
```

```yaml
SEO:
  gym_name:         { value: null, source: null, status: NOT_FOUND }
  locality:         { value: null, source: null, status: NOT_FOUND }
  city:             { value: null, source: null, status: NOT_FOUND }
  natural_location_wording: { value: null, source: null, status: NOT_FOUND }
    # e.g. "in Attapur, Hyderabad" - how locals actually phrase it
  title_candidate:  { value: null, source: null, status: INFERRED }
    # Pattern: "<Gym Name> | Gym in <Locality>, <City>"  (<= ~60 chars)
  description_candidate: { value: null, source: null, status: INFERRED }
    # ~150-160 chars, factual, mentions real services. No superlatives,
    # no keyword stuffing, no "best gym in ...".
  alt_text_context: { value: null, source: null, status: NOT_FOUND }
    # Facts useful when writing real alt text (equipment, floor layout, signage)
```

```yaml
ASSET_MANIFEST:
  # Identification only. The operator collects, approves and places every file.
  logo:
    url: null
    source: null
    status: NOT_FOUND
  candidates:
    - role: null        # about_interior | why_choose_anchor | program_<id> |
                        # gallery | pricing_background | faq_background | og_image
      url: null
      subject: null     # what the frame actually shows
      source: null
      usable: null      # true | false | unknown  (resolution / watermark / rights)
      status: NOT_FOUND
  # Hero artwork and transformation imagery are FROZEN - do not propose
  # candidates for either.
```

```yaml
SOURCE_LOG:
  - priority: 1           # 1..7 per the source-priority hierarchy
    type: official_website
    url: null
    accessed: null        # YYYY-MM-DD
    fields_supplied: []   # e.g. [phone, hours.monday, PRICING.plans.monthly]
```

```yaml
VERIFICATION_NOTES:
  conflicts:
    - field: null
      values: []          # each with its own source
      note: null
  not_found:
    - field: null
      searched: []        # where you looked
  publicly_reported_only:
    - field: null
      note: "OWNER VERIFICATION REQUIRED"
  owner_questions:
    # Everything the owner must confirm or supply at FINAL_CLIENT stage.
    - null
  excluded_by_contract:
    - "Transformations - frozen for the initial demo; owner supplies consented cases later."
    - "Hero copy and artwork - frozen."
    - "Training Intelligence and Between Sessions copy - global educational library, frozen."
    - "Discount percentages - owner-approved commercial terms only."
```
````

---

## 5. Field → data-file mapping (for Kiro)

| Package path | Destination |
|---|---|
| `BUSINESS.name` / `.tagline` / `.description` | `lib/business.ts` → `business.name` / `.tagline` / `.description` |
| `CONTACT.phone` | `business.phone` |
| `CONTACT.whatsapp` | `business.whatsapp.number` |
| `CONTACT.email` | `business.email` |
| `CONTACT.instagram_url` / `.instagram_handle` | `lib/instagram.ts` → `instagramConfig.profileUrl` / `.handle` |
| `CONTACT.website` | `lib/seo.ts` → `seo.canonical` (only if the demo is not on its own domain, record in notes) |
| `LOCATION.*` | `business.address.*`, `business.mapUrl` |
| `HOURS.*` | `business.hours[]` (`{ day, open, close }`, Monday-first) |
| `ABOUT.short_description` | `business.description` (**not** `lib/about.ts`) |
| `ABOUT.zones[]` / `.attributes[]` | `lib/about.ts` → `aboutConfiguration.zones` / `.attributes` (set `verified`) |
| `PROGRAMS[]` | `lib/services.ts` → `services[]` (set `verified`) |
| `PROGRAMS.special_training` | `lib/pricing.ts` → `pricing.special` |
| `WHY_CHOOSE_US[]` | `lib/why-choose-us.ts` → `whyChooseUs[]` |
| `REVIEWS.google_rating` / `.google_review_count` / `.google_profile_url` | `lib/reviews.ts` → `googleReviews.rating` / `.reviewCount` / `.googleBusinessProfileUrl` |
| `REVIEWS.selected_reviews[]` | `googleReviews.reviews[]` |
| `REVIEWS.sentiment_summary` | `googleReviews.tagline` |
| `PRICING.plans.*` | `pricing.plans[]` by matching `id` (`daily`, `weekly`, `monthly`, `quarterly`, `half-year`, `annual`) |
| `PRICING.publishes_pricing_publicly: false` | `pricing.enabled: false`, or all `priceStatus: "contact"` |
| `INSTAGRAM.items[]` | `instagramConfig.items[]` |
| `FAQ[]` | `lib/faq.ts` → `faq[]` |
| `SEO.title_candidate` / `.description_candidate` | `lib/seo.ts` → `seo.title` / `.description` |
| `ASSET_MANIFEST.*` | operator collects → `public/assets/**` per manifest §11 |

Fields with **no destination** (collected for the sales conversation only):
`BUSINESS.category`, `.branch_count`, `.year_established`,
`CONTACT.facebook_url`, `.youtube_url`, `.booking_url`,
`LOCATION.latitude`/`.longitude`, `INSTAGRAM.follower_count`,
`INSTAGRAM.items[].posted_on`, `HOURS.split_shifts_reported`,
`PRICING.admission_or_joining_fee` (usable as an FAQ answer instead).

---

## 6. Acceptance gate

Reject the package and re-run the research if any of these fail:

- [ ] Every factual field carries `value`, `source`, `status`.
- [ ] No field has a non-null `value` with a null `source`.
- [ ] Every `CONFLICTING_SOURCES` field has a populated `conflict[]`.
- [ ] Review texts are verbatim quotes with the profile URL as source.
- [ ] Every price is either sourced or `NOT_FOUND` — none inferred.
- [ ] No superlative, ranking or unsourced count anywhere in the package.
- [ ] No transformation data present.
- [ ] No hero copy or hero artwork suggestion present.
- [ ] No educational/training-advice copy present.
- [ ] No discount or promotional percentage present.
- [ ] No health, nutrition or physiological figure present.
- [ ] `SOURCE_LOG` accounts for every non-`NOT_FOUND` field.
- [ ] `VERIFICATION_NOTES.owner_questions` lists every field that is not
      `VERIFIED_OFFICIAL`.
