# predictotron — Listes de posts, tri et recherche

> Point d'entrée du projet : [PROJECT.md](PROJECT.md). Décisions et points ouverts :
> [DECISIONS.md](DECISIONS.md).

**Statut : draft v0.1.**

Le site affiche des listes de posts à plusieurs endroits. Ce document définit **un seul
composant** pour tous ces endroits, plutôt qu'une logique de tri réécrite à chaque écran.

---

## 1. Les endroits où une liste apparaît

| Endroit | Ensemble de départ | Tri qui a du sens par défaut |
|---|---|---|
| Enfants d'un post | `parent_id = X` | 🟡 |
| Résultats de recherche | tout l'univers, filtré par texte | similarité |
| Suggestion de posts similaires à la création | tout l'univers, filtré par le titre en cours de saisie | similarité |
| Page d'activité : mes posts | `author_id = moi` | date décroissante |
| Page d'activité : mes réactions | mes lignes de `prediction_votes` | date du vote |
| File des échéances dépassées (vérificateurs) | `target_date < aujourd'hui AND is_realized IS NULL` | échéance la plus ancienne |

Le composant est le même partout. Seuls changent **l'ensemble de départ**, les **filtres**
et le **critère de tri**.

---

## 2. Une requête de liste

```
{
  source     : enfants_de(X) | recherche(texte) | auteur(U) | échéances_dépassées | …
  filtres    : univers, réalisé/non/indéterminé, tags, plage de dates
  tri        : un critère de §3
  direction  : croissant | décroissant
  page       : curseur
}
```

---

## 3. Les critères de tri

Chaque critère est une valeur d'une liste fermée. Chacun correspond à une expression SQL et
à un index.

| Critère | Ce qui est trié | Index utilisé |
|---|---|---|
| `date_creation` | `predictions.created_at` | `(parent_id, created_at DESC)` |
| `echeance` | `predictions.target_date` | `idx_predictions_target_date` |
| `score:<axe>` | `prediction_axis_scores.score` pour cet axe | `(axis_id, score DESC)` |
| `votes:<axe>` | `prediction_axis_scores.vote_count` pour cet axe | `(axis_id, vote_count DESC)` |
| `similarite` | pertinence calculée par la recherche plein texte (§5) | index FTS5 |
| `nb_enfants` | nombre d'enfants | 🟡 demande un compteur, cf. §7 |

**`score:<axe>` et `votes:<axe>` sont paramétrés par l'axe**, pas par un nom d'axe figé.
« Trier par probabilité décroissante » et « trier par fun décroissant » sont la même
requête avec un `axis_id` différent. C'est ce qui permet de redéfinir les axes sans toucher
au code de tri — et c'est la raison pour laquelle les scores sont une table et non trois
colonnes ([DATABASE.md](DATABASE.md) §5).

**`similarite` n'existe que si un texte de recherche est fourni.** Ce n'est pas une valeur
stockée : elle est calculée par rapport à la requête. Le composant doit refuser ce critère
en l'absence de texte, sinon il n'y a rien à comparer.

---

## 4. Tri par poids combiné — 🟡 plus tard, et voici pourquoi

L'idée d'un score composite (un peu de date, un peu de votes, un peu de similarité, avec
des poids) est séduisante et elle a un coût mécanique précis.

Un tri sur une colonne indexée se résout en lisant l'index dans l'ordre et en s'arrêtant
après N lignes. Un tri sur une **formule** ne peut pas utiliser d'index : la valeur n'existe
nulle part, il faut la calculer pour chaque ligne candidate, donc lire toutes les lignes
candidates avant de pouvoir en garder vingt.

Conséquence : un poids combiné n'est utilisable que sur un ensemble **déjà réduit**. Deux
formes praticables :

1. **Deux étages.** Un premier tri indexé ramène 200 candidats, la formule les réordonne.
   C'est ce que font la plupart des moteurs de recherche.
2. **Colonne pré-calculée.** Un score composite écrit dans une colonne à chaque vote, donc
   indexable — mais les poids deviennent figés, et les changer demande de recalculer toute
   la table.

**Proposition pour la V1** : critères simples de §3 uniquement, le composant étant conçu
pour qu'un mode « poids combiné » s'ajoute comme un critère supplémentaire, sans réécrire
les appelants.

---

## 5. Recherche plein texte

### Ce qu'est FTS5

Une extension de SQLite qui construit un **index inversé**. Le mécanisme : chaque titre est
découpé en mots (« tokenisation »), et pour chaque mot l'extension stocke la liste des
lignes qui le contiennent. Chercher « homme lune » revient à prendre la liste des lignes
contenant « homme », celle des lignes contenant « lune », et à les intersecter.

Ce qu'un index ordinaire ne sait pas faire : un index classique sur `title` sert à trouver
un **préfixe** (`LIKE 'homme%'`). Chercher un mot au milieu d'un titre l'oblige à lire
toutes les lignes. L'index inversé, lui, va directement du mot aux lignes.

FTS5 fournit en plus :

- **BM25**, une mesure de pertinence : un mot rare dans l'ensemble des titres compte plus
  qu'un mot fréquent, et un titre court contenant le mot compte plus qu'un titre long.
  C'est ce qui alimente le critère `similarite`.
- **`snippet()`** et **`highlight()`** : renvoient l'extrait du titre avec les mots trouvés
  mis en évidence.
- Le tokeniseur **`unicode61`**, qui replie les majuscules et les accents, donc « Élection »
  trouve « election ».

Mise en œuvre : une table virtuelle `predictions_fts` indexant `title` (et peut-être
`description`), tenue à jour par des déclencheurs sur `predictions`.

### Disponibilité sur Cloudflare D1 — vérifié

FTS5 est compilé dans D1 et les tables virtuelles y sont utilisables.

> ⚠️ **Limitation qui touche directement l'exigence de portabilité** ([PROJECT.md](PROJECT.md) §3).
> La documentation Cloudflare indique que l'export n'est pas pris en charge pour les tables
> virtuelles, ni pour une base qui en contient. Le contournement documenté : supprimer les
> tables virtuelles, exporter, puis les recréer.
>
> Conséquence concrète : la procédure de sauvegarde et de migration doit **supprimer et
> recréer l'index de recherche**. Ce n'est pas bloquant — l'index est entièrement
> reconstructible depuis `predictions` — mais ça doit être écrit dans le script de
> sauvegarde dès le début, pas découvert le jour d'une restauration.

🟡 Reste à décider : indexer le titre seul, ou titre + description ?

---

## 6. Pagination

**Pagination par curseur, pas par `OFFSET`.** `LIMIT 20 OFFSET 2000` demande à la base de
lire 2020 lignes et d'en jeter 2000. Le curseur transporte la dernière valeur de tri vue
(par exemple `created_at` et `id`) et la requête suivante reprend après cette valeur, en
lisant 20 lignes.

Le curseur doit contenir `id` en plus du critère de tri, sinon deux lignes de même score
provoquent des doublons ou des trous entre deux pages.

---

## 7. Points à trancher

1. 🟡 **Tri par défaut des enfants d'un post.** C'est le plus important : c'est le tri que
   presque tous les utilisateurs verront. Date la plus récente ? Score de probabilité ?
   Nombre de votes ?
2. 🟡 Tri par défaut de chacun des autres endroits (§1).
3. 🟡 Un compteur d'enfants sur `predictions`, si le tri par nombre d'enfants est retenu.
4. 🟡 Titre seul ou titre + description dans l'index de recherche.
5. 🟡 La page de recherche elle-même n'est pas définie ([PAGES.md](PAGES.md)) : filtres
   disponibles, présentation des résultats.
6. 🟡 Mode « poids combiné » (§4) : après la V1 ?

---

Sources sur FTS5 et D1 :
[SQL statements · Cloudflare D1](https://developers.cloudflare.com/d1/sql-api/sql-statements/),
[Import and export data · Cloudflare D1](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
