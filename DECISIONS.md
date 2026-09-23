# predictotron — Décisions et points ouverts

**Liste unique.** Le détail de chaque point vit dans le document indiqué ; cette page sert à
savoir en un coup d'œil ce qui est acquis et ce qui ne l'est pas.

**Statut : draft v1.0.**

**Règle : ne jamais revenir seul sur une décision de la partie 1.** Si elle paraît
discutable, le dire à Paul et attendre sa réponse.

---

## 1. Décisions prises

### Modèle des événements

| # | Décision | Détail |
|---|---|---|
| 1 | Une prédiction = un événement. Les deux mots sont interchangeables | [CONCEPTS.md](CONCEPTS.md) §1 |
| 2 | **Une phrase = un fait.** Un événement doit être vérifiable sans ambiguïté. Un événement vague est rejeté, pas corrigé au moment de la vérification | [CONCEPTS.md](CONCEPTS.md) §2 |
| 3 | **Les enfants ne sont jamais stockés.** Seul le lien vers le parent existe ; les enfants se trouvent par recherche inverse | [DATABASE.md](DATABASE.md) §3 |
| 4 | Parent canonique dans `predictions.parent_id`, parents alternatifs **supplémentaires** dans `prediction_parents`. Le parent canonique n'est **pas** dupliqué dans la table de liaison | [DATABASE.md](DATABASE.md) §3.2 |
| 5 | Les **parents alternatifs sont essentiels**, pas un confort : sans eux, un événement atteignable par deux chemins est créé deux fois | [DEDUPLICATION.md](DEDUPLICATION.md) §2 |
| 6 | La structure est un **graphe orienté acyclique**, pas un arbre strict. Aucun cycle | [CONCEPTS.md](CONCEPTS.md) §3 |
| 7 | Le **présent est une frontière mobile**. Un événement est « niveau 1 » s'il n'a pas de parent, ou si son parent est réalisé | [CONCEPTS.md](CONCEPTS.md) §4 |
| 8 | **Quand un événement se réalise, ses enfants continuent de pointer dessus.** Rien n'est déplacé, le niveau 1 est déduit | [DATABASE.md](DATABASE.md) §3.3 |
| 9 | L'univers est une colonne de l'événement. Un lien ne traverse jamais deux univers. Seul « le futur » est actif au lancement | [CONCEPTS.md](CONCEPTS.md) §9 |
| 10 | La racine d'un univers est **virtuelle** : `parent_id IS NULL`, aucune ligne « présent » en base | [DATABASE.md](DATABASE.md) §2 |

### Réalisation et vérification

| # | Décision | Détail |
|---|---|---|
| 11 | Le statut d'une prédiction tient en **deux champs** : `is_realized` (booléen nullable) et `validated_by` (le compte qui a validé). Rien d'autre | [DATABASE.md](DATABASE.md) §3.1 |
| 12 | `NULL` = pas encore tranché, `TRUE` = réalisé, `FALSE` = ne s'est pas réalisé | [DATABASE.md](DATABASE.md) §3.1 |
| 13 | **Un seul vérificateur suffit** à trancher. Pas de quorum | [ROLES.md](ROLES.md) |
| 14 | `target_date` (échéance annoncée par l'auteur) existe : c'est elle qui alimente la file des événements à passer en « non réalisé ». Le dépassement **signale**, il ne tranche pas | [DATABASE.md](DATABASE.md) §3.4 |

### Votes

| # | Décision | Détail |
|---|---|---|
| 15 | La notation se fait **sur plusieurs axes**, et les axes exacts ne sont pas figés. `vote_axes` est une table de données, aucun axe codé en dur | [CONCEPTS.md](CONCEPTS.md) §7 |
| 16 | **Une ligne par (utilisateur, prédiction, axe).** Voter sur trois axes = trois lignes. Valeur `+1` ou `-1`, jamais 0 | [DATABASE.md](DATABASE.md) §5 |
| 17 | Les scores sont une **table** `prediction_axis_scores`, pas des colonnes nommant les axes en dur. Sinon ajouter un axe demanderait une migration | [DATABASE.md](DATABASE.md) §5 |
| 18 | `score` (somme des ±1) et `vote_count` (nombre de votes) sont deux informations distinctes, les deux servent au tri | [DATABASE.md](DATABASE.md) §5 |
| 19 | Les votes de l'axe probabilité sont **verrouillés dès qu'un événement est tranché**. Sinon on vote « probable » après coup pour récolter des titres | [CONCEPTS.md](CONCEPTS.md) §5 |

### Choix (décisions)

| # | Décision | Détail |
|---|---|---|
| 20 | **Le choix ne porte pas la décision.** Il liste des événements ; c'est l'événement qui porte `is_realized`. L'état d'un choix se lit, il n'est pas stocké | [DATABASE.md](DATABASE.md) §4 |
| 21 | Un événement peut appartenir à **plusieurs choix**. Tout passe par `choice_options`, pas de colonne `choice_id` | [DATABASE.md](DATABASE.md) §4 |
| 22 | `exclusivity` ne déclenche **aucune écriture automatique** : il assiste le vérificateur et signale les incohérences | [DATABASE.md](DATABASE.md) §4 |

### Déduplication

| # | Décision | Détail |
|---|---|---|
| 23 | À la création, le site **propose les événements similaires** pour éviter le doublon. Il informe, il ne bloque pas | [DEDUPLICATION.md](DEDUPLICATION.md) §1 |
| 24 | En cas de doublon avéré, **un modérateur fusionne**. Survivant par défaut : le plus ancien, ou celui qui a le plus de réactions. Le survivant récupère les réactions de l'autre | [DEDUPLICATION.md](DEDUPLICATION.md) §3 |
| 25 | **La fusion est hors V1.** Le sujet sera exploré en détail avant d'être construit | [DEDUPLICATION.md](DEDUPLICATION.md) §3 |

### Authentification

| # | Décision | Détail |
|---|---|---|
| 26 | **L'authentification n'est pas écrite à la main.** Bibliothèque éprouvée, pas un service hébergé — la portabilité l'exige. Better Auth proposé | [AUTH.md](AUTH.md) §1-2 |
| 27 | V1 : **mot de passe ET Google OAuth**, cohabitant sur le même compte | [AUTH.md](AUTH.md) §3 |
| 28 | L'identité de connexion est une **ligne**, jamais une colonne de l'utilisateur. L'e-mail est une donnée de profil, jamais la clé d'authentification | [AUTH.md](AUTH.md) §4.2 |
| 29 | Jamais de rattachement automatique de deux comptes sur l'e-mail | [AUTH.md](AUTH.md) §4.2 |
| 30 | **Pseudonyme public unique**, distinct de l'e-mail, qui n'est jamais affichée | [AUTH.md](AUTH.md) §3 |
| 31 | Affichage avec accents ; **clé d'unicité sans accents ni ponctuation**, en minuscules. `Amélie` affiché, `Amelie` ensuite refusé | [AUTH.md](AUTH.md) §3 |
| 32 | Jeu de caractères limité à l'alphabet latin, pour écarter les lettres visuellement identiques d'autres alphabets | [AUTH.md](AUTH.md) §3 |
| 33 | **Un seul écran de choix du pseudonyme**, partagé par les deux parcours de connexion, bloquant : un compte sans pseudonyme ne peut rien publier | [AUTH.md](AUTH.md) §3 |

### Rôles

| # | Décision | Détail |
|---|---|---|
| 34 | Quatre rôles strictement hiérarchiques et cumulatifs : utilisateur, vérificateur, modérateur, administrateur | [ROLES.md](ROLES.md) |
| 35 | Le premier administrateur est créé **à la main en base**. Aucun chemin applicatif n'y mène | [ROLES.md](ROLES.md) |

### Listes et recherche

| # | Décision | Détail |
|---|---|---|
| 36 | **Un composant de liste unifié** sert tous les affichages de posts, avec un critère de tri paramétré | [LISTS.md](LISTS.md) |
| 37 | Le tri par axe est **paramétré par l'axe**, pas par un nom figé. « Par probabilité » et « par fun » sont la même requête | [LISTS.md](LISTS.md) §3 |
| 38 | Recherche plein texte via **FTS5**, disponible sur D1 (vérifié) | [LISTS.md](LISTS.md) §5 |
| 39 | Pagination **par curseur**, jamais par `OFFSET` | [LISTS.md](LISTS.md) §6 |

### Titres

| # | Décision | Détail |
|---|---|---|
| 40 | Trois niveaux de structure : famille → titre (un niveau, un seuil) → attribution. **Une ligne par joueur et par titre obtenu** | [DATABASE.md](DATABASE.md) §7 |
| 41 | Un titre acquis **ne se perd jamais** | [TITLES.md](TITLES.md) §1 |
| 42 | Familles, niveaux et seuils sont **de la donnée**, pas du code | [TITLES.md](TITLES.md) §1 |

### Technique générale

| # | Décision | Détail |
|---|---|---|
| 43 | Clés primaires : **entiers auto-incrémentés** | [DATABASE.md](DATABASE.md) conventions |
| 44 | **Suppressions logiques uniquement.** Une suppression physique casserait l'arborescence | [DATABASE.md](DATABASE.md) conventions |
| 45 | SQL standard, aucun type propriétaire. La portabilité est une contrainte dure | [PROJECT.md](PROJECT.md) §3 |

### Design

| # | Décision | Détail |
|---|---|---|
| 46 | **On commence par une maquette la plus simple possible, sans style.** Elle sert à rendre la structure visible | [PAGES.md](PAGES.md) §1b |
| 47 | Paul a un plan précis pour le design et le donnera dans une session dédiée. **Ne proposer aucune direction visuelle** | [PAGES.md](PAGES.md) §1b |

---

## 2. Ouvert — 🔴 c'est Paul qui définit

| Sujet | Où |
|---|---|
| **Toute la navigation de la page principale** (vue arborescence, vue boîtes empilées, autres). **Ne pas proposer.** | [PAGES.md](PAGES.md) §1 |
| Liste définitive des axes de vote | [CONCEPTS.md](CONCEPTS.md) §7 |
| Familles de titres, niveaux, seuils, noms | [TITLES.md](TITLES.md) §3 |
| Tags libres ou liste fermée gérée par les administrateurs | [CONCEPTS.md](CONCEPTS.md) §8 |
| ET / OU entre parents multiples (aujourd'hui : OU) | [CONCEPTS.md](CONCEPTS.md) §3 |
| Aspect visuel et design — plan précis chez Paul, session dédiée | [PAGES.md](PAGES.md) §1b |

---

## 3. À trancher — 🟡 propositions en attente de validation

### Bloquant pour commencer à construire

| Sujet | Où |
|---|---|
| **Tri par défaut** des enfants d'un événement, et de chaque autre liste | [LISTS.md](LISTS.md) §7 |
| Valider le choix de Better Auth | [AUTH.md](AUTH.md) §6 |
| Fournisseur d'envoi d'e-mails (confirmation d'adresse, réinitialisation) | [AUTH.md](AUTH.md) §6 |

### Non bloquant

| Sujet | Où |
|---|---|
| Un utilisateur peut-il éditer sa propre prédiction, et jusqu'à quand ? | [ROLES.md](ROLES.md) |
| Qui peut attribuer quel rôle (à garder configurable) | [ROLES.md](ROLES.md) |
| Retrait d'un rôle ; traçabilité des attributions | [ROLES.md](ROLES.md) |
| Un auteur peut-il voter sur sa propre prédiction ? | [CONCEPTS.md](CONCEPTS.md) §7 |
| Les axes intérêt/fun donnent-ils droit à des titres ? | [TITLES.md](TITLES.md) §5 |
| Verrouillage des axes intérêt/fun après résolution | [CONCEPTS.md](CONCEPTS.md) §5 |
| Pseudonyme modifiable ? L'ancien redevient-il disponible ? | [AUTH.md](AUTH.md) §3 |
| Longueur minimale de mot de passe ; durée de vie d'une session | [AUTH.md](AUTH.md) §6 |
| Que devient le contenu d'un compte supprimé ? | [AUTH.md](AUTH.md) §6 |
| Échéance (`target_date`) obligatoire ou facultative ? | [DATABASE.md](DATABASE.md) §3.4 |
| Indexer le titre seul, ou titre + description ? | [LISTS.md](LISTS.md) §7 |
| Page d'activité : privée ou profil public ? | [PAGES.md](PAGES.md) §2 |
| Commentaires sur les événements ? Notifications ? | [PAGES.md](PAGES.md) §3 |
| Signalement d'un doublon par un utilisateur | [DEDUPLICATION.md](DEDUPLICATION.md) §4 |
| Un choix peut-il être placé dans l'arbre ? | [DATABASE.md](DATABASE.md) §4 |
| Colonne-cache pour le niveau 1 / le nombre d'enfants | [DATABASE.md](DATABASE.md) §10 |

---

## 4. Écarté volontairement de la V1 — à reprendre plus tard

Chaque ligne dit ce que son absence coûte.

| Écarté | Ce que ça coûte aujourd'hui |
|---|---|
| **Statut de modération** séparé de `is_realized` | Un événement rejeté pour ambiguïté est indistinguable d'un événement qui ne s'est pas réalisé, et compte comme une prédiction ratée de son auteur |
| **Date de validation** | On sait qui a validé, pas quand |
| **Date réelle de l'événement** | Impossible de distinguer la date du fait de celle de sa validation |
| **Source / preuve** de la vérification | Une validation n'est pas justifiable |
| **Historique des vérifications** | Revenir sur une validation écrase l'identité du valideur précédent, sans trace |
| **Historique des éditions** | Une édition de modérateur n'est pas contestable |
| **Fusion d'événements** | Deux doublons coexistent ; le seul recours est la suppression logique, qui perd les votes au lieu de les transférer |
| **Signalements** | Aucune file de modération alimentée par les utilisateurs |
