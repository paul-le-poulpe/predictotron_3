// Maquette de la vue pile de journaux.
// Applique les décisions 48 à 66 de DECISIONS.md. Voir maquette/README.md pour ce
// que cette maquette montre et ce qu'elle ne montre pas.

'use strict';

// --------------------------------------------------------------------- état

// Le chemin parcouru, sous forme de suite d'identifiants. Le dernier est le journal
// courant (PAGES.md §1.4). C'est un parcours, pas une donnée du graphe.
let chemin = [PRESENT];

// Nombre de futurs possibles dépliés, par POSITION dans le chemin et non par
// identifiant : le même événement peut apparaître deux fois dans la pile
// (décision 60), et chaque occurrence a son propre état.
let deplies = [];

const PAS_FUTURS = 4;          // combien on affiche, puis combien « voir plus » ajoute

let filtresTags = new Set();   // vide = aucun filtre
let critereTri = 'score:' + AXE_TRI_DEFAUT;

// Les votes de l'utilisateur, uniquement pour que les boutons réagissent dans la
// maquette. Clé : `${idEvenement}:${idAxe}`, valeur : +1 ou -1.
const mesVotes = new Map();

// ------------------------------------------------------------------ le chemin

// Remonte de parent canonique en parent canonique jusqu'au présent (décision 55).
// Cette remontée termine toujours : le graphe canonique est acyclique et enraciné
// (CONCEPTS.md §3), donc aucune liste d'événements déjà visités n'est nécessaire.
function cheminCanonique(id) {
  const suite = [];
  let courant = id;
  while (courant !== PRESENT && PAR_ID.has(courant)) {
    suite.unshift(courant);
    courant = PAR_ID.get(courant).parent;
  }
  return [PRESENT, ...suite];
}

// Un chemin reçu par l'URL peut être faux. On vérifie que chaque couple consécutif
// est un vrai lien parent → enfant ; sinon on retombe sur les parents canoniques
// (décision 62).
function cheminValide(suite) {
  if (!suite.length || suite[0] !== PRESENT) return false;
  for (let i = 1; i < suite.length; i++) {
    if (!PAR_ID.has(suite[i])) return false;
    if (!parentsDe(suite[i]).includes(suite[i - 1])) return false;
  }
  return true;
}

function lireURL() {
  const brut = location.hash.replace(/^#\/?e\/?/, '');
  if (!brut) return [PRESENT];
  const suite = brut.split('-').map((n) => parseInt(n, 10));
  if (suite.some(Number.isNaN)) return [PRESENT];
  if (cheminValide(suite)) return suite;
  const dernier = suite[suite.length - 1];
  return PAR_ID.has(dernier) ? cheminCanonique(dernier) : [PRESENT];
}

// L'URL porte le chemin (décision 58) et est réécrite sans ajouter d'entrée à
// l'historique (décision 59) : le bouton « retour » du navigateur ramène à la page
// précédente, il ne dépile pas (décision 56).
//
// La maquette est un fichier local, donc le chemin vit dans le fragment (#). Dans le
// site, ce sera un vrai chemin d'URL : /e/0-10-21.
function ecrireURL() {
  history.replaceState(null, '', '#/e/' + chemin.join('-'));
}

// ------------------------------------------------------------- tri et filtres

function score(ev, axe) { return ev.scores[axe][0]; }
function nbVotes(ev, axe) { return ev.scores[axe][1]; }

function trier(liste) {
  const copie = [...liste];
  const [genre, axe] = critereTri.split(':');
  if (genre === 'score') copie.sort((a, b) => score(b, +axe) - score(a, +axe));
  else if (genre === 'votes') copie.sort((a, b) => nbVotes(b, +axe) - nbVotes(a, +axe));
  else if (genre === 'date_creation') copie.sort((a, b) => b.cree_le.localeCompare(a.cree_le));
  else if (genre === 'echeance') copie.sort((a, b) => a.echeance.localeCompare(b.echeance));
  return copie;
}

function filtrer(liste) {
  if (!filtresTags.size) return liste;
  return liste.filter((e) => e.tags.some((t) => filtresTags.has(t)));
}

function futursDe(id) {
  return trier(filtrer(enfantsDe(id)));
}

// ------------------------------------------------------------------ rendu

function el(balise, classe, texte) {
  const n = document.createElement(balise);
  if (classe) n.className = classe;
  if (texte !== undefined) n.textContent = texte;
  return n;
}

function annee(date) { return date.slice(0, 4); }

// Rotation calculée depuis l'identifiant, donc stable : dépiler puis réempiler
// redonne le même angle. Le prototype la tirait au hasard à chaque affichage, ce qui
// faisait changer la pile d'aspect. Le choix définitif reste reporté (PAGES.md).
function rotation(id, position) {
  const graine = (id * 2654435761 + position * 97) % 1000;
  return ((graine / 1000) * 5 - 2.5).toFixed(2);
}

function bandeau(ev, position, recouvert) {
  const bloc = el('div', 'bandeau');
  bloc.appendChild(el('h1', 'titre', ev ? ev.titre : 'Le présent'));

  const infos = ev
    ? ['Univers : le futur', 'Avant ' + annee(ev.echeance)].join('  —  ')
    : 'Univers : le futur  —  Point de départ  —  Frontière mobile';
  bloc.appendChild(el('div', 'sous-bandeau', infos));

  if (recouvert) {
    bloc.addEventListener('click', () => depilerJusque(position));
  }
  return bloc;
}

function sectionNotation(ev) {
  const sec = el('section', 'section');
  sec.appendChild(el('h2', null, 'Ce qu’en disent les lecteurs'));

  const axes = el('div', 'axes');
  AXES.forEach((axe) => {
    const bloc = el('div', 'axe');
    bloc.appendChild(el('div', 'nom', axe.nom));
    bloc.appendChild(el('div', 'question', axe.question));

    const monVote = mesVotes.get(ev.id + ':' + axe.id);
    [['Pour', 1], ['Contre', -1]].forEach(([libelle, valeur]) => {
      const b = el('button', null, libelle);
      b.setAttribute('aria-pressed', String(monVote === valeur));
      b.addEventListener('click', () => {
        const cle = ev.id + ':' + axe.id;
        if (mesVotes.get(cle) === valeur) mesVotes.delete(cle);  // un vote se retire
        else mesVotes.set(cle, valeur);
        rendre();
      });
      bloc.appendChild(b);
    });
    bloc.appendChild(el('span', 'total',
      'score ' + (score(ev, axe.id) >= 0 ? '+' : '') + score(ev, axe.id) +
      ' sur ' + nbVotes(ev, axe.id) + ' votes'));

    // Pour / contre : (score + nombre de votes) / 2 donne les « pour ».
    const total = nbVotes(ev, axe.id);
    const pour = (score(ev, axe.id) + total) / 2;
    const part = total ? Math.round((pour / total) * 100) : 0;

    const jauge = el('div', 'jauge');
    const g = el('div', 'pour'); g.style.width = part + '%';
    const d = el('div', 'contre'); d.style.width = (100 - part) + '%';
    jauge.append(g, d);
    bloc.appendChild(jauge);

    const legende = el('div', 'jauge-legende');
    legende.append(el('span', null, part + ' % pour'), el('span', null, (100 - part) + ' % contre'));
    bloc.appendChild(legende);

    axes.appendChild(bloc);
  });

  sec.appendChild(axes);
  return sec;
}

function sectionChemins(ev, parentAffiche) {
  const autres = parentsDe(ev.id).filter((p) => p !== parentAffiche && PAR_ID.has(p));
  if (!autres.length) return null;

  const sec = el('section', 'section');
  sec.appendChild(el('h2', null, 'Cet événement peut aussi venir d’ailleurs'));

  const liste = el('ul', 'chemins');
  autres.forEach((p) => {
    liste.appendChild(el('li', null, PAR_ID.get(p).titre + '.'));
  });
  sec.appendChild(liste);
  return sec;
}

// La valeur sur laquelle la liste est triée, pour que l'ordre affiché soit lisible.
function infoTri(ev) {
  const [genre, axe] = critereTri.split(':');
  const nomAxe = () => AXES.find((a) => a.id === +axe).nom.toLowerCase();
  if (genre === 'score') {
    const s = score(ev, +axe);
    return nomAxe() + ' ' + (s >= 0 ? '+' : '') + s;
  }
  if (genre === 'votes') return nbVotes(ev, +axe) + ' votes (' + nomAxe() + ')';
  if (genre === 'date_creation') return 'ajouté le ' + ev.cree_le.split('-').reverse().join('/');
  return '';
}

function sectionFuturs(id, position) {
  const sec = el('section', 'section');
  sec.appendChild(el('h2', null, 'Ce qui peut arriver ensuite'));

  const tous = futursDe(id);
  if (!tous.length) {
    sec.appendChild(el('p', 'vide',
      filtresTags.size
        ? 'Aucun futur possible ne porte les tags sélectionnés.'
        : 'Personne n’a encore proposé de suite à cet événement.'));
    return sec;
  }

  const combien = deplies[position] || PAS_FUTURS;
  const liste = el('ul', 'futurs');

  tous.slice(0, combien).forEach((ev) => {
    const li = el('li', 'futur');
    li.appendChild(el('div', 'futur-titre', ev.titre));
    li.appendChild(el('div', 'futur-infos',
      [infoTri(ev), 'avant ' + annee(ev.echeance)].filter(Boolean).join('  ·  ')));
    li.appendChild(el('div', 'futur-tags', ev.tags.join(', ')));
    li.addEventListener('click', () => empiler(ev.id, position));
    liste.appendChild(li);
  });
  sec.appendChild(liste);

  if (tous.length > combien) {
    const b = el('button', 'voir-plus',
      'Voir plus  (' + (tous.length - combien) + ' de plus)');
    b.addEventListener('click', () => {
      deplies[position] = combien + PAS_FUTURS;
      rendre();
    });
    sec.appendChild(b);
  }
  return sec;
}

function corpsPresent(position) {
  const corps = el('div', 'corps');
  corps.appendChild(el('p', 'surtitre', 'Nous sommes ici'));
  corps.appendChild(el('div', 'signature', 'Le point de départ de l’univers'));

  corps.appendChild(el('div', 'non-defini',
    'Le contenu de ce journal n’est pas défini (PAGES.md §1.5). Il ne représente pas un ' +
    'événement : le présent est une frontière, pas une ligne en base. La piste évoquée est ' +
    'd’y placer des catégories à choisir, qui détermineraient les événements proposés ensuite.'));

  corps.appendChild(sectionFuturs(PRESENT, position));
  return corps;
}

function corpsEvenement(ev, position, parentAffiche) {
  const corps = el('div', 'corps');
  corps.appendChild(el('p', 'surtitre', ev.tags.join('  ·  ')));
  corps.appendChild(el('div', 'signature', 'Signé ' + ev.auteur));

  const texte = el('div', 'texte' + (ev.description.length > 320 ? ' deux-colonnes' : ''));
  texte.appendChild(el('p', null, ev.description));
  corps.appendChild(texte);

  corps.appendChild(sectionNotation(ev));

  const chemins = sectionChemins(ev, parentAffiche);
  if (chemins) corps.appendChild(chemins);

  corps.appendChild(sectionFuturs(ev.id, position));
  return corps;
}

const empilement = document.getElementById('empilement');

function rendre() {
  empilement.textContent = '';

  chemin.forEach((id, position) => {
    const recouvert = position < chemin.length - 1;
    const ev = PAR_ID.get(id) || null;

    const journal = el('article', 'journal' + (recouvert ? ' recouvert' : ''));
    journal.appendChild(bandeau(ev, position, recouvert));
    journal.appendChild(
      ev ? corpsEvenement(ev, position, chemin[position - 1]) : corpsPresent(position)
    );
    if (recouvert) journal.style.transform = 'rotate(' + rotation(id, position) + 'deg)';
    empilement.appendChild(journal);
  });

  positionner();
  ecrireURL();
  rendreColonneDroite();
}

// Le décalage d'un journal est la hauteur RÉELLE du bandeau du journal précédent,
// mesurée après rendu. Le prototype utilisait 100 px fixes, ce qui coupe un titre qui
// passe sur deux lignes. Le choix définitif reste reporté (PAGES.md).
function positionner() {
  const journaux = [...empilement.children];
  let haut = 0;

  journaux.forEach((journal, i) => {
    journal.style.top = haut + 'px';
    if (i < journaux.length - 1) {
      haut += journal.querySelector('.bandeau').offsetHeight;
    }
  });

  const dernier = journaux[journaux.length - 1];
  empilement.style.height = (haut + dernier.offsetHeight) + 'px';
}

// -------------------------------------------------------------- interactions

// Clic sur un futur possible. C'est la parenté qui tranche (décision 57) : si
// l'événement est un enfant du journal courant, on empile simplement ; sinon on dépile
// d'abord jusqu'au journal dont il est l'enfant.
//
// Dans la disposition actuelle, seul le journal courant montre ses futurs, donc le
// second cas ne se déclenche pas. Le code le traite quand même : la règle reprend effet
// si les futurs repassent dans la colonne de droite.
function empiler(id, positionSource) {
  const courant = chemin[chemin.length - 1];
  if (!parentsDe(id).includes(courant)) {
    chemin = chemin.slice(0, positionSource + 1);
    deplies = deplies.slice(0, positionSource + 1);
  }
  chemin.push(id);
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  rendre();
}

// Clic sur le titre d'un journal antérieur : tous les journaux empilés par-dessus sont
// retirés (décision 50).
function depilerJusque(position) {
  chemin = chemin.slice(0, position + 1);
  deplies = deplies.slice(0, position + 1);
  rendre();
}

// ----------------------------------------------------- colonne de droite

const colonne = document.getElementById('colonne-droite');

// Filtres par tags et choix du critère de tri (décision 66).
function rendreColonneDroite() {
  colonne.textContent = '';

  const blocTri = el('div', 'bloc');
  blocTri.appendChild(el('h2', null, 'Trier les futurs possibles'));
  const select = el('select');
  [
    ['score:2', 'Intérêt (par défaut)'],
    ['score:1', 'Probabilité'],
    ['score:3', 'Fun'],
    ['votes:2', 'Nombre de votes sur l’intérêt'],
    ['date_creation', 'Ajouté récemment'],
    ['echeance', 'Échéance la plus proche']
  ].forEach(([valeur, libelle]) => {
    const o = el('option', null, libelle);
    o.value = valeur;
    if (valeur === critereTri) o.selected = true;
    select.appendChild(o);
  });
  select.addEventListener('change', () => { critereTri = select.value; rendre(); });
  blocTri.appendChild(select);
  colonne.appendChild(blocTri);

  const blocTags = el('div', 'bloc');
  blocTags.appendChild(el('h2', null, 'Filtrer par tags'));
  tousLesTags().forEach((tag) => {
    const label = el('label');
    const c = el('input');
    c.type = 'checkbox';
    c.checked = filtresTags.has(tag);
    c.addEventListener('change', () => {
      if (c.checked) filtresTags.add(tag); else filtresTags.delete(tag);
      rendre();
    });
    label.append(c, document.createTextNode(' ' + tag));
    blocTags.appendChild(label);
  });
  colonne.appendChild(blocTags);

  const note = el('div', 'note');
  note.appendChild(el('div', null,
    'Le tri et les filtres portent sur les futurs possibles du journal courant.'));
  note.appendChild(el('div', 'fil', 'Chemin : ' + chemin.join(' → ')));
  colonne.appendChild(note);
}

// ------------------------------------------------------------------ démarrage

chemin = lireURL();
rendre();

// Repositionne quand les polices arrivent : la hauteur du bandeau change avec elles.
if (document.fonts && document.fonts.ready) document.fonts.ready.then(positionner);
window.addEventListener('resize', positionner);
