// Curated country knowledge for students (Erasmus, internships, exchanges).
// Injected into AI prompts when the destination matches a country below.
// Facts are general guidance (2026); official sources must always be checked.

interface CountryFacts {
  names: string[]; // lowercase aliases (FR/EN, main cities)
  fr: string;
  en: string;
}

const C: CountryFacts[] = [
  {
    names: ["états-unis", "etats-unis", "usa", "united states", "new york", "los angeles", "san francisco", "chicago", "miami", "boston"],
    fr: "ÉTATS-UNIS — Hors UE. Formalités : ESTA pour un séjour touristique ≤ 90 jours (pas de travail, pas de stage rémunéré) ; stage ou études = visa J-1 (stage, sponsor + formulaire DS-2019) ou F-1 (études, formulaire I-20), entretien au consulat, frais SEVIS. Passeport biométrique valide. Santé : soins extrêmement chers, assurance santé internationale obligatoire de fait (et exigée pour le J-1). Budget étudiant : très élevé — loyer en colocation 900-2000 $/mois selon la ville (NYC, SF les plus chères), repas 15-25 $, pourboire 18-20 % attendu, taxes ajoutées en caisse. Pratique : prise type A/B 120 V (adaptateur), carte bancaire partout, voiture souvent indispensable hors grandes villes, numéro d'urgence 911. Culture : ponctualité, small talk, alcool interdit avant 21 ans, pièce d'identité demandée souvent.",
    en: "UNITED STATES — Non-EU. Paperwork: ESTA for tourism ≤ 90 days (no work, no paid internship); internships/studies need a J-1 (sponsor + DS-2019) or F-1 (I-20) visa, consulate interview, SEVIS fee. Health: very expensive care, international health insurance essential (required for J-1). Student budget: very high — shared rent $900-2000/month, meals $15-25, 18-20% tips expected, sales tax added at checkout. Practical: type A/B plugs 120 V, cards everywhere, car often needed outside big cities, emergency 911. Culture: punctuality, small talk, drinking age 21, ID often checked.",
  },
  {
    names: ["brésil", "bresil", "brazil", "rio", "são paulo", "sao paulo", "salvador", "florianópolis", "florianopolis"],
    fr: "BRÉSIL — Hors UE. Formalités : Français exemptés de visa pour le tourisme ≤ 90 jours ; études ou stage = visa temporaire (VITEM) via le consulat, puis enregistrement à la Police fédérale à l'arrivée (CRNM). Santé : vaccin fièvre jaune recommandé selon les régions, moustiques (dengue) ; assurance santé conseillée. Budget étudiant : modéré — colocation 1500-3500 R$/mois à São Paulo/Rio, repas « prato feito » 25-40 R$. Le Pix (paiement instantané) est partout. Sécurité : vigilance réelle dans les grandes villes (téléphone discret, Uber le soir, éviter certaines favelas sans guide). Pratique : langue portugaise (peu d'anglais), prises type N, urgences 190 (police) / 192 (SAMU). Culture : chaleureuse, bises, retard toléré.",
    en: "BRAZIL — Non-EU. Paperwork: French citizens visa-free for tourism ≤ 90 days; studies/internships need a temporary visa (VITEM) then Federal Police registration (CRNM) on arrival. Health: yellow fever vaccine recommended in some regions, dengue mosquitoes; insurance advised. Student budget: moderate — shared rent R$1500-3500/month in São Paulo/Rio, set meal R$25-40. Pix instant payment everywhere. Safety: real caution in big cities (hide phone, Uber at night). Practical: Portuguese (little English), type N plugs, emergency 190 police / 192 ambulance. Culture: warm, flexible with time.",
  },
  {
    names: ["mexique", "mexico", "méxico", "ciudad de méxico", "guadalajara", "oaxaca", "cancún", "cancun", "monterrey"],
    fr: "MEXIQUE — Hors UE. Formalités : Français sans visa pour le tourisme ≤ 180 jours (durée décidée à la frontière) ; stage ou études > 180 jours = visa de résident temporaire étudiant via le consulat, puis carte à l'INM sous 30 jours. Santé : eau du robinet non potable, moustiques (dengue) ; assurance conseillée. Budget étudiant : abordable — colocation 5000-10000 MXN/mois à Mexico, tacos 15-30 MXN pièce, comida corrida 80-150 MXN. Sécurité : variable selon les États (consulter les conseils aux voyageurs), taxis d'application (Uber/DiDi). Altitude à Mexico (2240 m). Pratique : espagnol, prises type A/B, urgences 911, pourboire ~10-15 %. Culture : politesse, « ahorita » élastique.",
    en: "MEXICO — Non-EU. Paperwork: French visa-free for tourism ≤ 180 days (set at border); studies/internships > 180 days need a temporary resident student visa then INM card within 30 days. Health: no tap water, dengue mosquitoes; insurance advised. Student budget: affordable — shared rent MXN 5000-10000/month in CDMX, tacos MXN 15-30 each, set lunch MXN 80-150. Safety: varies by state, use ride apps. Mexico City altitude 2240 m. Practical: Spanish, type A/B plugs, emergency 911, tip ~10-15%.",
  },
  {
    names: ["japon", "japan", "tokyo", "kyoto", "osaka", "fukuoka", "sapporo", "nagoya"],
    fr: "JAPON — Hors UE. Formalités : Français sans visa pour le tourisme ≤ 90 jours ; études = visa étudiant avec Certificate of Eligibility fourni par l'université ; stage = visa adapté selon le type (designated activities) ; visa vacances-travail possible pour les 18-30 ans. Inscription à la mairie et assurance nationale (NHI) obligatoires pour un long séjour. Budget étudiant : moyen à élevé — chambre/share house 50000-90000 ¥/mois à Tokyo, repas konbini 500-800 ¥, ramen 900-1300 ¥. Pratique : beaucoup de paiement en liquide encore, carte Suica/Pasmo pour les transports, prises type A 100 V, urgences 110 (police) / 119 (ambulance). Culture : silence dans les transports, pas de pourboire, chaussures retirées à l'intérieur, tri des déchets strict.",
    en: "JAPAN — Non-EU. Paperwork: French visa-free ≤ 90 days; studies need a student visa with a Certificate of Eligibility from the university; internships need the matching visa; working holiday for ages 18-30. City hall registration and national health insurance (NHI) required for long stays. Student budget: medium-high — room/share house ¥50,000-90,000/month in Tokyo, konbini meal ¥500-800, ramen ¥900-1300. Practical: cash still common, Suica/Pasmo cards, type A plugs 100 V, emergency 110 police / 119 ambulance. Culture: quiet on trains, no tipping, shoes off indoors, strict waste sorting.",
  },
  {
    names: ["pays-bas", "pays bas", "netherlands", "holland", "hollande", "amsterdam", "rotterdam", "utrecht", "la haye", "the hague", "eindhoven", "groningen", "leiden", "delft"],
    fr: "PAYS-BAS — UE/Schengen : carte d'identité suffit, pas de visa ni permis pour les Européens. Long séjour > 4 mois : inscription à la mairie (BSN, numéro indispensable pour banque, travail, santé). Santé : carte européenne d'assurance maladie (CEAM) ; si job/stage rémunéré, assurance néerlandaise obligatoire. Logement : LE gros défi — pénurie sévère, chercher plusieurs mois avant, chambre 500-1000 €/mois (Amsterdam le plus cher), attention aux arnaques (ne jamais payer sans visite/contrat). Budget : courses ~250 €/mois, vélo indispensable (occasion 80-150 €). Pratique : carte bancaire partout (Maestro/débit, parfois pas de Visa crédit), OV-chipkaart pour les transports, anglais parlé partout, urgences 112. Culture : franchise directe, agenda planifié.",
    en: "NETHERLANDS — EU/Schengen: ID card enough for Europeans. Stays > 4 months: city hall registration (BSN number needed for bank, work, health). Health: EHIC; paid job/internship requires Dutch insurance. Housing is THE challenge — severe shortage, search months ahead, room €500-1000/month, beware scams. Budget: groceries ~€250/month, bike essential (used €80-150). Practical: debit cards (credit cards sometimes refused), OV-chipkaart, English everywhere, emergency 112. Culture: very direct, planned schedules.",
  },
  {
    names: ["espagne", "spain", "españa", "madrid", "barcelone", "barcelona", "valence", "valencia", "séville", "seville", "sevilla", "grenade", "granada", "bilbao", "malaga", "málaga", "salamanque", "salamanca"],
    fr: "ESPAGNE — UE/Schengen : carte d'identité suffit. Séjour > 3 mois : demander le NIE / certificat d'enregistrement de citoyen UE (rendez-vous « cita previa » à prendre tôt, souvent saturé). Santé : CEAM. Budget étudiant : modéré — chambre en colocation 350-700 €/mois (Madrid/Barcelone plus cher), menu del día 12-16 €, carte jeune transports à prix réduit à Madrid. Pratique : horaires décalés (déjeuner 14h, dîner 21-22h), prises type F, urgences 112, pickpockets à Barcelone (Rambla, métro). Culture : vie dehors, bises, langues régionales (catalan à Barcelone/Valence, basque à Bilbao) parfois utilisées dans les cours.",
    en: "SPAIN — EU/Schengen: ID card enough. Stays > 3 months: get the NIE / EU registration certificate (book the cita previa early). Health: EHIC. Student budget: moderate — shared room €350-700/month, menú del día €12-16. Practical: late meal times (lunch 2pm, dinner 9-10pm), type F plugs, emergency 112, pickpockets in Barcelona. Culture: outdoor life, regional languages (Catalan, Basque) sometimes used in classes.",
  },
  {
    names: ["australie", "australia", "sydney", "melbourne", "brisbane", "perth", "adelaide", "cairns"],
    fr: "AUSTRALIE — Hors UE. Formalités : eVisitor (gratuit, tourisme ≤ 3 mois) ; études = Student visa (subclass 500) avec assurance OSHC obligatoire ; Working Holiday Visa (subclass 417) pour les 18-35 ans, idéal pour stages/jobs. Budget étudiant : élevé — chambre 250-450 AUD/semaine (loyers à la semaine), repas 18-30 AUD, salaire minimum élevé. Pratique : conduite à gauche, prises type I 230 V, TFN (numéro fiscal) pour travailler, urgences 000. Santé/nature : soleil très fort (crème, chapeau), baignade uniquement entre les drapeaux, faune à respecter. Saisons inversées (été en décembre). Culture : décontractée, tutoiement facile, pourboire non obligatoire.",
    en: "AUSTRALIA — Non-EU. Paperwork: eVisitor (free, tourism ≤ 3 months); studies = Student visa (subclass 500) with mandatory OSHC insurance; Working Holiday (417) for ages 18-35. Student budget: high — room AUD 250-450/week, meals AUD 18-30. Practical: drive on the left, type I plugs, TFN to work, emergency 000. Strong sun, swim between the flags, reversed seasons. Culture: relaxed, tipping optional.",
  },
  {
    names: ["allemagne", "germany", "deutschland", "berlin", "munich", "münchen", "hambourg", "hamburg", "cologne", "köln", "francfort", "frankfurt", "leipzig", "heidelberg", "stuttgart"],
    fr: "ALLEMAGNE — UE/Schengen : carte d'identité suffit. Obligation de s'enregistrer à la mairie (Anmeldung) dans les 14 jours après emménagement — indispensable pour banque, contrat de téléphone, etc. Santé : CEAM pour les études ; stage rémunéré = assurance allemande (Krankenkasse). Budget étudiant : modéré — chambre en WG 350-700 €/mois (Munich le plus cher, Leipzig moins), repas à la Mensa 3-5 €, Deutschlandticket ~58 €/mois pour tous les transports régionaux (souvent inclus dans le Semesterticket). Pratique : liquide encore fréquent, dimanche tout fermé, consigne (Pfand) sur les bouteilles, prises type F, urgences 112. Culture : ponctualité, vouvoiement (Sie) par défaut, tri des déchets.",
    en: "GERMANY — EU/Schengen: ID card enough. City hall registration (Anmeldung) within 14 days of moving in — needed for bank, phone, etc. Health: EHIC for studies; paid internship = German insurance. Student budget: moderate — shared flat (WG) €350-700/month, Mensa meal €3-5, Deutschlandticket ~€58/month (often in Semesterticket). Practical: cash still common, shops closed Sunday, bottle deposit (Pfand), type F plugs, emergency 112. Culture: punctuality, formal 'Sie' by default.",
  },
  {
    names: ["pologne", "poland", "polska", "varsovie", "warsaw", "warszawa", "cracovie", "krakow", "kraków", "wroclaw", "wrocław", "gdansk", "gdańsk", "poznan", "poznań", "lodz", "łódź"],
    fr: "POLOGNE — UE/Schengen : carte d'identité suffit. Séjour > 3 mois : enregistrement du séjour au bureau de la voïvodie ; numéro PESEL utile (santé, banque). Santé : CEAM. Monnaie : zloty (PLN), pas l'euro. Budget étudiant : abordable — chambre 1200-2500 PLN/mois (Varsovie plus cher), repas au « bar mleczny » 20-35 PLN, réductions étudiantes fortes (≈50 % transports avec carte étudiante polonaise ou ISIC selon les cas). Pratique : paiement par carte et BLIK partout, prises type E, hivers froids (-10 °C possible), urgences 112. Culture : accueillante, catholicisme présent, jours fériés religieux respectés, anglais courant chez les jeunes.",
    en: "POLAND — EU/Schengen: ID card enough. Stays > 3 months: register residence at the voivodeship office; PESEL number useful. Health: EHIC. Currency: zloty (PLN). Student budget: affordable — room PLN 1200-2500/month, milk bar meal PLN 20-35, strong student discounts. Practical: cards and BLIK everywhere, type E plugs, cold winters, emergency 112. Culture: welcoming, English common among young people.",
  },
  {
    names: ["suisse", "switzerland", "schweiz", "genève", "geneve", "geneva", "zurich", "zürich", "lausanne", "berne", "bern", "bâle", "basel"],
    fr: "SUISSE — Hors UE mais Schengen et libre circulation pour les Européens : carte d'identité suffit. Séjour > 3 mois : s'annoncer à la commune et obtenir un permis (L ou B) ; assurance maladie suisse OBLIGATOIRE dans les 3 mois (dispense possible pour étudiants avec CEAM, à demander). Monnaie : franc suisse (CHF). Budget étudiant : très élevé — chambre 700-1200 CHF/mois (Genève/Zurich), repas 20-30 CHF, cuisiner soi-même indispensable ; abonnement demi-tarif CFF conseillé. Salaire minimum légal à Genève (stages encadrés par la convention). Pratique : prises type J (adaptateur spécifique), urgences 112/117/144, ponctualité absolue, tri très strict (sacs taxés). Langues : français, allemand, italien selon les cantons.",
    en: "SWITZERLAND — Non-EU but Schengen with free movement for Europeans: ID card enough. Stays > 3 months: register with the commune and get a permit (L or B); Swiss health insurance MANDATORY within 3 months (student exemption with EHIC on request). Currency: CHF. Student budget: very high — room CHF 700-1200/month, meals CHF 20-30, cook yourself; SBB Half Fare card advised. Practical: type J plugs, emergency 112/117/144, strict punctuality and waste sorting. Languages: French, German, Italian by canton.",
  },
];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Returns a prompt snippet with curated country facts, or "" when no match. */
export function countryContext(destination: string | null | undefined, locale: "fr" | "en" | string = "fr"): string {
  if (!destination) return "";
  const d = norm(String(destination));
  const hit = C.find((c) => c.names.some((n) => {
    const k = norm(n);
    return new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(d);
  }));
  if (!hit) return "";
  const en = locale === "en";
  const head = en
    ? "== XPLANIA COUNTRY FACTS (reliable base for students; use them, stay consistent, remind to check official sources for visas) =="
    : "== FICHE PAYS XPLANIA (base fiable pour étudiants ; utilise-la, reste cohérent, rappelle de vérifier les sources officielles pour les visas) ==";
  return `\n\n${head}\n${en ? hit.en : hit.fr}`;
}
