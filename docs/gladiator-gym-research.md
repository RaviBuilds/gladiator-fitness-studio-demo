# GYM RESEARCH PACKAGE — Gladiator Fitness Studio

Researched: September 2026  
Research source: `Gladiator Fitness Studio Research Plan.pdf`  
Phase: PROSPECT_DEMO

> Normalized research package for the BLOGSPAGE AI reusable gym website factory.
> Preserve branch-level distinctions and unresolved conflicts. Do not treat inference as verified fact.

```yaml
BUSINESS:
  name:
    value: "Gladiator Fitness Studio"
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL
  category:
    value: "Gym / Fitness Centre"
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL
  primary_locality:
    value: "Madhapur, Hitech City"
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL
  city:
    value: "Hyderabad"
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL
  state:
    value: "Telangana"
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL
  country:
    value: "India"
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL
  founded_year:
    value: 2012
    source: "https://www.justdial.com/Hyderabad/Gladiator-Fitness-Studio-Opposite-Police-Station-Above-Andhra-Bank-Kattendan-Durga-Nagar-Mailardevpalli/040PXX40-XX40-140110202356-Z4Q1_BZDET"
    status: PUBLICLY_REPORTED
  branch_count:
    value: 4
    source: "Multi-branch public-source research"
    status: PUBLICLY_REPORTED
  tagline:
    value: "Clean gym boasting spacious facilities"
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL
  owner_founder:
    value: null
    source: null
    status: NOT_FOUND
  mission_vision:
    value: null
    source: null
    status: NOT_FOUND
```

```yaml
WEBSITE:
  discovery_status:
    value: "WEBSITE_NOT_FOUND"
    source: "Deep website discovery documented in research report"
    status: PUBLICLY_REPORTED
  official_url:
    value: null
    source: null
    status: NOT_FOUND
  official_ownership:
    value: null
    source: null
    status: NOT_FOUND
  google_business_profile_linkage:
    value: "NOT_LINKED_ON_GBP"
    source: "Google Business Profile Screenshot / research report"
    status: PUBLICLY_REPORTED
  scope:
    value: null
    source: null
    status: NOT_FOUND
  branch_relationship:
    value: null
    source: null
    status: NOT_FOUND
  excluded_domain:
    value: "https://gladiatorgym.in"
    source: "https://gladiatorgym.in/pricing-plans/"
    reason: "Research report states this is an unrelated Gladiator Gym entity in Ernakulam, Kochi, Kerala."
    status: EXCLUDED_WRONG_BUSINESS
  discovery_note:
    value: "No verified centralized corporate website for the Hyderabad Gladiator Fitness Studio network was identified."
    source: "Research report"
    status: PUBLICLY_REPORTED
```

```yaml
BRANCHES:
  - id: "madhapur"
    branch_number: 1
    name: "Gladiator Fitness Studio"
    role: "anchor"
    address: "Prince Complex, Hitech City Main Road, opposite Leaf Hospital, Sri Vivekananda Nagar"
    locality: "Madhapur"
    city: "Hyderabad"
    state: "Telangana"
    postal_code: "500114"
    phone: "+919948313442"
    whatsapp: null
    email: null
    map_url: null
    website_url: null
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL

  - id: "falaknuma"
    branch_number: 2
    name: "Gladiator Fitness Studio Falaknuma"
    address: "8FP9+62M, Fatima Nagar"
    locality: "Falaknuma"
    city: "Hyderabad"
    state: "Telangana"
    postal_code: "500053"
    phone: null
    whatsapp: null
    email: null
    map_url: null
    website_url: null
    source: "https://gym-india.nears.me/listings/india/telangana/hyderabad/gladiator-fitness-studio-falaknuma-hyderabad-ts/"
    status: PUBLICLY_REPORTED

  - id: "kattedan"
    branch_number: 3
    name: "Gladiator Fitness Studio Kattedan"
    address: "NCR Complex, 4th Floor, Opp. Police Station, Above Andhra Bank, Kattedan-Durga Nagar, Mailardevpalli"
    locality: "Mailardevpalli / Kattedan"
    city: "Hyderabad"
    state: "Telangana"
    postal_code: "500077"
    phone: null
    whatsapp: null
    email: null
    map_url: null
    website_url: null
    source: "https://www.justdial.com/Hyderabad/Gladiator-Fitness-Studio-Opposite-Police-Station-Above-Andhra-Bank-Kattendan-Durga-Nagar-Mailardevpalli/040PXX40-XX40-140110202356-Z4Q1_BZDET"
    status: PUBLICLY_REPORTED

  - id: "rakshapuram"
    branch_number: 4
    name: "Gladiator Fitness Studio Rakshapuram"
    address: "Near Arundhati Colony, Road Rakshapuram"
    locality: "Rakshapuram"
    city: "Hyderabad"
    state: "Telangana"
    postal_code: "500053"
    phone: null
    whatsapp: null
    email: null
    map_url: null
    website_url: null
    source: "https://www.justdial.com/Hyderabad/Gladiator-Fitness-Studio-Rakshapuram/040PXX40-XX40"
    status: PUBLICLY_REPORTED
```

```yaml
HOURS:
  madhapur:
    monday: "5:30 AM – 10:00 PM"
    tuesday: "5:30 AM – 10:00 PM"
    wednesday: "5:30 AM – 10:00 PM"
    thursday: "5:30 AM – 10:00 PM"
    friday: "5:30 AM – 10:00 PM"
    saturday: "5:30 AM – 10:00 PM"
    sunday: "6:00 AM – 10:00 PM"
    source: "Google Business Profile Screenshot + Nears.me"
    status: PUBLICLY_REPORTED
    verification_note: "Sunday opening time is more specifically reported as 6:00 AM by Nears.me; owner confirmation recommended."

  falaknuma:
    monday: "6:00 AM – 11:00 AM"
    tuesday: "6:00 AM – 11:00 AM"
    wednesday: "6:00 AM – 11:00 AM"
    thursday: "6:00 AM – 11:00 AM"
    friday: "6:00 AM – 11:00 AM"
    saturday: "6:00 AM – 11:00 AM"
    sunday: "6:00 AM – 10:00 AM"
    source: "Nears.me / research report"
    status: PUBLICLY_REPORTED
    verification_note: "Do not invent evening hours. The report says some directories may truncate them."

  kattedan:
    monday: "5:00 AM – 11:00 AM; 5:00 PM – 10:00 PM"
    tuesday: "5:00 AM – 11:00 AM; 5:00 PM – 10:00 PM"
    wednesday: "5:00 AM – 11:00 AM; 5:00 PM – 10:00 PM"
    thursday: "5:00 AM – 11:00 AM; 5:00 PM – 10:00 PM"
    friday: "5:00 AM – 11:00 AM; 5:00 PM – 10:00 PM"
    saturday: "5:00 AM – 11:00 AM; 5:00 PM – 10:00 PM"
    sunday: "5:00 AM – 11:00 AM; evening closed"
    source: "Research report / branch-hours table"
    status: PUBLICLY_REPORTED

  rakshapuram:
    monday: null
    tuesday: null
    wednesday: null
    thursday: null
    friday: null
    saturday: null
    sunday: null
    source: null
    status: NOT_FOUND
```

```yaml
CONTACT:
  primary_madhapur_phone:
    value: "+919948313442"
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL
  branch_phones:
    value: null
    source: null
    status: NOT_FOUND
  whatsapp:
    value: null
    source: null
    status: NOT_FOUND
  email:
    value: null
    source: null
    status: NOT_FOUND
  booking_url:
    value: null
    source: null
    status: NOT_FOUND
  instagram_url:
    value: null
    source: null
    status: NOT_FOUND
  instagram_handle:
    value: null
    source: null
    status: NOT_FOUND
  facebook_url:
    value: null
    source: null
    status: NOT_FOUND
  youtube_url:
    value: "https://www.youtube.com/watch?v=q-ae7gCFeB8"
    source: "Gladiator Fitness Studio YouTube result cited in report"
    status: PUBLICLY_REPORTED
  youtube_channel_name:
    value: "Gladiator Fitness Studio"
    source: "Research report"
    status: PUBLICLY_REPORTED
```

```yaml
ABOUT:
  short_description:
    value: "Established Hyderabad fitness studio network focused on strength training, bodybuilding, cardiovascular conditioning, personal training and functional training."
    source: "Google Business Profile Screenshot + public service listings"
    status: PUBLICLY_REPORTED
  positioning:
    value: "Equipment-focused fitness offering centered on weight training, cardio, bodybuilding, personal training and functional training."
    source: "Research report"
    status: PUBLICLY_REPORTED
  story:
    value: null
    source: null
    status: NOT_FOUND
  founder_story:
    value: null
    source: null
    status: NOT_FOUND
  facilities:
    - label: "Spacious Facilities"
      value: "The Madhapur branch is described as having spacious facilities."
      source: "Google Business Profile Screenshot"
      status: VERIFIED_OFFICIAL
    - label: "Clean Gym"
      value: "The Madhapur branch is described as a clean gym."
      source: "Google Business Profile Screenshot"
      status: VERIFIED_OFFICIAL
    - label: "Restrooms"
      value: "Restroom access is publicly documented."
      source: "https://gym-india.nears.me/listings/india/telangana/hyderabad/trusted-gladiator-fitness-studio-hyderabad-ts/"
      status: PUBLICLY_REPORTED
    - label: "Wheelchair Accessible"
      value: "Wheelchair-accessible entrance and car parking are publicly reported for the Madhapur branch."
      source: "Justdial"
      status: PUBLICLY_REPORTED
```

```yaml
PROGRAMS:
  - id: "weight-training"
    name: "Weight Training"
    description: "Weight training with dedicated heavy-lifting areas."
    category: "strength"
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL
  - id: "cardio-fitness"
    name: "Cardio Fitness"
    description: "Cardiovascular conditioning using the documented cardio areas and machines."
    category: "conditioning"
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL
  - id: "personal-training"
    name: "Personal Training"
    description: "One-on-one personal training with certified coaching support."
    category: "personal"
    source: "Nears.me"
    status: PUBLICLY_REPORTED
  - id: "functional-training"
    name: "Functional Training"
    description: "Functional fitness training with dedicated space/equipment."
    category: "conditioning"
    source: "Nears.me"
    status: PUBLICLY_REPORTED
  - id: "bodybuilding"
    name: "Bodybuilding"
    description: "Bodybuilding programs are publicly documented."
    category: "strength"
    source: "XploreSports / secondary aggregator evidence cited by report"
    status: PUBLICLY_REPORTED
  - id: "weight-loss"
    name: "Weight Loss Programs"
    description: "Structured weight-loss programs are publicly reported."
    category: "other"
    source: "XploreSports / secondary aggregator evidence cited by report"
    status: PUBLICLY_REPORTED

  group_training:
    value: true
    source: "Premium aggregator literature cited by report"
    status: PUBLICLY_REPORTED

  unverified_modalities:
    value:
      - "CrossFit-style training"
      - "Yoga"
      - "Martial Arts"
      - "Boxing"
      - "Online Coaching"
      - "distinct Women's programs"
      - "distinct Men's programs"
    source: "Research report"
    status: NOT_VERIFIED
```

```yaml
EQUIPMENT:
  - name: "Cardio Machines"
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL
  - name: "Weight-Training Machines"
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL
  - name: "Free Weights"
    source: "Nears.me"
    status: PUBLICLY_REPORTED
  - name: "Heavy Resistance Machines"
    source: "Nears.me"
    status: PUBLICLY_REPORTED
  - name: "Dumbbells"
    source: "Nears.me"
    status: PUBLICLY_REPORTED
  - name: "Commercial Treadmills"
    source: "Nears.me"
    status: PUBLICLY_REPORTED
  - name: "Airbikes"
    source: "Nears.me"
    status: PUBLICLY_REPORTED
```

```yaml
REVIEWS:
  google:
    madhapur_rating:
      value: 4.4
      source: "Google Business Profile Screenshot"
      status: VERIFIED_OFFICIAL
    madhapur_review_count:
      value: 454
      source: "Google Business Profile Screenshot"
      status: VERIFIED_OFFICIAL
    checked:
      value: "September 2026"
      source: "Research report"
      status: PUBLICLY_REPORTED
    profile_url:
      value: null
      source: null
      status: NOT_FOUND

  branches:
    - branch: "Madhapur"
      rating: 4.4
      review_count: 442
      source: "Nears.me"
      status: PUBLICLY_REPORTED
    - branch: "Falaknuma"
      rating: 4.2
      review_count: 211
      source: "Nears.me"
      status: PUBLICLY_REPORTED
    - branch: "Kattedan"
      rating: 4.0
      review_count: 181
      source: "Justdial"
      status: PUBLICLY_REPORTED
    - branch: "Rakshapuram"
      rating: 4.0
      review_count: 206
      source: "Justdial"
      status: PUBLICLY_REPORTED

  featured_reviews:
    value: []
    source: null
    status: NOT_FOUND
    note: "The research explicitly says attributable full-text Gladiator testimonials could not be authenticated because directory aggregators mix competitor reviews into listings."

  themes:
    positive:
      value:
        - "Hygiene and cleanliness"
        - "Spacious gym floors"
        - "Welcoming community atmosphere"
        - "Equipment range and quality"
      source: "Google Business Profile Screenshot + public directory review analysis"
      status: PUBLICLY_REPORTED
    mixed_negative:
      value: null
      source: null
      status: NOT_FOUND
```

```yaml
PRICING:
  status:
    value: "NOT_PUBLICLY_DISCLOSED"
    source: "Research report"
    status: PUBLICLY_REPORTED
  daily: null
  weekly: null
  monthly: null
  quarterly: null
  half_year: null
  annual: null
  special_training: null
  excluded_prices:
    - source: "https://gladiatorgym.in/pricing-plans/"
      values: "INR 6000 / 4 months; INR 10000 / 1 year"
      reason: "Belongs to unrelated Kochi, Kerala business."
      status: EXCLUDED_WRONG_BUSINESS
    - source: "Local aggregator/search snippets"
      values: "Approximate INR 4000–6000 monthly ranges"
      reason: "Report states these may be scraped from neighboring competitor gyms."
      status: EXCLUDED_UNVERIFIED
  note:
    value: "Do not use any exact Hyderabad membership price from the research package; direct business confirmation is required."
    source: "Research report"
    status: PUBLICLY_REPORTED
```

```yaml
FAQ:
  - question: "Where is the Madhapur Gladiator Fitness Studio?"
    answer: "Prince Complex on Hitech City Main Road, opposite Leaf Hospital, Sri Vivekananda Nagar, Madhapur, Hyderabad."
    topic: "location"
    source: "Google Business Profile Screenshot"
    status: VERIFIED_OFFICIAL
  - question: "What are the Madhapur branch hours?"
    answer: "Monday to Saturday: 5:30 AM–10:00 PM. Sunday: 6:00 AM–10:00 PM, based on the sources documented in the research."
    topic: "timings"
    source: "Google Business Profile Screenshot + Nears.me"
    status: PUBLICLY_REPORTED
  - question: "What programs are offered?"
    answer: "Publicly documented services include weight training, cardio fitness, personal training, functional training, bodybuilding and structured weight-loss programs."
    topic: "programs"
    source: "Research report"
    status: PUBLICLY_REPORTED
  - question: "How many Gladiator Fitness Studio branches were identified?"
    answer: "Four branches were identified in Hyderabad: Madhapur, Falaknuma, Kattedan and Rakshapuram."
    topic: "branches"
    source: "Multi-branch public-source research"
    status: PUBLICLY_REPORTED
  - question: "Is the Madhapur branch wheelchair accessible?"
    answer: "Wheelchair-accessible entrance and car parking are publicly reported for the Madhapur branch."
    topic: "accessibility"
    source: "Justdial"
    status: PUBLICLY_REPORTED
  - question: "Is membership pricing available online?"
    answer: "Current direct membership pricing was not verified in the research."
    topic: "pricing"
    source: "Research report"
    status: PUBLICLY_REPORTED
```

```yaml
SEO:
  business_name: "Gladiator Fitness Studio"
  primary_locality: "Madhapur"
  primary_city: "Hyderabad"
  secondary_localities:
    - "Falaknuma"
    - "Kattedan"
    - "Mailardevpalli"
    - "Rakshapuram"
  documented_service_terms:
    - "Gym"
    - "Fitness centre"
    - "Bodybuilding"
    - "Weight training"
    - "Personal training"
    - "Cardio machines"
    - "Functional training"
  natural_search_phrases:
    - "Gym in Madhapur"
    - "Fitness studio near Hitech City"
    - "Bodybuilding gym in Falaknuma"
    - "Weight loss personal trainer near Leaf Hospital"
    - "Spacious fitness centre in Sri Vivekananda Nagar"
  title_candidate:
    value: "Gladiator Fitness Studio | Gym & Personal Training in Madhapur"
    source: "Research report"
    status: INFERRED
  alternate_title_candidate:
    value: "Gladiator Fitness Studio | Strength, Cardio & Bodybuilding in Hitech City"
    source: "Research report"
    status: INFERRED
```

```yaml
INSTAGRAM:
  profile_url:
    value: https://www.instagram.com/gladiatorfitnessstudioandgym
    source: null
    status: NOT_FOUND
  handle:
    value: gladiatorfitnessstudioandgym
    source: null
    status: NOT_FOUND
  items: 

   - url:
        value: "https://www.instagram.com/reel/DWnVt7ekbEV/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA=="
        source: "Official Instagram"
        status: VERIFIED_OFFICIAL
      type: "reel"
      posted_on:
        value: null
        source: null
        status: NOT_FOUND
      subject:
        value: "Strength training session inside the gym"
        source: "Official Instagram Reel"
        status: VERIFIED_OFFICIAL

    - url:
        value: "https://www.instagram.com/reel/DR2Np_vEzhC/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA=="
        source: "Official Instagram"
        status: VERIFIED_OFFICIAL
      type: "reel"
      posted_on:
        value: null
        source: null
        status: NOT_FOUND
      subject:
        value: "Gym interior and equipment walkthrough"
        source: "Official Instagram Reel"
        status: VERIFIED_OFFICIAL

 - url:
        value: "https://www.instagram.com/reel/DO7ofenEVaz/?utm_source=ig_web_copy_link&stkn=MzRlODBiNWFlZA=="
        source: "Official Instagram"
        status: VERIFIED_OFFICIAL
      type: "reel"
      posted_on:
        value: null
        source: null
        status: NOT_FOUND
      subject:
        value: "Gym interior and equipment walkthrough"
        source: "Official Instagram Reel"
        status: VERIFIED_OFFICIAL


  note:
    value: "Unified official Instagram ownership was not verified by the research."
    source: "Research report"
    status: NOT_FOUND
```

```yaml
ASSET_MANIFEST:
  logo:
    url: null
    source: null
    status: NOT_FOUND
  manual_collection_required:
    - role: "about_interior"
      subject: "Spacious Gladiator Fitness Studio training floor"
    - role: "why_choose_anchor"
      subject: "Strength/cardio floor or accessibility-relevant facility"
    - role: "program-weight-training"
      subject: "Free weights / heavy resistance training"
    - role: "program-cardio"
      subject: "Cardio machines"
    - role: "program-personal-training"
      subject: "One-on-one coaching"
    - role: "program-functional-training"
      subject: "Functional training"
    - role: "program-bodybuilding"
      subject: "Bodybuilding / heavy free-weight training"
    - role: "program-weight-loss"
      subject: "Training session appropriate to the documented program"
    - role: "gallery"
      subject: "Gym interiors, equipment and training"
    - role: "pricing_background"
      subject: "Dark gym/equipment image"
    - role: "faq_background"
      subject: "Wide gym interior/equipment image"
    - role: "og_image"
      subject: "Wide branded Gladiator Fitness Studio image"
```

```yaml
SOURCE_LOG:
  - source: "Google Business Profile Screenshot"
    type: "Primary identity anchor"
    confidence: "HIGH"
    accessed: "September 2026"
  - source: "https://gym-india.nears.me/listings/india/telangana/hyderabad/trusted-gladiator-fitness-studio-hyderabad-ts/"
    type: "Local fitness directory"
    confidence: "MEDIUM"
    accessed: "September 2026"
  - source: "https://gym-india.nears.me/listings/india/telangana/hyderabad/gladiator-fitness-studio-falaknuma-hyderabad-ts/"
    type: "Branch directory"
    confidence: "MEDIUM"
    accessed: "September 2026"
  - source: "https://www.justdial.com/Hyderabad/Gladiator-Fitness-Studio-Opposite-Police-Station-Above-Andhra-Bank-Kattendan-Durga-Nagar-Mailardevpalli/040PXX40-XX40-140110202356-Z4Q1_BZDET"
    type: "Local business directory"
    confidence: "MEDIUM"
    accessed: "September 2026"
  - source: "https://www.justdial.com/Hyderabad/Gladiator-Fitness-Studio-Rakshapuram/040PXX40-XX40"
    type: "Local business directory"
    confidence: "MEDIUM"
    accessed: "September 2026"
  - source: "https://magicpin.in/Hyderabad/Falaknuma/Fitness/Gladiator-Fitness-Studio-Falaknuma/store/1b37cc0"
    type: "Retail/local directory"
    confidence: "LOW"
    accessed: "September 2026"
```

```yaml
VERIFICATION_NOTES:
  major_conflicts:
    - field: "Official website / pricing"
      issue: "gladiatorgym.in contains pricing for an unrelated Gladiator Gym in Ernakulam, Kochi, Kerala."
      resolution: "Exclude the domain and all of its pricing/data/imagery from Hyderabad research."
      status: CONFLICTING_SOURCES
    - field: "Brand boundary"
      issue: "Gladiator Pro Fitness Studio in Yousufguda may be related or unrelated; ownership is unverified."
      resolution: "Exclude Yousufguda data until core business management confirms the relationship."
      status: CONFLICTING_SOURCES
    - field: "Madhapur Sunday hours"
      issue: "GBP implies generic daily closing at 10 PM; Nears.me specifies Sunday opening at 6 AM."
      resolution: "Use 6 AM Sunday opening provisionally; owner confirmation recommended."
      status: CONFLICTING_SOURCES

  owner_confirmation_required:
    - "Official website/domain, if any"
    - "Whether Gladiator Pro Fitness Studio in Yousufguda is part of the network"
    - "Exact current pricing by branch"
    - "Branch-specific phone/WhatsApp numbers"
    - "Official Instagram and Facebook accounts"
    - "Madhapur Sunday opening time"
    - "Falaknuma evening schedule, if any"
    - "Rakshapuram hours"
    - "Trainer names and verified credentials"
    - "Genuine attributable testimonials"
    - "Consented transformation stories"
    - "Final approved logo and photography"

  excluded_by_contract:
    - "Transformations remain unavailable for the initial prospect demo."
    - "Trainer names from competitor-contaminated snippets are excluded."
    - "No exact pricing from gladiatorgym.in may be imported."
    - "No unverified luxury/spa amenities may be added."
    - "Hero and global education modules remain controlled by the master template."
```

```yaml
TEMPLATE_DATA_READINESS:
  website:
    exists: NOT_FOUND
    url: NOT_FOUND
    official_status: NOT_FOUND
    gbp_linkage: NOT_LINKED_ON_GBP
  business:
    name: READY
    description: READY
    primary_phone: READY
    email: NOT_FOUND
    multi_branch_logic: REQUIRED
  services:
    status: READY_WITH_PUBLICLY_REPORTED_FIELDS
  pricing:
    status: NOT_FOUND
    note: "Prospect-demo workflow should preserve the existing template demonstration pricing until the gym provides actual pricing."
  trainers:
    status: NOT_FOUND
  reviews:
    aggregate: READY
    featured_quotes: NOT_FOUND
  transformations:
    status: NOT_FOUND
```
