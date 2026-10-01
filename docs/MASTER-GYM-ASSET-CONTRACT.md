# Master Gym Asset Contract

## Folder Structure

```
public/
  assets/
    brand/
      logo.svg
      logo-light.svg
      logo-dark.svg
      favicon/
    hero/
      hero-01.webp
      hero-02.webp
      hero-03.webp
    about/
    programs/
    transformations/
    gallery/
    social/
```

This structure stays identical across every gym project. Only the file
contents change.

## Naming Convention

```
[brand]-[location]-[subject]-[context].webp
```

Examples:
```
fitness-academy-attapur-gym-interior.webp
fitness-academy-attapur-cardio-area.webp
fitness-academy-attapur-transformation-01.webp
fitness-academy-attapur-gallery-strength-floor.webp
```

Rules:
- lowercase, hyphen-separated
- descriptive of the actual subject
- no spaces
- no keyword stuffing (never `best-gym-in-attapur.jpg`)
- no generic names (`image1.jpg`, `final-final.jpg`)

## Image Requirements

- Format: `.webp` preferred for photography.
- Served via `next/image` wherever rendered so Next.js handles responsive
  sizing, lazy loading, and format negotiation.
- Local images get automatic width/height inference; remote images (rare,
  should be avoided in v1) require explicit `width`/`height`.

## Hero Asset Rules

- Up to 3 slides: `hero-01.webp` (place), `hero-02.webp` (people),
  `hero-03.webp` (training) — matches the default narrative in
  `lib/hero.ts`.
- Hero images load with priority (no lazy loading) since they are always
  above the fold.
- Real business photography preferred. AI-generated imagery only when
  original photography is weak, used as a clearly creative visual, and never
  implying it depicts the real facility when it does not.

## Section Asset Rules

- `about/`, `programs/`, `transformations/`, `social/` each hold imagery
  specific to that section only.
- Below-the-fold section images load lazily.

## Gallery Rules

- Lives under `public/assets/gallery/`.
- Display order is controlled by `lib/gallery.ts`'s array order, not by
  filename sorting. Filenames should still be descriptive, not sequential
  placeholders.
- Gallery images load lazily.

## Transformation Assets

- One image per `TransformationItem`.
- Only rendered when `consentVerified: true` in the corresponding data entry.

## Logo / Favicon

- `brand/logo.svg` (default), `logo-light.svg` / `logo-dark.svg` for
  theme-specific variants if the design ever needs them.
- `brand/favicon/` holds the generated favicon set (ico/png sizes).
- Logos are supplied by the client and used as-is. Do not redesign or
  regenerate logos.

## Alt Text Requirements

- Every image requires meaningful alt text describing the actual image
  content.
- Example: `"Strength training equipment at Fitness Academy in Attapur"`.
- Never keyword-stuff alt text (e.g. `"best gym in Attapur best gym
  Hyderabad"`).
- `lib/gallery.ts`'s `GalleryItem.alt` field is mandatory (not optional) so
  alt text cannot be silently omitted.

## Image Optimization Expectations

- Hero: priority load.
- Below-the-fold sections, gallery, dialog images: lazy load.
- Instagram, Maps: deferred / link-first, never eagerly loaded.
- The Factory should never load every image on initial page load.
