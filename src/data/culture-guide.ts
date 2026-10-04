// Cultural immersion guide — pillar config + pre-written country sheets (free, no AI).
// Pillar order/list can be changed here only.
export const CULTURE_PILLARS = [
  { id: "greetings", emoji: "👋" },
  { id: "food", emoji: "🍽️" },
  { id: "social", emoji: "🤝" },
  { id: "dress", emoji: "👕" },
  { id: "gestures", emoji: "🙌" },
  { id: "language", emoji: "💬" },
  { id: "values", emoji: "🕊️", sensitive: true },
  { id: "calendar", emoji: "📅" },
  { id: "sociallife", emoji: "🎉", sensitive: true },
  { id: "work", emoji: "🎓" },
  { id: "popculture", emoji: "🎬" },
  { id: "shock", emoji: "🌀" },
] as const;
export type PillarId = (typeof CULTURE_PILLARS)[number]["id"];

type L = { fr: string; en: string };
export interface Tip { text: string; why: string; severity?: "low" | "medium" | "high" }
export interface PillarContent { ping: string; dos: Tip[]; donts: Tip[]; homeVsHere: string[] }
interface RawTip { text: L; why: L; severity?: "low" | "medium" | "high" }
interface RawPillar { ping: L; dos: RawTip[]; donts: RawTip[]; homeVsHere: L[] }

const l = (fr: string, en: string): L => ({ fr, en });
const tip = (tf: string, te: string, wf: string, we: string, severity?: Tip["severity"]): RawTip => ({ text: l(tf, te), why: l(wf, we), severity });

const SHEETS: Record<string, Partial<Record<PillarId, RawPillar>>> = {
  GB: {
    social: {
      ping: l("Ici, la file d'attente est presque sacrée !", "Here, queuing is almost sacred!"),
      dos: [tip("Faire la queue patiemment, partout", "Queue patiently, everywhere", "C'est une marque de respect de l'ordre d'arrivée.", "It shows respect for who came first."),
        tip("Dire « sorry » et « cheers » souvent", "Say “sorry” and “cheers” often", "Ces petits mots adoucissent toutes les interactions.", "These little words soften every interaction.")],
      donts: [tip("Doubler dans une file", "Jump a queue", "C'est très mal vu, même si personne ne dira rien.", "It's frowned upon, even if nobody says a word.", "medium"),
        tip("Parler fort dans les transports", "Talk loudly on public transport", "Le calme y est la norme.", "Quiet is the norm there.", "low")],
      homeVsHere: [l("En France on peut râler ouvertement ; ici on reste poli et on suggère avec humour.", "In France people complain openly; here you stay polite and hint with humour.")],
    },
    food: {
      ping: l("Au pub, chacun paie sa tournée à tour de rôle.", "At the pub, everyone buys a round in turn."),
      dos: [tip("Participer aux « rounds » au pub", "Join in the rounds at the pub", "Ne pas payer sa tournée peut paraître radin.", "Skipping your round can look stingy."),
        tip("Commander au comptoir dans un pub", "Order at the bar in a pub", "Il n'y a souvent pas de service à table.", "There's often no table service.")],
      donts: [tip("Attendre qu'on vienne prendre la commande au pub", "Wait for table service at the pub", "Tu risques d'attendre longtemps !", "You might wait a long time!", "low")],
      homeVsHere: [l("En France le dîner est vers 20 h ; ici on dîne souvent dès 18 h–19 h.", "In France dinner is around 8 pm; here it's often 6–7 pm.")],
    },
    greetings: {
      ping: l("Une poignée de main ou un simple « hi » suffit.", "A handshake or a simple “hi” is enough."),
      dos: [tip("Serrer la main lors d'une première rencontre", "Shake hands when you first meet", "C'est la salutation neutre et sûre.", "It's the safe, neutral greeting.")],
      donts: [tip("Faire la bise à quelqu'un qu'on connaît peu", "Kiss on the cheek someone you barely know", "Ça peut mettre mal à l'aise.", "It can make people uncomfortable.", "low")],
      homeVsHere: [l("« How are you? » n'est pas une vraie question : réponds « Fine, thanks, you? ».", "“How are you?” isn't a real question: answer “Fine, thanks, you?”.")],
    },
  },
  US: {
    food: {
      ping: l("Le pourboire fait partie du salaire du serveur.", "Tips are part of the server's wage."),
      dos: [tip("Laisser 15–20 % de pourboire au restaurant", "Leave a 15–20% tip at restaurants", "Les serveurs vivent en grande partie des pourboires.", "Servers rely largely on tips."),
        tip("Demander un « doggy bag » sans gêne", "Ask for a “to-go box” freely", "Les portions sont grandes, c'est tout à fait normal.", "Portions are big, it's totally normal.")],
      donts: [tip("Ne pas laisser de pourboire", "Leave no tip", "C'est perçu comme une critique du service.", "It's read as a complaint about the service.", "medium")],
      homeVsHere: [l("En France le service est inclus ; aux États-Unis le pourboire fait partie du salaire.", "In France service is included; in the US the tip is part of the wage.")],
    },
    greetings: {
      ping: l("Sourire et enthousiasme sont la norme !", "Smiles and enthusiasm are the norm!"),
      dos: [tip("Sourire et répondre avec énergie", "Smile and answer with energy", "La chaleur est attendue, même avec des inconnus.", "Warmth is expected, even with strangers.")],
      donts: [tip("Faire la bise", "Kiss on the cheek", "On préfère la poignée de main ou le « hug » entre amis.", "Handshakes, or hugs among friends, are preferred.", "low")],
      homeVsHere: [l("En France on peut sembler réservé ; ici le small talk est un signe de politesse.", "In France people may seem reserved; here small talk is a sign of politeness.")],
    },
    social: {
      ping: l("Ici, l'espace personnel compte beaucoup.", "Personal space matters a lot here."),
      dos: [tip("Respecter une certaine distance physique", "Keep some physical distance", "L'espace personnel est important.", "Personal space is important."),
        tip("Être ponctuel aux rendez-vous", "Be on time for appointments", "Le temps est considéré comme précieux.", "Time is considered valuable.")],
      donts: [tip("Aborder la politique ou la religion avec des inconnus", "Bring up politics or religion with strangers", "Ce sont des sujets sensibles.", "These are sensitive topics.", "medium")],
      homeVsHere: [l("Le « tu » n'existe pas : tout le monde s'appelle par son prénom.", "Everyone uses first names, even at work.")],
    },
  },
  MX: {
    greetings: {
      ping: l("Saluer tout le monde en arrivant, c'est essentiel.", "Greeting everyone when you arrive is essential."),
      dos: [tip("Dire « buenos días » à chaque personne", "Say “buenos días” to each person", "Ignorer quelqu'un peut paraître froid.", "Ignoring someone can seem cold."),
        tip("Utiliser « usted » avec les aînés", "Use “usted” with elders", "C'est une marque de respect.", "It's a sign of respect.")],
      donts: [tip("Entrer dans une pièce sans saluer", "Enter a room without greeting", "C'est perçu comme impoli.", "It's seen as rude.", "medium")],
      homeVsHere: [l("Comme en France on peut se faire la bise, mais une seule.", "Like in France you may kiss on the cheek, but only once.")],
    },
    values: {
      ping: l("Le Día de Muertos est une fête profonde et respectée.", "Día de Muertos is a deep, respected celebration."),
      dos: [tip("Découvrir les autels (ofrendas) avec curiosité et respect", "Discover the altars (ofrendas) with curiosity and respect", "Ils honorent les défunts de la famille.", "They honour the family's departed.")],
      donts: [tip("Traiter le Día de Muertos comme Halloween", "Treat Día de Muertos like Halloween", "C'est une tradition familiale et spirituelle.", "It's a family and spiritual tradition.", "high")],
      homeVsHere: [l("En France la Toussaint est discrète ; ici on célèbre les défunts avec joie et couleurs.", "In France All Saints' is quiet; here the dead are celebrated with joy and colour.")],
    },
    food: {
      ping: l("Le repas principal se prend souvent en début d'après-midi.", "The main meal is often in the early afternoon."),
      dos: [tip("Goûter ce qu'on te propose", "Taste what you're offered", "Refuser peut vexer l'hôte.", "Refusing can upset your host.")],
      donts: [tip("Manger des tacos avec couteau et fourchette", "Eat tacos with a knife and fork", "Ça se mange à la main !", "They're eaten by hand!", "low")],
      homeVsHere: [l("En France on déjeune vers 12 h ; ici la « comida » est vers 14 h–16 h.", "In France lunch is at noon; here “comida” is around 2–4 pm.")],
    },
  },
  BR: {
    greetings: {
      ping: l("Les Brésiliens sont chaleureux et tactiles.", "Brazilians are warm and tactile."),
      dos: [tip("Accepter la bise et la proximité physique", "Accept cheek kisses and closeness", "C'est une marque d'amitié.", "It's a sign of friendliness.")],
      donts: [tip("Reculer quand on te touche le bras", "Step back when someone touches your arm", "Ça peut paraître froid ou distant.", "It can seem cold or distant.", "low")],
      homeVsHere: [l("En France on garde ses distances ; ici on se touche facilement en parlant.", "In France people keep their distance; here touching while talking is common.")],
    },
    gestures: {
      ping: l("Attention au signe « OK » !", "Careful with the “OK” sign!"),
      dos: [tip("Faire un pouce levé pour dire « ok »", "Use a thumbs-up to say “ok”", "C'est le geste positif courant.", "It's the common positive gesture.")],
      donts: [tip("Faire le signe « OK » avec les doigts en cercle", "Make the OK sign with a finger circle", "Il est considéré comme vulgaire.", "It's considered vulgar.", "high")],
      homeVsHere: [l("En France le cercle des doigts veut dire « ok » ou « zéro » ; ici c'est une insulte.", "In France the finger circle means “ok” or “zero”; here it's an insult.")],
    },
    social: {
      ping: l("La ponctualité est souple pour les soirées.", "Punctuality is relaxed for parties."),
      dos: [tip("Arriver un peu en retard à une fête", "Arrive a bit late to a party", "Arriver pile à l'heure peut surprendre.", "Arriving exactly on time can surprise.")],
      donts: [tip("Être en retard à un rendez-vous pro", "Be late for a work meeting", "Au travail, la ponctualité reste attendue.", "At work, punctuality is still expected.", "medium")],
      homeVsHere: [l("Le « jeitinho » : on trouve toujours une solution souple et humaine.", "“Jeitinho”: there's always a flexible, human way around things.")],
    },
  },
  AU: {
    greetings: {
      ping: l("Ici tout le monde se tutoie, même le manager.", "Everyone's on first-name terms, even the boss."),
      dos: [tip("Utiliser les prénoms, même avec un manager", "Use first names, even with a manager", "La culture est très égalitaire.", "The culture is very egalitarian."),
        tip("Répondre « G'day » ou « How ya going? »", "Reply “G'day” or “How ya going?”", "C'est le salut local décontracté.", "It's the relaxed local greeting.")],
      donts: [tip("Être trop formel", "Be too formal", "Ça peut paraître distant.", "It can come across as distant.", "low")],
      homeVsHere: [l("En France on vouvoie son supérieur ; ici on l'appelle par son prénom.", "In France you use “vous” with a boss; here you use their first name.")],
    },
    social: {
      ping: l("Modestie et autodérision sont très appréciées.", "Modesty and self-deprecation are appreciated."),
      dos: [tip("Rester modeste et rire de soi", "Stay modest and laugh at yourself", "L'humour décontracté crée du lien.", "Laid-back humour builds bonds.")],
      donts: [tip("Se vanter ou se mettre en avant", "Brag or show off", "C'est le « tall poppy syndrome » : on n'aime pas ceux qui dépassent.", "It's the “tall poppy syndrome”: people dislike showing off.", "low")],
      homeVsHere: [l("Au barbecue, on apporte souvent sa propre boisson (« BYO »).", "At a barbie, you usually bring your own drinks (“BYO”).")],
    },
    food: {
      ping: l("Le barbecue est une institution !", "The barbie is an institution!"),
      dos: [tip("Proposer d'aider au barbecue ou à la vaisselle", "Offer to help at the barbie or with dishes", "C'est apprécié et naturel.", "It's appreciated and natural.")],
      donts: [tip("Arriver les mains vides à un « BYO »", "Show up empty-handed to a “BYO”", "Il faut apporter sa boisson ou un plat.", "You're expected to bring drinks or a dish.", "medium")],
      homeVsHere: [l("En France l'hôte prévoit tout ; ici chacun apporte quelque chose.", "In France the host provides everything; here everyone brings something.")],
    },
  },
  JP: {
    greetings: {
      ping: l("Une légère inclinaison vaut mieux qu'une bise.", "A slight bow beats a cheek kiss."),
      dos: [tip("S'incliner légèrement pour saluer", "Bow slightly to greet", "C'est la salutation respectueuse.", "It's the respectful greeting."),
        tip("Ajouter « -san » après le nom", "Add “-san” after names", "C'est une marque de politesse.", "It's a sign of politeness.")],
      donts: [tip("Faire la bise ou une accolade", "Kiss or hug", "Le contact physique est rare.", "Physical contact is rare.", "medium")],
      homeVsHere: [l("En France on se fait la bise ; au Japon on s'incline légèrement, sans contact.", "In France people kiss on the cheek; in Japan they bow slightly, without contact.")],
    },
    food: {
      ping: l("Les baguettes ont leurs propres règles.", "Chopsticks come with their own rules."),
      dos: [tip("Dire « itadakimasu » avant de manger", "Say “itadakimasu” before eating", "C'est un remerciement pour le repas.", "It's a thank-you for the meal."),
        tip("Slurper ses nouilles", "Slurp your noodles", "C'est normal et montre que tu apprécies.", "It's normal and shows you enjoy it.")],
      donts: [tip("Planter ses baguettes dans le riz", "Stick chopsticks upright in rice", "Ça rappelle les rites funéraires.", "It recalls funeral rites.", "high"),
        tip("Laisser un pourboire", "Leave a tip", "Ça peut gêner : le bon service est normal.", "It can embarrass: good service is normal.", "low")],
      homeVsHere: [l("En France on laisse un pourboire ; au Japon ce n'est pas l'usage.", "In France you tip; in Japan it's not customary.")],
    },
    social: {
      ping: l("Le calme et la propreté sont des valeurs fortes.", "Calm and cleanliness are strong values."),
      dos: [tip("Retirer ses chaussures à l'entrée des maisons et certains lieux", "Remove shoes when entering homes and some places", "L'intérieur est considéré comme propre.", "Indoors is considered clean."),
        tip("Garder ses déchets jusqu'à trouver une poubelle", "Keep your rubbish until you find a bin", "Il y a peu de poubelles publiques.", "Public bins are rare.")],
      donts: [tip("Téléphoner dans le train", "Make phone calls on the train", "Le silence y est respecté.", "Silence is respected there.", "medium")],
      homeVsHere: [l("En France on dit non franchement ; au Japon on refuse de façon indirecte.", "In France people say no directly; in Japan refusals are indirect.")],
    },
  },
  CN: {
    work: {
      ping: l("La carte de visite se traite avec respect.", "Business cards are handled with respect."),
      dos: [tip("Donner et recevoir une carte de visite à deux mains", "Give and receive business cards with both hands", "C'est un signe de respect.", "It's a sign of respect.")],
      donts: [tip("Ranger la carte sans la regarder", "Pocket the card without looking at it", "Ça paraît désinvolte.", "It seems dismissive.", "medium")],
      homeVsHere: [l("La notion de « face » (mianzi) compte : évite de mettre quelqu'un dans l'embarras en public.", "“Face” (mianzi) matters: avoid embarrassing someone in public.")],
    },
    social: {
      ping: l("Certains cadeaux portent un sens caché.", "Some gifts carry hidden meanings."),
      dos: [tip("Offrir un cadeau à deux mains", "Offer gifts with both hands", "C'est poli et respectueux.", "It's polite and respectful.")],
      donts: [tip("Offrir une horloge ou des objets par 4", "Give a clock or items in fours", "Ils évoquent la mort.", "They evoke death.", "medium")],
      homeVsHere: [l("Un cadeau peut être refusé une ou deux fois par politesse avant d'être accepté.", "A gift may be politely refused once or twice before being accepted.")],
    },
    food: {
      ping: l("Le repas se partage, au centre de la table.", "Meals are shared in the middle of the table."),
      dos: [tip("Goûter un peu de chaque plat partagé", "Try a bit of each shared dish", "Le repas est collectif.", "The meal is collective.")],
      donts: [tip("Planter ses baguettes dans le riz", "Stick chopsticks upright in rice", "Ça évoque les offrandes funéraires.", "It evokes funeral offerings.", "high")],
      homeVsHere: [l("En France chacun a son assiette ; ici les plats se partagent.", "In France everyone has their own plate; here dishes are shared.")],
    },
  },
  NL: {
    social: {
      ping: l("Ici, la franchise est une forme de respect.", "Here, frankness is a form of respect."),
      dos: [tip("Être direct et ponctuel", "Be direct and punctual", "La clarté est appréciée.", "Clarity is appreciated."),
        tip("Prévoir ses rendez-vous à l'avance", "Plan meetings ahead", "L'agenda est très organisé.", "Diaries are very organised.")],
      donts: [tip("Marcher sur les pistes cyclables", "Walk on cycle lanes", "Les vélos sont prioritaires et rapides.", "Bikes have priority and go fast.", "medium")],
      homeVsHere: [l("En France on tourne parfois autour du pot ; aux Pays-Bas, la franchise est une marque de respect.", "In France people sometimes beat around the bush; in the Netherlands frankness is respect.")],
    },
    food: {
      ping: l("Le déjeuner est simple, souvent un sandwich.", "Lunch is simple, often a sandwich."),
      dos: [tip("Proposer de partager l'addition (« going Dutch »)", "Offer to split the bill (“going Dutch”)", "Chacun paie sa part, c'est normal.", "Everyone pays their share, it's normal.")],
      donts: [tip("Arriver à l'improviste à l'heure du dîner", "Drop by unannounced at dinnertime", "On prévoit les visites à l'avance.", "Visits are planned in advance.", "low")],
      homeVsHere: [l("En France le déjeuner peut durer ; ici il est rapide et léger.", "In France lunch can be long; here it's quick and light.")],
    },
    greetings: {
      ping: l("Trois bises entre proches, une poignée de main sinon.", "Three kisses among friends, a handshake otherwise."),
      dos: [tip("Serrer la main en te présentant avec ton prénom", "Shake hands and say your first name", "C'est la présentation habituelle.", "It's the usual introduction.")],
      donts: [tip("Faire la bise à un collègue", "Kiss a colleague", "C'est réservé aux proches.", "It's for close friends.", "low")],
      homeVsHere: [l("En France on fait deux bises ; ici trois, et seulement entre proches.", "In France it's two kisses; here three, and only among close ones.")],
    },
  },
  PL: {
    social: {
      ping: l("Être invité chez quelqu'un est un honneur.", "Being invited home is an honour."),
      dos: [tip("Apporter des fleurs en nombre impair quand tu es invité", "Bring an odd number of flowers when invited", "Les nombres pairs sont pour les enterrements.", "Even numbers are for funerals.")],
      donts: [tip("Garder son manteau à l'intérieur d'une maison", "Keep your coat on inside a home", "On l'enlève dès l'entrée.", "You take it off at the door.", "low")],
      homeVsHere: [l("Comme en Pologne, on retire souvent ses chaussures en entrant chez quelqu'un.", "In Poland you often remove your shoes when entering a home.")],
    },
    greetings: {
      ping: l("Le « Pan / Pani » marque le respect.", "“Pan / Pani” shows respect."),
      dos: [tip("Dire « Dzień dobry » en entrant dans un magasin", "Say “Dzień dobry” when entering a shop", "C'est la politesse de base.", "It's basic politeness.")],
      donts: [tip("Tutoyer tout de suite un aîné", "Use first names straight away with an elder", "On attend d'y être invité.", "You wait to be invited.", "low")],
      homeVsHere: [l("Comme le vouvoiement en France, on utilise « Pan / Pani » au début.", "Like French “vous”, you use “Pan / Pani” at first.")],
    },
    food: {
      ping: l("L'hôte insistera pour te resservir !", "Your host will insist on second helpings!"),
      dos: [tip("Accepter de goûter les plats proposés", "Accept to taste the dishes offered", "L'hospitalité est généreuse.", "Hospitality is generous.")],
      donts: [tip("Refuser sèchement un toast", "Bluntly refuse a toast", "Tu peux lever ton verre sans boire beaucoup.", "You can raise your glass without drinking much.", "low")],
      homeVsHere: [l("En France on dit « santé » ; ici « Na zdrowie ! ».", "In France it's “santé”; here “Na zdrowie!”.")],
    },
  },
  ES: {
    food: {
      ping: l("Ici on dîne tard, et c'est un vrai moment de partage.", "Dinner is late here, and it's a real moment to share."),
      dos: [tip("Dîner tard (21 h–22 h) et prendre le temps à table", "Dine late (9–10 pm) and take your time", "La « sobremesa » (discuter après le repas) est précieuse.", "“Sobremesa” (chatting after the meal) is cherished."),
        tip("Prendre une tapa vers 19 h pour patienter", "Have a tapa around 7 pm to wait", "Les tapas servent à tenir jusqu'au dîner.", "Tapas help you last until dinner.")],
      donts: [tip("S'attendre à manger à 19 h au restaurant", "Expect to eat at 7 pm in a restaurant", "Beaucoup de cuisines ouvrent plus tard.", "Many kitchens open later.", "low")],
      homeVsHere: [l("En France on dîne vers 20 h ; en Espagne plutôt vers 21 h–22 h.", "In France dinner is around 8 pm; in Spain more like 9–10 pm.")],
    },
    greetings: {
      ping: l("Deux bises, même lors d'une première rencontre.", "Two kisses, even when meeting for the first time."),
      dos: [tip("Faire deux bises entre amis", "Kiss twice among friends", "C'est le salut habituel.", "It's the usual greeting.")],
      donts: [tip("Rester très distant", "Stay very distant", "Ça peut paraître froid.", "It can seem cold.", "low")],
      homeVsHere: [l("Comme en France, mais on commence par la joue droite.", "Like in France, but you start with the right cheek.")],
    },
    social: {
      ping: l("Les horaires sont décalés, adapte-toi !", "Schedules are shifted, adapt!"),
      dos: [tip("Respecter la pause de l'après-midi dans les petites villes", "Respect the afternoon break in small towns", "Certains commerces ferment de 14 h à 17 h.", "Some shops close 2–5 pm.")],
      donts: [tip("Confondre toutes les régions d'Espagne", "Lump all Spanish regions together", "Catalogne, Pays basque, Andalousie… chacune a son identité.", "Catalonia, Basque Country, Andalusia… each has its identity.", "medium")],
      homeVsHere: [l("En France la pause déjeuner est vers 12 h ; ici on déjeune vers 14 h.", "In France lunch is at noon; here it's around 2 pm.")],
    },
  },
};

export const FEATURED_COUNTRIES = ["GB", "US", "MX", "BR", "AU", "JP", "CN", "NL", "PL", "ES"];

export function getPrewritten(code: string, pillar: PillarId, lang: "fr" | "en"): PillarContent | null {
  const raw = SHEETS[code]?.[pillar];
  if (!raw) return null;
  const t = (r: RawTip): Tip => ({ text: r.text[lang], why: r.why[lang], severity: r.severity });
  return { ping: raw.ping[lang], dos: raw.dos.map(t), donts: raw.donts.map(t), homeVsHere: raw.homeVsHere.map((h) => h[lang]) };
}
export function hasPrewritten(code: string, pillar: PillarId) { return !!SHEETS[code]?.[pillar]; }
