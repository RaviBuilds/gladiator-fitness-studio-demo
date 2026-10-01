import type { GalleryItem } from "./types";

/**
 * Master gallery data. This array is authoritative for display order —
 * filename order is not a data dependency. Every item requires alt text
 * describing the actual image.
 *
 * GLADIATOR FITNESS STUDIO — REAL operator-supplied photography from
 * public/assets/gallery (12 images, confirmed as distinct files by MD5 hash,
 * no duplicates). Each `alt` below was written from the actual photograph
 * (equipment, zone and activity visible in frame), not from the filename.
 *
 * ORDER is editorial, not numeric: training-floor/cardio equipment shots
 * first, then the strength/weights area, then the group-fitness/stretching
 * room, then the community/event shot last.
 *
 * No claim, count, award or superlative is encoded here — only what is
 * visible in each frame.
 */
export const galleryItems: GalleryItem[] = [
  {
    src: "/assets/gallery/gladiator-fitness-studio-gallery-01.jpg",
    alt: "Hanging punching bag beside cardio machines on the Gladiator Fitness Studio training floor, with members training in the background",
  },
  {
    src: "/assets/gallery/gladiator-fitness-studio-gallery-02.jpg",
    alt: "Member performing a plank exercise beside a hanging punching bag near the entrance walkway",
  },
  {
    src: "/assets/gallery/gladiator-fitness-studio-gallery-03.jpg",
    alt: "Members training on exercise bikes and machines on the main gym floor",
  },
  {
    src: "/assets/gallery/gladiator-fitness-studio-gallery-04.jpg",
    alt: "Members using free-weight benches and resistance machines on the strength-training floor",
  },
  {
    src: "/assets/gallery/gladiator-fitness-studio-gallery-05.jpg",
    alt: "Members training on elliptical and cross-trainer machines near the gym's locker area",
  },
  {
    src: "/assets/gallery/gladiator-fitness-studio-gallery-06.jpg",
    alt: "Hanging punching bag beside cardio machines on the Gladiator Fitness Studio training floor",
  },
  {
    src: "/assets/gallery/gladiator-fitness-studio-gallery-07.jpg",
    alt: "Members training on spin bikes and a stair-climber machine on the cardio floor",
  },
  {
    src: "/assets/gallery/gladiator-fitness-studio-gallery-08.jpg",
    alt: "Members using cable and resistance machines on the strength-training floor",
  },
  {
    src: "/assets/gallery/gladiator-fitness-studio-gallery-09.jpg",
    alt: "Training floor walkway leading to a hanging punching bag, with members training at stations along the sides",
  },
  {
    src: "/assets/gallery/gladiator-fitness-studio-gallery-10.jpg",
    alt: "Members training on the gym floor near the entrance, with mirrored walls and resistance equipment",
  },
  {
    src: "/assets/gallery/gladiator-fitness-studio-gallery-11.jpg",
    alt: "Group fitness room with members stretching on mats and training with resistance bands and a tyre",
  },
  {
    src: "/assets/gallery/gladiator-fitness-studio-gallery-12.jpg",
    alt: "Gladiator Fitness Studio training floor decorated for an Independence Day event, with tricolour balloons above the cardio equipment",
  },
];
