// Données en dur pour la maquette. Aucune base, aucun appel réseau.
// Le schéma réel est décrit dans DATABASE.md ; ce fichier n'en reprend que ce qu'il
// faut pour afficher la vue pile.

// Les axes de vote sont de la donnée, pas du code (décision 15).
const AXES = [
  { id: 1, nom: 'Probabilité', question: 'Est-ce que je pense que c’est probable ?' },
  { id: 2, nom: 'Intérêt', question: 'Est-ce que je trouve ça intéressant ?' },
  { id: 3, nom: 'Fun', question: 'Est-ce que je trouve ça fun ?' }
];

// L'axe qui sert de tri par défaut (décision 64).
const AXE_TRI_DEFAUT = 2;

// Le présent n'est pas un événement : c'est une frontière (CONCEPTS.md §4). En base il
// n'a aucune ligne, les événements de niveau 1 ont simplement parent_id IS NULL. Ici on
// lui donne l'identifiant 0 pour que la pile puisse le porter comme les autres.
const PRESENT = 0;

// scores : { axe: [somme des ±1, nombre de votes] }
// Le nombre de « pour » vaut (somme + nombre) / 2.
const EVENEMENTS = [
  {
    id: 10,
    titre: 'Une panne de courant prive plus de dix millions de Français d’électricité',
    description: 'Une coupure simultanée touche au moins dix millions d’abonnés en France métropolitaine, pendant six heures ou plus. Le chiffre retenu est celui publié par le gestionnaire du réseau de transport.',
    auteur: 'ancolie',
    cree_le: '2026-02-11',
    echeance: '2029-12-31',
    tags: ['énergie', 'france'],
    parent: PRESENT,
    parentsAlternatifs: [25],
    scores: { 1: [18, 64], 2: [71, 95], 3: [-12, 40] }
  },
  {
    id: 11,
    titre: 'Un parti obtient seul la majorité absolue à l’Assemblée nationale',
    description: 'Un seul parti dispose d’au moins 289 sièges à l’issue d’élections législatives, sans compter ses alliés.',
    auteur: 'kraken',
    cree_le: '2026-01-04',
    echeance: '2032-06-30',
    tags: ['politique', 'france'],
    parent: PRESENT,
    parentsAlternatifs: [],
    scores: { 1: [-4, 88], 2: [54, 76], 3: [9, 31] }
  },
  {
    id: 12,
    titre: 'Le baril de Brent dépasse cent cinquante dollars',
    description: 'Le cours de clôture du Brent dépasse 150 dollars américains au moins une fois.',
    auteur: 'ancolie',
    cree_le: '2026-03-02',
    echeance: '2030-12-31',
    tags: ['énergie', 'économie'],
    parent: PRESENT,
    parentsAlternatifs: [],
    scores: { 1: [22, 58], 2: [31, 49], 3: [-5, 22] }
  },
  {
    id: 13,
    titre: 'Un modèle d’IA réussit l’examen du barreau sans assistance humaine',
    description: 'Un modèle passe l’épreuve complète dans les conditions des candidats humains et obtient la note requise, constatée par l’organisme examinateur.',
    auteur: 'petit_pois',
    cree_le: '2026-04-19',
    echeance: '2028-12-31',
    tags: ['ia'],
    parent: PRESENT,
    parentsAlternatifs: [],
    scores: { 1: [41, 73], 2: [88, 104], 3: [26, 52] }
  },
  {
    id: 14,
    titre: 'Un vaccin thérapeutique contre le cancer du pancréas est autorisé',
    description: 'Une agence du médicament européenne ou américaine délivre une autorisation de mise sur le marché à un vaccin thérapeutique visant le cancer du pancréas.',
    auteur: 'ancolie',
    cree_le: '2026-05-07',
    echeance: '2034-12-31',
    tags: ['santé'],
    parent: PRESENT,
    parentsAlternatifs: [],
    scores: { 1: [5, 42], 2: [46, 58], 3: [12, 24] }
  },
  {
    id: 15,
    titre: 'Une sélection africaine atteint la demi-finale d’une Coupe du monde masculine',
    description: 'Une équipe nationale affiliée à la Confédération africaine de football dispute une demi-finale de Coupe du monde masculine de la FIFA.',
    auteur: 'petit_pois',
    cree_le: '2026-05-12',
    echeance: '2038-12-31',
    tags: ['sport'],
    parent: PRESENT,
    parentsAlternatifs: [],
    scores: { 1: [19, 47], 2: [23, 39], 3: [33, 41] }
  },
  {
    id: 20,
    titre: 'Des émeutes éclatent dans au moins trois préfectures la même nuit',
    description: 'Des affrontements avec les forces de l’ordre sont constatés dans au moins trois chefs-lieux de département au cours d’une même nuit.',
    auteur: 'kraken',
    cree_le: '2026-02-14',
    echeance: '2030-06-30',
    tags: ['ordre public', 'france'],
    parent: 10,
    parentsAlternatifs: [23],
    scores: { 1: [12, 51], 2: [63, 80], 3: [-20, 44] }
  },
  {
    id: 21,
    titre: 'Le gouvernement décrète l’état d’urgence énergétique',
    description: 'Un décret publié au Journal officiel déclare l’état d’urgence énergétique sur tout le territoire métropolitain.',
    auteur: 'ancolie',
    cree_le: '2026-02-12',
    echeance: '2030-12-31',
    tags: ['énergie', 'politique', 'france'],
    parent: 10,
    parentsAlternatifs: [12],
    scores: { 1: [34, 62], 2: [47, 68], 3: [-8, 27] }
  },
  {
    id: 22,
    titre: 'La France suspend sa participation à l’espace Schengen',
    description: 'Le gouvernement rétablit les contrôles à toutes ses frontières terrestres pour une durée supérieure à six mois.',
    auteur: 'petit_pois',
    cree_le: '2026-01-09',
    echeance: '2033-12-31',
    tags: ['politique', 'europe'],
    parent: 11,
    parentsAlternatifs: [],
    scores: { 1: [-11, 57], 2: [39, 61], 3: [4, 25] }
  },
  {
    id: 23,
    titre: 'L’électricité est rationnée pour les particuliers',
    description: 'Des coupures programmées sont imposées aux abonnés résidentiels selon un calendrier publié à l’avance, pendant plus de quinze jours.',
    auteur: 'ancolie',
    cree_le: '2026-02-20',
    echeance: '2031-12-31',
    tags: ['énergie', 'france'],
    parent: 21,
    parentsAlternatifs: [20],
    scores: { 1: [16, 49], 2: [58, 72], 3: [-14, 30] }
  },
  {
    id: 24,
    titre: 'Un manifestant meurt lors d’une intervention policière',
    description: 'Le décès d’une personne participant à une manifestation est établi par une enquête judiciaire comme survenu pendant une intervention des forces de l’ordre.',
    auteur: 'kraken',
    cree_le: '2026-02-15',
    echeance: '2030-12-31',
    tags: ['ordre public', 'france'],
    parent: 20,
    parentsAlternatifs: [22],
    scores: { 1: [27, 66], 2: [44, 70], 3: [-38, 53] }
  },
  {
    id: 25,
    titre: 'Les centres de données sont débranchés en priorité',
    description: 'Un texte réglementaire place les centres de données en tête des installations délestées en cas de tension sur le réseau.',
    auteur: 'petit_pois',
    cree_le: '2026-03-30',
    echeance: '2031-12-31',
    tags: ['énergie', 'ia'],
    parent: 23,
    parentsAlternatifs: [],
    scores: { 1: [8, 37], 2: [52, 59], 3: [17, 28] }
  },
  {
    id: 26,
    titre: 'Un cabinet d’avocats est condamné pour une décision prise par une IA',
    description: 'Une juridiction condamne un cabinet pour un préjudice causé par un conseil produit par un modèle, sans relecture humaine établie.',
    auteur: 'petit_pois',
    cree_le: '2026-04-21',
    echeance: '2029-12-31',
    tags: ['ia', 'justice'],
    parent: 13,
    parentsAlternatifs: [],
    scores: { 1: [35, 60], 2: [66, 81], 3: [11, 34] }
  },
  {
    id: 27,
    titre: 'Un barreau interdit l’usage des modèles de langage à ses membres',
    description: 'Le règlement intérieur d’un barreau interdit explicitement le recours à un modèle de langage pour la rédaction d’actes.',
    auteur: 'kraken',
    cree_le: '2026-04-25',
    echeance: '2029-06-30',
    tags: ['ia', 'justice'],
    parent: 13,
    parentsAlternatifs: [26],
    scores: { 1: [-6, 44], 2: [29, 47], 3: [3, 19] }
  }
];

// Index par identifiant.
const PAR_ID = new Map(EVENEMENTS.map((e) => [e.id, e]));

// Les enfants ne sont jamais stockés (décision 3) : on les trouve par recherche inverse,
// sur le parent canonique comme sur les parents alternatifs.
function enfantsDe(id) {
  return EVENEMENTS.filter(
    (e) => e.parent === id || e.parentsAlternatifs.includes(id)
  );
}

// Tous les parents d'un événement, canonique en premier.
function parentsDe(id) {
  const e = PAR_ID.get(id);
  if (!e) return [];
  return [e.parent, ...e.parentsAlternatifs];
}

// La liste des tags existants, pour les filtres de la colonne de droite.
function tousLesTags() {
  const vus = new Set();
  EVENEMENTS.forEach((e) => e.tags.forEach((t) => vus.add(t)));
  return [...vus].sort((a, b) => a.localeCompare(b, 'fr'));
}
