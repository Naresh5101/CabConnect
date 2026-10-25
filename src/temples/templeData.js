/**
 * Temple catalogue for CabConnect Chennai.
 * Keep records unique; category membership is expressed by category IDs.
 * Tamil names are intentionally optional and only populated where an official
 * HR&CE listing was verified. No street addresses, opening hours or coordinates
 * are stored here.
 * @typedef {Object} TempleRecord
 * @property {string} id
 * @property {string} name
 * @property {string=} tamilName
 * @property {string} deity
 * @property {string} town
 * @property {string} district
 * @property {string} state
 * @property {string[]} categories
 * @property {string|null} image Local AI-generated image path, null until generated
 * @property {string} source
 */

export const templeCategories = [
  { id: "arupadai", label: "Arupadai Veedu" },
  { id: "navagraha", label: "Navagraha Temples" },
  { id: "pancha-bhoota", label: "Pancha Bhoota Sthalams" },
  { id: "navatirupathi", label: "Navatirupathi" },
  { id: "amman", label: "Amman Temples" },
  { id: "shiva", label: "Famous Shiva Temples" },
  { id: "vishnu", label: "Famous Vishnu Temples" },
  { id: "murugan", label: "Famous Murugan Temples" },
  { id: "pilgrimage", label: "Tamil Nadu Pilgrimage" },
  { id: "custom", label: "Custom Temple Tour" },
  { id: "kanchipuram", label: "Kanchipuram Temples" },
];

/** @type {TempleRecord[]} */
export const temples = [
  // Arupadai Veedu: individual HR&CE temple records.
  { id: "thiruparankundram", name: "Thiruparankundram Murugan Temple", tamilName: "திருப்பரங்குன்றம் சுப்பிரமணியசுவாமி திருக்கோயில்", deity: "Murugan (Subramania Swamy)", town: "Thiruparankundram, Madurai", district: "Madurai", state: "Tamil Nadu", categories: ["arupadai", "murugan", "pilgrimage"], image: "/images/temples/arupadai-veedu/thiruparankundram-murugan.jpg", source: "Tamil Nadu HR&CE temple record: https://thiruparankundrammurugan.hrce.tn.gov.in/" },
  { id: "tiruchendur", name: "Tiruchendur Murugan Temple", tamilName: "திருச்செந்தூர் சுப்பிரமணியசுவாமி திருக்கோயில்", deity: "Murugan (Subramania Swamy)", town: "Tiruchendur", district: "Thoothukudi", state: "Tamil Nadu", categories: ["arupadai", "murugan", "pilgrimage"], image: "/images/temples/arupadai-veedu/tiruchendur-murugan.jpg", source: "Tamil Nadu HR&CE temple record: https://tiruchendurmurugan.hrce.tn.gov.in/" },
  { id: "palani", name: "Palani Murugan Temple", tamilName: "பழனி தண்டாயுதபாணி சுவாமி திருக்கோயில்", deity: "Murugan (Dhandayuthapani Swamy)", town: "Palani", district: "Dindigul", state: "Tamil Nadu", categories: ["arupadai", "murugan", "pilgrimage"], image: "/images/temples/arupadai-veedu/palani-murugan.jpg", source: "Tamil Nadu HR&CE temple record: https://palanimurugan.hrce.tn.gov.in/" },
  { id: "swamimalai", name: "Swamimalai Murugan Temple", deity: "Murugan (Swaminathaswamy)", town: "Swamimalai, near Kumbakonam", district: "Thanjavur", state: "Tamil Nadu", categories: ["arupadai", "murugan", "pilgrimage"], image: "/images/temples/arupadai-veedu/swamimalai-murugan.jpg", source: "Tamil Nadu Tourism: https://www.tamilnadutourism.com/attractions/temples" },
  { id: "thiruthani", name: "Thiruthani Murugan Temple", deity: "Murugan (Subramaniaswamy)", town: "Thiruthani", district: "Tiruvallur", state: "Tamil Nadu", categories: ["arupadai", "murugan", "pilgrimage"], image: "/images/temples/arupadai-veedu/thiruthani-murugan.jpg", source: "Tamil Nadu HR&CE temple directory: https://hrce.tn.gov.in/" },
  { id: "pazhamudircholai", name: "Pazhamudircholai Murugan Temple", deity: "Murugan", town: "Near Madurai", district: "Madurai", state: "Tamil Nadu", categories: ["arupadai", "murugan", "pilgrimage"], image: "/images/temples/arupadai-veedu/pazhamudircholai-murugan.jpg", source: "Tamil Nadu Tourism: https://www.tamilnadutourism.com/attractions/temples" },

  // Navagraha circuit. Thirunallar is in Puducherry UT, not Tamil Nadu.
  { id: "suryanar", name: "Suryanar Kovil", deity: "Surya (Sun)", town: "Suryanar Kovil, near Kumbakonam", district: "Thanjavur", state: "Tamil Nadu", categories: ["navagraha", "pilgrimage"], image: "/images/temples/navagraha/suryanar-kovil.jpg", source: "Tamil Nadu HR&CE: https://hrce.tn.gov.in/" },
  { id: "thingalur", name: "Thingalur Kailasanathar Temple", deity: "Chandra (Moon); Shiva", town: "Thingalur", district: "Thanjavur", state: "Tamil Nadu", categories: ["navagraha", "shiva"], image: "/images/temples/navagraha/thingalur-kailasanathar.jpg", source: "Tamil Nadu Tourism: https://www.tamilnadutourism.com/attractions/temples" },
  { id: "vaitheeswaran", name: "Vaitheeswaran Koil", deity: "Shiva (Vaidyanathar); Mars association", town: "Vaitheeswarankoil", district: "Mayiladuthurai", state: "Tamil Nadu", categories: ["navagraha", "shiva", "pilgrimage"], image: "/images/temples/navagraha/vaitheeswaran-koil.jpg", source: "Tamil Nadu HR&CE: https://hrce.tn.gov.in/" },
  { id: "thiruvenkadu", name: "Thiruvenkadu Swetharanyeswarar Temple", deity: "Shiva; Mercury association", town: "Thiruvenkadu", district: "Mayiladuthurai", state: "Tamil Nadu", categories: ["navagraha", "shiva"], image: "/images/temples/navagraha/thiruvenkadu-swetharanyeswarar.jpg", source: "Tamil Nadu Tourism: https://www.tamilnadutourism.com/attractions/temples" },
  { id: "alangudi", name: "Apatsahayesvarar Temple, Alangudi", deity: "Shiva; Jupiter association", town: "Alangudi", district: "Thiruvarur", state: "Tamil Nadu", categories: ["navagraha", "shiva"], image: "/images/temples/navagraha/alangudi-apatsahayesvarar.jpg", source: "Tamil Nadu HR&CE: https://hrce.tn.gov.in/" },
  { id: "kanjanur", name: "Kanjanur Agneeswarar Temple", deity: "Shiva; Venus association", town: "Kanjanur", district: "Thanjavur", state: "Tamil Nadu", categories: ["navagraha", "shiva"], image: "/images/temples/navagraha/kanjanur-agneeswarar.jpg", source: "Tamil Nadu Tourism: https://www.tamilnadutourism.com/attractions/temples" },
  { id: "thirunallar", name: "Thirunallar Saniswaran Temple", deity: "Shani (Saturn); Shiva", town: "Thirunallar, Karaikal", district: "Karaikal", state: "Puducherry", categories: ["navagraha", "shiva"], image: "/images/temples/navagraha/thirunallar-saniswaran.jpg", source: "Puducherry Tourism: https://tourism.py.gov.in/" },
  { id: "thirunageswaram", name: "Thirunageswaram Naganathaswamy Temple", deity: "Rahu; Shiva", town: "Thirunageswaram, near Kumbakonam", district: "Thanjavur", state: "Tamil Nadu", categories: ["navagraha", "shiva"], image: "/images/temples/navagraha/thirunageswaram-naganathaswamy.jpg", source: "Tamil Nadu HR&CE: https://hrce.tn.gov.in/" },
  { id: "keezhperumpallam", name: "Keezhperumpallam Naganathaswamy Temple", deity: "Ketu; Shiva", town: "Keezhperumpallam", district: "Mayiladuthurai", state: "Tamil Nadu", categories: ["navagraha", "shiva"], image: null, source: "Tamil Nadu Tourism: https://www.tamilnadutourism.com/attractions/temples" },

  // Pancha Bhoota Sthalams: Srikalahasti is in Andhra Pradesh.
  { id: "ekambareswarar", name: "Ekambareswarar Temple", deity: "Shiva (Earth element)", town: "Kanchipuram", district: "Kanchipuram", state: "Tamil Nadu", categories: ["pancha-bhoota", "shiva", "pilgrimage", "kanchipuram"], image: null, source: "Kancheepuram District Tourism: https://kancheepuram.nic.in/tourism/places-of-interest/" },
  { id: "jambukeswarar", name: "Jambukeswarar Temple", deity: "Shiva (Water element)", town: "Thiruvanaikaval, Tiruchirappalli", district: "Tiruchirappalli", state: "Tamil Nadu", categories: ["pancha-bhoota", "shiva", "pilgrimage"], image: null, source: "Tamil Nadu Tourism: https://www.tamilnadutourism.com/tour-packages/temple-tour/panchasthala-tour" },
  { id: "arunachaleswarar", name: "Arunachaleswarar Temple", deity: "Shiva (Fire element)", town: "Tiruvannamalai", district: "Tiruvannamalai", state: "Tamil Nadu", categories: ["pancha-bhoota", "shiva", "pilgrimage"], image: null, source: "Tamil Nadu HR&CE: https://hrce.tn.gov.in/" },
  { id: "srikalahasti", name: "Srikalahasteeswara Temple", deity: "Shiva (Air element)", town: "Srikalahasti", district: "Tirupati", state: "Andhra Pradesh", categories: ["pancha-bhoota", "shiva"], image: null, source: "Tamil Nadu Tourism circuit listing: https://www.tamilnadutourism.com/tour-packages/temple-tour/panchasthala-tour" },
  { id: "chidambaram", name: "Chidambaram Nataraja Temple", deity: "Shiva (Space element)", town: "Chidambaram", district: "Cuddalore", state: "Tamil Nadu", categories: ["pancha-bhoota", "shiva", "pilgrimage"], image: null, source: "Tamil Nadu Tourism: https://www.tamilnadutourism.com/tour-packages/temple-tour/panchasthala-tour" },

  // Navatirupathi. The twin temples at Tholaivillimangalam are separate records.
  { id: "srivaikuntam", name: "Srivaikuntam Vaikuntanathar Temple", deity: "Vishnu (Vaikuntanathar)", town: "Srivaikuntam", district: "Thoothukudi", state: "Tamil Nadu", categories: ["navatirupathi", "vishnu", "pilgrimage"], image: null, source: "Tamil Nadu Tourism pilgrimage guide: https://www.tamilnadutourism.com/blog/best-pilgrimage-sites-in-tamilnadu/" },
  { id: "natham", name: "Natham Vijayasana Perumal Temple", deity: "Vishnu (Vijayasana Perumal)", town: "Natham, near Srivaikuntam", district: "Thoothukudi", state: "Tamil Nadu", categories: ["navatirupathi", "vishnu"], image: null, source: "Tamil Nadu Tourism pilgrimage guide: https://www.tamilnadutourism.com/blog/best-pilgrimage-sites-in-tamilnadu/" },
  { id: "thirupuliyangudi", name: "Thirupuliyangudi Perumal Temple", deity: "Vishnu", town: "Thirupuliyangudi", district: "Thoothukudi", state: "Tamil Nadu", categories: ["navatirupathi", "vishnu"], image: null, source: "Tamil Nadu Tourism pilgrimage guide: https://www.tamilnadutourism.com/blog/best-pilgrimage-sites-in-tamilnadu/" },
  { id: "alwarthirunagari", name: "Alwarthirunagari Adinathar Temple", deity: "Vishnu (Adinathar)", town: "Alwarthirunagari", district: "Thoothukudi", state: "Tamil Nadu", categories: ["navatirupathi", "vishnu", "pilgrimage"], image: null, source: "Tamil Nadu Tourism pilgrimage guide: https://www.tamilnadutourism.com/blog/best-pilgrimage-sites-in-tamilnadu/" },
  { id: "thenthiruperai", name: "Thenthiruperai Makara Nedunkuzhaikathar Temple", deity: "Vishnu (Makara Nedunkuzhaikathar)", town: "Thenthiruperai", district: "Thoothukudi", state: "Tamil Nadu", categories: ["navatirupathi", "vishnu"], image: null, source: "Tamil Nadu Tourism pilgrimage guide: https://www.tamilnadutourism.com/blog/best-pilgrimage-sites-in-tamilnadu/" },
  { id: "thirukolur", name: "Thirukolur Vaithamanidhi Perumal Temple", deity: "Vishnu (Vaithamanidhi Perumal)", town: "Thirukolur", district: "Thoothukudi", state: "Tamil Nadu", categories: ["navatirupathi", "vishnu"], image: null, source: "Tamil Nadu Tourism pilgrimage guide: https://www.tamilnadutourism.com/blog/best-pilgrimage-sites-in-tamilnadu/" },
  { id: "tholaivillimangalam-devapiran", name: "Tholaivillimangalam Devapiran Temple", deity: "Vishnu (Devapiran)", town: "Tholaivillimangalam", district: "Thoothukudi", state: "Tamil Nadu", categories: ["navatirupathi", "vishnu"], image: null, source: "Tamil Nadu Tourism pilgrimage guide: https://www.tamilnadutourism.com/blog/best-pilgrimage-sites-in-tamilnadu/" },
  { id: "tholaivillimangalam-aravindalochanar", name: "Tholaivillimangalam Aravindalochanar Temple", deity: "Vishnu (Aravindalochanar)", town: "Tholaivillimangalam", district: "Thoothukudi", state: "Tamil Nadu", categories: ["navatirupathi", "vishnu"], image: null, source: "Tamil Nadu Tourism pilgrimage guide: https://www.tamilnadutourism.com/blog/best-pilgrimage-sites-in-tamilnadu/" },
  { id: "perungulam", name: "Perungulam Mayakoothar Temple", deity: "Vishnu (Mayakoothar)", town: "Perungulam", district: "Thoothukudi", state: "Tamil Nadu", categories: ["navatirupathi", "vishnu"], image: null, source: "Tamil Nadu Tourism pilgrimage guide: https://www.tamilnadutourism.com/blog/best-pilgrimage-sites-in-tamilnadu/" },

  // Other frequently requested Tamil Nadu pilgrimage temples.
  { id: "meenakshi", name: "Meenakshi Amman Temple", deity: "Meenakshi (Parvati) and Sundareswarar (Shiva)", town: "Madurai", district: "Madurai", state: "Tamil Nadu", categories: ["amman", "shiva", "pilgrimage"], image: null, source: "Tamil Nadu Tourism: https://www.tamilnadutourism.com/attractions/temples" },
  { id: "kamakshi", name: "Kamakshi Amman Temple", deity: "Kamakshi (Parvati)", town: "Kanchipuram", district: "Kanchipuram", state: "Tamil Nadu", categories: ["amman", "pilgrimage", "kanchipuram"], image: null, source: "Kancheepuram District Tourism: https://kancheepuram.nic.in/tourism/places-of-interest/" },
  { id: "kailasanathar-kanchipuram", name: "Kailasanathar Temple", deity: "Shiva", town: "Kanchipuram", district: "Kanchipuram", state: "Tamil Nadu", categories: ["shiva", "pilgrimage", "kanchipuram"], image: null, source: "Kancheepuram District Tourism: https://kancheepuram.nic.in/tourism/places-of-interest/" },
  { id: "samayapuram", name: "Samayapuram Mariamman Temple", deity: "Mariamman", town: "Samayapuram, near Tiruchirappalli", district: "Tiruchirappalli", state: "Tamil Nadu", categories: ["amman", "pilgrimage"], image: null, source: "Tamil Nadu Tourism: https://www.tamilnadutourism.com/attractions/festivals/navratri" },
  { id: "kanyakumari-bhagavathy", name: "Kanyakumari Bhagavathy Amman Temple", deity: "Bhagavathy Amman", town: "Kanniyakumari", district: "Kanniyakumari", state: "Tamil Nadu", categories: ["amman", "pilgrimage"], image: null, source: "Tamil Nadu HR&CE directory: https://hrce.tn.gov.in/" },
  { id: "brihadeeswarar", name: "Brihadeeswarar Temple", deity: "Shiva (Brihadeeswarar)", town: "Thanjavur", district: "Thanjavur", state: "Tamil Nadu", categories: ["shiva", "pilgrimage"], image: null, source: "Tamil Nadu Tourism: https://www.tamilnadutourism.com/attractions/temples" },
  { id: "kapaleeswarar", name: "Kapaleeswarar Temple", deity: "Shiva (Kapaleeswarar)", town: "Mylapore, Chennai", district: "Chennai", state: "Tamil Nadu", categories: ["shiva", "pilgrimage"], image: null, source: "Tamil Nadu HR&CE directory: https://hrce.tn.gov.in/" },
  { id: "ramanathaswamy", name: "Ramanathaswamy Temple", deity: "Shiva (Ramanathaswamy)", town: "Rameswaram", district: "Ramanathapuram", state: "Tamil Nadu", categories: ["shiva", "pilgrimage"], image: null, source: "Tamil Nadu HR&CE directory: https://hrce.tn.gov.in/" },
  { id: "srirangam", name: "Sri Ranganathaswamy Temple", deity: "Vishnu (Ranganathar)", town: "Srirangam, Tiruchirappalli", district: "Tiruchirappalli", state: "Tamil Nadu", categories: ["vishnu", "pilgrimage"], image: null, source: "Tamil Nadu HR&CE directory: https://hrce.tn.gov.in/" },
  { id: "varadaraja", name: "Varadaraja Perumal Temple", deity: "Vishnu (Varadaraja Perumal)", town: "Kanchipuram", district: "Kanchipuram", state: "Tamil Nadu", categories: ["vishnu", "pilgrimage", "kanchipuram"], image: null, source: "Kancheepuram District Tourism: https://kancheepuram.nic.in/tourism/places-of-interest/" },
  { id: "vaikunta-perumal-kanchipuram", name: "Vaikunta Perumal Temple", deity: "Vishnu (Vaikunthanatha)", town: "Kanchipuram", district: "Kanchipuram", state: "Tamil Nadu", categories: ["vishnu", "pilgrimage", "kanchipuram"], image: null, source: "Kancheepuram District Tourism: https://kancheepuram.nic.in/tourism/places-of-interest/" },
  { id: "ulagalanda-perumal-kanchipuram", name: "Ulagalanda Perumal Temple", deity: "Vishnu (Trivikrama)", town: "Kanchipuram", district: "Kanchipuram", state: "Tamil Nadu", categories: ["vishnu", "pilgrimage", "kanchipuram"], image: null, source: "Kancheepuram District Tourism: https://kancheepuram.nic.in/tourism/places-of-interest/" },
  { id: "kumarakottam-kanchipuram", name: "Kumarakottam Murugan Temple", deity: "Murugan (Subramania Swamy)", town: "Kanchipuram", district: "Kanchipuram", state: "Tamil Nadu", categories: ["murugan", "pilgrimage", "kanchipuram"], image: null, source: "Kancheepuram District Tourism: https://kancheepuram.nic.in/tourism/places-of-interest/" },
  { id: "marudamalai", name: "Marudamalai Murugan Temple", deity: "Murugan (Subramania Swamy)", town: "Marudamalai, Coimbatore", district: "Coimbatore", state: "Tamil Nadu", categories: ["murugan", "pilgrimage"], image: null, source: "Tamil Nadu HR&CE directory: https://hrce.tn.gov.in/" },
];

export const catalogueNote = "Catalogue is an initial curated list, not an official itinerary. Categories can overlap. Names and groupings should be reconfirmed with temple authorities before travel; no opening hours, exact street addresses or coordinates are provided.";
