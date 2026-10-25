import { additionalDestinationSpecs } from "./additionalDestinationData.js";

export const tourCategories = [
  "Hill Station Getaways",
  "Family Holidays",
  "Weekend Trips",
  "Outstation Road Trips",
  "Coastal Getaways",
  "Culture & Heritage",
  "Nature & Waterfalls",
];

const coreDestinations = [
  {
    id: "kodaikanal", name: "Kodaikanal", shortName: "Kodaikanal", region: "Palani Hills · Tamil Nadu",
    slug: "/tour-packages/kodaikanal", routeSlug: "/chennai-to-kodaikanal-cab", hero: "/tours/generated/hd/kodaikanal.jpg", alt: "High-definition scenic view of Kodaikanal Lake and Palani Hills",
    duration: "Suggested 2–3 days", durationDays: "2–3", category: ["Hill Station Getaways", "Family Holidays", "Weekend Trips", "Outstation Road Trips"],
    summary: "A relaxed hill escape with lakeside time, forested viewpoints and cool-weather walks.",
    overview: "Kodaikanal brings together wooded hills, a star-shaped lake, walking paths and waterfalls in the Palani Hills. Choose a gentle sightseeing loop or leave more time for lake-side breaks and viewpoints. The suggested plan can be adjusted around weather and access on your travel dates.",
    highlights: ["Kodai Lake", "Coaker’s Walk", "Pillar Rocks", "Silver Cascade"],
    attractions: [
      { name: "Kodai Lake", description: "Spend time around the lake and choose from activities available locally on the day.", image: "/tours/kodaikanal/stops/kodaikanal-lake.jpg", alt: "AI-generated illustration of Kodaikanal Lake" },
      { name: "Coaker’s Walk", description: "A scenic promenade for an easy stroll and hill-country views when conditions are clear.", image: "/tours/kodaikanal/stops/coakers-walk.jpg", alt: "AI-generated illustration of Coaker’s Walk in Kodaikanal" },
      { name: "Pillar Rocks", description: "Tall rock formations and a viewing area among the forested hills.", image: "/tours/kodaikanal/stops/pillar-rocks.jpg", alt: "AI-generated illustration of Pillar Rocks in Kodaikanal" },
      { name: "Silver Cascade", description: "A roadside waterfall stop; water flow varies by season and rainfall.", image: "/tours/kodaikanal/stops/silver-cascade.jpg", alt: "AI-generated illustration of Silver Cascade near Kodaikanal" },
    ],
    itinerary: [
      { day: "Day 1", title: "Town and lake circuit", text: "A relaxed day around Kodaikanal town and its lake.", places: [
        { name: "Silver Cascade Falls", image: "/tours/kodaikanal/stops/silver-cascade.jpg", description: "A famous waterfall near the Kodaikanal approach road." },
        { name: "Kurinji Andavar Temple", image: "/tours/kodaikanal/stops/kurinji-andavar-temple.jpg", description: "A Murugan temple in peaceful surroundings." },
        { name: "Coaker’s Walk", image: "/tours/kodaikanal/stops/coakers-walk.jpg", description: "A popular paved walking path with valley views." },
        { name: "Bryant Park", image: "/tours/kodaikanal/stops/bryant-park.jpg", description: "A landscaped botanical garden." },
        { name: "Kodaikanal Lake", image: "/tours/kodaikanal/stops/kodaikanal-lake.jpg", description: "Enjoy boating, cycling and lakeside scenery, subject to local availability." },
        { name: "Upper Lake View", image: "/tours/kodaikanal/stops/upper-lake-view.jpg", description: "A roadside viewpoint overlooking the lake." },
      ] },
      { day: "Day 2", title: "Famous viewpoints circuit", text: "A scenic route through Kodaikanal’s forest-side viewpoints.", places: [
        { name: "Moir Point", image: "/tours/kodaikanal/stops/moir-point.jpg", description: "A popular viewpoint on the forest-side route." },
        { name: "Pine Forest", image: "/tours/kodaikanal/stops/pine-forest.jpg", description: "Tall pine trees and scenic photography spots." },
        { name: "Guna Caves", image: "/tours/kodaikanal/stops/guna-caves.jpg", description: "Famous rocky scenery and forest surroundings; access may be restricted." },
        { name: "Pillar Rocks", image: "/tours/kodaikanal/stops/pillar-rocks.jpg", description: "Three towering rock formations." },
        { name: "Green Valley View", image: "/tours/kodaikanal/stops/green-valley-view.jpg", description: "A well-known valley viewpoint." },
        { name: "Caps Fly Valley View", image: "/tours/kodaikanal/stops/caps-fly-valley-view.jpg", description: "A scenic stop on local sightseeing routes, subject to access." },
      ] },
      { day: "Day 3", title: "Poombarai and countryside", text: "Explore village and countryside scenery beyond the town.", places: [
        { name: "Poombarai Village", image: "/tours/kodaikanal/stops/poombarai-village.jpg", description: "A hillside village with terraced landscapes." },
        { name: "Kuzhanthai Velappar Temple", image: "/tours/kodaikanal/stops/kuzhanthai-velappar-temple.jpg", description: "A historic Murugan temple near Poombarai." },
        { name: "Mannavanur Lake", image: "/tours/kodaikanal/stops/mannavanur-lake.jpg", description: "A peaceful countryside lake and grassland area." },
      ] },
    ],
    suitable: ["Swift Dzire · up to 4 passengers", "Ertiga · up to 6 passengers"],
    included: ["Private cab for the agreed itinerary", "Driver and fuel for the confirmed route", "Pickup and drop as agreed"],
    excluded: ["Accommodation and meals", "Entry tickets, activities and parking", "Tolls and charges outside the confirmed quote"],
    faqs: [
      ["Can I change the suggested itinerary?", "Yes. Share the places and pace you prefer; the team will check the route and provide a revised quote."],
      ["Is the fare fixed on this page?", "No package price is displayed because the final quote depends on dates, route, duration, vehicle and availability."],
    ],
    sourceLinks: [{ label: "Incredible India · Kodaikanal overview", href: "https://www.prod.incredibleindia.gov.in/content/incredible-india-v2/en/destinations/madurai/kodaikanal.html" }],
  },
  {
    id: "ooty", name: "Ooty & Coonoor", shortName: "Ooty", region: "Nilgiris · Tamil Nadu",
    slug: "/tour-packages/ooty", routeSlug: "/chennai-to-ooty-cab", hero: "/tours/generated/hd/ooty.jpg", alt: "High-definition Nilgiri tea hills near Ooty and Coonoor",
    duration: "Suggested 3–4 days", durationDays: "3–4", category: ["Hill Station Getaways", "Family Holidays", "Outstation Road Trips"],
    summary: "Tea country, botanical gardens, mountain views and optional heritage railway planning.",
    overview: "Ooty and nearby Coonoor offer gardens, tea landscapes and highland viewpoints in the Nilgiris. This road-trip plan uses flexible sightseeing blocks so the day can adapt to weather, traffic and attraction access.",
    highlights: ["Ooty Lake", "Government Botanical Gardens", "Doddabetta Peak", "Tea gardens", "Nilgiri Mountain Railway"],
    attractions: [
      { name: "Ooty Lake", description: "A popular town-side lake; local activities and access may vary.", image: "/tours/ooty/ooty-lake-crop.jpg", alt: "AI-generated illustration of Ooty Lake" },
      { name: "Government Botanical Gardens", description: "A landscaped garden maintained by Tamil Nadu’s Horticulture Department.", image: "/tours/ooty/botanical-gardens-crop.jpg", alt: "AI-generated illustration of the Ooty Botanical Gardens" },
      { name: "Doddabetta Peak", description: "A Nilgiri viewpoint known for wide views over surrounding hills and forests.", image: "/tours/ooty/doddabetta-peak-crop.jpg", alt: "AI-generated illustration of Doddabetta Peak" },
      { name: "Coonoor tea country", description: "Tea-growing landscapes and viewpoints around Coonoor; stop access depends on local conditions.", image: "/tours/ooty/coonoor-tea-estates-crop.jpg", alt: "AI-generated illustration of Coonoor tea estates" },
      { name: "Sim’s Park", description: "A landscaped garden in Coonoor; check current opening hours before visiting.", image: "/tours/ooty/sims-park-crop.jpg", alt: "AI-generated illustration of Sim’s Park in Coonoor" },
      { name: "Nilgiri Mountain Railway", description: "A heritage rail experience. Train schedules and seats must be checked and booked separately, subject to availability.", image: "/tours/ooty/nilgiri-mountain-railway-crop.jpg", alt: "AI-generated illustration of the Nilgiri Mountain Railway" },
    ],
    itinerary: [
      { day: "Day 1", title: "Chennai to Ooty", text: "Drive to Ooty with planned rest breaks. Keep the evening flexible after arrival.", image: "/tours/ooty/ooty-lake-crop.jpg" },
      { day: "Day 2", title: "Ooty town and gardens", text: "Visit the lake and Government Botanical Gardens, with time for local dining and a relaxed town stop.", image: "/tours/ooty/botanical-gardens-crop.jpg" },
      { day: "Day 3", title: "Doddabetta and Coonoor", text: "Plan a hill viewpoint and tea-country drive. If taking the Nilgiri Mountain Railway, align the cab plan with confirmed train tickets.", image: "/tours/ooty/nilgiri-mountain-railway-crop.jpg" },
      { day: "Day 4", title: "Return journey", text: "Start back to Chennai with breaks, or request an extended stay and revised itinerary.", image: "/tours/ooty/coonoor-tea-estates-crop.jpg" },
    ],
    suitable: ["Swift Dzire · up to 4 passengers", "Ertiga · up to 6 passengers"],
    included: ["Private cab for the agreed itinerary", "Driver and fuel for the confirmed route", "Pickup and drop as agreed"],
    excluded: ["Accommodation and meals", "Entry tickets, activities and train tickets", "Tolls, parking and charges outside the confirmed quote"],
    faqs: [
      ["Can the cab take us on the toy train?", "The Nilgiri Mountain Railway is a separate train service. Cab timing can be planned around tickets you have confirmed."],
      ["Can we include Coonoor?", "Yes. Tell us your preferred stops and the team will confirm a practical route and quotation."],
    ],
    sourceLinks: [
      { label: "Incredible India · Ooty", href: "https://www.incredibleindia.gov.in/en/tamil-nadu/ooty" },
      { label: "UNESCO · Mountain Railways of India", href: "https://whc.unesco.org/en/list/944" },
    ],
  },
  {
    id: "yercaud", name: "Yercaud", shortName: "Yercaud", region: "Shevaroy Hills · Tamil Nadu",
    slug: "/tour-packages/yercaud", hero: "/tours/generated/hd/yercaud.jpg", alt: "High-definition hillside lake and green Shevaroy Hills in Yercaud",
    duration: "Suggested 2 days", durationDays: "2", category: ["Hill Station Getaways", "Family Holidays", "Weekend Trips", "Outstation Road Trips"],
    summary: "A quieter hill break with a lake, garden stops and scenic viewpoints.",
    overview: "Yercaud sits in the Shevaroy Hills and offers an easy mix of lake-side time, viewpoints, gardens and nature walks. Waterfall access and water flow can depend on rainfall and local conditions, so confirm stops close to the travel date.",
    highlights: ["Yercaud Lake", "Anna Park", "Lady’s Seat", "Kiliyur Falls", "Botanical Garden"],
    attractions: [
      { name: "Yercaud Lake", description: "A central sightseeing stop with a boat house and nearby park areas.", image: "/tours/yercaud/yercaud-lake-crop.jpg", alt: "AI-generated illustration of Yercaud Lake" },
      { name: "Lady’s Seat", description: "A hill viewpoint overlooking the Salem side of the landscape.", image: "/tours/yercaud/ladys-seat-crop.jpg", alt: "AI-generated illustration of Lady’s Seat viewpoint" },
      { name: "Pagoda Point", description: "A hillside viewpoint to include when weather and visibility allow.", image: "/tours/yercaud/pagoda-point-crop.jpg", alt: "AI-generated illustration of Pagoda Point in Yercaud" },
      { name: "Botanical Garden", description: "A quiet landscaped stop in the Yercaud hills; check local access before travelling.", image: "/tours/yercaud/botanical-garden-crop.jpg", alt: "AI-generated illustration of a Yercaud botanical garden" },
      { name: "Kiliyur Falls", description: "A waterfall visit best planned around seasonal flow and current access.", image: "/tours/yercaud/kiliyur-falls-crop.jpg", alt: "AI-generated illustration of Kiliyur Falls" },
      { name: "Shevaroy Hills", description: "Enjoy the hill scenery and countryside roads with stops planned for safe access.", image: "/tours/yercaud/shevaroy-hills-crop.jpg", alt: "AI-generated illustration of the Shevaroy Hills" },
    ],
    itinerary: [
      { day: "Day 1", title: "Chennai to Yercaud", text: "Travel to Yercaud with rest stops, then enjoy a gentle lake and town-side visit if time allows.", image: "/tours/yercaud/yercaud-lake-crop.jpg" },
      { day: "Day 2", title: "Viewpoints and return", text: "Choose from the viewpoints, garden and waterfall stops based on weather and access, then begin the return drive.", image: "/tours/yercaud/kiliyur-falls-crop.jpg" },
    ],
    suitable: ["Swift Dzire · up to 4 passengers", "Ertiga · up to 6 passengers"],
    included: ["Private cab for the agreed itinerary", "Driver and fuel for the confirmed route", "Pickup and drop as agreed"],
    excluded: ["Accommodation and meals", "Entry tickets, activities and parking", "Tolls and charges outside the confirmed quote"],
    faqs: [
      ["Is Yercaud suitable for a short break?", "The suggested plan is two days, but your actual travel time and stops depend on your dates and route."],
      ["Will Kiliyur Falls be flowing?", "Water flow is seasonal. The team can help plan an alternative nearby stop if conditions are not suitable."],
    ],
    sourceLinks: [{ label: "Salem District · Yercaud tourist places", href: "https://salem.nic.in/yercaud-tourist-places-salem/" }],
  },
  {
    id: "rameswaram", name: "Rameswaram", shortName: "Rameswaram", region: "Ramanathapuram Coast · Tamil Nadu",
    slug: "/tour-packages/rameswaram", hero: "/tours/generated/hd/rameswaram.jpg", alt: "High-definition Pamban Bridge over the turquoise sea near Rameswaram",
    duration: "Suggested 3 days", durationDays: "3", category: ["Family Holidays", "Outstation Road Trips", "Coastal Getaways"],
    summary: "A coastal pilgrimage journey with temple time, island sights and a flexible return plan.",
    overview: "Rameswaram combines a major pilgrimage site with coastal and island sightseeing. Build in time for temple visits and allow the schedule to flex around local guidance, visitor access, weather and road conditions.",
    highlights: ["Ramanathaswamy Temple", "Agni Theertham", "Pamban Bridge", "Dhanushkodi", "Dr. A.P.J. Abdul Kalam Memorial"],
    attractions: [
      { name: "Ramanathaswamy Temple", description: "A major Shiva pilgrimage shrine, known for its architecture and sacred water tanks. Follow current temple guidance for visitor access.", image: "/tours/rameswaram/ramanathaswamy-temple-crop.jpg", alt: "AI-generated illustration of Ramanathaswamy Temple" },
      { name: "Pamban Bridge", description: "The celebrated bridge links Rameswaram Island with the mainland; view access and stopping rules can change.", image: "/tours/rameswaram/pamban-bridge-crop.jpg", alt: "AI-generated illustration of Pamban Bridge" },
      { name: "Dr. A.P.J. Abdul Kalam Memorial", description: "A memorial dedicated to the former President of India. Confirm visitor timings and access before your visit.", image: "/tours/rameswaram/apj-memorial-crop.jpg", alt: "AI-generated illustration of the A.P.J. Abdul Kalam Memorial" },
      { name: "Dhanushkodi", description: "A coastal destination at the island’s edge. Check local road, weather and access advisories before setting out.", image: "/tours/rameswaram/dhanushkodi-crop.jpg", alt: "AI-generated illustration of Dhanushkodi" },
      { name: "Arichal Munai", description: "A coastal viewpoint near Dhanushkodi; access can be limited by weather and local advisories.", image: "/tours/rameswaram/arichal-munai-crop.jpg", alt: "AI-generated illustration of Arichal Munai coast" },
      { name: "Agni Theertham", description: "A beach-side pilgrimage stop beside the temple area; observe local customs and guidance.", image: "/tours/rameswaram/agni-theertham-crop.jpg", alt: "AI-generated illustration of Agni Theertham" },
    ],
    itinerary: [
      { day: "Day 1", title: "Chennai to Rameswaram", text: "Drive south with rest stops. Keep arrival evening free for rest or a short local visit.", image: "/tours/rameswaram/pamban-bridge-crop.jpg" },
      { day: "Day 2", title: "Temple and island sights", text: "Plan temple time and nearby coastal sights. Follow current temple instructions and leave flexibility for queues.", image: "/tours/rameswaram/ramanathaswamy-temple-crop.jpg" },
      { day: "Day 3", title: "Coastal visit and return", text: "If access and conditions permit, include a coastal outing before beginning the return journey.", image: "/tours/rameswaram/dhanushkodi-crop.jpg" },
    ],
    suitable: ["Swift Dzire · up to 4 passengers", "Ertiga · up to 6 passengers"],
    included: ["Private cab for the agreed itinerary", "Driver and fuel for the confirmed route", "Pickup and drop as agreed"],
    excluded: ["Accommodation and meals", "Temple donations, entry and activity charges", "Tolls, parking and charges outside the confirmed quote"],
    faqs: [
      ["Can the driver wait while we visit the temple?", "Waiting and parking arrangements depend on local rules and the agreed itinerary. The team will confirm these with your quotation."],
      ["Can we add Dhanushkodi?", "Yes, subject to current access, weather and local advisories on your travel date."],
    ],
    sourceLinks: [
      { label: "Incredible India · Sri Ramanathaswamy Temple", href: "https://www.incredibleindia.gov.in/en/tamil-nadu/rameswaram/sri-ramanathaswamy-temple" },
      { label: "Ramanathapuram District · Pamban Bridge", href: "https://ramanathapuram.nic.in/tourist-place/pamban-bridge/" },
    ],
    templeLink: true,
  },
];

for (const destination of coreDestinations) {
  destination.state = "Tamil Nadu";
  destination.region = destination.region.replace(/ · Tamil Nadu$/, "");
  for (const attraction of destination.attractions) {
    attraction.credit ||= "AI-generated illustrative artwork; not a documentary photograph";
  }
}

const makeAdditionalDestination = (spec) => {
  const image = `/tours/generated/hd/${spec.id}.jpg`;
  const destinationAttractionImages = {
    kanyakumari: ["kanyakumari-vivekananda-rock", "kanyakumari-thiruvalluvar-statue", "kanyakumari-padmanabhapuram-palace", "kanyakumari-sunrise"],
    chettinad: ["chettinad-mansions", "chettinad-palace", "chettinad-athangudi-tiles", "chettinad-karaikudi-markets"],
    hogenakkal: ["hogenakkal-falls", "hogenakkal-river-viewpoints", "hogenakkal-pennagaram-countryside", "hogenakkal-coracle"],
    courtallam: ["courtallam-main-falls", "courtallam-five-falls", "courtallam-old-falls", "courtallam-kasi-viswanathar-temple"],
    valparai: ["valparai-tea-estates", "valparai-aliyar-dam", "valparai-monkey-falls", "valparai-nallamudi-viewpoint"],
    yelagiri: ["yelagiri-punganoor-lake", "yelagiri-swamimalai-hills", "yelagiri-jalagamparai-falls", "yelagiri-nature-park"],
    munnar: ["munnar-tea-plantations", "munnar-eravikulam", "munnar-mattupetty-dam", "munnar-tea-museum"],
    kochi: ["kochi-fort-kochi", "kochi-chinese-fishing-nets", "kochi-mattancherry-palace", "kochi-jew-town"],
    alappuzha: ["alappuzha-backwaters", "alappuzha-beach", "alappuzha-kuttanad-fields", "alappuzha-marari-beach"],
    wayanad: ["wayanad-edakkal-caves", "wayanad-pookode-lake", "wayanad-banasura-dam", "wayanad-wildlife-sanctuary"],
    thekkady: ["thekkady-periyar-reserve", "thekkady-periyar-lake", "thekkady-spice-plantation", "thekkady-kumily"],
    visakhapatnam: ["visakhapatnam-rk-beach", "visakhapatnam-kailasagiri", "visakhapatnam-ins-kursura", "visakhapatnam-yarada-beach"],
    "araku-valley": ["araku-borra-caves", "araku-coffee-plantations", "araku-tribal-museum", "araku-ananthagiri-viewpoint"],
    amaravati: ["amaravati-mahachaitya", "amaravati-dhyana-buddha", "amaravati-museum", "amaravati-krishna-riverfront"],
    bengaluru: ["bengaluru-lalbagh", "bengaluru-cubbon-park", "bengaluru-palace", "bengaluru-vidhana-soudha"],
    mysuru: ["mysuru-palace", "mysuru-jaganmohan-palace", "mysuru-zoo", "mysuru-devaraja-market"],
    coorg: ["coorg-abbey-falls", "coorg-rajas-seat", "coorg-coffee-plantations", "coorg-madikeri-fort"],
    hampi: ["hampi-bazaar", "hampi-lotus-mahal", "hampi-queens-bath", "hampi-hemakuta-hill"],
    goa: ["goa-fontainhas", "goa-basilica-bom-jesus", "goa-calangute-beach", "goa-candolim-coast"],
  };
  const attractionImages = destinationAttractionImages[spec.id]?.map((filename) => `/tours/generated/attractions/${filename}.jpg`);
  const imageAlt = `AI-generated scenic illustration for ${spec.name}; representative artwork, not a documentary photograph`;
  const mahabalipuramAttractions = [
    ["Shore Temple", "Pallava-era stone shrines beside the Bay of Bengal.", "shore-temple"],
    ["Pancha Rathas", "Monolithic rock-cut monuments traditionally known as the Five Rathas.", "pancha-rathas"],
    ["Arjuna’s Penance", "An expansive open-air relief carved into two adjoining rock faces.", "arjunas-penance"],
    ["Krishna’s Butter Ball", "A large boulder balanced on a sloping rock surface.", "krishnas-butter-ball"],
    ["Mahabalipuram Beach", "A long shoreline beside the town’s historic monuments.", "beach"],
    ["Mahabalipuram Lighthouse", "A coastal viewpoint near the historic monument area.", "lighthouse"],
  ];
  const attractions = spec.id === "pondicherry" ? [
    ["French Quarter", "Pastel colonial-era streets, shaded verandas and distinctive Indo-French architecture.", "pondicherry-french-quarter"],
    ["Promenade Beach", "A scenic seafront walk along the Bay of Bengal; swimming is not advised at the rocky waterfront.", "pondicherry-promenade"],
    ["Basilica of the Sacred Heart of Jesus", "A landmark Gothic-style basilica; check service times and visitor guidance locally.", "pondicherry-basilica"],
    ["Sri Aurobindo Ashram", "A quiet spiritual centre in the city; follow the Ashram’s visitor rules and timings.", "pondicherry-ashram"],
    ["Chunnambar Boat House", "A backwater and boating stop south of town; boat services depend on operating conditions.", "pondicherry-chunnambar"],
    ["Auroville Matrimandir", "A meditation space in Auroville; visitor access requires advance planning and follows Auroville’s current rules.", "pondicherry-auroville"],
  ].map(([name, description, image]) => ({
    name,
    description,
    image: `/tours/generated/destinations/${image}.jpg`,
    alt: `AI-generated illustrative artwork for ${name}, Puducherry`,
    credit: "AI-generated illustrative artwork; verify site appearance and access locally",
  })) : spec.id === "mahabalipuram"
    ? mahabalipuramAttractions.map(([name, description, image]) => ({
      name,
      description,
      image: `/tours/mahabalipuram/${image}-crop.jpg`,
      alt: `AI-generated illustrative artwork for ${name} in Mahabalipuram`,
      credit: "AI-generated illustrative artwork; verify site appearance and access locally",
    }))
    : spec.highlights.slice(0, 4).map((name, index) => ({
      name,
      description: `A well-known ${spec.experience.toLowerCase()} stop to consider during your ${spec.name} visit. Confirm current access and local timings before travel.`,
      image: attractionImages?.[index] || image,
      alt: `AI-generated ${spec.name} destination scenery illustration`,
      credit: "AI-generated destination illustration",
    }));
  const itinerary = spec.id === "pondicherry" ? [
    { day: "Day 1", title: "French Quarter and seafront", text: "Drive to Puducherry and explore the French Quarter, Basilica and Promenade at an easy pace. Visit the Ashram according to its current visitor guidance.", image: "/tours/generated/destinations/pondicherry-french-quarter.jpg" },
    { day: "Day 2", title: "Auroville and Chunnambar", text: "Plan Auroville with advance attention to Matrimandir visitor rules, then consider Chunnambar if boat services are operating before returning to Chennai.", image: "/tours/generated/destinations/pondicherry-auroville.jpg" },
  ] : spec.id === "mahabalipuram" ? [
    { day: "Day 1", title: "Shore monuments and sculpture", text: "Explore the Shore Temple, Pancha Rathas and nearby rock-cut heritage sites. Confirm monument timings and local access before travel.", image: "/tours/mahabalipuram/pancha-rathas-crop.jpg" },
    { day: "Day 2", title: "Coastal sights and return", text: "Choose a relaxed beach-side visit and remaining town highlights before the return journey. Adjust the plan to your dates and preferred pace.", image: "/tours/mahabalipuram/beach-crop.jpg" },
  ] : [
    { day: "Day 1", title: `Travel to ${spec.name}`, text: `Drive to ${spec.name} with suitable rest breaks. Keep the arrival schedule flexible and confirm your stay separately.`, image },
    { day: "Day 2", title: "Explore local highlights", text: `Choose from ${spec.highlights.slice(0, 3).join(", ")} according to your interests and local access.`, image: attractionImages?.[0] || image },
    ...(Number(spec.durationDays) > 2 ? [{ day: "Day 3", title: "More time, easy pace", text: `Use the extra day for remaining sights or a relaxed return plan. Add days to suit your route and group.`, image: attractionImages?.[1] || image }] : []),
  ];
  return {
    ...spec,
    shortName: spec.name,
    slug: `/tour-packages/${spec.id}`,
    hero: image,
    alt: imageAlt,
    durationDays: String(spec.durationDays),
    duration: `Suggested ${spec.durationDays} days`,
    category: spec.category || ["Family Holidays", "Outstation Road Trips"],
    overview: spec.overview || `${spec.name} is a popular ${spec.experience.toLowerCase()} destination in ${spec.state}. Use this flexible outline to plan the main local highlights, with timing adjusted to your travel dates, local access and road conditions.`,
    attractions,
    itinerary,
    suitable: ["Swift Dzire · up to 4 passengers", "Ertiga · up to 6 passengers"],
    included: ["Private cab for the agreed itinerary", "Driver and fuel for the confirmed route", "Pickup and drop as agreed"],
    excluded: ["Accommodation and meals", "Entry tickets and activities", "Tolls, parking and charges outside the confirmed quote"],
    faqs: spec.faqs || [
      ["Can I change the suggested itinerary?", "Yes. Share your preferred stops and dates; the team will review the route and provide a trip-specific quotation."],
      ["Is the fare fixed on this page?", "No. The final quote depends on your travel dates, route, duration, vehicle and availability."],
    ],
  };
};

const templeFocusedIds = new Set([
  "madurai", "thanjavur", "tiruchirappalli", "kumbakonam",
  "tiruvannamalai", "kanchipuram", "chidambaram", "tirupati",
]);

export const destinations = [
  ...coreDestinations.filter((destination) => !templeFocusedIds.has(destination.id)),
  ...additionalDestinationSpecs.filter((destination) => !templeFocusedIds.has(destination.id)).map(makeAdditionalDestination),
];

export function findTourByPath(pathname) {
  const destinationPath = pathname.replace(/\/$/, "") || "/";
  if (destinationPath === "/chennai-to-kodaikanal-cab") return { destination: destinations[0], routeLanding: true };
  if (destinationPath === "/chennai-to-ooty-cab") return { destination: destinations[1], routeLanding: true };
  const destination = destinations.find((item) => item.slug === destinationPath);
  return destination ? { destination, routeLanding: false } : null;
}
