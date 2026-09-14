# predictotron — Structure de la base de données

**Statut : définition en cours (v0.4).** Aucune implémentation.

Ce document décrit **uniquement le schéma**. Le sens des objets est dans
[CONCEPTS.md](CONCEPTS.md), les droits dans [ROLES.md](ROLES.md), les titres dans
[TITLES.md](TITLES.md), les écrans dans [PAGES.md](PAGES.md).

Notation : 🟡 = choix proposé, à valider par Paul. 🔴 = laissé ouvert, à définir par Paul.

Conventions :

- Clé primaire `id` sur chaque table. 🟡 Entier auto-incrémenté ou UUID — à trancher.
- Horodatages UTC (`TIMESTAMP`).
- **Suppressions logiques uniquement** (`deleted_at NULL` = vivant) : une suppression
  physique casserait l'arborescence.
- SQL standard, aucun type propriétaire (contrainte de portabilité, `PROJECT.md` §3).

---

## 1. Utilisateurs

### `users`

| Colonne | Type | Notes |
|---|---|---|
| `id` | PK | |
| `username` | TEXT UNIQUE NOT NULL | unique, casse-insensible 🟡 |
| `email` | TEXT UNIQUE NOT NULL | |
| `email_verified_at` | TIMESTAMP NULL | NULL = compte non confirmé |
| `password_hash` | TEXT NULL | NULL si connexion uniquement via OAuth |
| `role` | SMALLINT NOT NULL DEFAULT 1 | 1/2/3/4, cf. [ROLES.md](ROLES.md) |
| `created_at` | TIMESTAMP NOT NULL | date de création du compte |
| `updated_at` | TIMESTAMP NOT NULL | |
| `last_login_at` | TIMESTAMP NULL | |
| `avatar_url` | TEXT NULL | 🟡 |
| `bio` | TEXT NULL | 🟡 |
| `display_title_id` | FK → `titles.id` NULL | titre affiché à côté du nom |
| `status` | TEXT NOT NULL DEFAULT 'active' | `active` / `suspended` / `banned` |
| `deleted_at` | TIMESTAMP NULL | |

Index : `username`, `email`, `role`.

Le mot de passe n'est jamais stocké en clair (Argon2id ou bcrypt — relève du module
Authentification).

### `user_sessions`

🟡 Dépend du module Authentification, forme prévisible :
`id`, `user_id`, `token_hash` (jamais le token en clair), `created_at`, `expires_at`,
`revoked_at`, `user_agent`, `ip_hash`.

---

## 2. Univers

### `universes`

| Colonne | Type | Notes |
|---|---|---|
| `id` | PK | |
| `slug` | TEXT UNIQUE | `futur`, `passe`, `dune`, `got`… |
| `name` | TEXT | libellé affiché |
| `description` | TEXT NULL | |
| `kind` | TEXT | `future` / `past` / `fiction` — règles de vérification différentes |
| `root_label` | TEXT | libellé du point de départ (pour `futur` : « Le présent ») |
| `is_active` | BOOLEAN | seul `futur` est actif au lancement |
| `created_at` | TIMESTAMP | |

**La racine est virtuelle.** Aucune ligne « présent » n'est créée : un événement avec
`parent_id IS NULL` est rattaché à la racine de son univers.

> 🟡 Alternative : créer un véritable événement racine par univers (`is_root = true`), ce
> qui simplifie les requêtes d'arbre (tout nœud a un parent) au prix d'une ligne spéciale
> à traiter partout. À trancher.

---

## 3. Prédictions (événements)

### `predictions`

| Colonne | Type | Notes |
|---|---|---|
| `id` | PK | |
| `universe_id` | FK → `universes.id` NOT NULL | |
| `parent_id` | FK → `predictions.id` NULL | **parent canonique**. NULL = niveau 1 d'origine |
| `author_id` | FK → `users.id` | |
| `title` | TEXT NOT NULL | la phrase-fait ([CONCEPTS.md](CONCEPTS.md) §2) |
| `description` | TEXT NULL | contexte, critères de réalisation |
| `created_at` | TIMESTAMP NOT NULL | |
| `updated_at` | TIMESTAMP NOT NULL | |
| **`is_realized`** | **BOOLEAN NULL** | **l'événement s'est-il réalisé ?** |
| **`validated_by`** | **FK → `users.id` NULL** | **le compte qui a validé** |
| `score_probability` | INTEGER NOT NULL DEFAULT 0 | cache, cf. §5 |
| `score_interest` | INTEGER NOT NULL DEFAULT 0 | cache |
| `score_fun` | INTEGER NOT NULL DEFAULT 0 | cache |
| `deleted_at` | TIMESTAMP NULL | |

Index :

```
idx_predictions_parent            (parent_id)
idx_predictions_universe_parent   (universe_id, parent_id)
idx_predictions_author            (author_id)
idx_predictions_realized          (is_realized)
```

**Les enfants ne sont jamais stockés** : `SELECT … WHERE parent_id = ?`. C'est la raison
d'être de `idx_predictions_parent`.

### 3.1 Réalisation — deux champs, rien de plus *(décidé)*

Le statut d'une prédiction tient en **deux colonnes** :

| Colonne | Sens |
|---|---|
| `is_realized` | booléen : l'événement s'est-il réalisé ? |
| `validated_by` | l'identifiant du compte qui a validé |

`is_realized` est **nullable** parce qu'il faut distinguer trois situations réelles :

| `is_realized` | `validated_by` | Sens |
|---|---|---|
| `NULL` | `NULL` | pas encore tranché — état par défaut |
| `TRUE` | id du valideur | réalisé |
| `FALSE` | id du valideur | ne s'est pas réalisé |

Un seul vérificateur suffit à valider *(décidé)*.

> **Rien d'autre n'est ajouté ici pour l'instant.** Date de validation, date réelle de
> l'événement, source/preuve, statut de modération, historique des vérifications,
> historique des éditions : tout cela est **écarté volontairement** et listé en §10 comme
> points à trancher plus tard.

### 3.2 Parents alternatifs — `prediction_parents`

Cette table contient **uniquement les parents supplémentaires**, pas le parent canonique
(qui vit dans `predictions.parent_id`). Une seule source de vérité par lien, pas de
synchronisation à maintenir.

| Colonne | Type | Notes |
|---|---|---|
| `prediction_id` | FK → `predictions.id` | l'enfant |
| `parent_id` | FK → `predictions.id` | un parent alternatif |
| `created_at` | TIMESTAMP | |
| `created_by` | FK → `users.id` | |

PK composite `(prediction_id, parent_id)`. Index sur `parent_id`.

Contraintes (applicatives) :

- `parent_id != prediction_id` ;
- `parent_id != predictions.parent_id` de la même ligne (pas de doublon du canonique) ;
- même `universe_id` pour l'enfant et le parent ;
- **aucun cycle** : le graphe doit rester un DAG.

Tous les parents d'un événement :

```sql
SELECT parent_id FROM predictions         WHERE id = ? AND parent_id IS NOT NULL
UNION
SELECT parent_id FROM prediction_parents  WHERE prediction_id = ?;
```

### 3.3 Niveau 1 / frontière du présent

Un événement est au **niveau 1** si :

```
parent_id IS NULL
OU le parent est réalisé (is_realized = TRUE)
```

Avec les parents alternatifs : il suffit qu'**un** des parents soit réalisé (relation OU).

Aucune colonne ne stocke le niveau 1 : il se calcule. *(Une colonne-cache reste possible
plus tard si les performances l'exigent — §10.)*

Conséquence structurelle : **quand un événement se réalise, ses enfants continuent de
pointer dessus.** Rien n'est déplacé. Voir [CONCEPTS.md](CONCEPTS.md) §4.

---

## 4. Choix (décisions)

> **Principe fondateur : le choix n'est pas porteur de la décision** *(décidé)*.
> C'est **l'événement** qui porte l'information de réalisation (`is_realized`). Le choix se
> contente de **lister des événements** mis en compétition. Il ne résout rien, il n'écrit
> jamais dans `predictions`.

### `choices`

| Colonne | Type | Notes |
|---|---|---|
| `id` | PK | |
| `universe_id` | FK → `universes.id` | |
| `title` | TEXT | « Élection présidentielle 2027 » |
| `description` | TEXT NULL | |
| `parent_id` | FK → `predictions.id` NULL | 🟡 le choix peut être situé dans l'arbre |
| `author_id` | FK → `users.id` | |
| `exclusivity` | TEXT DEFAULT 'exactly_one' | `exactly_one` / `at_most_one` — **indication**, pas un moteur |
| `created_at`, `updated_at`, `deleted_at` | | |

Pas de `resolved_prediction_id`, pas de `status` : **l'état d'un choix est déduit** de ses
membres.

```sql
-- le gagnant d'un choix, s'il existe
SELECT p.id FROM choice_options co
JOIN predictions p ON p.id = co.prediction_id
WHERE co.choice_id = ? AND p.is_realized = TRUE;
```

Un choix est « clos » quand un de ses membres est réalisé, ou quand tous sont à
`is_realized = FALSE`. C'est une lecture, pas une colonne.

### `choice_options`

| Colonne | Type |
|---|---|
| `choice_id` | FK → `choices.id` |
| `prediction_id` | FK → `predictions.id` |
| `sort_order` | INTEGER |
| `added_by` | FK → `users.id` |
| `created_at` | TIMESTAMP |

PK composite `(choice_id, prediction_id)`. Index sur `prediction_id`.

**Un événement peut appartenir à plusieurs choix** *(décidé)*. Il n'y a donc **aucune**
colonne `choice_id` dans `predictions` : la relation est plusieurs-à-plusieurs, elle vit
entièrement ici.

### Rôle de l'exclusivité

`exclusivity` ne déclenche **aucune écriture automatique**. Il sert à deux choses :

1. **Assister le vérificateur.** Quand il déclare une option réalisée, l'interface lui
   propose de marquer les autres options du même choix comme non réalisées. Chaque
   événement reste tranché **individuellement**, par une action explicite.
2. **Signaler les incohérences.** Une requête de contrôle peut lister les choix
   `exactly_one` ayant deux membres réalisés, ou aucun alors que tous les autres sont
   tranchés. C'est un signalement pour la modération, pas une correction automatique.

> ✅ Le conflit de verdicts entre deux choix évoqué en v0.2 **n'existe plus** : rien
> n'écrit dans un événement en dehors d'une décision de vérificateur. Un événement membre
> de dix choix n'a qu'un seul `is_realized`, posé une seule fois, par une seule personne.

---

## 5. Votes

### `vote_axes`

Les axes sont **des données, pas du code** : en ajouter ne demande aucune migration.

| `id` | `slug` | `name` | `positive_label` | `negative_label` |
|---|---|---|---|---|
| 1 | `probability` | Probabilité | Probable | Improbable |
| 2 | `interest` | Intérêt | Intéressant | Sans intérêt |
| 3 | `fun` | Fun | Fun | Pas fun |

Plus : `description`, `sort_order`, `is_active`, `locks_on_resolution` (BOOLEAN),
`created_at`.

`locks_on_resolution` vaut TRUE pour `probability` : **les votes de cet axe sont verrouillés
dès que l'événement est tranché** *(décidé)* — plus de vote ni de changement d'avis.
Sans cela, on voterait « probable » après coup pour récolter des titres.

### `prediction_votes`

**Une ligne par (utilisateur, prédiction, axe).** Voter sur les trois axes d'un post = trois
lignes.

| Colonne | Type | Notes |
|---|---|---|
| `user_id` | FK → `users.id` | |
| `prediction_id` | FK → `predictions.id` | |
| `axis_id` | FK → `vote_axes.id` | |
| `value` | SMALLINT | `+1` ou `-1`. Jamais 0 : retirer un vote = supprimer la ligne |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | changement d'avis |

PK composite `(user_id, prediction_id, axis_id)`.
Index : `(prediction_id, axis_id)` pour les totaux, `(user_id, created_at)` pour la page
d'activité.

### Compteurs dénormalisés

`predictions.score_probability / score_interest / score_fun` = somme des `value` de l'axe
correspondant, recalculée à chaque vote. Permet de trier et d'afficher sans agréger.
`prediction_votes` reste la source de vérité ; les scores sont reconstructibles.

---

## 6. Tags

### `tags`

`id`, `slug` (UNIQUE, normalisé sans accent), `name`, `description`, `created_by`,
`created_at`, `usage_count` (cache 🟡).

### `prediction_tags`

`prediction_id`, `tag_id`, `created_by`, `created_at`.
PK composite `(prediction_id, tag_id)`. Index sur `tag_id`.

> 🔴 Tags libres ou liste fermée gérée par les administrateurs ? Non décidé.

---

## 7. Titres

Structure à trois niveaux, détaillée dans [TITLES.md](TITLES.md).

### `title_families`

`id`, `slug`, `name`, `description`, `metric` (le nom de la colonne de `user_stats`
mesurée), `is_active`.

### `titles`

Un titre = **un niveau** d'une famille.

| Colonne | Type | Notes |
|---|---|---|
| `id` | PK | |
| `family_id` | FK → `title_families.id` | |
| `level` | INTEGER | 1, 2, 3… |
| `name` | TEXT | « Apprenti prophète », « Prophète », « Oracle » |
| `threshold` | INTEGER | valeur de la métrique à atteindre |
| `icon` | TEXT NULL | |
| `description` | TEXT NULL | |

UNIQUE `(family_id, level)` et `(family_id, threshold)`.

### `user_titles`

**Une ligne par joueur et par titre obtenu.** Un titre ne se retire jamais.

| Colonne | Type |
|---|---|
| `user_id` | FK → `users.id` |
| `title_id` | FK → `titles.id` |
| `awarded_at` | TIMESTAMP |
| `metric_value_at_award` | INTEGER |

PK composite `(user_id, title_id)`. Index sur `user_id`.

Le « titre courant » d'une famille = celui de plus haut `level` obtenu.

### `user_stats`

Cache des métriques qui alimentent l'attribution. Une ligne par utilisateur.

| Colonne | Sens |
|---|---|
| `user_id` | PK, FK → `users.id` |
| `predictions_created` | prédictions créées |
| `predictions_realized` | prédictions créées passées à `is_realized = TRUE` |
| `predictions_failed` | prédictions créées passées à `is_realized = FALSE` |
| `votes_cast` | votes émis, tous axes |
| `correct_probability_votes` | `+1` sur un événement réalisé **ou** `-1` sur un non réalisé |
| `incorrect_probability_votes` | l'inverse |
| `verifications_made` | pour les vérificateurs |
| `tags_created` | 🟡 |
| `updated_at` | |

Entièrement reconstructible depuis les tables sources.

---

## 8. Vue d'ensemble

```
universes       1──n  predictions
users           1──n  predictions              (author_id)
predictions     1──n  predictions              (parent_id — parent canonique)
predictions     n──n  predictions              (prediction_parents — parents alternatifs)
predictions     n──n  tags                     (prediction_tags)
predictions     n──n  users × vote_axes        (prediction_votes)
users           1──n  predictions              (validated_by)
choices         n──n  predictions              (choice_options)
title_families  1──n  titles
users           n──n  titles                   (user_titles)
users           1──1  user_stats
```

---

## 9. Décisions prises

| # | Décision | Section |
|---|---|---|
| 1 | **Option C** : parent canonique en colonne `predictions.parent_id` + table `prediction_parents` pour les **seuls** parents alternatifs | §3.2 |
| 2 | Un événement peut appartenir à **plusieurs choix** → tout passe par `choice_options`, pas de colonne `choice_id` | §4 |
| 2b | **Le choix ne porte pas la décision** : il liste des événements, c'est l'événement qui porte `is_realized`. État du choix = déduit | §4 |
| 3 | **Un seul vérificateur** suffit à trancher | §3.4 |
| 4 | Les votes de l'axe **probabilité sont verrouillés** à la résolution | §5 |
| 5 | Statut d'une prédiction = **deux champs seulement** : `is_realized` (booléen) + `validated_by` (id du compte). Rien d'autre pour l'instant | §3.1 |
| 6 | Quand un événement se réalise, **ses enfants continuent de pointer dessus** ; le niveau 1 est déduit, pas déplacé | §3.3 |

## 10. À trancher (🟡)

### Écartés volontairement du statut d'une prédiction (§3.1)

Tout ceci a été retiré pour rester simple. À reprendre plus tard, un par un, si le besoin
se confirme :

1. **Statut de modération** (`ok` / `disputed` / `rejected`), séparé de `is_realized`.
   Enjeu : un événement rejeté pour ambiguïté n'est pas une prédiction ratée de son auteur,
   et si les deux partagent le même champ, les statistiques des titres comptent faux.
2. **Date de validation** — on sait *qui* a validé, pas *quand*.
3. **Date réelle de l'événement** (`occurred_at`), distincte de la date de validation.
4. **Source / preuve** fournie par le vérificateur.
5. **Échéance annoncée** (`target_date`) : sans elle, rien ne déclenche jamais un
   « ne se réalisera pas » par dépassement de délai.
6. **Historique des vérifications** — avec un seul champ `validated_by`, revenir sur une
   validation efface l'identité du précédent valideur, sans trace.
7. **Historique des éditions** — sans lui, une édition de modérateur n'est pas contestable
   ([ROLES.md](ROLES.md)).

### Autres points à trancher

8. Racine d'univers virtuelle, ou véritable ligne `is_root` ? (§2)
9. Clés primaires : entiers auto-incrémentés ou UUID ?
10. Un choix peut-il être placé dans l'arbre (`choices.parent_id`) ? (§4)
11. Colonne-cache pour le niveau 1 / nombre d'enfants, si le calcul à la volée coûte trop
    cher (§3.3).
12. Un utilisateur peut-il éditer sa propre prédiction, et jusqu'à quand ?
    ([ROLES.md](ROLES.md))
13. Les axes intérêt/fun donnent-ils droit à des titres ? ([TITLES.md](TITLES.md))

## 11. Ouvert (🔴)

1. ET / OU entre parents multiples ([CONCEPTS.md](CONCEPTS.md) §3).
2. Liste définitive des axes de vote.
3. Tags libres ou liste fermée.
4. Liste des familles de titres, niveaux et seuils ([TITLES.md](TITLES.md)).
5. Navigation de la page principale ([PAGES.md](PAGES.md)) — **à définir par Paul**.
