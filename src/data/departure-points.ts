// Comprehensive worldwide airports and stations database
// Format: "City - Name (Type) | Country [IATA]"

export interface DeparturePoint {
  name: string;
  city: string;
  country: string;
  code: string;
  type: "airport" | "station";
}

const DEPARTURE_POINTS: DeparturePoint[] = [
  // FRANCE
  { name: "Paris Charles de Gaulle", city: "Paris", country: "France", code: "CDG", type: "airport" },
  { name: "Paris Orly", city: "Paris", country: "France", code: "ORY", type: "airport" },
  { name: "Lyon Saint-Exupéry", city: "Lyon", country: "France", code: "LYS", type: "airport" },
  { name: "Marseille Provence", city: "Marseille", country: "France", code: "MRS", type: "airport" },
  { name: "Nice Côte d'Azur", city: "Nice", country: "France", code: "NCE", type: "airport" },
  { name: "Toulouse Blagnac", city: "Toulouse", country: "France", code: "TLS", type: "airport" },
  { name: "Bordeaux Mérignac", city: "Bordeaux", country: "France", code: "BOD", type: "airport" },
  { name: "Nantes Atlantique", city: "Nantes", country: "France", code: "NTE", type: "airport" },
  { name: "Lille Lesquin", city: "Lille", country: "France", code: "LIL", type: "airport" },
  { name: "Strasbourg Entzheim", city: "Strasbourg", country: "France", code: "SXB", type: "airport" },
  { name: "Montpellier Méditerranée", city: "Montpellier", country: "France", code: "MPL", type: "airport" },
  { name: "Rennes Bretagne", city: "Rennes", country: "France", code: "RNS", type: "airport" },
  { name: "Biarritz Pays Basque", city: "Biarritz", country: "France", code: "BIQ", type: "airport" },
  { name: "Ajaccio Napoléon Bonaparte", city: "Ajaccio", country: "France", code: "AJA", type: "airport" },
  { name: "Bastia Poretta", city: "Bastia", country: "France", code: "BIA", type: "airport" },
  // France - Gares
  { name: "Paris Gare du Nord", city: "Paris", country: "France", code: "XPG", type: "station" },
  { name: "Paris Gare de Lyon", city: "Paris", country: "France", code: "PLY", type: "station" },
  { name: "Paris Gare Montparnasse", city: "Paris", country: "France", code: "XGB", type: "station" },
  { name: "Paris Gare de l'Est", city: "Paris", country: "France", code: "XHP", type: "station" },
  { name: "Lyon Part-Dieu", city: "Lyon", country: "France", code: "XYD", type: "station" },
  { name: "Marseille Saint-Charles", city: "Marseille", country: "France", code: "XRF", type: "station" },
  { name: "Bordeaux Saint-Jean", city: "Bordeaux", country: "France", code: "XBW", type: "station" },
  { name: "Lille Europe", city: "Lille", country: "France", code: "XDB", type: "station" },
  { name: "Strasbourg Gare Centrale", city: "Strasbourg", country: "France", code: "XWG", type: "station" },

  // EUROPE
  { name: "London Heathrow", city: "Londres", country: "Royaume-Uni", code: "LHR", type: "airport" },
  { name: "London Gatwick", city: "Londres", country: "Royaume-Uni", code: "LGW", type: "airport" },
  { name: "London Stansted", city: "Londres", country: "Royaume-Uni", code: "STN", type: "airport" },
  { name: "London Luton", city: "Londres", country: "Royaume-Uni", code: "LTN", type: "airport" },
  { name: "Manchester", city: "Manchester", country: "Royaume-Uni", code: "MAN", type: "airport" },
  { name: "Edinburgh", city: "Édimbourg", country: "Royaume-Uni", code: "EDI", type: "airport" },
  { name: "Amsterdam Schiphol", city: "Amsterdam", country: "Pays-Bas", code: "AMS", type: "airport" },
  { name: "Bruxelles Zaventem", city: "Bruxelles", country: "Belgique", code: "BRU", type: "airport" },
  { name: "Bruxelles Charleroi", city: "Charleroi", country: "Belgique", code: "CRL", type: "airport" },
  { name: "Frankfurt am Main", city: "Francfort", country: "Allemagne", code: "FRA", type: "airport" },
  { name: "Munich Franz Josef Strauss", city: "Munich", country: "Allemagne", code: "MUC", type: "airport" },
  { name: "Berlin Brandenburg", city: "Berlin", country: "Allemagne", code: "BER", type: "airport" },
  { name: "Düsseldorf", city: "Düsseldorf", country: "Allemagne", code: "DUS", type: "airport" },
  { name: "Hamburg", city: "Hambourg", country: "Allemagne", code: "HAM", type: "airport" },
  { name: "Madrid Barajas", city: "Madrid", country: "Espagne", code: "MAD", type: "airport" },
  { name: "Barcelona El Prat", city: "Barcelone", country: "Espagne", code: "BCN", type: "airport" },
  { name: "Malaga Costa del Sol", city: "Malaga", country: "Espagne", code: "AGP", type: "airport" },
  { name: "Palma de Mallorca", city: "Palma", country: "Espagne", code: "PMI", type: "airport" },
  { name: "Roma Fiumicino", city: "Rome", country: "Italie", code: "FCO", type: "airport" },
  { name: "Milano Malpensa", city: "Milan", country: "Italie", code: "MXP", type: "airport" },
  { name: "Venezia Marco Polo", city: "Venise", country: "Italie", code: "VCE", type: "airport" },
  { name: "Napoli Capodichino", city: "Naples", country: "Italie", code: "NAP", type: "airport" },
  { name: "Lisboa Humberto Delgado", city: "Lisbonne", country: "Portugal", code: "LIS", type: "airport" },
  { name: "Porto Francisco Sá Carneiro", city: "Porto", country: "Portugal", code: "OPO", type: "airport" },
  { name: "Zürich", city: "Zurich", country: "Suisse", code: "ZRH", type: "airport" },
  { name: "Genève Cointrin", city: "Genève", country: "Suisse", code: "GVA", type: "airport" },
  { name: "Wien Schwechat", city: "Vienne", country: "Autriche", code: "VIE", type: "airport" },
  { name: "Dublin", city: "Dublin", country: "Irlande", code: "DUB", type: "airport" },
  { name: "København Kastrup", city: "Copenhague", country: "Danemark", code: "CPH", type: "airport" },
  { name: "Stockholm Arlanda", city: "Stockholm", country: "Suède", code: "ARN", type: "airport" },
  { name: "Oslo Gardermoen", city: "Oslo", country: "Norvège", code: "OSL", type: "airport" },
  { name: "Helsinki Vantaa", city: "Helsinki", country: "Finlande", code: "HEL", type: "airport" },
  { name: "Athina Eleftherios Venizelos", city: "Athènes", country: "Grèce", code: "ATH", type: "airport" },
  { name: "Praha Václav Havel", city: "Prague", country: "Tchéquie", code: "PRG", type: "airport" },
  { name: "Warszawa Chopin", city: "Varsovie", country: "Pologne", code: "WAW", type: "airport" },
  { name: "Budapest Ferenc Liszt", city: "Budapest", country: "Hongrie", code: "BUD", type: "airport" },
  { name: "Bucuresti Henri Coandă", city: "Bucarest", country: "Roumanie", code: "OTP", type: "airport" },
  { name: "Istanbul", city: "Istanbul", country: "Turquie", code: "IST", type: "airport" },
  { name: "Istanbul Sabiha Gökçen", city: "Istanbul", country: "Turquie", code: "SAW", type: "airport" },
  { name: "Reykjavik Keflavik", city: "Reykjavik", country: "Islande", code: "KEF", type: "airport" },
  // Europe - Gares
  { name: "London St Pancras", city: "Londres", country: "Royaume-Uni", code: "STP", type: "station" },
  { name: "Amsterdam Centraal", city: "Amsterdam", country: "Pays-Bas", code: "AMS-S", type: "station" },
  { name: "Bruxelles-Midi", city: "Bruxelles", country: "Belgique", code: "BRU-S", type: "station" },
  { name: "Frankfurt Hauptbahnhof", city: "Francfort", country: "Allemagne", code: "FRA-S", type: "station" },
  { name: "München Hauptbahnhof", city: "Munich", country: "Allemagne", code: "MUC-S", type: "station" },
  { name: "Berlin Hauptbahnhof", city: "Berlin", country: "Allemagne", code: "BER-S", type: "station" },
  { name: "Roma Termini", city: "Rome", country: "Italie", code: "FCO-S", type: "station" },
  { name: "Milano Centrale", city: "Milan", country: "Italie", code: "MXP-S", type: "station" },
  { name: "Madrid Puerta de Atocha", city: "Madrid", country: "Espagne", code: "MAD-S", type: "station" },
  { name: "Barcelona Sants", city: "Barcelone", country: "Espagne", code: "BCN-S", type: "station" },
  { name: "Zürich HB", city: "Zurich", country: "Suisse", code: "ZRH-S", type: "station" },

  // AMÉRIQUE DU NORD
  { name: "New York JFK", city: "New York", country: "États-Unis", code: "JFK", type: "airport" },
  { name: "New York Newark", city: "Newark", country: "États-Unis", code: "EWR", type: "airport" },
  { name: "New York LaGuardia", city: "New York", country: "États-Unis", code: "LGA", type: "airport" },
  { name: "Los Angeles LAX", city: "Los Angeles", country: "États-Unis", code: "LAX", type: "airport" },
  { name: "Chicago O'Hare", city: "Chicago", country: "États-Unis", code: "ORD", type: "airport" },
  { name: "Miami", city: "Miami", country: "États-Unis", code: "MIA", type: "airport" },
  { name: "San Francisco", city: "San Francisco", country: "États-Unis", code: "SFO", type: "airport" },
  { name: "Atlanta Hartsfield-Jackson", city: "Atlanta", country: "États-Unis", code: "ATL", type: "airport" },
  { name: "Dallas/Fort Worth", city: "Dallas", country: "États-Unis", code: "DFW", type: "airport" },
  { name: "Denver", city: "Denver", country: "États-Unis", code: "DEN", type: "airport" },
  { name: "Seattle-Tacoma", city: "Seattle", country: "États-Unis", code: "SEA", type: "airport" },
  { name: "Boston Logan", city: "Boston", country: "États-Unis", code: "BOS", type: "airport" },
  { name: "Las Vegas Harry Reid", city: "Las Vegas", country: "États-Unis", code: "LAS", type: "airport" },
  { name: "Washington Dulles", city: "Washington", country: "États-Unis", code: "IAD", type: "airport" },
  { name: "Honolulu Daniel K. Inouye", city: "Honolulu", country: "États-Unis", code: "HNL", type: "airport" },
  { name: "Montréal Trudeau", city: "Montréal", country: "Canada", code: "YUL", type: "airport" },
  { name: "Toronto Pearson", city: "Toronto", country: "Canada", code: "YYZ", type: "airport" },
  { name: "Vancouver", city: "Vancouver", country: "Canada", code: "YVR", type: "airport" },
  { name: "Ciudad de México Benito Juárez", city: "Mexico", country: "Mexique", code: "MEX", type: "airport" },
  { name: "Cancún", city: "Cancún", country: "Mexique", code: "CUN", type: "airport" },

  // AMÉRIQUE DU SUD
  { name: "São Paulo Guarulhos", city: "São Paulo", country: "Brésil", code: "GRU", type: "airport" },
  { name: "Rio de Janeiro Galeão", city: "Rio de Janeiro", country: "Brésil", code: "GIG", type: "airport" },
  { name: "Buenos Aires Ezeiza", city: "Buenos Aires", country: "Argentine", code: "EZE", type: "airport" },
  { name: "Santiago Arturo Merino Benítez", city: "Santiago", country: "Chili", code: "SCL", type: "airport" },
  { name: "Lima Jorge Chávez", city: "Lima", country: "Pérou", code: "LIM", type: "airport" },
  { name: "Bogotá El Dorado", city: "Bogotá", country: "Colombie", code: "BOG", type: "airport" },

  // ASIE
  { name: "Tokyo Narita", city: "Tokyo", country: "Japon", code: "NRT", type: "airport" },
  { name: "Tokyo Haneda", city: "Tokyo", country: "Japon", code: "HND", type: "airport" },
  { name: "Osaka Kansai", city: "Osaka", country: "Japon", code: "KIX", type: "airport" },
  { name: "Seoul Incheon", city: "Séoul", country: "Corée du Sud", code: "ICN", type: "airport" },
  { name: "Beijing Capital", city: "Pékin", country: "Chine", code: "PEK", type: "airport" },
  { name: "Shanghai Pudong", city: "Shanghai", country: "Chine", code: "PVG", type: "airport" },
  { name: "Hong Kong", city: "Hong Kong", country: "Chine", code: "HKG", type: "airport" },
  { name: "Singapore Changi", city: "Singapour", country: "Singapour", code: "SIN", type: "airport" },
  { name: "Bangkok Suvarnabhumi", city: "Bangkok", country: "Thaïlande", code: "BKK", type: "airport" },
  { name: "Kuala Lumpur KLIA", city: "Kuala Lumpur", country: "Malaisie", code: "KUL", type: "airport" },
  { name: "Bali Ngurah Rai", city: "Denpasar", country: "Indonésie", code: "DPS", type: "airport" },
  { name: "Jakarta Soekarno-Hatta", city: "Jakarta", country: "Indonésie", code: "CGK", type: "airport" },
  { name: "Ho Chi Minh Tan Son Nhat", city: "Ho Chi Minh", country: "Vietnam", code: "SGN", type: "airport" },
  { name: "Hanoi Noi Bai", city: "Hanoï", country: "Vietnam", code: "HAN", type: "airport" },
  { name: "Manila Ninoy Aquino", city: "Manille", country: "Philippines", code: "MNL", type: "airport" },
  { name: "New Delhi Indira Gandhi", city: "New Delhi", country: "Inde", code: "DEL", type: "airport" },
  { name: "Mumbai Chhatrapati Shivaji", city: "Mumbai", country: "Inde", code: "BOM", type: "airport" },
  { name: "Colombo Bandaranaike", city: "Colombo", country: "Sri Lanka", code: "CMB", type: "airport" },
  { name: "Kathmandu Tribhuvan", city: "Katmandou", country: "Népal", code: "KTM", type: "airport" },
  { name: "Phnom Penh", city: "Phnom Penh", country: "Cambodge", code: "PNH", type: "airport" },
  { name: "Siem Reap Angkor", city: "Siem Reap", country: "Cambodge", code: "REP", type: "airport" },

  // MOYEN-ORIENT
  { name: "Dubai", city: "Dubaï", country: "Émirats arabes unis", code: "DXB", type: "airport" },
  { name: "Abu Dhabi", city: "Abu Dhabi", country: "Émirats arabes unis", code: "AUH", type: "airport" },
  { name: "Doha Hamad", city: "Doha", country: "Qatar", code: "DOH", type: "airport" },
  { name: "Tel Aviv Ben Gourion", city: "Tel Aviv", country: "Israël", code: "TLV", type: "airport" },
  { name: "Amman Queen Alia", city: "Amman", country: "Jordanie", code: "AMM", type: "airport" },
  { name: "Muscat", city: "Mascate", country: "Oman", code: "MCT", type: "airport" },
  { name: "Beirut Rafic Hariri", city: "Beyrouth", country: "Liban", code: "BEY", type: "airport" },

  // AFRIQUE
  { name: "Casablanca Mohammed V", city: "Casablanca", country: "Maroc", code: "CMN", type: "airport" },
  { name: "Marrakech Menara", city: "Marrakech", country: "Maroc", code: "RAK", type: "airport" },
  { name: "Tunis Carthage", city: "Tunis", country: "Tunisie", code: "TUN", type: "airport" },
  { name: "Alger Houari Boumediene", city: "Alger", country: "Algérie", code: "ALG", type: "airport" },
  { name: "Le Caire", city: "Le Caire", country: "Égypte", code: "CAI", type: "airport" },
  { name: "Johannesburg O.R. Tambo", city: "Johannesburg", country: "Afrique du Sud", code: "JNB", type: "airport" },
  { name: "Cape Town", city: "Le Cap", country: "Afrique du Sud", code: "CPT", type: "airport" },
  { name: "Nairobi Jomo Kenyatta", city: "Nairobi", country: "Kenya", code: "NBO", type: "airport" },
  { name: "Dakar Blaise Diagne", city: "Dakar", country: "Sénégal", code: "DSS", type: "airport" },
  { name: "Abidjan Félix Houphouët-Boigny", city: "Abidjan", country: "Côte d'Ivoire", code: "ABJ", type: "airport" },
  { name: "Antananarivo Ivato", city: "Antananarivo", country: "Madagascar", code: "TNR", type: "airport" },
  { name: "Addis Abeba Bole", city: "Addis Abeba", country: "Éthiopie", code: "ADD", type: "airport" },
  { name: "Lagos Murtala Muhammed", city: "Lagos", country: "Nigeria", code: "LOS", type: "airport" },
  { name: "Île Maurice SSR", city: "Port Louis", country: "Île Maurice", code: "MRU", type: "airport" },

  // OCÉANIE
  { name: "Sydney Kingsford Smith", city: "Sydney", country: "Australie", code: "SYD", type: "airport" },
  { name: "Melbourne Tullamarine", city: "Melbourne", country: "Australie", code: "MEL", type: "airport" },
  { name: "Brisbane", city: "Brisbane", country: "Australie", code: "BNE", type: "airport" },
  { name: "Perth", city: "Perth", country: "Australie", code: "PER", type: "airport" },
  { name: "Auckland", city: "Auckland", country: "Nouvelle-Zélande", code: "AKL", type: "airport" },
  { name: "Papeete Faa'a", city: "Tahiti", country: "Polynésie française", code: "PPT", type: "airport" },
  { name: "Nouméa La Tontouta", city: "Nouméa", country: "Nouvelle-Calédonie", code: "NOU", type: "airport" },

  // CARAÏBES
  { name: "La Havane José Martí", city: "La Havane", country: "Cuba", code: "HAV", type: "airport" },
  { name: "Pointe-à-Pitre Pôle Caraïbes", city: "Pointe-à-Pitre", country: "Guadeloupe", code: "PTP", type: "airport" },
  { name: "Fort-de-France Aimé Césaire", city: "Fort-de-France", country: "Martinique", code: "FDF", type: "airport" },
  { name: "Saint-Denis Roland Garros", city: "Saint-Denis", country: "La Réunion", code: "RUN", type: "airport" },
  { name: "Punta Cana", city: "Punta Cana", country: "République dominicaine", code: "PUJ", type: "airport" },
];

export function searchDeparturePoints(query: string): DeparturePoint[] {
  if (query.length < 2) return [];
  const q = query.toLowerCase();
  return DEPARTURE_POINTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.country.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
  ).slice(0, 12);
}

export function formatDeparturePoint(p: DeparturePoint): string {
  const typeLabel = p.type === "airport" ? "✈️" : "🚄";
  return `${typeLabel} ${p.city} — ${p.name} [${p.code}] • ${p.country}`;
}

export default DEPARTURE_POINTS;
