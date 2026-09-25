# predictotron — Pages et navigation

> Point d'entrée du projet : [PROJECT.md](PROJECT.md). Décisions et points ouverts :
> [DECISIONS.md](DECISIONS.md).

Inventaire des pages du site.

---

## 1. Page principale — navigation dans les événements

Ce qui est acquis :

- C'est le cœur du site : l'utilisateur y **navigue dans les événements**.
- Il y aura **plusieurs vues différentes** du même contenu, pas une seule.
  - Une vue **pile de journaux** — définie ci-dessous *(décidé)*.
  - Une vue **arborescence** — 🔴 non définie.
  - (d'autres possibles)
- Le point d'entrée naturel de l'univers « futur » est **le présent**, donc les événements
  de niveau 1 (voir [CONCEPTS.md](CONCEPTS.md) §4).

---

## 1.1 La vue « pile de journaux » *(décidé)*

**Un événement s'affiche comme une page de journal** : le titre de l'événement est le titre
du journal, le reste de la page est mis en pages façon presse écrite.

### Mécanisme de l'empilement

Cliquer sur un futur possible **ajoute son journal par-dessus la pile**, décalé vers le bas
d'une hauteur égale à celle du bandeau de titre du journal précédent. Le journal recouvert
laisse donc dépasser exactement son titre.

```
+----------------------------------+
| LE PRÉSENT                       |      <- titre visible, journal recouvert
+----------------------------------+
   | TRUMP RÉÉLU                      |   <- titre visible, journal recouvert
   +----------------------------------+
      | MANIFESTATIONS À WASHINGTON      |
      +----------------------------------+
         | UN MANIFESTANT BLESSÉ            |  <- journal courant, entier
         |                                  |
         | texte, notation, futurs possibles|
         +----------------------------------+
```

**La suite de titres qui dépassent est le chemin parcouru depuis le présent.** La pile n'est
pas une décoration : c'est le fil d'Ariane. Un seul journal est lisible en entier, le
dernier.

### Interactions

| Action | Effet |
|---|---|
| Clic sur un futur possible | Son journal s'empile par-dessus, décalé vers le bas. |
| **Clic sur le titre d'un journal antérieur** | **Tous les journaux empilés par-dessus celui-là sont retirés.** La pile redevient le chemin jusqu'à ce journal, qui redevient le journal courant. |
| La pile s'allonge | **Normal. La page s'allonge et on scrolle vers le bas.** Aucun repliement, aucune limite de profondeur. |

Les journaux occupent les **deux tiers gauche** de l'écran. Le tiers droit est décrit en
§1.3.

### Cliquer sur un futur possible affiché par un journal antérieur *(décidé)*

Un futur possible peut être atteint depuis un journal qui n'est pas le journal courant. Deux
cas, et c'est la **parenté qui tranche**, pas la position dans la pile :

| Cas | Effet |
|---|---|
| L'événement cliqué est **aussi un enfant du journal courant** | **On l'empile simplement par-dessus.** La pile n'est pas dépilée : l'embranchement antérieur n'était qu'un autre chemin vers le même endroit. |
| L'événement cliqué **n'est pas un enfant du journal courant** | C'est un vrai retour en arrière vers un embranchement antérieur : **on dépile jusqu'au journal dont il est l'enfant, puis on l'empile.** |

> **Cette règle est en sommeil dans la disposition actuelle.** Les futurs possibles étant
> dans le journal (§1.2) et les journaux antérieurs étant recouverts jusqu'à leur titre, le
> seul futur cliquable est un enfant du journal courant : le second cas ne peut pas se
> déclencher. La règle reprend effet si les futurs repassent dans la colonne de droite, ou si
> un journal recouvert expose les siens.

### Un même événement peut apparaître deux fois *(décidé)*

**La vue affiche le chemin tel qu'il est, sans le contrôler.** Si le chemin repasse sur un
événement déjà présent dans la pile, **son journal est empilé une seconde fois, sans
traitement particulier**. Chaque journal est rendu indépendamment des autres, donc un journal
répété ne demande rien de spécial.

Le cas est réel, pas théorique : le graphe complet autorise les cycles sur les parents
alternatifs ([CONCEPTS.md](CONCEPTS.md) §3). La façon dont le graphe est construit ne relève
pas de ce document.

**Aucune limite de longueur de pile pour l'instant** — aucune raison identifiée d'en poser
une. À rediscuter plus tard si besoin.

### Bouton « retour » du navigateur *(décidé)*

Il **ramène à la page précédente**. Ce n'est pas un dépilement : **on dépile en cliquant sur
le titre d'un journal antérieur**, uniquement.

---

## 1.2 Contenu d'une page de journal

Dans l'ordre, de haut en bas :

| Élément | Contenu |
|---|---|
| Titre | Le titre de l'événement, en tête de journal. |
| Texte | La description de l'événement. |
| Notation | Le vote sur chacun des axes actifs (voir [CONCEPTS.md](CONCEPTS.md) §7). |
| 🟡 Graphique pour / contre | Petit graphique : quel pourcentage est pour, quel pourcentage est contre. |
| 🟡 Autres parents possibles | Les autres chemins qui mènent à cet événement. **Une ligne de texte par parent, pas une grille de boîtes.** |
| Les futurs possibles | Les enfants de l'événement. *(décidé)* |

**Un journal = un événement.** Les colonnes de la mise en page journal sont un habillage du
texte, pas plusieurs articles.

### Les futurs possibles sont dans le journal *(décidé)*

**Pour commencer, les futurs possibles sont dans le journal**, plus bas dans la page, et non
dans la colonne de droite comme l'idée de départ le prévoyait. Conséquence : seuls les futurs
du journal courant sont lisibles, puisque les journaux antérieurs sont recouverts jusqu'à
leur titre.

**Ils sont triés par `score:intérêt` décroissant** ([LISTS.md](LISTS.md) §7), et
l'utilisateur peut changer de critère depuis la colonne de droite (§1.3).

**Le journal en affiche un nombre fixe, puis un bouton « voir plus » charge la suite**
par curseur ([DECISIONS.md](DECISIONS.md) #39). Sans cette limite, un événement à deux cents
enfants donnerait un journal interminable et rendrait la pile impraticable.

> La liste ci-dessus n'est pas fermée : beaucoup d'autres informations peuvent trouver leur
> place dans le journal. La contrainte est qu'elles soient **mises en pages façon journal**,
> et non ajoutées comme des éléments d'interface posés sur du papier.

### Le graphique pour / contre ne demande aucun stockage nouveau

`prediction_axis_scores` porte déjà `score` (somme des ±1) et `vote_count` (nombre de
votes) — voir [DATABASE.md](DATABASE.md) §5. Le nombre de votes « pour » vaut
`(score + vote_count) / 2`, les « contre » sont le reste. Les deux pourcentages se
calculent depuis les colonnes existantes.

---

## 1.3 La colonne de droite

Deux choses, et rien d'autre pour l'instant *(décidé)* :

| Élément | Contenu |
|---|---|
| **Filtres par tags** | Ne montrer que les futurs portant certains tags. |
| **Choix du critère de tri** | Les critères de [LISTS.md](LISTS.md) §3, appliqués aux futurs possibles du journal courant. Par défaut `score:intérêt` décroissant. |

C'est peu, et c'est assumé : d'autres éléments s'ajouteront plus tard.

---

## 1.4 Comment la pile est construite

Deux cas, selon la façon dont on arrive sur un événement.

| Cas | Ce que contient la pile |
|---|---|
| **Navigation depuis le présent**, de journal en journal | **Les journaux par lesquels on est réellement passé**, même quand le lien suivi n'était pas celui du parent canonique. |
| **Arrivée directe depuis une autre page** (« mes prédictions », une liste, une recherche) | **La chaîne des parents canoniques** de l'événement, remontée jusqu'au présent. |

Conséquence : la pile du premier cas est un **parcours**, pas une donnée du graphe. Deux
utilisateurs sur le même événement peuvent voir deux piles différentes, et c'est voulu.

### La chaîne des parents canoniques s'arrête au présent *(décidé)*

Dans le second cas, on remonte de parent canonique en parent canonique **jusqu'au niveau 1**,
et on s'arrête là. **On ne remonte pas dans les événements déjà réalisés**, derrière la
frontière ([CONCEPTS.md](CONCEPTS.md) §4). Consulter le passé n'est pas conçu ; le jour où
ça le sera, ce point sera repris.

Cette remontée termine toujours : le graphe des parents canoniques est acyclique et enraciné,
donc le niveau 1 est atteint en un nombre fini d'étapes ([CONCEPTS.md](CONCEPTS.md) §3). Elle
n'a besoin d'aucune liste d'événements déjà visités, contrairement à un parcours qui suivrait
les parents alternatifs.

### L'URL porte le chemin *(décidé)*

Un parcours n'étant pas déductible du graphe, l'URL le porte, pour qu'un rechargement ou un
lien retrouve la même pile. Les clés primaires sont des **entiers auto-incrémentés**
([DECISIONS.md](DECISIONS.md) #43), donc un chemin est une suite d'entiers :

```
/e/1-47-312-1580-9241
```

Le **dernier entier est l'événement affiché** ; les précédents ne servent qu'à reconstituer
la pile. À chaque empilement, **l'identifiant est ajouté à la fin de la liste** ; à chaque
dépilement, la liste est tronquée. Le coût est négligeable : à 6 chiffres par identifiant,
une profondeur de 50 tient en 350 caractères, loin de la limite pratique de 2000.

### L'URL change sans recharger la page, et sans ajouter d'entrée à l'historique *(décidé)*

L'URL est réécrite par **`history.replaceState`**, qui change l'adresse affichée et
**écrase l'entrée d'historique courante**. La page n'est pas rechargée et aucune entrée n'est
ajoutée.

C'est ce qui rend le bouton « retour » conforme à §1.1 : il ramène à la page d'où venait
l'utilisateur, il ne dépile pas. L'autre appel disponible, `history.pushState`, ne recharge
pas la page non plus mais **ajoute** une entrée : le bouton retour restaurerait alors le
chemin privé de son dernier identifiant, c'est-à-dire dépilerait d'un cran.

### Un chemin reçu de l'extérieur peut être faux

Rien n'empêche d'écrire une suite d'entiers qui ne correspond à aucune chaîne
parent → enfant réelle. Il faut donc vérifier que chaque couple consécutif est un vrai lien
avant d'afficher la pile. Comme le dernier entier suffit à identifier l'événement, un chemin
invalide n'a pas besoin d'être une erreur : on peut retomber sur la chaîne des parents
canoniques.

> 🟡 Que fait-on d'un chemin invalide — retomber silencieusement sur les parents canoniques,
> ou afficher une erreur ?

---

## 1.5 Le journal du bas de la pile

Le premier journal — **en bas de la pile, donc en haut de la page** — est d'une autre nature
que les suivants : le présent n'est pas un événement, c'est une frontière
([CONCEPTS.md](CONCEPTS.md) §4).

**🔴 Son contenu n'est pas décidé.** Piste évoquée par Paul, à ne pas traiter comme acquise :
il pourrait porter des **catégories à choisir**, qui détermineraient les événements proposés
ensuite.

---

## 1.6 Style

**Presse écrite.** La référence est cette page :
<https://codepen.io/silkine/pen/QWBxVX>

Le prototype d'origine de Paul est hors dépôt :
`C:\Users\Paul_500Go\Desktop\Predictotron\test_journal\test_journal.html`

Il ne montre que l'empilement et le décalage. Ce qu'il fixe : fond papier, titre en Playfair
Display capitales, bandeau d'infos sous le titre, corps en Droid Serif, légère rotation des
journaux recouverts.

**La maquette du dépôt le reprend et applique les décisions 48 à 66** :
[maquette/pile/](maquette/pile/), documentée dans [maquette/README.md](maquette/README.md).

---

## 1b. Méthode pour le design

**Pour la page principale, la direction visuelle est donnée** (§1.6) : c'est Paul qui l'a
posée, avec sa référence et son prototype.

Pour **le reste du site**, la règle d'origine tient : Paul a un plan précis, il le donnera
dans une session dédiée. En attendant, maquette la plus simple possible, sans style, et
**aucune direction visuelle proposée**.

---

## 2. Page d'activité de l'utilisateur

L'utilisateur y suit sa propre activité.

| Section | Contenu |
|---|---|
| **Mes prédictions** | Les événements qu'il a créés, avec leur état (indéterminé / réalisé / non réalisé). |
| **Mes réactions** | Les événements sur lesquels il a voté, par axe, avec l'issue de chacun. |
| **Mes titres** | Les titres acquis, par famille et par niveau. Voir [TITLES.md](TITLES.md). |
| **Mes statistiques** | Prédictions créées, prédictions réalisées, votes justes sur l'axe probabilité, etc. |

Aucune de ces sections n'a besoin de stockage propre : tout se déduit des données
existantes.

Cliquer sur un événement depuis cette page ouvre la page principale dans le second cas de
§1.4 : pile reconstruite sur les parents canoniques.

> 🟡 Cette page est-elle **privée** (mon activité, visible de moi seul) ou est-elle le
> **profil public** d'un utilisateur, consultable par les autres ? Les deux sont possibles,
> mais la page ne contient pas la même chose selon la réponse.

---

## 3. Autres pages (non détaillées)

| Page | Rôle |
|---|---|
| Création d'un événement | Titre, description, univers, parent, tags, choix éventuel. |
| Détail d'un événement | L'événement, son score sur chaque axe actif, ses parents, ses enfants, ses tags, ses choix. |
| Détail d'un choix | Les options en compétition et leur état. |
| Inscription / connexion | Voir [AUTH.md](AUTH.md). |
| **Choix du pseudonyme** | Écran unique, partagé par l'inscription e-mail et la première connexion Google. Bloquant : un compte sans pseudonyme ne peut rien publier ([AUTH.md](AUTH.md) §3). |
| Modération | Prédictions en attente de validation. 🟡 Signalements et contestations n'existent pas encore en base. |
| Administration | Rôles, univers, axes, tags, titres. |

> 🟡 « Détail d'un événement » et la vue pile de journaux affichent la même chose. Cette
> page a-t-elle encore une raison d'exister, ou la vue pile la remplace-t-elle ?

---

## Points ouverts

### Vue pile de journaux

- 🔴 **Contenu du journal du bas de la pile** (§1.5).
- 🟡 **Le graphique pour / contre** (§1.2) : à confirmer, ce n'est pour l'instant qu'une
  piste.
- 🟡 **Les autres parents possibles affichés dans le journal** (§1.2) : même statut.

### Vue pile de journaux — reporté, vu avec Paul

À reprendre plus tard, pas maintenant :

- **Rotation des journaux recouverts** : fixe pour un événement donné, ou tirée au hasard à
  chaque affichage ? Dans le prototype elle est tirée au hasard, donc la pile change
  d'aspect à chaque dépilement puis réempilement.
- **Hauteur du décalage** : le prototype décale de 100 px fixes. Un titre assez long pour
  passer sur deux lignes dépasse cette hauteur et se fait couvrir. Décalage mesuré sur le
  bandeau de titre réel, ou titres tenus sur une ligne ?

### Vue arborescence

- 🔴 **Toute la vue arborescence.**
- 🟡 **Passage d'une vue à l'autre** : quel nœud reste sélectionné, et comment la pile est
  reconstruite au retour de l'arbre vers la pile.

### Autres pages

- 🟡 Page d'activité : privée ou profil public ? (§2)
- 🟡 La page « détail d'un événement » survit-elle à la vue pile ? (§3)
- 🟡 Y a-t-il des commentaires sur les événements, en plus des votes ? Jamais évoqué.
- 🟡 Y a-t-il des notifications ? (« votre prédiction s'est réalisée », « vous avez gagné un
  titre »)
