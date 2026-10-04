import type { HeroConfiguration } from "./types";

/**
 * Master hero data. Default narrative across up to 3 slides:
 * place -> people -> training. Hero information priority: WHO, WHAT,
 * WHERE, WHY, ACTION. Never put more than a handful of facts in the hero.
 *
 * Headlines use "\n" to mark an intentional editorial line break. HeroSlider
 * renders each segment as its own stacked display line rather than relying
 * on natural text wrapping — this is what gives the hero its oversized,
 * chaptered typographic composition. A headline without "\n" still renders
 * correctly as a single line.
 *
 * Each slide also carries `headlineLayers` (back/front word groups) and
 * `subjectAlign`, driving the layered athletic campaign composition: an
 * oversized ghost word behind the transparent athlete cutout, and the real
 * headline in front of it. `headline` still doubles as the plain-text
 * fallback (image alt, non-JS contexts) so the shape stays backward
 * compatible with slides that only set `headline`.
 *
 * PLACEHOLDER DATA: replace with real per-gym imagery once client assets
 * are supplied; copy stays generic (no invented claims/stats).
 */
// MASTER DEMO DATA — placeholder campaign slides for visual QA only.
export const heroConfiguration: HeroConfiguration = {
  slides: [
    {
      image: "/assets/hero/banner-image-03.png",
      imageAlt:
        "Athlete standing front-on with arms crossed and flexed, mid-workout.",
      eyebrow: "The Power",
      headline: "Build your power.",
      // ONE headline — "BUILD YOUR POWER." — split across depth only. `back`
      // renders behind the athlete cutout, `front` in front of it. No word is
      // repeated between the two groups.
      headlineLayers: {
        back: ["BUILD", "YOUR"],
        front: ["POWER."],
      },
      // Composition is authored per breakpoint (recomposed, not scaled). All
      // values are % of the composition zone (see `.factory-hero-zone`), which
      // is the full hero frame from 1024px up and stops above the copy block
      // below that. Offsets are derived from this cutout's actual alpha
      // geometry: the head sits between 32%-62% of the image width in its top
      // quarter, and the torso/arms widen to almost the full image width
      // between 40%-70% of its height. `backTop` is therefore placed so the
      // head/shoulders cut through BUILD YOUR, and `frontLeft` so POWER.
      // starts inside the wide torso band.
      composition: {
        // Phones (<768px, also used for short phones — no `mobileShort`).
        // Mirrors the desktop two-line reading: BUILD YOUR on one line,
        // POWER. alone on the second, staggered right over the torso.
        mobile: {
          // ~12% larger athlete than the previous 92% frame. The extra height
          // is taken mostly below the zone floor (inside the cutout's bottom
          // fade) so the head stays clear of the header.
          subjectHeight: "103%",
          subjectWidth: "106%",
          subjectCenterX: "54%",
          subjectBottom: "-5%",
          // Largest size at which "BUILD YOUR" (~5.73em incl. word gap) fits
          // on one line inside the frame at every phone width (320-767px).
          typeSize: "15.6vw",
          // Raised from 22% so more of "YOUR" clears the athlete's head.
          backTop: "14%",
          backLeft: "4%",
          backWordLayout: "inline",
          // Anchored to the BUILD YOUR line in em (0.82em line box + 0.4em
          // gap, matching desktop's ~0.43em) instead of a zone %: the zone's
          // height/width ratio varies ~2x across phones, so a % offset either
          // collides with YOUR on short phones or drifts away on tall ones.
          frontTop: "calc(14% + 1.22em)",
          frontLeft: "30%",
        },
        tablet: {
          subjectHeight: "90%",
          subjectWidth: "88%",
          subjectCenterX: "57%",
          subjectBottom: "0%",
          typeSize: "13vw",
          backTop: "30%",
          backLeft: "5%",
          backWordLayout: "inline",
          frontTop: "52%",
          frontLeft: "34%",
        },
        laptop: {
          subjectHeight: "88%",
          subjectWidth: "66%",
          subjectCenterX: "60%",
          subjectBottom: "0%",
          typeSize: "11.2vw",
          backTop: "26%",
          backLeft: "4%",
          backWordLayout: "inline",
          frontTop: "51%",
          frontLeft: "46%",
        },
        desktop: {
          subjectHeight: "90%",
          subjectWidth: "56%",
          subjectCenterX: "58%",
          subjectBottom: "0%",
          typeSize: "11.5vw",
          backTop: "27%",
          backLeft: "4%",
          backWordLayout: "inline",
          frontTop: "52%",
          frontLeft: "43%",
        },
      },
      subjectAlign: "right",
      subheadline:
        "A strength and conditioning floor built for people who train around a real schedule.",
      // Slide 01 leads with the first guided tool; this is the hero's single
      // direct WhatsApp action (header + floating button cover the rest).
      cta: {
        primary: { type: "tool", toolId: "starting-point" },
        secondary: { type: "whatsapp", label: "Chat on WhatsApp" },
      },
    },
    {
      image: "/assets/hero/banner-image-02.png",
      imageAlt:
        "Muscular male athlete in profile performing a standing dumbbell curl.",
      eyebrow: "The Coaching",
      headline: "Move with intent.",
      // ONE semantic headline — "MOVE WITH INTENT." — distributed across three
      // depth planes: MOVE (deep background, partially occluded by the
      // athlete's head/shoulder) -> WITH (bridge layer threading across the
      // shoulder/upper-back seam) -> INTENT. (foreground climax, accent
      // color, anchored to the torso/working arm without covering the
      // dumbbell).
      headlineLayers: {
        back: ["MOVE"],
        middle: ["WITH"],
        front: ["INTENT."],
      },
      // Three-depth editorial cascade composition authored per breakpoint.
      // Slide 02 refinement — Slide 01 ("BUILD YOUR POWER.") is frozen and
      // untouched; only this slide's data changes below. Geometry derived
      // from banner-image-02.png (three-quarter rear/side pose): head at
      // x=55-72% in the top ~22%, shoulder/traps widen x=35-88% at 15-35%,
      // torso/back fills x=18-70% at 30-70%, curled working arm + dumbbell
      // sit far right at x=74-98%, y=28-62%.
      //
      // Spatial choreography (kinetic, deliberately NOT Slide 01's
      // back/front-only, evenly-spaced rhythm):
      // - MOVE: largest, upper-left, neutral off-white. Only its trailing
      //   edge ("VE") tucks behind the head/shoulder — legible as "MOV[E]",
      //   never fully hidden, so the word stays instantly readable.
      // - WITH: the bridge. Smaller scale, receded tone, sitting low against
      //   the neck/shoulder/upper-back seam so the athlete's silhouette
      //   visibly interrupts it — threaded through the figure, not floating
      //   beneath MOVE.
      // - INTENT.: the climax, accent lime, anchored to start over the
      //   lower torso/working forearm and travel rightward into open space
      //   toward (not over) the dumbbell, echoing the curl's own direction.
      composition: {
        mobile: {
          subjectHeight: "90%",
          subjectWidth: "112%",
          // Athlete pulled back toward centre so its left contour sits where
          // WITH can actually cross it (at 58% the body edge fell so far
          // right that the bridge word never met it).
          subjectCenterX: "50%",
          subjectBottom: "-2%",
          // Phones: reduced complexity but the athlete now sits inside the
          // MOVE -> WITH -> INTENT. stack rather than beside it. MOVE stays
          // upper-left with its tail meeting the head; WITH is pulled right
          // and down onto the shoulder/back so the figure genuinely
          // interrupts it; INTENT. crosses the torso.
          typeSize: "16.63vw",
          // The whole MOVE / WITH / INTENT. block (43.06vw tall) is centred in
          // the zone: its top sits at 50% minus half that height, and the
          // other two words keep their tight vw steps below it. The
          // horizontal stagger between the words is unchanged.
          backTop: "calc(50% - 21.53vw)",
          backLeft: "10%",
          backWordLayout: "inline",
          // Bridge at z15, behind the athlete, so its tail is genuinely cut
          // by the back contour instead of floating beside the figure.
          // Vertical rhythm: WITH and INTENT. are anchored to MOVE in vw (the
          // unit their sizes use) rather than as independent zone %, so the
          // three words keep one tight ~3vw gap at every phone width/height
          // instead of drifting apart on tall frames. Each step = previous
          // word's line box (0.82 x its size) + 3vw.
          middleTop: "calc(50% - 4.89vw)",
          middleLeft: "42%",
          middleSize: "10.54vw",
          // INTENT. lands over the torso.
          frontTop: "calc(50% + 6.75vw)",
          frontLeft: "11%",
          frontSize: "18.02vw",
        },
        mobileShort: {
          subjectHeight: "88%",
          subjectWidth: "112%",
          subjectCenterX: "50%",
          subjectBottom: "-2%",
          typeSize: "15.25vw",
          // Same centred block as `mobile` (40.11vw tall), from this frame's sizes.
          backTop: "calc(50% - 20.06vw)",
          backLeft: "13%",
          backWordLayout: "inline",
          middleTop: "calc(50% - 4.55vw)",
          middleLeft: "49%",
          middleSize: "9.71vw",
          frontTop: "calc(50% + 6.41vw)",
          frontLeft: "14%",
          frontSize: "16.63vw",
        },
        tablet: {
          subjectHeight: "98%",
          subjectWidth: "92%",
          subjectCenterX: "50%",
          subjectBottom: "-2%",
          // Portrait tablet: the zone is header-clamped and lifted above the
          // copy, so the three planes stack vertically down the athlete.
          typeSize: "17vw",
          backTop: "6%",
          backLeft: "4%",
          backWordLayout: "inline",
          // Bridge at z15, behind the athlete: tail tucked behind the back.
          middleTop: "32%",
          middleLeft: "18.5%",
          middleSize: "8.6vw",
          // INTENT. crosses the torso, positioned clear of the CTA row below.
          frontTop: "52%",
          frontLeft: "10%",
          frontSize: "13vw",
        },
        laptop: {
          subjectHeight: "89%",
          subjectWidth: "68%",
          subjectCenterX: "46%",
          subjectBottom: "0%",
          typeSize: "13vw",
          backTop: "18%",
          backLeft: "5%",
          backWordLayout: "inline",
          // Bridge at z15, behind the athlete: tail tucked behind the back.
          middleTop: "44%",
          middleLeft: "19%",
          middleSize: "7.4vw",
          // Climax raised and shifted right to fully clear the CTA row while
          // keeping the torso overlap and rightward reach.
          frontTop: "61%",
          frontLeft: "33%",
          frontSize: "9.6vw",
        },
        desktop: {
          subjectHeight: "91%",
          subjectWidth: "64%",
          subjectCenterX: "47%",
          subjectBottom: "0%",
          // MOVE: modestly smaller than before (13.5 vs 15.5vw) so it stops
          // dominating the whole upper band; nudged down from the header
          // (backTop 18 vs 14) and started a touch further right (backLeft 6)
          // so its trailing "VE" runs into the head/upper-back and only the
          // tail is occluded — anchored to the athlete, not a poster word.
          typeSize: "13.5vw",
          backTop: "18%",
          backLeft: "6%",
          backWordLayout: "inline",
          // WITH: the bridge, now rendered at z15 BEHIND the athlete, so the
          // cutout genuinely interrupts it. Calibrated against the cutout's
          // measured alpha silhouette (left contour ~31-35% of the image box
          // through the upper-back band): the word runs in from the dark left
          // and its tail tucks behind the back, landing ~23% occluded at
          // 1440 and ~32% at 1920 with the remaining letters fully readable.
          middleTop: "43%",
          middleLeft: "20%",
          middleSize: "7.8vw",
          // INTENT.: raised and shifted right (frontTop 66->60, frontLeft
          // 27->34) — the smallest adjustment that fully clears the CTA row
          // while keeping the torso overlap and the rightward reach toward
          // (not over) the dumbbell.
          frontTop: "60%",
          frontLeft: "34%",
          frontSize: "10vw",
        },
      },
      subjectAlign: "left",
      subheadline:
        "Small-group and personal coaching for people who want structure, not guesswork.",
      // Slide 02 leads with the journey tool. Its subheadline is swapped for a
      // journey-specific line only while the tool resolves; if /journey is
      // ever disabled the original coaching line above returns.
      cta: {
        primary: {
          type: "tool",
          toolId: "journey",
          subheadline:
            "Structure, not guesswork. Map a training path around your goal, your week and your starting point.",
        },
      },
    },
    {
      image: "/assets/hero/banner-image-01.png",
      imageAlt:
        "Two athletes training together with a medicine ball, facing each other.",
      eyebrow: "The Training",
      headline: "Stronger again together.",
      // The depth order (back -> front) does not match the sentence order on
      // this slide: AGAIN sits behind the pair but reads second. The spoken
      // heading is therefore authored explicitly so the single H1 stays
      // correct; Slides 01/02 keep the layer-join behaviour untouched.
      spokenHeadline: "Stronger again together.",
      // Slide 03 is deliberately NOT Slide 01's or Slide 02's choreography.
      // It is a FULL-FIGURE CAMPAIGN FRAME: the athlete pair is one large
      // photographic subject, and the typography frames it from the front —
      // STRONGER above-left (off-white, `frontSecondary`) and TOGETHER.
      // across the lower bodies (accent climax, `front`). AGAIN is the only
      // element behind the pair, as a subordinate depth accent.
      headlineLayers: {
        back: ["AGAIN"],
        front: ["TOGETHER."],
        frontSecondary: ["STRONGER"],
      },
      // Geometry derived from this asset's measured alpha: the two figures
      // occupy only x 15.4-75.6% / y 1.5-98.7% of the PNG, so the visible
      // group is ~0.93 aspect (taller than wide) inside a 1.4993 image. The
      // subject box is therefore authored WIDE (so object-contain stays
      // height-bound and never letterboxes) while height drives the scale.
      // Heads sit at y 10-18% of the image (left x 36.8-45.7%, right
      // x 58.7-67.3%, with a channel between them), the bodies merge into one
      // mass at y 30-42%, and the legs separate again from y 62%. Typography
      // is placed against those bands so it crosses shoulders, arms and lower
      // bodies but never a face.
      //
      // MICRO-POLISH (final pass, data only). Two measured corrections, no
      // re-composition: (a) STRONGER's right edge reached 38-43% into the
      // pair's measured silhouette width on laptop/desktop, so it pressed
      // into the group instead of framing it — its size drops ~8% to land at
      // ~30% penetration, which is inside the near athlete's contour but
      // clear of the group's centre. (b) AGAIN was the second-LARGEST word on
      // every frame (larger than STRONGER), and on desktop its baseline sat
      // 2px off STRONGER's cap line — its size drops below STRONGER's on all
      // frames so the hierarchy reads TOGETHER. > STRONGER > AGAIN, which
      // also opens a real typographic gap between the two upper words. AGAIN
      // keeps its single-head crossing: `backLeft` is re-anchored per frame so
      // the now-shorter word still runs behind one head and its final "N"
      // emerges in the channel between the heads rather than dying behind a
      // head. Athlete scale, asset, position, TOGETHER., the type system and
      // every other slide are untouched.
      composition: {
        mobile: {
          subjectHeight: "100%",
          subjectWidth: "170%",
          subjectCenterX: "52%",
          subjectBottom: "-3%",
          // AGAIN sits above the head band on phones (heads start at y 145 of
          // a 470px-tall figure at 430x932), so it is not occluded there and
          // scale alone has to carry the hierarchy: 13vw made it read as
          // STRONGER's equal, 10.4vw puts it clearly behind it.
          typeSize: "10.4vw",
          backTop: "6%",
          backLeft: "26%",
          backWordLayout: "inline",
          // STRONGER sits BELOW the head band (heads occupy y 9-19% of the
          // asset) so it crosses shoulders/arms and never covers a face —
          // there is no room above the heads once the header is cleared.
          // Phone frames are narrower than the figure itself, so any legible
          // size overlaps the pair; STRONGER's scale is deliberately NOT
          // reduced here.
          frontSecondaryTop: "26%",
          frontSecondaryLeft: "3%",
          frontSecondarySize: "13vw",
          frontTop: "60%",
          frontLeft: "4%",
          frontSize: "16vw",
        },
        mobileShort: {
          subjectHeight: "100%",
          subjectWidth: "170%",
          subjectCenterX: "52%",
          subjectBottom: "-3%",
          typeSize: "9.6vw",
          backTop: "4%",
          backLeft: "26%",
          backWordLayout: "inline",
          frontSecondaryTop: "28%",
          frontSecondaryLeft: "3%",
          frontSecondarySize: "12vw",
          frontTop: "58%",
          frontLeft: "4%",
          frontSize: "15vw",
        },
        tablet: {
          subjectHeight: "100%",
          subjectWidth: "150%",
          subjectCenterX: "52%",
          subjectBottom: "-3%",
          // Portrait tablet was the worst case: at 12vw / backLeft 30% AGAIN
          // ran into BOTH heads and its "N" died behind the second one, so it
          // read as the fragment "A_AI_", and its baseline overlapped
          // STRONGER's cap line by ~5px. Smaller, re-anchored left and lifted
          // 2%: one head crossing, the "N" lands in the channel between the
          // heads, and the two upper words separate cleanly.
          typeSize: "9.5vw",
          backTop: "8%",
          backLeft: "26%",
          backWordLayout: "inline",
          frontSecondaryTop: "22%",
          frontSecondaryLeft: "3%",
          frontSecondarySize: "10.2vw",
          frontTop: "62%",
          frontLeft: "10%",
          frontSize: "14vw",
        },
        laptop: {
          // Shorter 16:9 laptop frames need a larger downward push than
          // desktop for the heads to clear the fixed 90px header.
          subjectHeight: "95%",
          subjectWidth: "125%",
          subjectCenterX: "58%",
          subjectBottom: "-8%",
          typeSize: "8.0vw",
          backTop: "15%",
          // AGAIN crosses ONE head rather than straddling both, so it is cut
          // once and reads as a single word passing behind the pair instead of
          // breaking into three fragments. Re-anchored 28% -> 33% for the
          // smaller size so the head crosses the MIDDLE of the word and the
          // trailing "N" lands clear, in the channel between the two heads.
          backLeft: "33%",
          backWordLayout: "inline",
          // STRONGER clears the head band (heads occupy y 9-19% of the asset)
          // and crosses shoulders/arms instead. 9vw -> 8.3vw pulls its right
          // edge out of the group's centre (43% -> 37% penetration here, 30%
          // at 1280/1366) so it frames rather than presses.
          frontSecondaryTop: "32%",
          frontSecondaryLeft: "2%",
          frontSecondarySize: "8.3vw",
          frontTop: "68%",
          frontLeft: "34%",
          frontSize: "11.5vw",
        },
        desktop: {
          // Scale is set by height, then the box is pushed BELOW the zone floor
          // (subjectBottom) rather than shrunk, so both heads clear the fixed
          // 90px header while the pair stays as large as possible. The extra
          // lower overflow lands inside the existing 16% bottom fade, so no
          // meaningful anatomy is hard-cropped.
          subjectHeight: "95%",
          subjectWidth: "120%",
          subjectCenterX: "58%",
          subjectBottom: "-5.5%",
          typeSize: "8.0vw",
          backTop: "15%",
          // AGAIN crosses ONE head only, so it reads as a single word passing
          // behind the pair rather than breaking into three fragments; at this
          // smaller size backLeft 33% puts that crossing in the middle of the
          // word and leaves the final "N" clear in the head channel.
          backLeft: "33%",
          backWordLayout: "inline",
          frontSecondaryTop: "30%",
          frontSecondaryLeft: "2%",
          frontSecondarySize: "8.3vw",
          frontTop: "68%",
          frontLeft: "34%",
          frontSize: "11.5vw",
        },
      },
      subjectAlign: "center",
      subheadline:
        "Full racks, real plates, and enough floor space to train without waiting.",
      // Slide 03 opens the third interactive tool (lib/fitness-tools.ts,
      // "first-30-days"). If that registry entry is ever disabled, the slide
      // shows the fallback below instead — never a dead link.
      cta: {
        primary: {
          type: "tool",
          toolId: "first-30-days",
          fallback: { label: "Explore Programs", href: "#programs" },
        },
      },
    },
  ],
};
