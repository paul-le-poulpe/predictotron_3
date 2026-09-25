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
| 6 | **Le graphe canonique (`parent_id` seul) est acyclique. Le graphe complet, avec les parents alternatifs, peut avoir des cycles** — deux événements peuvent se déclencher mutuellement | [CONCEPTS.md](CONCEPTS.md) §3, [DATABASE.md](DATABASE.md) §3.2.1 |
| 6b | Si A est parent **canonique** de B, B ne peut être que parent **alternatif** de A | [DATABASE.md](DATABASE.md) §3.2.1 |
| 6c | Tout parcours suivant les parents alternatifs **doit dédoublonner ou borner sa profondeur**. Les parcours purement canoniques terminent par construction | [DATABASE.md](DATABASE.md) §3.2.1 |
| 6d | Un événement peut être validé alors que son parent canonique ne l'est pas : il s'est produit par un autre chemin | [DATABASE.md](DATABASE.md) §3.2.1 |
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
| 46 | **On commence par une maquette la plus simple possible, sans style.** Elle sert à rendre la structure visible. **Ne vaut plus pour la page principale**, dont la direction visuelle est donnée (#53) | [PAGES.md](PAGES.md) §1b |
| 47 | Pour le reste du site, Paul a un plan précis et le donnera dans une session dédiée. **Ne proposer aucune direction visuelle** | [PAGES.md](PAGES.md) §1b |

### Page principale — vue pile de journaux

| # | Décision | Détail |
|---|---|---|
| 48 | **Un événement s'affiche comme une page de journal.** Un journal = un événement ; les colonnes sont un habillage du texte, pas plusieurs articles | [PAGES.md](PAGES.md) §1.1 |
| 49 | Un clic sur un futur possible **empile son journal par-dessus, décalé vers le bas de la hauteur du bandeau de titre.** La suite des titres qui dépassent **est le chemin parcouru depuis le présent** | [PAGES.md](PAGES.md) §1.1 |
| 50 | **Un clic sur le titre d'un journal antérieur retire tous les journaux empilés par-dessus lui** | [PAGES.md](PAGES.md) §1.1 |
| 51 | **La pile n'est ni repliée ni limitée en profondeur.** La page s'allonge et on scrolle | [PAGES.md](PAGES.md) §1.1 |
| 52 | Deux façons de construire la pile : en navigation depuis le présent, **les journaux réellement traversés** (même via un parent non canonique) ; en arrivée directe depuis une autre page, **la chaîne des parents canoniques** | [PAGES.md](PAGES.md) §1.4 |
| 53 | Style **presse écrite**, d'après la référence et le prototype fournis par Paul. Journaux sur les deux tiers gauche | [PAGES.md](PAGES.md) §1.6 |
| 54 | La colonne de droite porte **des filtres** — précisé par #66 | [PAGES.md](PAGES.md) §1.3 |
| 55 | La chaîne des parents canoniques **s'arrête au niveau 1**. On ne remonte pas dans les événements réalisés : consulter le passé n'est pas conçu | [PAGES.md](PAGES.md) §1.4 |
| 56 | Le **bouton « retour » du navigateur ramène à la page précédente**, il ne dépile pas. On dépile uniquement en cliquant sur le titre d'un journal antérieur | [PAGES.md](PAGES.md) §1.1 |
| 57 | Clic sur un futur possible affiché par un journal antérieur : **c'est la parenté qui tranche.** Enfant du journal courant → on empile simplement ; sinon → on dépile jusqu'au journal dont il est l'enfant, puis on empile | [PAGES.md](PAGES.md) §1.1 |
| 58 | **L'URL porte le chemin**, sous forme de suite d'identifiants entiers. Le dernier est l'événement affiché ; empiler ajoute un identifiant, dépiler tronque la liste | [PAGES.md](PAGES.md) §1.4 |
| 59 | L'URL est réécrite par **`history.replaceState`** : pas de rechargement, et **aucune entrée ajoutée à l'historique**. C'est ce qui rend le bouton « retour » conforme à #56 | [PAGES.md](PAGES.md) §1.4 |
| 60 | **La vue affiche le chemin tel qu'il est, sans le contrôler.** Si le chemin repasse sur un événement déjà dans la pile, son journal est **empilé une seconde fois sans traitement particulier** — chaque journal est rendu indépendamment. La construction du graphe n'est pas l'affaire de cette vue | [PAGES.md](PAGES.md) §1.1 |
| 61 | **Les futurs possibles sont dans le journal**, pas dans la colonne de droite. « Pour commencer » | [PAGES.md](PAGES.md) §1.2 |
| 62 | Un **chemin invalide dans l'URL retombe sur la chaîne des parents canoniques**. Pas d'erreur affichée | [PAGES.md](PAGES.md) §1.4 |
| 63 | **Aucune limite de longueur de pile.** Aucune raison identifiée d'en poser une ; à rediscuter plus tard si besoin | [PAGES.md](PAGES.md) §1.1 |
| 64 | **Tri par défaut des enfants d'un événement : `score:intérêt` décroissant.** Le critère par défaut doit rester configurable — c'est un `axis_id` différent dans la même requête (#37) | [LISTS.md](LISTS.md) §7 |
| 65 | Un journal affiche **un nombre fixe de futurs possibles, puis un bouton « voir plus »** qui charge la suite par curseur (#39) | [PAGES.md](PAGES.md) §1.2 |
| 66 | La colonne de droite porte **des filtres par tags et le choix du critère de tri**. Rien d'autre pour l'instant | [PAGES.md](PAGES.md) §1.3 |

---

## 2. Ouvert — 🔴 c'est Paul qui définit

| Sujet | Où |
|---|---|
| **Toute la vue arborescence**, et le passage d'une vue à l'autre. **Ne pas proposer.** | [PAGES.md](PAGES.md) points ouverts, « Vue arborescence » |
| **Contenu du journal du bas de la pile** (le présent). Piste évoquée : des catégories à choisir | [PAGES.md](PAGES.md) §1.5 |
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
| **Tri par défaut des autres listes** que les enfants d'un événement (celui-ci est tranché, #64) | [LISTS.md](LISTS.md) §7 |
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
| La page « détail d'un événement » survit-elle à la vue pile ? | [PAGES.md](PAGES.md) §3 |
| **Reporté par Paul, à reprendre plus tard :** rotation des journaux recouverts, hauteur du décalage | [PAGES.md](PAGES.md) points ouverts |

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
