// Single source of truth for the programmatic-SEO "Solutions métiers" pages
// (/solutions/[metier]). Every field here ends up as real, differentiated
// on-page content (pain points, push examples, FAQ) — the whole point is
// that no two industry pages read as the same template with the name
// swapped, which is what would get this section flagged as duplicate/thin
// content. When adding a métier, write its painPoints/pushExamples/faq from
// how that specific trade actually works, not by copying a neighbor's and
// find-replacing the name.
//
// Numbers (averageTicket, monthlyVisits) are deliberately plausible,
// round-ish estimates for a mid-sized independent shop — used to pre-fill
// the revenue simulator, not asserted anywhere as measured fact. Same for
// each push example's `estimatedOpenRate`: always phrased as an estimate
// (SEO pages are public and unverified numbers must never read as a
// measured guarantee).

export interface PushExample {
  message: string
  estimatedOpenRate: string
}

export interface IndustryFaqItem {
  question: string
  answer: string
}

export interface SeoIndustry {
  slug: string
  name: string
  pluralName: string
  /** Emoji used as the Wallet card's stamp icon in the live preview. */
  stampIcon: string
  /** € — average spend per visit, pre-fills the revenue simulator. */
  averageTicket: number
  /** Average visits/month for an engaged loyal customer — pre-fills the simulator. */
  monthlyVisits: number
  rewardExample: string
  /** Stamps needed to unlock rewardExample — drives the live card preview's grid. */
  rewardThreshold: number
  cardColor: string
  cardTextColor: string
  painPoints: [string, string, string]
  pushExamples: [PushExample, PushExample, PushExample]
  faq: [IndustryFaqItem, IndustryFaqItem, IndustryFaqItem]
}

export const SEO_INDUSTRIES: SeoIndustry[] = [
  {
    slug: 'boulangerie',
    name: 'Boulangerie',
    pluralName: 'Boulangeries',
    stampIcon: '🥐',
    averageTicket: 6,
    monthlyVisits: 12,
    rewardExample: 'La 10ème baguette offerte',
    rewardThreshold: 10,
    cardColor: '#c17a3d',
    cardTextColor: '#ffffff',
    painPoints: [
      'La carte à tamponner en papier traîne au fond d’un sac et finit lavée en machine avant le 10ème passage.',
      'Impossible de savoir si un client du matin ne revient plus l’après-midi, ou s’il a simplement changé de trottoir.',
      'Les invendus du soir (viennoiseries, sandwichs) se jettent faute d’un moyen rapide de prévenir les habitués.',
    ],
    pushExamples: [
      { message: '🥐 Il reste 6 croissants pour ce soir, -30% jusqu’à fermeture.', estimatedOpenRate: '≈ 46% de taux d’ouverture estimé (urgence + créneau court)' },
      { message: 'Votre 10ème baguette est offerte dès votre prochain passage 🍞', estimatedOpenRate: '≈ 38% de taux d’ouverture estimé' },
      { message: 'Ça fait 12 jours qu’on ne vous a pas vu — votre café est toujours au même prix ☕', estimatedOpenRate: '≈ 29% de taux d’ouverture estimé (relance inactivité)' },
    ],
    faq: [
      {
        question: 'Mes clients viennent tous les jours, la carte papier suffit non ?',
        answer: 'C’est justement parce qu’ils viennent souvent que le papier devient le problème : une carte lavée, oubliée ou perdue efface des semaines de fidélité d’un coup. La carte Loyalty vit dans leur téléphone — elle ne se perd jamais, même pour un client qui passe chaque matin.',
      },
      {
        question: 'Puis-je offrir une baguette plutôt qu’une réduction en euros ?',
        answer: 'Oui — la récompense est un texte libre ("10ème baguette offerte", "1 viennoiserie offerte"), pas forcément un montant. C’est votre boulanger qui décide, en caisse, quand la valider.',
      },
      {
        question: 'Est-ce que ça remplace ma caisse enregistreuse ?',
        answer: 'Non, Loyalty tourne à côté de votre système d’encaissement actuel — un QR code au comptoir suffit pour l’inscription, aucune intégration caisse n’est requise pour démarrer.',
      },
    ],
  },
  {
    slug: 'coffee-shop',
    name: 'Coffee-shop',
    pluralName: 'Coffee-shops',
    stampIcon: '☕',
    averageTicket: 5,
    monthlyVisits: 10,
    rewardExample: 'Le 8ème café offert',
    rewardThreshold: 8,
    cardColor: '#5b3a29',
    cardTextColor: '#ffffff',
    painPoints: [
      'Le rush du matin ne laisse pas 10 secondes pour expliquer un programme de fidélité ou tamponner une carte.',
      'Les clients de passage (bureaux, université) changent de quartier sans qu’aucune donnée ne permette de les relancer.',
      'Un carnet de tampons perdu, c’est un client qui recommence à zéro et qui, souvent, ne recommence pas du tout.',
    ],
    pushExamples: [
      { message: '☕ Votre latte habituel vous attend — -1€ avant 10h aujourd’hui.', estimatedOpenRate: '≈ 51% de taux d’ouverture estimé (créneau matinal ciblé)' },
      { message: 'Plus qu’un café avant votre récompense 🎉', estimatedOpenRate: '≈ 34% de taux d’ouverture estimé' },
      { message: 'On a un nouveau grain en test cette semaine, venez goûter ☕', estimatedOpenRate: '≈ 27% de taux d’ouverture estimé (découverte produit)' },
    ],
    faq: [
      {
        question: 'Ça ralentit la file d’attente du matin ?',
        answer: 'Non — le client scanne un QR code une seule fois à l’inscription (5 secondes), puis chaque tampon suivant se fait au comptoir sans friction. Pas d’app à ouvrir, pas de carte à chercher dans un sac.',
      },
      {
        question: 'Mes clients changent souvent de boisson, comment je gère les tampons ?',
        answer: 'Un tampon = une visite, peu importe la boisson commandée. Vous décidez du seuil (8 cafés, 10 boissons…) et de la récompense associée depuis votre tableau de bord, modifiable à tout moment.',
      },
      {
        question: 'Puis-je cibler uniquement les clients du matin ?',
        answer: 'Oui — l’historique d’achat (horaire, fréquence) permet de construire des segments comme "habitués du matin" et de leur envoyer une notification dédiée, différente de celle des clients de l’après-midi.',
      },
    ],
  },
  {
    slug: 'restaurant-japonais',
    name: 'Restaurant japonais',
    pluralName: 'Restaurants japonais',
    stampIcon: '🍣',
    averageTicket: 24,
    monthlyVisits: 3,
    rewardExample: 'Un plateau de makis offert',
    rewardThreshold: 10,
    cardColor: '#b5293e',
    cardTextColor: '#ffffff',
    painPoints: [
      'La clientèle du midi (bureaux à proximité) et celle du soir (dîner) ont des attentes différentes, mais une carte en carton ne fait aucune distinction.',
      'Un client qui adore les makis et un autre qui préfère les bentos reçoivent exactement la même offre générique, quand il y en a une.',
      'Sans aucune donnée d’achat, impossible de savoir qui sont vos 20% de clients qui génèrent 80% du chiffre du midi.',
    ],
    pushExamples: [
      { message: '🍣 Vos makis préférés à -15% ce midi, juste pour vous.', estimatedOpenRate: '≈ 42% de taux d’ouverture estimé (segment "amateurs de makis")' },
      { message: 'Nouveau menu du soir disponible dès ce week-end 🍱', estimatedOpenRate: '≈ 31% de taux d’ouverture estimé' },
      { message: 'Votre plateau offert vous attend — valable jusqu’à dimanche.', estimatedOpenRate: '≈ 37% de taux d’ouverture estimé (récompense proche)' },
    ],
    faq: [
      {
        question: 'Peut-on cibler séparément la clientèle du midi et celle du soir ?',
        answer: 'Oui — Loyalty segmente automatiquement sur l’historique d’achat (horaire, panier, plats commandés), donc un "habitué du midi" et un "amateur de makis du soir" ne reçoivent jamais la même notification.',
      },
      {
        question: 'Et si un client a des allergies ou des préférences précises ?',
        answer: 'Le ciblage par historique d’achat permet d’identifier ce qu’un client commande réellement (plutôt sushis, plutôt plats chauds) pour proposer une offre pertinente — sans jamais stocker de données médicales.',
      },
      {
        question: 'Le QR code fonctionne pour la livraison et l’emporté aussi ?',
        answer: 'Oui, le même QR code s’affiche sur le ticket à emporter ou en caisse — le client scanne au retrait et cumule ses points qu’il mange sur place ou chez lui.',
      },
    ],
  },
  {
    slug: 'pizzeria',
    name: 'Pizzeria',
    pluralName: 'Pizzerias',
    stampIcon: '🍕',
    averageTicket: 16,
    monthlyVisits: 3,
    rewardExample: 'La 8ème pizza offerte',
    rewardThreshold: 8,
    cardColor: '#d64545',
    cardTextColor: '#ffffff',
    painPoints: [
      'Entre livraison, à emporter et sur place, la carte papier ne suit aucun des trois canaux — ou alors trois carnets différents.',
      'Les soirs creux (lundi, mardi) ne se remplissent pas faute d’un moyen simple de relancer les habitués ce jour-là précisément.',
      'Un client qui commande toujours la même pizza n’est jamais reconnu comme tel au prochain passage.',
    ],
    pushExamples: [
      { message: '🍕 Mardi = jour calme chez nous. 2 pizzas achetées = 1 part offerte, ce soir.', estimatedOpenRate: '≈ 44% de taux d’ouverture estimé (offre jour creux)' },
      { message: 'Votre pizza offerte est prête à être réclamée 🎉', estimatedOpenRate: '≈ 35% de taux d’ouverture estimé' },
      { message: 'Nouvelle recette signature disponible dès ce soir.', estimatedOpenRate: '≈ 26% de taux d’ouverture estimé (découverte produit)' },
    ],
    faq: [
      {
        question: 'Ça fonctionne aussi pour les commandes en livraison ?',
        answer: 'Oui — le QR code peut être imprimé sur le ticket de livraison ou affiché sur votre page de commande en ligne ; le client scanne à réception et cumule ses points, même sans passer en boutique.',
      },
      {
        question: 'Peut-on relancer spécifiquement les soirs creux ?',
        answer: 'C’est l’un des Playbooks les plus utilisés en pizzeria : une notification automatique le mardi ou le lundi en fin d’après-midi, envoyée uniquement aux clients qui n’ont pas de commande prévue ce jour-là.',
      },
      {
        question: 'Combien de temps pour mettre en place la carte Wallet ?',
        answer: 'La carte et le QR code sont prêts en quelques minutes depuis votre tableau de bord — pas d’attente de fabrication comme pour des cartes en carton imprimées.',
      },
    ],
  },
  {
    slug: 'burger-artisanal',
    // Deliberately "Restaurant burger", not "Burger artisanal" — `name` gets
    // embedded in sentences like "votre {name}" across the page, and "votre
    // burger artisanal" reads as the sandwich, not the shop. pluralName
    // (used for headings/tags only) keeps the more natural "Burgers
    // Artisanaux" category label.
    name: 'Restaurant burger',
    pluralName: 'Burgers Artisanaux',
    stampIcon: '🍔',
    averageTicket: 15,
    monthlyVisits: 3,
    rewardExample: 'Le 7ème burger offert',
    rewardThreshold: 7,
    cardColor: '#2b1f1a',
    cardTextColor: '#ffffff',
    painPoints: [
      'La concurrence des chaînes de fast-food juste à côté capte les clients occasionnels qui n’ont aucune raison objective de revenir chez vous plutôt qu’ailleurs.',
      'Le pic du vendredi/samedi soir ne laisse pas le temps de présenter un programme de fidélité en caisse.',
      'Sans canal direct, une nouvelle recette ou un burger du mois passe inaperçue auprès des clients déjà conquis.',
    ],
    pushExamples: [
      { message: '🍔 Le burger du mois est sorti — vos habitués le goûtent en premier.', estimatedOpenRate: '≈ 33% de taux d’ouverture estimé' },
      { message: 'Plus qu’un burger avant votre récompense, ce week-end c’est le bon moment 🎉', estimatedOpenRate: '≈ 40% de taux d’ouverture estimé (proche de la récompense)' },
      { message: 'Vendredi soir, -20% sur commande avant 20h pour nos habitués.', estimatedOpenRate: '≈ 47% de taux d’ouverture estimé (créneau + urgence)' },
    ],
    faq: [
      {
        question: 'Comment se différencier des programmes des grandes chaînes ?',
        answer: 'Les chaînes envoient des offres génériques à des millions de personnes ; vous, vous ciblez les 200 clients qui habitent à 10 minutes à pied, avec un message écrit par vous, pas par un algorithme national.',
      },
      {
        question: 'Le scan fonctionne avec un flux important un vendredi soir ?',
        answer: 'Oui — le scan prend 5 secondes et peut se faire à n’importe quel poste de caisse, même en coup de feu ; il n’ajoute pas d’étape bloquante au service.',
      },
      {
        question: 'Puis-je changer la récompense selon la saison ?',
        answer: 'Oui, le seuil et la récompense se modifient à tout moment depuis le tableau de bord — un burger offert l’hiver, une boisson offerte l’été, sans recréer de programme.',
      },
    ],
  },
  {
    slug: 'barbier',
    name: 'Barbier',
    pluralName: 'Barbiers',
    stampIcon: '💈',
    averageTicket: 25,
    monthlyVisits: 1.2,
    rewardExample: 'La 6ème coupe offerte',
    rewardThreshold: 6,
    cardColor: '#1f2d3d',
    cardTextColor: '#ffffff',
    painPoints: [
      'Entre deux coupes, un client peut mettre 4 à 6 semaines à revenir — largement le temps d’oublier une carte en papier au fond d’un tiroir.',
      'Sans rappel, un client fidèle finit par essayer le barbier plus proche de son nouveau bureau, par pure habitude.',
      'Impossible de savoir qui sont vos clients les plus réguliers pour les remercier spécifiquement.',
    ],
    pushExamples: [
      { message: '💈 Ça fait 5 semaines — votre barbe mérite un rafraîchissement.', estimatedOpenRate: '≈ 36% de taux d’ouverture estimé (relance cycle de repousse)' },
      { message: 'Votre 6ème coupe est offerte dès votre prochain rendez-vous.', estimatedOpenRate: '≈ 41% de taux d’ouverture estimé' },
      { message: 'Créneaux calmes ce mardi — passez sans rendez-vous.', estimatedOpenRate: '≈ 28% de taux d’ouverture estimé' },
    ],
    faq: [
      {
        question: 'Mes clients reviennent toutes les 4-6 semaines, c’est trop espacé pour fidéliser ?',
        answer: 'C’est au contraire l’intervalle où la fidélisation compte le plus : c’est justement le délai pendant lequel un client sans rappel teste "juste une fois" le salon plus proche de chez lui. Une notification au bon moment referme cette fenêtre.',
      },
      {
        question: 'Est-ce compatible avec un système de prise de rendez-vous existant ?',
        answer: 'Oui, Loyalty gère la fidélité et les notifications ; votre outil de réservation reste celui que vous utilisez déjà, les deux fonctionnent en parallèle sans conflit.',
      },
      {
        question: 'Puis-je savoir qui sont mes clients les plus fidèles ?',
        answer: 'Le tableau de bord classe vos clients par fréquence et ancienneté de visite — de quoi identifier vos habitués de longue date pour, par exemple, leur offrir une coupe en avant-première d’un nouveau service.',
      },
    ],
  },
  {
    slug: 'salon-de-coiffure',
    name: 'Salon de coiffure',
    pluralName: 'Salons de coiffure',
    stampIcon: '💇',
    averageTicket: 45,
    monthlyVisits: 1,
    rewardExample: 'La 5ème prestation offerte',
    rewardThreshold: 5,
    cardColor: '#c2185b',
    cardTextColor: '#ffffff',
    painPoints: [
      'Le cycle de visite (6 à 8 semaines) rend la relance manuelle (SMS, appel) chronophage pour l’équipe en salon.',
      'Une carte de fidélité papier glissée dans un sac à main se perd aussi facilement qu’elle se tamponne.',
      'Aucune visibilité sur quelles clientes ont arrêté de venir, et depuis quand.',
    ],
    pushExamples: [
      { message: '💇 Ça fait 7 semaines — votre couleur mérite un rafraîchissement.', estimatedOpenRate: '≈ 39% de taux d’ouverture estimé (relance cycle)' },
      { message: 'Votre 5ème prestation est offerte — à utiliser avant la fin du mois.', estimatedOpenRate: '≈ 44% de taux d’ouverture estimé' },
      { message: 'Nouvelle gamme de soins disponible, demandez conseil lors de votre prochain passage.', estimatedOpenRate: '≈ 25% de taux d’ouverture estimé' },
    ],
    faq: [
      {
        question: 'On fait déjà des rappels par SMS, pourquoi changer ?',
        answer: 'Un SMS coûte à chaque envoi et finit souvent ignoré comme un message publicitaire classique. Une notification Wallet arrive sur l’écran verrouillé, sans coût par message, et avec la carte de fidélité directement visible dessous.',
      },
      {
        question: 'Peut-on relancer automatiquement selon le cycle de chaque cliente ?',
        answer: 'Oui — le Playbook de relance d’inactivité se base sur la date du dernier passage et peut être réglé sur le cycle moyen de votre salon (6, 7 ou 8 semaines), sans action manuelle de l’équipe.',
      },
      {
        question: 'La carte peut-elle afficher plusieurs prestations différentes ?',
        answer: 'La carte suit un seul programme de tampons à la fois (coupe, couleur, soin…), mais vous pouvez ajuster son nom, son seuil et sa récompense à tout moment selon ce que vous souhaitez valoriser.',
      },
    ],
  },
  {
    slug: 'institut-beaute',
    name: 'Institut de beauté',
    pluralName: 'Instituts de beauté',
    stampIcon: '💆',
    averageTicket: 55,
    monthlyVisits: 1.5,
    rewardExample: 'Le 6ème soin offert',
    rewardThreshold: 6,
    cardColor: '#9c6b98',
    cardTextColor: '#ffffff',
    painPoints: [
      'Un soin visage et un soin corps n’ont pas le même cycle de retour, mais une carte papier unique ne fait pas la différence.',
      'Les offres saisonnières (soins d’été, cures d’hiver) se perdent faute d’un canal direct vers les clientes déjà abonnées aux soins.',
      'Pas de vision sur quelles prestations génèrent le plus de fidélité réelle, au-delà du chiffre d’affaires du jour.',
    ],
    pushExamples: [
      { message: '💆 Votre peau mérite une pause — soin visage à -20% cette semaine.', estimatedOpenRate: '≈ 34% de taux d’ouverture estimé' },
      { message: 'Votre 6ème soin est offert, prenez rendez-vous avant la fin du mois.', estimatedOpenRate: '≈ 43% de taux d’ouverture estimé' },
      { message: 'Nouvelle cure détox disponible, réservée à nos clientes fidèles.', estimatedOpenRate: '≈ 29% de taux d’ouverture estimé (exclusivité)' },
    ],
    faq: [
      {
        question: 'Puis-je cibler uniquement les clientes intéressées par un type de soin ?',
        answer: 'Oui — l’historique d’achat permet de distinguer une cliente habituée aux soins visage d’une autre plutôt orientée massages, et de leur envoyer des offres différentes en conséquence.',
      },
      {
        question: 'Est-ce adapté à un institut avec plusieurs praticiennes ?',
        answer: 'Oui, le programme de fidélité est rattaché à l’institut, pas à une praticienne en particulier — toute l’équipe peut valider un tampon ou une récompense depuis le même tableau de bord.',
      },
      {
        question: 'Comment relancer une cliente qui vient habituellement par saison (été, hiver) ?',
        answer: 'Une campagne ciblée peut être programmée en avance (par exemple début mai pour les soins d’été) et envoyée uniquement aux clientes qui ont déjà pris ce type de soin l’an dernier.',
      },
    ],
  },
  {
    slug: 'fleuriste',
    name: 'Fleuriste',
    pluralName: 'Fleuristes',
    stampIcon: '💐',
    averageTicket: 28,
    monthlyVisits: 1.5,
    rewardExample: 'Le 6ème bouquet offert',
    rewardThreshold: 6,
    cardColor: '#2e7d4f',
    cardTextColor: '#ffffff',
    painPoints: [
      'Les achats sont souvent liés à une date (anniversaire, fête des mères) : sans rappel automatique, l’occasion passe et le client achète ailleurs au dernier moment.',
      'Un client qui offre des fleurs 3 fois par an n’a pas le temps de remplir une carte papier à tamponner.',
      'Les commandes en ligne et en boutique ne sont jamais reliées sur un même programme de fidélité.',
    ],
    pushExamples: [
      { message: '💐 La Fête des Mères approche — pensez à réserver votre bouquet.', estimatedOpenRate: '≈ 48% de taux d’ouverture estimé (rappel événement calendaire)' },
      { message: 'Votre 6ème bouquet est offert — valable toute occasion.', estimatedOpenRate: '≈ 36% de taux d’ouverture estimé' },
      { message: 'Fleurs de saison fraîchement arrivées ce matin 🌸', estimatedOpenRate: '≈ 24% de taux d’ouverture estimé' },
    ],
    faq: [
      {
        question: 'Mes clients n’achètent que 2-3 fois par an, ça vaut le coup ?',
        answer: 'C’est justement sur ces achats occasionnels et liés à une date que la relance automatique change le plus de choses : un rappel avant la Saint-Valentin ou la Fête des Mères capte une vente qui, sans notification, serait partie chez un concurrent.',
      },
      {
        question: 'Ça fonctionne pour les commandes passées en ligne ?',
        answer: 'Oui — le même QR code peut être intégré à votre page de commande en ligne, et les achats en boutique comme en ligne cumulent sur la même carte de fidélité.',
      },
      {
        question: 'Puis-je programmer des notifications à l’avance pour les fêtes ?',
        answer: 'Oui, les campagnes peuvent être préparées et programmées en amont (Saint-Valentin, Fête des Mères, Noël) et envoyées automatiquement à la date choisie.',
      },
    ],
  },
  {
    slug: 'caviste',
    name: 'Caviste',
    pluralName: 'Cavistes',
    stampIcon: '🍷',
    averageTicket: 22,
    monthlyVisits: 2,
    rewardExample: 'La 8ème bouteille offerte',
    rewardThreshold: 8,
    cardColor: '#5c1f36',
    cardTextColor: '#ffffff',
    painPoints: [
      'Un client qui découvre un vin qu’il adore n’a souvent aucun moyen simple de recevoir un rappel quand un vin similaire arrive en rayon.',
      'Les dégustations et arrivages se communiquent au compte-gouttes, faute d’un canal direct vers les clients déjà intéressés.',
      'La carte de fidélité papier ne distingue jamais un amateur de vin rouge d’un amateur de champagne.',
    ],
    pushExamples: [
      { message: '🍷 Nouvel arrivage de Bourgogne ce vendredi, places limitées à la dégustation.', estimatedOpenRate: '≈ 32% de taux d’ouverture estimé' },
      { message: 'Votre 8ème bouteille est offerte, valable sur toute la cave.', estimatedOpenRate: '≈ 40% de taux d’ouverture estimé' },
      { message: 'Les fêtes approchent — réservez vos champagnes avant rupture de stock.', estimatedOpenRate: '≈ 45% de taux d’ouverture estimé (urgence saisonnière)' },
    ],
    faq: [
      {
        question: 'Peut-on cibler les clients selon leurs goûts (rouge, blanc, champagne) ?',
        answer: 'Oui — l’historique d’achat permet de distinguer un client plutôt rouge d’un client plutôt champagne, et d’adapter les notifications d’arrivage ou de dégustation en conséquence.',
      },
      {
        question: 'Est-ce pertinent pour des achats irréguliers dans l’année ?',
        answer: 'Oui, c’est même l’un des cas où un canal direct change le plus de choses : un rappel avant les fêtes de fin d’année, quand les achats de vin et champagne sont les plus fréquents, capte des ventes qui autrement se feraient ailleurs.',
      },
      {
        question: 'Puis-je annoncer une dégustation uniquement à mes meilleurs clients ?',
        answer: 'Oui, un segment "clients fidèles" basé sur la fréquence ou le montant d’achat peut recevoir une invitation en exclusivité avant une annonce plus large.',
      },
    ],
  },
  {
    slug: 'pressing',
    name: 'Pressing',
    pluralName: 'Pressings',
    stampIcon: '👔',
    averageTicket: 12,
    monthlyVisits: 4,
    rewardExample: 'Le 10ème nettoyage offert',
    rewardThreshold: 10,
    cardColor: '#2b6ca3',
    cardTextColor: '#ffffff',
    painPoints: [
      'Un client dépose et récupère son linge en quelques minutes — pas le temps de présenter un programme de fidélité ni de chercher une carte.',
      'Aucun rappel quand un vêtement est prêt, au-delà d’un ticket papier facilement égaré.',
      'Les clients de bureaux à proximité changent d’employeur sans qu’aucune donnée ne permette de comprendre pourquoi la fréquentation baisse.',
    ],
    pushExamples: [
      { message: '👔 Votre linge est prêt, récupérable dès maintenant.', estimatedOpenRate: '≈ 58% de taux d’ouverture estimé (information utile immédiate)' },
      { message: 'Votre 10ème nettoyage est offert.', estimatedOpenRate: '≈ 37% de taux d’ouverture estimé' },
      { message: 'Service couettes et textiles volumineux disponible ce mois-ci.', estimatedOpenRate: '≈ 22% de taux d’ouverture estimé' },
    ],
    faq: [
      {
        question: 'Peut-on prévenir un client que son linge est prêt via Loyalty ?',
        answer: 'Oui — une notification manuelle "linge prêt" peut être envoyée en un clic depuis le tableau de bord à un client ciblé, sans dépendre d’un SMS payant.',
      },
      {
        question: 'Le scan ralentit le passage en caisse ?',
        answer: 'Non, l’inscription se fait une seule fois en 5 secondes ; les passages suivants se tamponnent directement en caisse sans étape supplémentaire.',
      },
      {
        question: 'Est-ce adapté à une clientèle de bureaux qui change souvent ?',
        answer: 'Oui — le tableau de bord permet de voir qui ralentit sa fréquence de visite et de déclencher une relance automatique avant que le client ne parte définitivement chez un concurrent.',
      },
    ],
  },
  {
    slug: 'salle-de-sport',
    name: 'Salle de sport',
    pluralName: 'Salles de sport',
    stampIcon: '💪',
    averageTicket: 15,
    monthlyVisits: 8,
    rewardExample: 'Un mois de produits boutique offert',
    rewardThreshold: 10,
    cardColor: '#1a1a1a',
    cardTextColor: '#ffffff',
    painPoints: [
      'Le plus gros churn arrive dans les 6 premières semaines après l’inscription, sans qu’aucun rappel n’intervienne au bon moment.',
      'Les ventes additionnelles (boutique, coaching, cours collectifs) ne sont jamais poussées au bon adhérent au bon moment.',
      'Impossible de distinguer un adhérent assidu d’un adhérent qui a arrêté de venir mais paie encore son abonnement sans le savoir.',
    ],
    pushExamples: [
      { message: '💪 On ne vous a pas vu depuis 10 jours — votre prochaine séance vous attend.', estimatedOpenRate: '≈ 35% de taux d’ouverture estimé (relance anti-churn)' },
      { message: 'Nouveau cours collectif ce mardi 19h, places limitées.', estimatedOpenRate: '≈ 30% de taux d’ouverture estimé' },
      { message: 'Votre récompense boutique est débloquée 🎉', estimatedOpenRate: '≈ 41% de taux d’ouverture estimé' },
    ],
    faq: [
      {
        question: 'Comment identifier les adhérents qui vont résilier ?',
        answer: 'Le tableau de bord suit la fréquence de passage par adhérent — une baisse marquée déclenche automatiquement une notification de relance, avant que le client ne décide de résilier.',
      },
      {
        question: 'Ça remplace notre logiciel de gestion d’abonnements ?',
        answer: 'Non, Loyalty se concentre sur le passage en salle (scan à l’accueil, tampons, notifications) et fonctionne en complément de votre outil de gestion d’abonnements existant.',
      },
      {
        question: 'Peut-on pousser des offres de coaching ciblées ?',
        answer: 'Oui — un segment "adhérents réguliers depuis 3 mois sans coaching" peut recevoir une offre dédiée, différente de celle envoyée à un nouvel inscrit.',
      },
    ],
  },
  {
    slug: 'boucherie',
    name: 'Boucherie',
    pluralName: 'Boucheries',
    stampIcon: '🥩',
    averageTicket: 18,
    monthlyVisits: 6,
    rewardExample: 'Le 10ème passage, -10% offerts',
    rewardThreshold: 10,
    cardColor: '#8b1e1e',
    cardTextColor: '#ffffff',
    painPoints: [
      'Les grandes surfaces voisines cassent les prix sur les mêmes produits, sans qu’une boucherie de quartier ait de canal direct pour défendre sa valeur ajoutée.',
      'Les commandes spéciales (fêtes, barbecue, pièces à réserver) se perdent faute de rappel au bon moment.',
      'Aucune carte papier ne survit à un sac de courses rempli de viande fraîche.',
    ],
    pushExamples: [
      { message: '🥩 Pensez à réserver votre commande pour le barbecue de ce week-end.', estimatedOpenRate: '≈ 39% de taux d’ouverture estimé (rappel saisonnier)' },
      { message: 'Votre 10ème passage débloque -10% sur votre prochaine commande.', estimatedOpenRate: '≈ 33% de taux d’ouverture estimé' },
      { message: 'Arrivage de pièces de bœuf maturées cette semaine.', estimatedOpenRate: '≈ 25% de taux d’ouverture estimé' },
    ],
    faq: [
      {
        question: 'Comment lutter contre les prix de la grande distribution avec ça ?',
        answer: 'Loyalty ne baisse pas vos prix, il renforce la raison de rester : un canal direct vers vos clients réguliers, pour rappeler vos arrivages, vos conseils et vos commandes spéciales qu’un rayon en supermarché ne propose pas.',
      },
      {
        question: 'Peut-on rappeler une commande spéciale (fêtes, événement) ?',
        answer: 'Oui, une notification manuelle peut être envoyée à un client ciblé pour lui rappeler de passer commande avant une date précise (Noël, un anniversaire, un barbecue).',
      },
      {
        question: 'Le scan fonctionne avec des mains parfois occupées ou gantées ?',
        answer: 'Le client scanne son propre téléphone depuis sa poche ou son sac — vous n’avez qu’à valider le tampon côté caisse, sans manipulation supplémentaire de votre part.',
      },
    ],
  },
  {
    slug: 'primeur',
    name: 'Primeur',
    pluralName: 'Primeurs',
    stampIcon: '🥕',
    averageTicket: 14,
    monthlyVisits: 8,
    rewardExample: 'Le 10ème panier, -15% offerts',
    rewardThreshold: 10,
    cardColor: '#e07a28',
    cardTextColor: '#ffffff',
    painPoints: [
      'Les produits de saison changent chaque semaine, mais aucun canal ne permet de prévenir les clients intéressés par un arrivage précis.',
      'La concurrence des supermarchés de proximité capte les achats impulsifs faute de rappel régulier.',
      'Un client fidèle de longue date n’est jamais reconnu différemment d’un client de passage.',
    ],
    pushExamples: [
      { message: '🥕 Arrivage de fraises locales ce matin, en quantité limitée.', estimatedOpenRate: '≈ 37% de taux d’ouverture estimé (produit de saison)' },
      { message: 'Votre 10ème panier débloque -15% sur votre prochain passage.', estimatedOpenRate: '≈ 34% de taux d’ouverture estimé' },
      { message: 'Nouveaux producteurs locaux référencés cette semaine.', estimatedOpenRate: '≈ 23% de taux d’ouverture estimé' },
    ],
    faq: [
      {
        question: 'Les produits changent chaque semaine, comment communiquer dessus simplement ?',
        answer: 'Une notification manuelle se rédige et s’envoie en quelques minutes depuis le tableau de bord — pas besoin de préparer une campagne à l’avance pour annoncer un arrivage du jour.',
      },
      {
        question: 'Peut-on cibler les clients intéressés par les produits bio ou locaux ?',
        answer: 'Oui, si votre caisse distingue ces catégories, l’historique d’achat permet de construire un segment dédié et de lui envoyer une offre spécifique.',
      },
      {
        question: 'Est-ce adapté à un stand de marché, pas seulement une boutique fixe ?',
        answer: 'Oui — le QR code s’affiche sur un simple support imprimé, utilisable aussi bien sur un étal de marché que dans une boutique.',
      },
    ],
  },
  {
    slug: 'poissonnerie',
    name: 'Poissonnerie',
    pluralName: 'Poissonneries',
    stampIcon: '🐟',
    averageTicket: 20,
    monthlyVisits: 4,
    rewardExample: 'Le 8ème passage, -10% offerts',
    rewardThreshold: 8,
    cardColor: '#1b6f8c',
    cardTextColor: '#ffffff',
    painPoints: [
      'L’arrivage du jour dépend de la pêche — un client qui cherche un poisson précis n’a aucun moyen d’être prévenu de sa disponibilité.',
      'Les commandes pour les fêtes (huîtres, plateaux) se perdent sans rappel, au profit de la grande distribution qui communique plus largement.',
      'Aucune carte papier ne résiste longtemps à une activité où l’on manipule constamment eau et glace.',
    ],
    pushExamples: [
      { message: '🐟 Arrivage de bar de ligne ce matin, quantité limitée.', estimatedOpenRate: '≈ 36% de taux d’ouverture estimé' },
      { message: 'Pensez à réserver vos huîtres pour les fêtes.', estimatedOpenRate: '≈ 44% de taux d’ouverture estimé (rappel saisonnier)' },
      { message: 'Votre 8ème passage débloque -10% sur votre prochaine commande.', estimatedOpenRate: '≈ 32% de taux d’ouverture estimé' },
    ],
    faq: [
      {
        question: 'La carte résiste à un environnement humide, comptoir avec glace ?',
        answer: 'La carte est 100% numérique, dans le téléphone du client — elle n’a jamais besoin d’être manipulée près de l’eau ou de la glace de votre étal.',
      },
      {
        question: 'Peut-on prévenir d’un arrivage précis le jour même ?',
        answer: 'Oui, une notification manuelle s’envoie en quelques minutes à vos clients fidèles dès que l’arrivage du matin est connu.',
      },
      {
        question: 'Comment gérer les commandes pour les fêtes de fin d’année ?',
        answer: 'Une campagne peut être programmée à l’avance (début décembre par exemple) pour rappeler à vos clients de réserver leurs plateaux ou huîtres avant la période de forte demande.',
      },
    ],
  },
  {
    slug: 'salon-manucure',
    name: 'Salon de manucure',
    pluralName: 'Salons de manucure',
    stampIcon: '💅',
    averageTicket: 35,
    monthlyVisits: 1.5,
    rewardExample: 'La 6ème pose offerte',
    rewardThreshold: 6,
    cardColor: '#d6336c',
    cardTextColor: '#ffffff',
    painPoints: [
      'Le cycle de repousse (3 à 4 semaines) est précis, mais sans rappel automatique, la cliente prend rendez-vous "quand elle y pense" — souvent ailleurs.',
      'Une carte de fidélité papier se raye et s’abîme aussi vite que les ongles qu’elle est censée récompenser.',
      'Aucune visibilité sur quelles clientes testent un nouveau salon après des années de fidélité.',
    ],
    pushExamples: [
      { message: '💅 Ça fait 4 semaines — votre pose mérite un rafraîchissement.', estimatedOpenRate: '≈ 42% de taux d’ouverture estimé (relance cycle de repousse)' },
      { message: 'Votre 6ème pose est offerte, prenez rendez-vous avant la fin du mois.', estimatedOpenRate: '≈ 45% de taux d’ouverture estimé' },
      { message: 'Nouvelle collection de couleurs disponible dès cette semaine.', estimatedOpenRate: '≈ 24% de taux d’ouverture estimé' },
    ],
    faq: [
      {
        question: 'Comment relancer automatiquement selon le cycle de repousse ?',
        answer: 'Le Playbook de relance d’inactivité peut être réglé sur l’intervalle moyen de votre salon (3, 4 ou 5 semaines) et se déclenche automatiquement, sans action manuelle de l’équipe.',
      },
      {
        question: 'Est-ce adapté si plusieurs prestations existent (gel, semi-permanent, nail art) ?',
        answer: 'Oui, vous définissez un seul programme de tampons global, mais l’historique d’achat permet de voir quelle prestation chaque cliente préfère pour personnaliser vos offres.',
      },
      {
        question: 'La carte fonctionne avec un système de réservation en ligne existant ?',
        answer: 'Oui, les deux outils fonctionnent côte à côte : la réservation reste gérée par votre outil actuel, Loyalty gère la fidélité et les relances.',
      },
    ],
  },
  {
    slug: 'spa-massage',
    name: 'Spa & massage',
    pluralName: 'Spas & instituts de massage',
    stampIcon: '🧖',
    averageTicket: 65,
    monthlyVisits: 1,
    rewardExample: 'Le 5ème massage offert',
    rewardThreshold: 5,
    cardColor: '#6b8f82',
    cardTextColor: '#ffffff',
    painPoints: [
      'Un soin détente est souvent un achat "plaisir" repoussé semaine après semaine faute de rappel au bon moment.',
      'Les offres cadeaux (fêtes, anniversaires) ne touchent jamais les clients existants, seulement les nouveaux visiteurs du site.',
      'Aucun moyen simple de savoir quels massages ou soins génèrent le plus de clients réguliers.',
    ],
    pushExamples: [
      { message: '🧖 Offrez-vous une pause bien méritée — -15% ce mois-ci sur nos massages signature.', estimatedOpenRate: '≈ 31% de taux d’ouverture estimé' },
      { message: 'Votre 5ème massage est offert, réservez votre créneau.', estimatedOpenRate: '≈ 40% de taux d’ouverture estimé' },
      { message: 'Les fêtes approchent — pensez aux bons cadeaux pour vos proches.', estimatedOpenRate: '≈ 35% de taux d’ouverture estimé (rappel saisonnier)' },
    ],
    faq: [
      {
        question: 'Mes clients viennent rarement, ça vaut quand même le coup ?',
        answer: 'Avec un ticket moyen élevé et des achats peu fréquents, chaque relance qui ramène un client vaut proportionnellement beaucoup plus qu’ailleurs — c’est exactement le profil où un rappel au bon moment change le plus un chiffre d’affaires mensuel.',
      },
      {
        question: 'Peut-on vendre des bons cadeaux via Loyalty ?',
        answer: 'Loyalty ne gère pas la vente en ligne de bons cadeaux, mais vous pouvez notifier vos clients existants d’une offre cadeau disponible en institut ou sur votre site, au moment opportun (fêtes, anniversaires).',
      },
      {
        question: 'La carte distingue-t-elle les différents soins proposés ?',
        answer: 'Le programme de fidélité compte les passages de façon globale, mais l’historique d’achat garde la trace du type de soin pour affiner vos offres par la suite.',
      },
    ],
  },
  {
    slug: 'animalerie',
    name: 'Animalerie',
    pluralName: 'Animaleries',
    stampIcon: '🐾',
    averageTicket: 25,
    monthlyVisits: 3,
    rewardExample: 'Le 10ème sac de croquettes, -20%',
    rewardThreshold: 10,
    cardColor: '#7a5c3e',
    cardTextColor: '#ffffff',
    painPoints: [
      'Les achats récurrents (croquettes, litière) sont prévisibles mais partent facilement vers des sites en ligne moins chers sans programme de fidélité réel.',
      'Le toilettage et les accessoires ne sont jamais rappelés au bon moment, entre deux achats d’alimentation.',
      'Aucune donnée sur quels clients ont plusieurs animaux, ni sur leurs habitudes d’achat.',
    ],
    pushExamples: [
      { message: '🐾 Votre stock de croquettes doit toucher à sa fin — pensez à renouveler.', estimatedOpenRate: '≈ 38% de taux d’ouverture estimé (rappel réapprovisionnement)' },
      { message: 'Votre 10ème sac débloque -20% sur votre prochain achat.', estimatedOpenRate: '≈ 33% de taux d’ouverture estimé' },
      { message: 'Créneaux de toilettage disponibles cette semaine.', estimatedOpenRate: '≈ 22% de taux d’ouverture estimé' },
    ],
    faq: [
      {
        question: 'Comment rivaliser avec les sites en ligne sur les achats récurrents ?',
        answer: 'Un rappel envoyé juste avant la fin probable d’un sac de croquettes (basé sur la fréquence d’achat passée) capte le réachat avant que le client ne pense à commander en ligne.',
      },
      {
        question: 'Peut-on relancer pour le toilettage séparément de l’alimentation ?',
        answer: 'Oui, l’historique d’achat distingue les catégories de produits et de services, ce qui permet d’envoyer une notification toilettage uniquement aux clients concernés.',
      },
      {
        question: 'Un client avec plusieurs animaux a-t-il plusieurs cartes ?',
        answer: 'Non, une seule carte par client, quel que soit le nombre d’animaux — les achats pour chaque animal cumulent sur le même programme de fidélité.',
      },
    ],
  },
  {
    slug: 'traiteur',
    name: 'Traiteur',
    pluralName: 'Traiteurs',
    stampIcon: '🍽️',
    averageTicket: 30,
    monthlyVisits: 2,
    rewardExample: 'Le 8ème plat, -15% offerts',
    rewardThreshold: 8,
    cardColor: '#2f4f3f',
    cardTextColor: '#ffffff',
    painPoints: [
      'Les commandes pour événements (anniversaires, fêtes de fin d’année) se perdent faute de rappel au bon moment dans l’année.',
      'Un client qui commande régulièrement pour le déjeuner du bureau n’est jamais distingué d’un client occasionnel.',
      'Les plats du jour changent quotidiennement, sans canal direct pour les annoncer aux habitués.',
    ],
    pushExamples: [
      { message: '🍽️ Le plat du jour de ce midi : à réserver avant 11h.', estimatedOpenRate: '≈ 43% de taux d’ouverture estimé (urgence créneau midi)' },
      { message: 'Votre 8ème plat débloque -15% sur votre prochaine commande.', estimatedOpenRate: '≈ 34% de taux d’ouverture estimé' },
      { message: 'Les fêtes de fin d’année approchent — réservez votre menu traiteur dès maintenant.', estimatedOpenRate: '≈ 40% de taux d’ouverture estimé (rappel saisonnier)' },
    ],
    faq: [
      {
        question: 'Peut-on annoncer le plat du jour chaque matin facilement ?',
        answer: 'Oui, une notification manuelle se rédige et s’envoie en moins d’une minute depuis le tableau de bord — de quoi annoncer le plat du jour avant le rush du déjeuner.',
      },
      {
        question: 'Comment relancer pour les grosses commandes événementielles ?',
        answer: 'Une campagne peut être programmée en amont des périodes clés (fêtes de fin d’année, rentrée) pour rappeler aux clients fidèles de réserver leur menu avant les dates les plus demandées.',
      },
      {
        question: 'Peut-on distinguer les clients "déjeuner bureau" des clients "événementiel" ?',
        answer: 'Oui, l’historique d’achat (fréquence, montant, type de commande) permet de construire ces deux segments et de leur adresser des offres différentes.',
      },
    ],
  },
  {
    slug: 'brasserie',
    name: 'Brasserie',
    pluralName: 'Brasseries',
    stampIcon: '🍺',
    averageTicket: 18,
    monthlyVisits: 4,
    rewardExample: 'La 10ème consommation offerte',
    rewardThreshold: 10,
    cardColor: '#a8762c',
    cardTextColor: '#ffffff',
    painPoints: [
      'Les soirs de match ou d’événements sportifs sont imprévisibles à remplir sans un canal direct pour prévenir les habitués à l’avance.',
      'Un client de l’happy hour et un client du dîner du vendredi ont des attentes différentes, jamais distinguées par une carte papier.',
      'Les arrivages de bières de saison ou les nouvelles cartes ne sont jamais annoncés aux clients déjà intéressés.',
    ],
    pushExamples: [
      { message: '🍺 Match ce soir, grand écran et happy hour prolongée jusqu’au coup d’envoi.', estimatedOpenRate: '≈ 46% de taux d’ouverture estimé (événement + créneau)' },
      { message: 'Votre 10ème consommation est offerte, à consommer avec modération.', estimatedOpenRate: '≈ 37% de taux d’ouverture estimé' },
      { message: 'Nouvelle bière de saison disponible à la pression dès ce soir.', estimatedOpenRate: '≈ 27% de taux d’ouverture estimé' },
    ],
    faq: [
      {
        question: 'Peut-on remplir la brasserie les soirs de match en avance ?',
        answer: 'Oui — une notification envoyée la veille ou le matin d’un match annonçant l’écran géant et une offre happy hour capte les clients avant qu’ils ne choisissent un autre établissement.',
      },
      {
        question: 'Peut-on distinguer la clientèle happy hour de celle du dîner ?',
        answer: 'Oui, l’historique d’achat (horaire, panier moyen) permet de segmenter ces deux profils et de leur envoyer des offres adaptées à chacun.',
      },
      {
        question: 'Le scan est gérable avec un service au comptoir et en salle ?',
        answer: 'Oui, le QR code peut être affiché au comptoir et sur les tables ; le client scanne une seule fois à l’inscription puis cumule ses points lors de chaque passage, quel que soit le mode de service.',
      },
    ],
  },
]

export function getSeoIndustry(slug: string): SeoIndustry | undefined {
  return SEO_INDUSTRIES.find((industry) => industry.slug === slug)
}
