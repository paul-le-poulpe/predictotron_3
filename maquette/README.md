# Maquettes

> Point d'entrée du projet : [PROJECT.md](../PROJECT.md). Pages et navigation :
> [PAGES.md](../PAGES.md).

Des pages statiques qui servent à **regarder** une décision d'interface, pas à préfigurer
le code du site. Aucune base, aucun serveur applicatif, aucune authentification : les
données sont en dur dans un fichier.

---

## pile — la vue pile de journaux

`maquette/pile/`

| Fichier | Rôle |
|---|---|
| `index.html` | La page. Deux tiers gauche pour la pile, un tiers droit pour la colonne. |
| `journal.css` | Le style presse écrite, d'après <https://codepen.io/silkine/pen/QWBxVX> et le prototype de Paul. |
| `donnees.js` | Douze événements en dur, leurs tags, leurs votes, leurs parents. |
| `pile.js` | L'empilement, le dépilement, le tri, les filtres, le chemin dans l'URL. |

### La lancer

```bash
python -m http.server 4173
```

Puis <http://localhost:4173/maquette/pile/>. Un fichier ouvert directement depuis le disque
fonctionne aussi, mais certains navigateurs bloquent alors le chargement des trois scripts.

Une configuration `maquette` existe dans `.claude/launch.json` pour lancer ce serveur depuis
Claude Code.

### Ce que la maquette met en œuvre

Les décisions 48 à 66 de [DECISIONS.md](../DECISIONS.md) :

- Un événement s'affiche comme une page de journal ; un journal = un événement.
- Cliquer sur un futur possible empile son journal par-dessus, décalé vers le bas de la
  hauteur du bandeau de titre du précédent. La suite des titres qui dépassent est le chemin
  parcouru depuis le présent.
- Cliquer sur le titre d'un journal antérieur retire tous les journaux empilés par-dessus.
- La pile n'est ni repliée ni limitée : la page s'allonge.
- Le journal porte le titre, le texte, la notation par axe, le graphique pour / contre, les
  autres chemins qui mènent à l'événement (une ligne par parent), et les futurs possibles.
- Les futurs possibles sont triés par `score:intérêt` décroissant, quatre à la fois, puis
  « voir plus ».
- La colonne de droite porte les filtres par tags et le choix du critère de tri.
- L'URL porte le chemin sous forme de suite d'identifiants, réécrite sans ajouter d'entrée à
  l'historique. Un chemin invalide retombe sur la chaîne des parents canoniques.
- Le même événement peut apparaître deux fois dans la pile : il est empilé deux fois, sans
  traitement particulier. Le chemin `#/e/0-10-21-23-25-10` le montre.

### Deux choix provisoires, pris pour que la maquette tienne debout

Les deux questions correspondantes sont **reportées** dans [PAGES.md](../PAGES.md), pas
tranchées. La maquette a dû faire quelque chose :

| Question reportée | Ce que la maquette fait |
|---|---|
| Hauteur du décalage | Mesurée sur le bandeau réel après rendu, donc un titre sur trois lignes n'est pas coupé. |
| Rotation des journaux recouverts | Calculée depuis l'identifiant, donc stable : dépiler puis réempiler redonne le même angle. |

### Ce qu'elle ne montre pas

- Le contenu du journal du présent, 🔴 non défini : un encadré le dit à sa place.
- La vue arborescence, 🔴 non définie, et le passage d'une vue à l'autre.
- Les votes ne sont pas enregistrés : les boutons changent d'état, les scores affichés
  restent ceux du fichier de données.
- Le « voir plus » recharge depuis le tableau en mémoire ; la pagination par curseur
  ([LISTS.md](../LISTS.md) §6) n'est pas simulée.
- Aucune connexion, aucun rôle, aucune modération.
