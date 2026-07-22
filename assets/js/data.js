/* ============================================================
   CREATEBYMOH — brand copy, niche configuration & media curation
   ============================================================ */
window.CBM = {
  manifestUrl: "/assets/manifest.json",
  /* pages prefetched on idle for instant navigation */
  prefetch: ["/perfumes/", "/streetwear/", "/jewelry/", "/how-we-work/", "/about/"],

  brand: {
    name: "CREATEBYMOH",
    handle: "@createbymoh",
    email: "webwizardmarketingagency@gmail.com",
    waNumber: "2348164802777",
    whatsapp:
      "https://wa.me/2348164802777?text=Hi%20CREATEBYMOH%2C%20I%27m%20interested%20in%20a%20free%20custom%20ad%20campaign%20for%20my%20brand!",
    taglineVoice: "Designing premium sensory worlds in motion...",
    audioLine: "Original Sound - CREATEBYMOH",
    stats: [
      { n: "50+", label: "Brands Scaled" },
      { n: "4+", label: "Years Exp." },
      { n: "20M+", label: "Campaign Views" },
      { n: "$15M+", label: "Tracked Revenue" },
    ],
    likes: "14.2K",
    comments: "248",
    shares: "832",
  },

  services: [
    {
      num: "01",
      title: "Sensory Art Direction",
      desc: "Textures, light and materials staged to make viewers feel the product through the screen — liquid glints, fabric drape, metal reflections.",
    },
    {
      num: "02",
      title: "Tactile Fluid Physics",
      desc: "Slow ripples, caustics and micro-macro movements engineered to trigger ASMR-like product desire and scroll-stopping attention.",
    },
    {
      num: "03",
      title: "Cinematic 3D Panning",
      desc: "Floating camera paths and seamless transition cuts composed like miniature films, purpose-built for 10–15s vertical loops.",
    },
    {
      num: "04",
      title: "High-CTR Hook Copy",
      desc: "Scroll-breaking hooks and caption systems tested across 20M+ campaign views — engineered for clicks, not vibes.",
    },
  ],

  /* ---------------- niche configuration ---------------- */
  niches: {
    perfume: {
      slug: "perfume",
      page: "/perfumes/",
      chip: "Perfume",
      menuLabel: "Perfumes",
      heroTitle: "Haute Fragrance Portfolio",
      heroSub:
        "Signature video ads crafted for fragrance houses — scent profiles translated into liquid gold, rippling caustics and cinematic macro campaigns that sell the feeling before the first spray.",
      galleryLabel: "Fragrance Concept",
      /* keyword -> curated title (matched against original Drive filenames) */
      keywordTitles: [
        { kw: "o_naya", title: "O Naya — Eau de Parfum", tag: "Hero Film", desc: "A flagship hero film — gilded mist, slow-motion bottle reveals and a radiant ribbon of liquid amber." },
        { kw: "dream_screen", title: "Dream Screen Concept", tag: "Concept Study", desc: "Surreal screen-painted fragrance world: scent notes rendered as drifting color fields and glass reflections." },
      ],
      /* pool applied in order (covers the original campaign copy first) */
      pool: [
        { title: "Parfum Homme", tag: "Aquatic Ripples", desc: "Top: Sunlit Citrus | Heart: Aquatic Caustics | Base: Wet Mineral Stones" },
        { title: "Bleu de Chanel", tag: "Frosted Ice", desc: "Top: Frozen Mint | Heart: Ginger Roots | Base: Dry Sandalwood" },
        { title: "Sparda Oud", tag: "Oud Amber Explosion", desc: "Top: Saffron Thread | Heart: Smoky Oud | Base: Golden Amber" },
        { title: "Lost Cherry", tag: "Decadent Cherry", desc: "Top: Black Cherry | Heart: Almond Liqueur | Base: Tonka Beans" },
        { title: "Oud for Greatness", tag: "Mystic Saffron", desc: "Top: Saffron Lavender | Heart: Nutmeg | Base: Dark Agarwood Smoke" },
        { title: "Evien Parfums", tag: "Blossom Dream", desc: "Top: Sakura Petals | Heart: Dewy Jasmine | Base: Creamy Vanilla" },
      ],
      overflow: [
        { title: "Amber Noir", tag: "Midnight Resin", desc: "Slow-burning amber glow wrapped in dark vanilla smoke and polished obsidian glass." },
        { title: "Velvet Musk", tag: "Skin Scent", desc: "Powder-soft musk textures woven through warm golden backlight and satin fabric." },
        { title: "Citrus Cascade", tag: "Fresh Burst", desc: "High-speed citrus splash cuts — zesty, dew soaked, and built for summer campaign energy." },
        { title: "Golden Attar", tag: "Oil Ritual", desc: "Viscous oil ribbons and engraved flacon macros for a regal attar unveiling." },
        { title: "Santal Mirage", tag: "Desert Woods", desc: "Sun-baked sandalwood tones rippling through desert heat haze and brushed copper." },
        { title: "Rose Obscur", tag: "Dark Florals", desc: "Black-rose petals dissolving into burgundy mist — a gothic floral statement piece." },
        { title: "Azure Coast", tag: "Marine Citrus", desc: "Sea-spray caustics and cold mineral freshness for aquatic blue-hour campaigns." },
        { title: "Cuir Impérial", tag: "Leather & Smoke", desc: "Tanned leather grain, ember particles and low amber keylight — pure evening luxury." },
      ],
      brief: {
        heading: "Get your custom perfume ad mockup, free",
        sub: "Provide details on your perfume bottle style and targeted client vibe. We will generate a free custom 10-15s vertical campaign mock in 48 hours.",
        points: [
          { icon: "🧪", title: "Scent Profiling", desc: "Visual layouts meticulously configured to match your top, heart, and base notes." },
          { icon: "✉️", title: "Email or WhatsApp", desc: "Brief options are instantly structured — forward the prefilled email to webwizardmarketingagency@gmail.com, or send the same brief via WhatsApp." },
        ],
        brandLabel: "Fragrance Brand",
        productLabel: "Bottle Finish / Materials",
        descLabel: "Key Olfactory Notes & targeted feel",
        submitLabel: "Submit Fragrance Brief",
        successAttach: "Email: attach your bottle photos and hit Send. WhatsApp: drop them in the chat.",
      },
    },

    streetwear: {
      slug: "streetwear",
      page: "/streetwear/",
      chip: "Streetwear",
      menuLabel: "Streetwear",
      heroTitle: "Streetwear & Fashion Portfolio",
      heroSub:
        "Lookbooks, swap transitions and tactile garment films engineered for viral reach — heavyweight fabrics, drop shoulders and utility stitching rendered loud enough to feel.",
      galleryLabel: "Streetwear Concept",
      keywordTitles: [
        { kw: "shirt_swap", title: "Shirt Swap Transition", tag: "Transition UGC", desc: "A fast-paced streetwear swap cut sequence built for viral social reach and high catalog discovery." },
        { kw: "tracksuit", title: "Tracksuit Campaign", tag: "Active Lifestyle", desc: "Full tracksuit lookbook movement cuts displaying active street cuts." },
        { kw: "tshirt", title: "Retro Tee Lookbook", tag: "Vintage Wash", desc: "Aesthetic lookbook frames highlighting raw collar washes, luxury chest graphic embroidery, and boxy fit." },
        { kw: "fashion_video_campaign", title: "Streetwear Fashion Campaign", tag: "Brand Film", desc: "A cinematic brand campaign line — movement, attitude and silhouette built for launch week." },
      ],
      pool: [
        { title: "Shirt Swap Transition", tag: "Lifestyle UGC", desc: "A fast-paced streetwear swap cut sequence built for viral social reach and high catalog discovery." },
        { title: "Oversized Hoodie", tag: "Heavyweight Fleece", desc: "Tactile closeups displaying robust fabric drapes, premium relaxed fits, and clean drop shoulders." },
        { title: "Tracksuit Campaign", tag: "Active Lifestyle", desc: "Full tracksuit lookbook movement cuts displaying active street cuts." },
        { title: "Retro Tee Lookbook", tag: "Vintage Wash", desc: "Aesthetic lookbook frames highlighting raw collar washes, luxury chest graphic embroidery, and boxy fit." },
        { title: "Cargo Sweatpants Drop", tag: "Heavy Utility", desc: "Detailed closeups of utility pocket stitching, robust waist ties, and premium fleece textures." },
        { title: "Heavyweight Fleece", tag: "Product review UGC", desc: "Conversational, tactile unboxing feel reviewing material thickness, cozy inner fleece linings, and fit sizing." },
      ],
      overflow: [
        { title: "Drop-Shoulder Study", tag: "Fit Focus", desc: "Shoulder seam drama and boxy proportions captured in slow editorial movement." },
        { title: "Graphic Tee Rotation", tag: "Catalog Spin", desc: "Clean 360 rotations built to cycle through graphic colorways at feed speed." },
        { title: "Utility Detail Cut", tag: "Macro Stitch", desc: "Zippers, cinches and double-stitched panels in razor-close macro passes." },
        { title: "Night Fit Check", tag: "Lifestyle UGC", desc: "After-dark fit checks with flash-lit fabric texture and hard street shadows." },
        { title: "Lookbook Motion Set", tag: "Lookbook", desc: "A looping motion set stitching full-body silhouettes into one seamless catalog flow." },
        { title: "Fabric Weight Story", tag: "Tactile Macro", desc: "Dragging, pinching and squeezing shots that sell GSM through pure texture." },
      ],
      brief: {
        heading: "Get your custom streetwear mockup, free",
        sub: "Provide details on your garment's fabric weight and target style. We will generate a free custom 10-15s vertical lookbook or transition mock in 48 hours.",
        points: [
          { icon: "🧵", title: "Fabric Matchmaking", desc: "Visual layouts meticulously configured to highlight heavy cotton drapes, texture weaves, or print details." },
          { icon: "✉️", title: "Email or WhatsApp", desc: "Brief options are instantly structured — forward the prefilled email to webwizardmarketingagency@gmail.com, or send the same brief via WhatsApp." },
        ],
        brandLabel: "Garment Brand",
        productLabel: "Fabric Material & GSM",
        descLabel: "Key Design Details & targeted lookbook feel",
        submitLabel: "Submit Streetwear Brief",
        successAttach: "Email: attach your product photos and hit Send. WhatsApp: drop them in the chat.",
      },
    },

    jewelry: {
      slug: "jewelry",
      page: "/jewelry/",
      chip: "Jewelry",
      menuLabel: "Jewelry",
      heroTitle: "Fine Jewelry & Accessory Portfolio",
      heroSub:
        "Macro films for precious metals and stones — mirror finishes, hand-set pavés and liquid-gold reflections staged against obsidian dark for maximum sparkle per second.",
      galleryLabel: "Jewelry Concept",
      keywordTitles: [],
      pool: [
        { title: "Classic Gilded Chain", tag: "Luxury Closeups", desc: "Macro camera panning loops displaying golden reflections and high-end mirror finishes." },
        { title: "Frosted Diamond Pendant", tag: "Luxury Closeups", desc: "High-contrast jewelry detail cuts reflecting pure silver sparkles and hand-set diamond pavés." },
        { title: "Heavy Silver Band", tag: "Aesthetic Review", desc: "Unboxing-style jewelry review detailing ring thickness, custom carvings, and fit weighting." },
        { title: "Prism Crystal Cuff", tag: "Tactile Closeup", desc: "Geometric glass caustics reflecting light prisms across a sleek brushed platinum bracelet." },
        { title: "Solid Gold Band", tag: "Aesthetic Macro", desc: "Slow-moving camera cuts capturing solid gold bands against deep obsidian stone blocks." },
      ],
      overflow: [
        { title: "Halo Ring Reveal", tag: "Luxury Closeups", desc: "A slow orbit reveal centered on halo-set stones catching pinpoint starlight flares." },
        { title: "Onyx Link Bracelet", tag: "Aesthetic Macro", desc: "Alternating gold and onyx links sliding through soft studio light in infinite loop." },
      ],
      brief: {
        heading: "Get your custom jewelry mockup, free",
        sub: "Provide details on your accessory's gold/silver material finish and gemstone specs. We will generate a free custom 10-15s vertical campaign mockup in 48 hours.",
        points: [
          { icon: "💎", title: "Material Matchmaking", desc: "Visual layouts meticulously configured to capture precious metal glows, diamond sparkle caustics, or custom carving details." },
          { icon: "✉️", title: "Email or WhatsApp", desc: "Brief options are instantly structured — forward the prefilled email to webwizardmarketingagency@gmail.com, or send the same brief via WhatsApp." },
        ],
        brandLabel: "Jewelry Brand",
        productLabel: "Metal & Gemstone Type",
        descLabel: "Key Design Details & targeted campaign feel",
        submitLabel: "Submit Jewelry Brief",
        successAttach: "Email: attach your product photos and hit Send. WhatsApp: drop them in the chat.",
      },
    },
  },

  /* ---------------- homepage curated mixed showcase ---------------- */
  homeShowcase: [
    {
      niche: "perfume", pick: { type: "index", value: 0 },
      title: "Parfum Homme", meta: "Perfume · Aquatic Ripples",
      desc: "Top: Sunlit Citrus | Heart: Aquatic Caustics | Base: Wet Mineral Stones",
    },
    {
      niche: "streetwear", pick: { type: "keyword", value: "shirt_swap" },
      title: "Shirt Swap Cut", meta: "Streetwear · Transition UGC",
      desc: "Seamless garment swap cut designed for viral streetwear catalog discovery.",
    },
    {
      niche: "jewelry", pick: { type: "index", value: 0 },
      title: "Classic Gilded Chain", meta: "Jewelry · Luxury Closeups",
      desc: "Macro camera panning loops displaying golden reflections and mirror finishes.",
    },
    {
      niche: "perfume", pick: { type: "index", value: 2 },
      title: "Sparda Oud", meta: "Perfume · Oud Amber Explosion",
      desc: "Top: Saffron Thread | Heart: Smoky Oud | Base: Golden Amber",
    },
    {
      niche: "streetwear", pick: { type: "index", value: 1 },
      title: "Oversized Hoodie", meta: "Streetwear · Heavyweight Fleece",
      desc: "Tactile closeups highlighting premium fabric weight and relaxed boxy fits.",
    },
    {
      niche: "jewelry", pick: { type: "index", value: 4 },
      title: "Solid Gold Band", meta: "Jewelry · Aesthetic Macro",
      desc: "Sleek, slow-panning cuts of raw gold bands against deep obsidian stone.",
    },
  ],

  /* generic brief (homepage) */
  homeBrief: {
    heading: "Get your custom ad mockup, free of charge",
    sub: "Give us details on your brand's style profile and target audience. We'll hand-craft a bespoke 10-15s ad mockup with native cinematic transitions in 48 hours.",
    points: [
      { icon: "🎯", title: "Product Matchmaking", desc: "Visual layouts meticulously configured to match your product's specific materials (gold, silver, cotton, or liquid)." },
      { icon: "✉️", title: "Email or WhatsApp", desc: "Your brief is compiled instantly — forward it by email to webwizardmarketingagency@gmail.com, or send the same brief in a WhatsApp chat. Your choice." },
      { icon: "🔊", title: "Scroll-Autoplay Previews", desc: "Every campaign auto-plays silently as you scroll — tap any video to replay it with full sound in the native social preview." },
    ],
    brandLabel: "Brand Name",
    productLabel: "Product / Line Name",
    descLabel: "Brief Description / Material Notes",
    submitLabel: "Submit Project Brief",
    successTitle: "Olfactory Brief Prepared",
    successAttach: "Email: attach your product photos and hit Send. WhatsApp: drop them in the chat.",
  },

  /* ---------------- editorial homepage boards ---------------- */
  homeLayout: {
    roles: "Ad Creative Studio | Motion Design ✦ Cinematic Campaigns",
    contactLine: "webwizardmarketingagency@gmail.com · WhatsApp +234 816 480 2777 · Worldwide — Remote",
    trustedLine: "Trusted by 50+ brands scaled",
    who: {
      title1: "WHAT",
      title2: "We Do",
      body1:
        "CREATEBYMOH is a cinematic motion design studio. We hand-craft bespoke 10–15s vertical ad campaigns for perfume, streetwear and fine jewelry brands — sensory worlds in motion built to stop the scroll.",
      body2:
        "Every frame is art-directed around your product's physical reality: liquid viscosity, fabric weight, mirror finishes. The result feels less like an ad and more like a miniature film.",
    },
    caseStudy: {
      title: "Case STUDY 1",
      line: "Aggregate campaign results across our niche portfolio",
      body:
        "Crafted end-to-end ad creatives covering concept development, art direction and native vertical execution for fragrance, streetwear and jewelry brands scaling on paid social.",
      stats: ["20M+ campaign views", "$15M+ tracked revenue", "50+ brands scaled"],
    },
    nicheBoard: {
      title1: "MY Niche &",
      title2: "SPECIALITIES",
      leftPills: ["UGC Ad Videos", "Product-focused Ads", "Product Review Ads", "Unboxing Style", "Lifestyle & Aesthetic Ads"],
      rightPills: ["Perfume & Fragrance", "Streetwear Clothing", "Fine Jewelry", "Cosmetics & Skincare", "Watches & Accessories"],
    },
    rates: [
      {
        title: "UGC-Style Video + Art Direction",
        desc: "10–15s vertical campaign loops with native cinematic transitions — staged lighting, tactile macro passes and hook-first pacing, platform-ready for TikTok, Reels and Shorts.",
        list: ["Lifestyle & sensory videos", "Seamless transition cuts", "Cinematic 3D panning", "Hook copy + captions", "Tap-for-sound previews"],
        cta: "Free mockup in 48h",
      },
      {
        title: "Campaign Creative Kit",
        desc: "Everything a brand needs to ship a month of premium ads — concept boards, hero frames and a reusable motion language tuned to your product materials.",
        list: ["Concept art direction boards", "Product photography frames", "3–10s cutdown variations", "Unlimited revisions", "Delivery via Drive & email"],
        cta: "Free mockup in 48h",
      },
    ],
    howSteps: [
      { n: "1", t: "Send a 2-minute brief", d: "Tell us about your brand vision and goals over the form or a WhatsApp chat — we'll help you figure out what type of content will hit best with your audience." },
      { n: "2", t: "Strategy & creative direction", d: "Once we lock in the concept and materials, we plan the shoot: styling, light, textures and camera paths designed to make your product irresistible on screen." },
      { n: "3", t: "Content delivery & usage", d: "Your final creative lands in 48 hours via Google Drive — polished, loop-ready and formatted for whatever platform you run your ads on." },
    ],
  },

  testimonials: [
    {
      name: "Fragrance Brand Partner",
      img: { niche: "perfume", index: 0 },
      quote: "CREATEBYMOH's content brought real energy to our launch. The pacing, the light, the macro bottle reveals — every frame matched the brand perfectly. The 15s cut became our best-performing ad.",
    },
    {
      name: "Streetwear Label Owner",
      img: { niche: "streetwear", index: 0 },
      quote: "The fabric really does feel heavy on camera. Customers kept asking what the hoodie was made of after seeing the motion set — it looked exactly like our brand feels in person.",
    },
    {
      name: "Jewelry Boutique Founder",
      img: { niche: "jewelry", index: 0 },
      quote: "Loved how the gold was staged against dark stone — effortless and premium. The loops showed every detail while keeping that raw, stylish and authentic edge we wanted.",
    },
  ],

  nicheOptions: [
    "Perfume & Fragrance",
    "Streetwear Clothing",
    "Fine Jewelry",
    "Cosmetics & Skincare",
    "Watches & Accessories",
    "Other (Specify below)",
  ],
  adStyleOptions: [
    "UGC Ad",
    "Product-focused Ad",
    "Product Review Ad",
    "Unboxing Style",
    "Lifestyle & Aesthetic Ad",
  ],
  creativeFormatOptions: [
    "Video Creative (.mp4)",
    "Image Ads Creative (.jpg/.png)",
  ],
};
