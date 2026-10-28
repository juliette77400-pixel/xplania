// Hand-written culture sheets (no AI) for the destinations added on 28 Oct 2026.
// Same shape as the sheets in culture-guide.ts: three themes per country
// (greetings, social life, work/studies), short, tendencies — never rules.
import type { PillarId } from "./culture-guide";

type L = { fr: string; en: string };
interface RawTip { text: L; why: L; severity?: "low" | "medium" | "high" }
export interface RawPillar { ping: L; dos: RawTip[]; donts: RawTip[]; homeVsHere: L[] }

const l = (fr: string, en: string): L => ({ fr, en });
const tip = (tf: string, te: string, wf: string, we: string, severity?: RawTip["severity"]): RawTip => ({ text: l(tf, te), why: l(wf, we), severity });

export const MORE_SHEETS: Record<string, Partial<Record<PillarId, RawPillar>>> = {
  ID: {
    greetings: {
      ping: l("Un sourire et une poignée de main douce, de la main droite.", "A smile and a gentle handshake, with the right hand."),
      dos: [tip("Saluer, donner et recevoir avec la main droite", "Greet, give and receive with your right hand", "La main gauche est considérée comme impure.", "The left hand is considered unclean.")],
      donts: [tip("Toucher la tête de quelqu'un, même d'un enfant", "Touch someone's head, even a child's", "La tête est considérée comme sacrée.", "The head is seen as sacred.", "medium")],
      homeVsHere: [l("En France on fait la bise ; ici, une poignée de main légère, parfois suivie de la main posée sur le cœur.", "In France people kiss on the cheek; here it's a light handshake, sometimes followed by a hand on the heart.")],
    },
    social: {
      ping: l("Garder son calme en public est très apprécié.", "Staying calm in public is highly valued."),
      dos: [tip("Retirer tes chaussures avant d'entrer chez quelqu'un ou dans une mosquée", "Take your shoes off before entering a home or a mosque", "C'est une marque de respect et de propreté.", "It shows respect and cleanliness."),
        tip("Couvrir épaules et genoux dans les lieux religieux", "Cover shoulders and knees in religious places", "Certains temples prêtent un sarong à l'entrée.", "Some temples lend a sarong at the entrance.")],
      donts: [tip("Hausser le ton ou t'énerver en public", "Raise your voice or get angry in public", "Faire perdre la face est très mal vécu.", "Making someone lose face is very badly felt.", "medium")],
      homeVsHere: [l("En France on débat ouvertement ; en Indonésie, on évite le conflit direct pour préserver l'harmonie.", "In France people argue openly; in Indonesia direct conflict is avoided to keep harmony.")],
    },
    work: {
      ping: l("Le respect de la hiérarchie compte beaucoup.", "Respect for hierarchy matters a lot."),
      dos: [tip("Dire « Pak » (monsieur) ou « Ibu » (madame) avant le prénom", "Say “Pak” (Mr) or “Ibu” (Mrs) before the first name", "C'est la façon polie de parler à un aîné ou à ton responsable.", "It's the polite way to address an elder or your manager.")],
      donts: [tip("Contredire ton responsable devant tout le monde", "Contradict your manager in front of everyone", "Mieux vaut en parler en privé.", "Better to raise it privately.", "medium")],
      homeVsHere: [l("En France un « oui » veut dire oui ; ici, il peut vouloir dire « j'ai compris » : vérifie poliment.", "In France “yes” means yes; here it can mean “I understood”: check politely.")],
    },
  },
  KR: {
    greetings: {
      ping: l("Une légère inclinaison accompagne le bonjour.", "A slight bow comes with hello."),
      dos: [tip("Saluer en inclinant un peu la tête (« annyeonghaseyo »)", "Greet with a slight bow (“annyeonghaseyo”)", "C'est la salutation polie de base.", "It's the basic polite greeting."),
        tip("Donner et recevoir les objets à deux mains", "Give and receive things with both hands", "Surtout avec une personne plus âgée : c'est une marque de respect.", "Especially with older people: it shows respect.")],
      donts: [tip("Écrire le nom de quelqu'un à l'encre rouge", "Write someone's name in red ink", "C'est associé à la mort.", "It's associated with death.", "medium")],
      homeVsHere: [l("En France on se tutoie vite entre étudiants ; en Corée, l'âge fixe souvent le niveau de politesse.", "In France students use informal address quickly; in Korea age often sets the level of politeness.")],
    },
    social: {
      ping: l("Repas et sorties en groupe soudent les liens.", "Group meals and nights out build bonds."),
      dos: [tip("Attendre que la personne la plus âgée commence à manger", "Wait for the eldest to start eating", "C'est une règle de respect à table.", "It's a rule of respect at the table."),
        tip("Servir les autres avant toi quand tu verses à boire", "Pour drinks for others before yourself", "On ne se sert pas soi-même en premier.", "You don't serve yourself first.")],
      donts: [tip("Planter tes baguettes à la verticale dans le riz", "Stick your chopsticks upright in rice", "Ça rappelle les rites funéraires.", "It recalls funeral rites.", "medium")],
      homeVsHere: [l("En France chacun se sert ; en Corée, on remplit le verre des autres et on se tourne un peu pour boire devant un aîné.", "In France everyone serves themselves; in Korea you fill others' glasses and turn slightly to drink in front of an elder.")],
    },
    work: {
      ping: l("Ponctualité et hiérarchie sont essentielles.", "Punctuality and hierarchy are essential."),
      dos: [tip("Arriver en avance et appeler les gens par leur titre", "Arrive early and address people by their title", "Le titre (ex. « Kim timjang-nim », chef d'équipe Kim) compte plus que le prénom.", "The title (e.g. “Kim timjang-nim”, team leader Kim) matters more than the first name.")],
      donts: [tip("Partir avant ton responsable sans dire au revoir", "Leave before your manager without saying goodbye", "Saluer avant de partir est attendu.", "Saying goodbye before leaving is expected.", "low")],
      homeVsHere: [l("En France on appelle souvent son tuteur par son prénom ; en Corée, on utilise son titre.", "In France you often call your supervisor by their first name; in Korea you use their title.")],
    },
  },
  NZ: {
    greetings: {
      ping: l("Ici, on se dit « Kia ora » !", "Here, people say “Kia ora”!"),
      dos: [tip("Dire « Kia ora » pour bonjour", "Say “Kia ora” for hello", "Ce salut maori est utilisé par tout le monde.", "This Māori greeting is used by everyone.")],
      donts: [tip("Faire la bise à quelqu'un que tu connais à peine", "Kiss someone you barely know on the cheek", "Une poignée de main ou un sourire suffit.", "A handshake or a smile is enough.", "low")],
      homeVsHere: [l("En France on vouvoie au début ; ici, tout le monde s'appelle par son prénom très vite.", "In France you use “vous” at first; here everyone is on first-name terms very quickly.")],
    },
    social: {
      ping: l("Ambiance détendue, et respect de la culture maorie.", "Relaxed vibe, and respect for Māori culture."),
      dos: [tip("Suivre les consignes sur un marae (lieu de rencontre maori)", "Follow the protocol on a marae (Māori meeting ground)", "On t'expliquera quand enlever tes chaussures ou où t'asseoir.", "You'll be told when to remove your shoes or where to sit."),
        tip("Apporter un plat à partager quand on te dit « bring a plate »", "Bring food to share when told to “bring a plate”", "Ça ne veut pas dire apporter une assiette vide !", "It doesn't mean bringing an empty plate!")],
      donts: [tip("Confondre Néo-Zélandais et Australiens", "Mistake New Zealanders for Australians", "C'est un sujet de taquinerie, mais ça agace.", "It's a source of teasing, but it annoys.", "low")],
      homeVsHere: [l("En France on s'habille souvent pour sortir ; ici, la tenue est très décontractée.", "In France people often dress up to go out; here clothing is very casual.")],
    },
    work: {
      ping: l("Hiérarchie légère, ton informel.", "Light hierarchy, informal tone."),
      dos: [tip("Appeler ton tuteur par son prénom", "Call your supervisor by their first name", "C'est la norme, même avec la direction.", "It's the norm, even with senior managers.")],
      donts: [tip("Trop te mettre en avant", "Show off too much", "La modestie est appréciée (on parle de « tall poppy syndrome »).", "Modesty is valued (people speak of the “tall poppy syndrome”).", "low")],
      homeVsHere: [l("En France on garde ses distances avec la hiérarchie ; ici, le ton est égalitaire.", "In France people keep their distance from managers; here the tone is equal.")],
    },
  },
  PT: {
    greetings: {
      ping: l("Deux bises entre amis, une poignée de main au travail.", "Two kisses among friends, a handshake at work."),
      dos: [tip("Faire deux bises en commençant par la joue droite", "Kiss twice, starting with the right cheek", "C'est le salut habituel entre jeunes.", "It's the usual greeting among young people.")],
      donts: [tip("Parler espagnol en pensant faire plaisir", "Speak Spanish thinking it will please", "Les Portugais tiennent à leur langue : essaie quelques mots de portugais ou l'anglais.", "Portuguese people care about their language: try a few Portuguese words or English.", "medium")],
      homeVsHere: [l("Comme en France on fait la bise, mais deux et pas plus.", "Like in France people kiss on the cheek, but twice and no more.")],
    },
    social: {
      ping: l("Le café est un rituel de la journée.", "Coffee is a daily ritual."),
      dos: [tip("Commander « um café » pour un expresso", "Order “um café” for an espresso", "C'est la base de chaque pause.", "It's the basis of every break."),
        tip("Prendre le temps à table", "Take your time at the table", "Le repas est un vrai moment de convivialité.", "Meals are a real moment together.")],
      donts: [tip("Manger ce qui est posé sur la table sans savoir que c'est payant", "Eat what's on the table without knowing it's charged", "Pain, olives ou fromage (le « couvert ») sont souvent facturés : renvoie-les si tu n'en veux pas.", "Bread, olives or cheese (the “couvert”) are often charged: send them back if you don't want them.", "low")],
      homeVsHere: [l("En France le pain est gratuit au restaurant ; au Portugal, ce qui est posé sur la table peut être facturé.", "In France bread is free in restaurants; in Portugal what's on the table may be charged.")],
    },
    work: {
      ping: l("Politesse et un peu de formalité au début.", "Politeness and some formality at first."),
      dos: [tip("Utiliser « Senhor / Senhora » ou le titre (« Doutor / Doutora ») au début", "Use “Senhor / Senhora” or a title (“Doutor / Doutora”) at first", "Les titres universitaires sont courants au travail.", "University titles are common at work.")],
      donts: [tip("Être trop direct dans une critique", "Be too blunt when criticising", "On préfère les formulations diplomatiques.", "Diplomatic wording is preferred.", "low")],
      homeVsHere: [l("Comme en France, on vouvoie au début ; le tutoiement vient plus tard.", "Like in France, you use formal address at first; informal comes later.")],
    },
  },
  CL: {
    greetings: {
      ping: l("Une seule bise sur la joue droite, même à la première rencontre.", "One kiss on the right cheek, even when you first meet."),
      dos: [tip("Faire une bise entre femmes ou entre homme et femme", "Give one kiss between women or between a man and a woman", "Entre hommes, c'est plutôt une poignée de main ou une accolade.", "Between men it's rather a handshake or a hug.")],
      donts: [tip("Partir sans dire au revoir à chacun", "Leave without saying goodbye to each person", "On salue souvent tout le monde en arrivant et en partant.", "People often greet everyone when arriving and leaving.", "low")],
      homeVsHere: [l("En France deux bises ; au Chili, une seule.", "In France two kisses; in Chile, just one.")],
    },
    social: {
      ping: l("La « once » est le repas léger du soir.", "“Once” is the light evening meal."),
      dos: [tip("Accepter une invitation à « tomar once »", "Accept an invitation to “tomar once”", "Thé, pain, avocat : un moment simple et très convivial.", "Tea, bread, avocado: a simple and very friendly moment.")],
      donts: [tip("Arriver pile à l'heure à une soirée entre amis", "Arrive exactly on time at a party with friends", "Un léger retard est courant ; au travail, sois ponctuel.", "A slight delay is common; at work, be on time.", "low")],
      homeVsHere: [l("L'espagnol chilien est rapide, avec beaucoup d'expressions locales (« ¿cachai? ») : n'hésite pas à faire répéter.", "Chilean Spanish is fast, with many local expressions (“¿cachai?”): don't hesitate to ask again.")],
    },
    work: {
      ping: l("Relations chaleureuses, mais respect de la hiérarchie.", "Warm relationships, but respect for hierarchy."),
      dos: [tip("Discuter un peu avant d'entrer dans le vif du sujet", "Chat a little before getting down to business", "La relation compte autant que la tâche.", "The relationship matters as much as the task.")],
      donts: [tip("Critiquer un collègue devant tout le monde", "Criticise a colleague in front of everyone", "Mieux vaut un échange privé et diplomate.", "Better a private and diplomatic talk.", "low")],
      homeVsHere: [l("En France on va vite à l'essentiel ; au Chili, on construit d'abord la relation.", "In France people get to the point fast; in Chile you build the relationship first.")],
    },
  },
  AR: {
    greetings: {
      ping: l("Une bise, même entre hommes qui se connaissent.", "One kiss, even between men who know each other."),
      dos: [tip("Faire une bise sur la joue droite pour saluer", "Give one kiss on the right cheek to greet", "C'est courant, y compris entre amis hommes.", "It's common, including between male friends.")],
      donts: [tip("Te vexer du tutoiement rapide (« vos »)", "Take offence at the quick informal “vos”", "Le « vos » informel arrive vite, c'est normal.", "Informal “vos” comes quickly, it's normal.", "low")],
      homeVsHere: [l("En France deux bises ; en Argentine, une seule.", "In France two kisses; in Argentina, just one.")],
    },
    social: {
      ping: l("Le maté se partage : c'est un geste d'amitié.", "Mate is shared: it's a sign of friendship."),
      dos: [tip("Accepter le maté et le rendre à la personne qui le sert", "Accept the mate and hand it back to the person serving", "Dis « gracias » seulement quand tu n'en veux plus.", "Only say “gracias” when you don't want any more."),
        tip("Dîner tard, souvent après 21 h", "Dine late, often after 9 pm", "Les restaurants se remplissent tard.", "Restaurants fill up late.")],
      donts: [tip("Remuer la paille du maté (« bombilla »)", "Stir the mate straw (“bombilla”)", "Ça bouche le filtre et agace celui qui sert.", "It clogs the filter and annoys the server.", "low")],
      homeVsHere: [l("En France « merci » est poli ; avec le maté, « gracias » veut dire « je n'en veux plus ».", "In France “thank you” is polite; with mate, “gracias” means “no more for me”.")],
    },
    work: {
      ping: l("Relations chaleureuses, horaires souples.", "Warm relationships, flexible hours."),
      dos: [tip("Prendre le temps des échanges personnels", "Take time for personal chats", "La confiance se construit par la relation.", "Trust is built through the relationship.")],
      donts: [tip("Parler à la légère de politique ou des Malouines (« Malvinas »)", "Talk lightly about politics or the Falklands (“Malvinas”)", "Ce sont des sujets sensibles.", "These are sensitive topics.", "medium")],
      homeVsHere: [l("En France on dîne vers 20 h ; en Argentine, la journée et le dîner finissent plus tard.", "In France dinner is around 8 pm; in Argentina the day and dinner end later.")],
    },
  },
  DK: {
    greetings: {
      ping: l("Une poignée de main ferme et ton prénom.", "A firm handshake and your first name."),
      dos: [tip("Te présenter par ton prénom", "Introduce yourself with your first name", "Tout le monde se tutoie, même avec les professeurs.", "Everyone uses first names, even with teachers.")],
      donts: [tip("Faire la bise à une nouvelle connaissance", "Kiss a new acquaintance on the cheek", "Une poignée de main ou un « hej » suffit.", "A handshake or a “hej” is enough.", "low")],
      homeVsHere: [l("En France on vouvoie un professeur ; au Danemark, on l'appelle par son prénom.", "In France you use “vous” with a teacher; in Denmark you call them by their first name.")],
    },
    social: {
      ping: l("Le « hygge » : des moments simples et chaleureux.", "“Hygge”: simple, cosy moments."),
      dos: [tip("Accepter les invitations à un dîner ou un café cosy", "Accept invitations to a cosy dinner or coffee", "Le « hygge » est au cœur de la vie sociale.", "“Hygge” is at the heart of social life."),
        tip("Respecter les pistes cyclables", "Respect cycle lanes", "Le vélo est roi, surtout à Copenhague.", "Bikes rule, especially in Copenhagen.")],
      donts: [tip("Te vanter ou te mettre en avant", "Brag or show off", "La modestie est une valeur forte (la « Janteloven »).", "Modesty is a strong value (the “Janteloven”).", "low")],
      homeVsHere: [l("En France on se lie vite en soirée ; au Danemark, les amitiés se construisent plus lentement, souvent via des activités.", "In France friendships form fast at parties; in Denmark they build more slowly, often through activities.")],
    },
    work: {
      ping: l("Hiérarchie plate, équilibre vie pro et perso.", "Flat hierarchy, work-life balance."),
      dos: [tip("Donner ton avis, même en tant que stagiaire", "Share your opinion, even as an intern", "On attend de chacun qu'il participe.", "Everyone is expected to contribute.")],
      donts: [tip("Rester tard au bureau pour te faire voir", "Stay late at the office to be seen", "Partir à l'heure est normal ; rester tard peut sembler mal organisé.", "Leaving on time is normal; staying late can look disorganised.", "low")],
      homeVsHere: [l("En France la hiérarchie se respecte ; au Danemark, on discute d'égal à égal avec son responsable.", "In France hierarchy is respected; in Denmark you talk as equals with your manager.")],
    },
  },
  SE: {
    greetings: {
      ping: l("Poignée de main et prénom, sans chichis.", "Handshake and first name, no fuss."),
      dos: [tip("Serrer la main en regardant la personne", "Shake hands while looking at the person", "C'est la présentation habituelle.", "It's the usual introduction.")],
      donts: [tip("Faire la bise à quelqu'un que tu connais à peine", "Kiss someone you barely know", "On garde plus de distance physique.", "People keep more physical distance.", "low")],
      homeVsHere: [l("En France on se fait la bise ; en Suède, on se serre la main, ou on se fait un câlin entre amis proches.", "In France people kiss on the cheek; in Sweden they shake hands, or hug close friends.")],
    },
    social: {
      ping: l("La « fika » : la pause café presque sacrée.", "“Fika”: the almost sacred coffee break."),
      dos: [tip("Participer à la « fika » (café et pâtisserie)", "Join the “fika” (coffee and a pastry)", "C'est un vrai moment de lien, au travail comme entre amis.", "It's a real bonding moment, at work and among friends."),
        tip("Retirer tes chaussures en entrant chez quelqu'un", "Take your shoes off when entering a home", "C'est l'usage presque partout.", "It's the custom almost everywhere.")],
      donts: [tip("Parler fort dans les transports", "Talk loudly on public transport", "Le calme est la norme.", "Quiet is the norm.", "low")],
      homeVsHere: [l("En France on garde ses chaussures chez des amis ; en Suède, on les enlève à l'entrée.", "In France you keep your shoes on at friends'; in Sweden you take them off at the door.")],
    },
    work: {
      ping: l("Consensus et égalité avant tout.", "Consensus and equality first."),
      dos: [tip("Laisser à chacun le temps de donner son avis", "Give everyone time to share their view", "Les décisions se prennent souvent par consensus.", "Decisions are often made by consensus.")],
      donts: [tip("Couper la parole en réunion", "Interrupt in meetings", "On laisse chacun finir ; les silences sont normaux.", "People let each other finish; silences are normal.", "low")],
      homeVsHere: [l("En France on débat vivement ; en Suède, on cherche calmement le consensus.", "In France people debate lively; in Sweden they calmly seek consensus.")],
    },
  },
  IT: {
    greetings: {
      ping: l("Deux bises entre amis, une poignée de main sinon.", "Two kisses among friends, a handshake otherwise."),
      dos: [tip("Dire « buongiorno » en entrant dans un commerce", "Say “buongiorno” when entering a shop", "C'est la politesse de base.", "It's basic politeness.")],
      donts: [tip("Tutoyer tout de suite un professeur", "Use “tu” straight away with a teacher", "On utilise le « Lei » (vouvoiement) et souvent le titre (« Professore »).", "People use “Lei” (formal you) and often the title (“Professore”).", "low")],
      homeVsHere: [l("Comme en France, deux bises, mais souvent en commençant par la joue gauche.", "Like in France, two kisses, but often starting with the left cheek.")],
    },
    social: {
      ping: l("Le repas est un moment important.", "Meals are an important moment."),
      dos: [tip("Prendre l'« aperitivo » en fin de journée", "Have an “aperitivo” in the early evening", "C'est un vrai moment social, souvent avec de petits plats.", "It's a real social moment, often with snacks."),
        tip("Commander « un caffè » pour un expresso", "Order “un caffè” for an espresso", "Le cappuccino se boit plutôt le matin.", "Cappuccino is mainly a morning drink.")],
      donts: [tip("Demander du parmesan sur des pâtes aux fruits de mer", "Ask for parmesan on seafood pasta", "Ça surprend beaucoup les Italiens.", "It really surprises Italians.", "low")],
      homeVsHere: [l("En France on boit un café au lait à toute heure ; en Italie, un cappuccino après le dîner étonne.", "In France people drink milky coffee any time; in Italy a cappuccino after dinner surprises.")],
    },
    work: {
      ping: l("Titres et relations personnelles comptent.", "Titles and personal relationships matter."),
      dos: [tip("Utiliser les titres (« Dottore / Dottoressa », « Ingegnere »)", "Use titles (“Dottore / Dottoressa”, “Ingegnere”)", "Ils sont courants au travail.", "They're common at work.")],
      donts: [tip("Négliger ta tenue", "Neglect your appearance", "Une apparence soignée (la « bella figura ») est appréciée.", "A neat appearance (the “bella figura”) is valued.", "low")],
      homeVsHere: [l("Comme en France, on vouvoie au début, mais les titres sont plus fréquents en Italie.", "Like in France, you use formal address at first, but titles are more common in Italy.")],
    },
  },
  HU: {
    greetings: {
      ping: l("Le nom de famille vient avant le prénom.", "The family name comes before the first name."),
      dos: [tip("Dire « Jó napot » (bonjour) en entrant", "Say “Jó napot” (good day) when entering", "C'est la salutation polie.", "It's the polite greeting."),
        tip("Retenir l'ordre des noms : « Nagy Anna », pas « Anna Nagy »", "Remember the name order: “Nagy Anna”, not “Anna Nagy”", "En hongrois, le nom de famille passe en premier.", "In Hungarian, the family name comes first.")],
      donts: [tip("Tutoyer une personne âgée sans y être invité", "Use informal address with an older person uninvited", "Le vouvoiement reste attendu.", "Formal address is still expected.", "low")],
      homeVsHere: [l("En France le prénom vient d'abord ; en Hongrie, c'est le nom de famille.", "In France the first name comes first; in Hungary it's the family name.")],
    },
    social: {
      ping: l("Hospitalité généreuse, cafés et bains thermaux.", "Generous hospitality, cafés and thermal baths."),
      dos: [tip("Goûter les plats proposés quand tu es invité", "Taste the dishes offered when invited", "L'hôte est fier de sa cuisine.", "Hosts are proud of their cooking.")],
      donts: [tip("Trinquer avec des verres de bière", "Clink beer glasses", "Une vieille tradition le déconseille ; trinquer avec du vin est normal.", "An old tradition advises against it; clinking wine glasses is fine.", "low")],
      homeVsHere: [l("En France on trinque avec tout ; en Hongrie, certains évitent encore de trinquer avec la bière.", "In France people clink any drink; in Hungary some still avoid clinking beer.")],
    },
    work: {
      ping: l("Formalité et ponctualité.", "Formality and punctuality."),
      dos: [tip("Arriver à l'heure et utiliser les titres au début", "Be on time and use titles at first", "Le respect passe par la forme.", "Respect is shown through formality.")],
      donts: [tip("Tutoyer ton responsable sans y être invité", "Use informal address with your manager uninvited", "Attends qu'il ou elle le propose.", "Wait for them to suggest it.", "low")],
      homeVsHere: [l("Comme en France, le vouvoiement est la règle au début.", "Like in France, formal address is the rule at first.")],
    },
  },
  CH: {
    greetings: {
      ping: l("Trois bises entre amis, une poignée de main sinon.", "Three kisses among friends, a handshake otherwise."),
      dos: [tip("Saluer commerçants et voisins", "Greet shopkeepers and neighbours", "Un « bonjour » ou « grüezi » est attendu.", "A “bonjour” or “grüezi” is expected.")],
      donts: [tip("Arriver en retard", "Arrive late", "La ponctualité est presque une règle sociale.", "Punctuality is almost a social rule.", "medium")],
      homeVsHere: [l("En France deux bises ; en Suisse, souvent trois.", "In France two kisses; in Switzerland, often three.")],
    },
    social: {
      ping: l("Calme, ordre et respect des règles.", "Calm, order and respect for rules."),
      dos: [tip("Trier tes déchets et respecter les jours de collecte", "Sort your waste and follow collection days", "Le tri est strict, et les sacs sont souvent payants.", "Sorting is strict, and bin bags are often paid for."),
        tip("Respecter le calme le soir et le dimanche", "Keep quiet in the evening and on Sundays", "Le règlement d'immeuble fixe souvent des heures de calme.", "Building rules often set quiet hours.")],
      donts: [tip("Faire du bruit tard dans un immeuble", "Make noise late in a building", "Les voisins peuvent se plaindre à la régie.", "Neighbours may complain to the property manager.", "medium")],
      homeVsHere: [l("En France on tolère le bruit ; en Suisse, les heures de calme sont souvent écrites dans le bail.", "In France noise is tolerated; in Switzerland quiet hours are often written in the lease.")],
    },
    work: {
      ping: l("Précision et fiabilité.", "Precision and reliability."),
      dos: [tip("Préparer tes réunions et tenir les délais", "Prepare meetings and keep deadlines", "La fiabilité est très valorisée.", "Reliability is highly valued.")],
      donts: [tip("Oublier la langue de la région", "Forget the region's language", "Selon le canton, on parle français, allemand, italien ou romanche.", "Depending on the canton, people speak French, German, Italian or Romansh.", "low")],
      homeVsHere: [l("Même en Suisse romande, le rythme et la ponctualité sont plus stricts qu'en France.", "Even in French-speaking Switzerland, pace and punctuality are stricter than in France.")],
    },
  },
  NO: {
    greetings: {
      ping: l("Une poignée de main et ton prénom.", "A handshake and your first name."),
      dos: [tip("Te présenter par ton prénom avec une poignée de main", "Introduce yourself with your first name and a handshake", "On se tutoie avec tout le monde.", "Everyone uses informal address.")],
      donts: [tip("Faire la bise", "Kiss on the cheek", "On garde une plus grande distance physique.", "People keep more physical distance.", "low")],
      homeVsHere: [l("En France on fait la bise ; en Norvège, on se serre la main.", "In France people kiss on the cheek; in Norway they shake hands.")],
    },
    social: {
      ping: l("La nature et le « friluftsliv » (la vie au grand air).", "Nature and “friluftsliv” (outdoor life)."),
      dos: [tip("Accepter les sorties randonnée ou ski", "Accept hiking or skiing outings", "C'est la meilleure façon de te faire des amis.", "It's the best way to make friends."),
        tip("Retirer tes chaussures chez quelqu'un", "Take your shoes off at someone's home", "C'est l'usage.", "It's the custom.")],
      donts: [tip("Prendre la réserve des gens pour de la froideur", "Mistake people's reserve for coldness", "Les Norvégiens s'ouvrent avec le temps.", "Norwegians open up with time.", "low")],
      homeVsHere: [l("En France on discute avec des inconnus au café ; en Norvège, on se lie plutôt par les activités.", "In France people chat with strangers in cafés; in Norway bonds form through activities.")],
    },
    work: {
      ping: l("Égalité et autonomie.", "Equality and autonomy."),
      dos: [tip("Prendre des initiatives", "Take initiative", "On te fait confiance et on attend de l'autonomie.", "You're trusted and expected to be autonomous.")],
      donts: [tip("Attendre des ordres détaillés pour chaque tâche", "Wait for detailed orders for every task", "Le management est peu hiérarchique.", "Management is not very hierarchical.", "low")],
      homeVsHere: [l("En France la journée de travail finit tard ; en Norvège, beaucoup partent vers 16 h.", "In France the working day ends late; in Norway many leave around 4 pm.")],
    },
  },
  GR: {
    greetings: {
      ping: l("Accueil chaleureux et expressif.", "Warm and expressive welcome."),
      dos: [tip("Dire « Yassou » (salut) ou « Kalimera » (bonjour)", "Say “Yassou” (hi) or “Kalimera” (good morning)", "Les gens apprécient l'effort.", "People appreciate the effort.")],
      donts: [tip("Montrer la paume ouverte, doigts écartés, vers quelqu'un", "Push an open palm, fingers spread, towards someone", "Ce geste (la « moutza ») est une insulte.", "This gesture (the “moutza”) is an insult.", "high")],
      homeVsHere: [l("En Grèce, un petit mouvement de tête vers le haut peut vouloir dire « non » : fais attention.", "In Greece, a small upward nod can mean “no”: be careful.")],
    },
    social: {
      ping: l("Les repas se partagent, souvent tard.", "Meals are shared, often late."),
      dos: [tip("Partager les plats au centre de la table", "Share the dishes in the middle of the table", "On commande souvent pour tout le monde.", "People often order for the whole table."),
        tip("Accepter l'hospitalité (« filoxenia »)", "Accept hospitality (“filoxenia”)", "Refuser peut vexer.", "Refusing can offend.")],
      donts: [tip("Vouloir payer ta part au centime près", "Insist on paying your exact share", "Souvent, une personne invite et l'autre rendra la pareille.", "Often one person pays and the other returns the favour.", "low")],
      homeVsHere: [l("En France chacun choisit son plat ; en Grèce, tout se partage.", "In France everyone picks their own dish; in Greece everything is shared.")],
    },
    work: {
      ping: l("Relations personnelles et souplesse.", "Personal relationships and flexibility."),
      dos: [tip("Prendre le temps de connaître tes collègues", "Take time to get to know your colleagues", "La confiance passe par la relation.", "Trust comes through the relationship.")],
      donts: [tip("Montrer de l'impatience si une réunion commence en retard", "Show impatience if a meeting starts late", "Les horaires sont plus souples.", "Timekeeping is more flexible.", "low")],
      homeVsHere: [l("En France on sépare souvent vie pro et perso ; en Grèce, les deux se mêlent davantage.", "In France work and private life are often kept apart; in Greece they mix more.")],
    },
  },
  ZA: {
    greetings: {
      ping: l("Une poignée de main et un « Howzit? » amical.", "A handshake and a friendly “Howzit?”."),
      dos: [tip("Demander « comment ça va ? » avant de parler travail", "Ask “how are you?” before talking business", "C'est la politesse attendue.", "It's the expected politeness.")],
      donts: [tip("Faire des généralités sur les communautés", "Make generalisations about communities", "Le pays a 12 langues officielles et une histoire sensible.", "The country has 12 official languages and a sensitive history.", "high")],
      homeVsHere: [l("En France on fait la bise ; ici, la poignée de main est le salut habituel.", "In France people kiss on the cheek; here a handshake is the usual greeting.")],
    },
    social: {
      ping: l("Le « braai » (barbecue) réunit tout le monde.", "The “braai” (barbecue) brings everyone together."),
      dos: [tip("Accepter une invitation à un « braai »", "Accept an invitation to a “braai”", "C'est le grand moment social ; propose d'apporter une boisson ou un plat.", "It's the big social moment; offer to bring a drink or a dish."),
        tip("Demander conseil sur les quartiers et horaires à éviter", "Ask for advice on areas and times to avoid", "Ton école ou tes collègues connaissent la ville.", "Your school or colleagues know the city.")],
      donts: [tip("Montrer téléphone ou objets de valeur dans la rue", "Show your phone or valuables in the street", "Ça attire l'attention ; reste discret.", "It attracts attention; stay discreet.", "medium")],
      homeVsHere: [l("Ici, « now now » veut dire bientôt et « just now » peut vouloir dire plus tard : ne panique pas !", "Here “now now” means soon and “just now” can mean later: don't panic!")],
    },
    work: {
      ping: l("Ambiance cordiale, ponctualité attendue.", "Friendly atmosphere, punctuality expected."),
      dos: [tip("Arriver à l'heure aux rendez-vous professionnels", "Be on time for work meetings", "La ponctualité est attendue au travail.", "Punctuality is expected at work.")],
      donts: [tip("Couper court aux échanges personnels", "Cut personal chat short", "Créer la relation compte.", "Building the relationship matters.", "low")],
      homeVsHere: [l("Comme en France, la ponctualité compte au travail, mais l'ambiance est plus informelle.", "Like in France, punctuality matters at work, but the mood is more informal.")],
    },
  },
  AT: {
    greetings: {
      ping: l("« Grüß Gott » et une poignée de main.", "“Grüß Gott” and a handshake."),
      dos: [tip("Dire « Grüß Gott », ou « Servus » entre amis", "Say “Grüß Gott”, or “Servus” among friends", "Ce sont les salutations typiques.", "These are the typical greetings."),
        tip("Utiliser les titres universitaires (« Frau Magister », « Herr Doktor »)", "Use academic titles (“Frau Magister”, “Herr Doktor”)", "Ils sont très utilisés.", "They're widely used.")],
      donts: [tip("Tutoyer (« du ») au travail sans y être invité", "Use informal “du” at work uninvited", "On commence par le « Sie ».", "You start with “Sie”.", "low")],
      homeVsHere: [l("En France les titres sont rares ; en Autriche, ils sont fréquents.", "In France titles are rare; in Austria they're common.")],
    },
    social: {
      ping: l("Cafés viennois et dimanches calmes.", "Viennese cafés and quiet Sundays."),
      dos: [tip("Prendre ton temps au café", "Take your time in a café", "On peut rester longtemps avec un seul café.", "You can stay a long time with one coffee.")],
      donts: [tip("Faire du bruit le dimanche (bricolage, tondeuse)", "Make noise on Sundays (DIY, mowing)", "Le dimanche est un jour de repos respecté.", "Sunday is a respected day of rest.", "medium")],
      homeVsHere: [l("En France, plus de magasins ouvrent le dimanche ; en Autriche, la plupart sont fermés.", "In France more shops open on Sundays; in Austria most are closed.")],
    },
    work: {
      ping: l("Ponctualité et organisation.", "Punctuality and organisation."),
      dos: [tip("Arriver à l'heure et prévenir en cas de retard", "Be on time and warn if you're late", "C'est une marque de respect.", "It's a sign of respect.")],
      donts: [tip("Confondre l'Autriche et l'Allemagne", "Confuse Austria with Germany", "Les Autrichiens tiennent à leur identité.", "Austrians care about their identity.", "medium")],
      homeVsHere: [l("En France on improvise volontiers ; en Autriche, on planifie.", "In France people happily improvise; in Austria they plan.")],
    },
  },
  BG: {
    greetings: {
      ping: l("Attention : hocher la tête peut vouloir dire « non » !", "Careful: nodding can mean “no”!"),
      dos: [tip("Confirmer à voix haute « da » (oui) ou « ne » (non)", "Confirm out loud “da” (yes) or “ne” (no)", "Les mouvements de tête pour oui et non sont souvent inversés.", "Head movements for yes and no are often reversed.")],
      donts: [tip("Te fier seulement aux gestes de tête", "Rely only on head gestures", "Ça crée vite des malentendus.", "It quickly causes misunderstandings.", "medium")],
      homeVsHere: [l("En France hocher la tête de haut en bas veut dire oui ; en Bulgarie, ça peut vouloir dire non.", "In France nodding up and down means yes; in Bulgaria it can mean no.")],
    },
    social: {
      ping: l("Hospitalité chaleureuse.", "Warm hospitality."),
      dos: [tip("Apporter des fleurs en nombre impair ou un petit cadeau quand tu es invité", "Bring an odd number of flowers or a small gift when invited", "Les nombres pairs sont réservés aux enterrements.", "Even numbers are for funerals.")],
      donts: [tip("Refuser tout ce que l'hôte propose", "Refuse everything the host offers", "Goûter un peu est apprécié.", "Tasting a little is appreciated.", "low")],
      homeVsHere: [l("Comme en France, on apporte quelque chose quand on est invité.", "Like in France, you bring something when invited.")],
    },
    work: {
      ping: l("Respect de la hiérarchie et relations personnelles.", "Respect for hierarchy and personal relationships."),
      dos: [tip("Dire « Gospodin / Gospozha » avec le nom de famille au début", "Say “Gospodin / Gospozha” with the surname at first", "C'est la forme polie.", "It's the polite form.")],
      donts: [tip("Être trop familier dès le départ", "Be too familiar from the start", "La confiance vient avec le temps.", "Trust comes with time.", "low")],
      homeVsHere: [l("Comme en France, on vouvoie au début.", "Like in France, you use formal address at first.")],
    },
  },
  IE: {
    greetings: {
      ping: l("Accueil chaleureux et beaucoup d'humour.", "Warm welcome and lots of humour."),
      dos: [tip("Répondre à la petite conversation (météo, sport)", "Join in small talk (weather, sport)", "C'est la base pour créer du lien.", "It's the basis for connecting.")],
      donts: [tip("Confondre l'Irlande avec le Royaume-Uni", "Confuse Ireland with the UK", "C'est un sujet historique sensible.", "It's a sensitive historical topic.", "high")],
      homeVsHere: [l("En France on fait la bise ; en Irlande, une poignée de main ou un simple « hi ».", "In France people kiss on the cheek; in Ireland a handshake or a simple “hi”.")],
    },
    social: {
      ping: l("Au pub, chacun paie sa tournée (« round »).", "At the pub, everyone buys a round."),
      dos: [tip("Participer aux tournées et payer la tienne", "Join the rounds and buy yours", "Ne pas payer son tour peut paraître radin.", "Skipping your round can look stingy."),
        tip("Remercier le chauffeur en descendant du bus", "Thank the driver when getting off the bus", "C'est une habitude courante.", "It's a common habit.")],
      donts: [tip("Prendre les taquineries au premier degré", "Take teasing literally", "L'humour et l'autodérision sont une forme d'affection.", "Humour and self-mockery are a form of affection.", "low")],
      homeVsHere: [l("En France chacun commande son verre ; en Irlande, on fonctionne par tournées.", "In France everyone orders their own drink; in Ireland it works by rounds.")],
    },
    work: {
      ping: l("Ton informel, hiérarchie discrète.", "Informal tone, discreet hierarchy."),
      dos: [tip("Appeler tes collègues par leur prénom", "Call colleagues by their first name", "C'est la norme.", "It's the norm.")],
      donts: [tip("Critiquer très directement", "Criticise very directly", "On adoucit souvent avec de l'humour ou des formules polies.", "People often soften with humour or polite phrases.", "low")],
      homeVsHere: [l("En France on peut être direct ; en Irlande, les critiques sont plus enrobées.", "In France people can be direct; in Ireland criticism is more wrapped up.")],
    },
  },
  PE: {
    greetings: {
      ping: l("Une bise sur la joue droite entre amis.", "One kiss on the right cheek among friends."),
      dos: [tip("Saluer chaque personne en arrivant", "Greet each person when you arrive", "Saluer le groupe d'un coup peut paraître froid.", "Greeting the group all at once can seem cold.")],
      donts: [tip("Tutoyer tout de suite une personne âgée", "Use “tú” straight away with an older person", "On utilise « usted » au début.", "“Usted” is used at first.", "low")],
      homeVsHere: [l("En France deux bises ; au Pérou, une seule.", "In France two kisses; in Peru, just one.")],
    },
    social: {
      ping: l("La cuisine est une fierté nationale.", "Food is a national pride."),
      dos: [tip("Goûter les plats locaux (ceviche, lomo saltado)", "Taste local dishes (ceviche, lomo saltado)", "Les Péruviens sont fiers de leur cuisine.", "Peruvians are proud of their food."),
        tip("Y aller doucement les premiers jours en altitude (Cusco, Arequipa…)", "Take it easy for the first days at altitude (Cusco, Arequipa…)", "Le mal des montagnes est fréquent à l'arrivée.", "Altitude sickness is common on arrival.")],
      donts: [tip("Photographier des personnes sans leur demander", "Photograph people without asking", "Demande toujours la permission.", "Always ask permission.", "medium")],
      homeVsHere: [l("En France on boit l'eau du robinet ; au Pérou, préfère l'eau en bouteille ou filtrée.", "In France people drink tap water; in Peru prefer bottled or filtered water.")],
    },
    work: {
      ping: l("Relations personnelles et respect de la hiérarchie.", "Personal relationships and respect for hierarchy."),
      dos: [tip("Utiliser les titres (« Ingeniero », « Doctor », « Licenciado »)", "Use titles (“Ingeniero”, “Doctor”, “Licenciado”)", "Ils marquent le respect.", "They show respect.")],
      donts: [tip("Contredire un supérieur devant tout le monde", "Contradict a manager in front of everyone", "On préfère un échange en privé.", "A private talk is preferred.", "low")],
      homeVsHere: [l("En France on va vite au sujet ; au Pérou, on commence par discuter.", "In France people get to the point fast; in Peru you start by chatting.")],
    },
  },
  IN: {
    greetings: {
      ping: l("« Namaste », mains jointes, est toujours bien reçu.", "“Namaste”, palms together, is always welcome."),
      dos: [tip("Saluer avec « Namaste », mains jointes", "Greet with “Namaste”, palms together", "C'est respectueux avec tout le monde.", "It's respectful with everyone."),
        tip("Utiliser la main droite pour donner, recevoir et manger", "Use your right hand to give, receive and eat", "La main gauche est associée à l'hygiène.", "The left hand is associated with hygiene.")],
      donts: [tip("Serrer la main d'une personne de l'autre sexe sans qu'elle la tende", "Shake hands with someone of the other sex unless they offer", "Attends qu'on te tende la main.", "Wait for them to offer their hand.", "medium")],
      homeVsHere: [l("En France on fait la bise ; en Inde, le contact physique en public est plus rare.", "In France people kiss on the cheek; in India physical contact in public is rarer.")],
    },
    social: {
      ping: l("Une diversité immense : chaque région a ses codes.", "Huge diversity: every region has its own codes."),
      dos: [tip("Retirer tes chaussures dans les temples et chez quelqu'un", "Take your shoes off in temples and homes", "C'est une règle de respect.", "It's a rule of respect."),
        tip("Porter des vêtements qui couvrent épaules et jambes", "Wear clothes covering shoulders and legs", "Surtout dans les lieux religieux et les petites villes.", "Especially in religious places and small towns.")],
      donts: [tip("Pointer quelqu'un du pied ou poser les pieds sur une table", "Point at someone with your foot or put your feet on a table", "Les pieds sont considérés comme impurs.", "Feet are considered unclean.", "medium")],
      homeVsHere: [l("Le mouvement de tête de gauche à droite (« head wobble ») veut souvent dire « d'accord », pas « non ».", "The side-to-side head movement (“head wobble”) often means “OK”, not “no”.")],
    },
    work: {
      ping: l("Hiérarchie marquée et relations personnelles.", "Clear hierarchy and personal relationships."),
      dos: [tip("Dire « Sir / Madam », ou ajouter « -ji » au nom quand c'est l'usage", "Say “Sir / Madam”, or add “-ji” to the name where it's customary", "C'est la forme polie au travail.", "It's the polite form at work.")],
      donts: [tip("Prendre un « oui » pour un engagement ferme", "Take a “yes” as a firm commitment", "Vérifie poliment les délais et les détails.", "Politely check deadlines and details.", "low")],
      homeVsHere: [l("En France on dit facilement « non » ; en Inde, on évite souvent le refus direct.", "In France people say “no” easily; in India a direct refusal is often avoided.")],
    },
  },
};
