window.ROVE_SITE = {
  name: "Rove India",
  tagline: "Discover Indian Tourist Places Through Curated Videos",
  description:
    "Rove India is a static tourism showcase where each state and union territory has curated videos, image highlights, and quick travel context.",
  baseUrl: "https://www.roveindia.in",
  themeColor: "#8f4f2f",
  analytics: {
    ga4Id: "",
    clarityId: ""
  },
  sync: {
    enabled: false,
    readUrl: "",
    writeUrl: "",
    method: "PUT",
    authHeader: "",
    authToken: "",
    requestTimeoutMs: 8000
  },
  storagePrefix: "rove_india_v3"
};

window.ROVE_PLACES = [
  { name: "Andhra Pradesh", file: "State List/Andhra Pradesh.html", type: "State", region: "South", vibe: "Temples and coast", season: "October to March" },
  { name: "Arunachal Pradesh", file: "State List/Arunachal Pradesh.html", type: "State", region: "Northeast", vibe: "Mountains and monasteries", season: "October to April" },
  { name: "Assam", file: "State List/Assam.html", type: "State", region: "Northeast", vibe: "Tea gardens and wildlife", season: "November to April" },
  { name: "Bihar", file: "State List/Bihar.html", type: "State", region: "East", vibe: "Sacred circuits and heritage", season: "October to March" },
  { name: "Chhattisgarh", file: "State List/Chattisgarh.html", type: "State", region: "Central", vibe: "Waterfalls and tribal culture", season: "October to February" },
  { name: "Goa", file: "State List/Goa.html", type: "State", region: "West", vibe: "Beaches and nightlife", season: "November to February" },
  { name: "Gujarat", file: "State List/Gujrat.html", type: "State", region: "West", vibe: "White desert and heritage towns", season: "November to February" },
  { name: "Haryana", file: "State List/Harayana.html", type: "State", region: "North", vibe: "Rural culture and urban edge", season: "October to March" },
  { name: "Himachal Pradesh", file: "State List/Himacahal Pradesh.html", type: "State", region: "North", vibe: "Hills and adventure", season: "March to June" },
  { name: "Jharkhand", file: "State List/Jharkhand.html", type: "State", region: "East", vibe: "Forests and hidden falls", season: "October to March" },
  { name: "Karnataka", file: "State List/Karnataka.html", type: "State", region: "South", vibe: "Coast, coffee, and heritage", season: "October to March" },
  { name: "Kerala", file: "State List/Kerala.html", type: "State", region: "South", vibe: "Backwaters and wellness", season: "September to March" },
  { name: "Madhya Pradesh", file: "State List/Madhya Pradesh.html", type: "State", region: "Central", vibe: "Wildlife and monuments", season: "October to March" },
  { name: "Maharashtra", file: "State List/Maharashtra.html", type: "State", region: "West", vibe: "Forts, cities, and coast", season: "October to February" },
  { name: "Manipur", file: "State List/Manipur.html", type: "State", region: "Northeast", vibe: "Lakes and dance culture", season: "October to April" },
  { name: "Meghalaya", file: "State List/Meghalaya.html", type: "State", region: "Northeast", vibe: "Cloud valleys and caves", season: "October to April" },
  { name: "Mizoram", file: "State List/Mizoram.html", type: "State", region: "Northeast", vibe: "Hills and calm retreats", season: "October to March" },
  { name: "Nagaland", file: "State List/Nagaland.html", type: "State", region: "Northeast", vibe: "Festivals and highland views", season: "October to May" },
  { name: "Odisha", file: "State List/Odisha.html", type: "State", region: "East", vibe: "Temples and beaches", season: "October to March" },
  { name: "Punjab", file: "State List/Punjab.html", type: "State", region: "North", vibe: "Food and vibrant culture", season: "October to March" },
  { name: "Rajasthan", file: "State List/Rajasthan.html", type: "State", region: "North", vibe: "Deserts and royal forts", season: "October to March" },
  { name: "Sikkim", file: "State List/Sikkim.html", type: "State", region: "Northeast", vibe: "Mountain monasteries", season: "March to June" },
  { name: "Tamil Nadu", file: "State List/TamilNadu.html", type: "State", region: "South", vibe: "Temple architecture and coast", season: "November to March" },
  { name: "Telangana", file: "State List/Telangana.html", type: "State", region: "South", vibe: "Deccan heritage and cuisine", season: "October to March" },
  { name: "Tripura", file: "State List/Tripura.html", type: "State", region: "Northeast", vibe: "Palaces and green valleys", season: "October to March" },
  { name: "Uttar Pradesh", file: "State List/Uttar Pradesh.html", type: "State", region: "North", vibe: "Spiritual and cultural circuit", season: "October to March" },
  { name: "Uttarakhand", file: "State List/Uttarakhand.html", type: "State", region: "North", vibe: "Pilgrimage and mountains", season: "March to June" },
  { name: "West Bengal", file: "State List/West Bengal.html", type: "State", region: "East", vibe: "Culture, hills, and mangroves", season: "October to March" },
  { name: "Andaman and Nicobar Islands", file: "State List/Andaman and Nicobar Islands.html", type: "Union Territory", region: "Islands", vibe: "Turquoise beaches and diving", season: "November to May" },
  { name: "Chandigarh", file: "State List/Chandigarh.html", type: "Union Territory", region: "North", vibe: "Planned city and gardens", season: "October to March" },
  { name: "Dadra and Nagar Haveli", file: "State List/Dadra & Nagar Haveli.html", type: "Union Territory", region: "West", vibe: "River islands and nature parks", season: "October to March" },
  { name: "Daman and Diu", file: "State List/Daman & Diu.html", type: "Union Territory", region: "West", vibe: "Forts and beach promenade", season: "October to March" },
  { name: "Delhi", file: "State List/Delhi.html", type: "Union Territory", region: "North", vibe: "Monuments and modern city life", season: "October to March" },
  { name: "Jammu and Kashmir", file: "State List/Jammu and Kashmir.html", type: "Union Territory", region: "North", vibe: "Valleys and alpine lakes", season: "April to October" },
  { name: "Lakshadweep", file: "State List/Lakshadweep.html", type: "Union Territory", region: "Islands", vibe: "Coral reefs and lagoons", season: "October to March" },
  { name: "Puducherry", file: "State List/Puducherry.html", type: "Union Territory", region: "South", vibe: "French quarter and sea views", season: "October to March" },
  { name: "Ladakh", file: "State List/Ladakh.html", type: "Union Territory", region: "North", vibe: "High-altitude passes", season: "May to September" }
];

window.ROVE_FEATURED_DESTINATIONS = [
  {
    name: "Rajasthan",
    file: "State List/Rajasthan.html",
    title: "Royal Heritage Trail",
    description: "Forts, palaces, and desert experiences with cultural performances."
  },
  {
    name: "Kerala",
    file: "State List/Kerala.html",
    title: "Backwater Wellness Route",
    description: "Slow travel through backwaters, Ayurveda, and coastal cuisine."
  },
  {
    name: "Meghalaya",
    file: "State List/Meghalaya.html",
    title: "Cloud Valley Escape",
    description: "Living root bridges, caves, and dramatic monsoon landscapes."
  },
  {
    name: "Ladakh",
    file: "State List/Ladakh.html",
    title: "Highland Adventure",
    description: "Mountain passes, monasteries, and unforgettable road journeys."
  }
];

window.ROVE_FESTIVAL_SPOTLIGHTS = [
  {
    festival: "Navratri",
    season: "September - October",
    focus: "Gujarat",
    idea: "Garba nights, local food walks, and heritage city trails."
  },
  {
    festival: "Durga Puja",
    season: "September - October",
    focus: "West Bengal",
    idea: "Pandal trails, art installations, and street food circuits."
  },
  {
    festival: "Onam",
    season: "August - September",
    focus: "Kerala",
    idea: "Boat races, floral decor, and traditional sadya experiences."
  },
  {
    festival: "Hornbill Festival",
    season: "December",
    focus: "Nagaland",
    idea: "Tribal performances, crafts, and mountain culture showcases."
  }
];

window.ROVE_REGIONS = ["All", "North", "South", "East", "West", "Central", "Northeast", "Islands"];
