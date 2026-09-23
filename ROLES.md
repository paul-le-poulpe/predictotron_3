# predictotron — Rôles et permissions

> Point d'entrée du projet : [PROJECT.md](PROJECT.md). Décisions et points ouverts :
> [DECISIONS.md](DECISIONS.md).

**Statut : draft v0.3.**

Quatre rôles, **strictement hiérarchiques et cumulatifs** : chaque rôle possède tous les
droits du rôle inférieur, plus les siens.

| Niveau | Rôle | Droits ajoutés |
|---|---|---|
| 1 | **Utilisateur** | Créer des prédictions, voter sur les axes, ajouter des tags, créer des choix. |
| 2 | **Vérificateur** | Confirmer ou infirmer qu'un événement s'est réellement produit. |
| 3 | **Modérateur** | Éditer, supprimer, rejeter, déplacer, fusionner des prédictions. Revenir sur une vérification. Sanctionner un utilisateur. |
| 4 | **Administrateur** | Tous les droits : attribution des rôles, gestion des univers, des axes, des tags, des titres, configuration. |

---

## Matrice des permissions

| Action | Utilisateur | Vérificateur | Modérateur | Admin |
|---|:--:|:--:|:--:|:--:|
| Créer une prédiction | ✅ | ✅ | ✅ | ✅ |
| Éditer **sa propre** prédiction | 🟡 | 🟡 | ✅ | ✅ |
| Voter (3 axes) | ✅ | ✅ | ✅ | ✅ |
| Ajouter un tag | ✅ | ✅ | ✅ | ✅ |
| Créer un choix | ✅ | ✅ | ✅ | ✅ |
| Rattacher un événement à un choix | ✅ | ✅ | ✅ | ✅ |
| Déclarer un événement réalisé / non réalisé | ❌ | ✅ | ✅ | ✅ |
| Revenir sur une vérification | ❌ | ❌ | ✅ | ✅ |
| Éditer la prédiction d'autrui | ❌ | ❌ | ✅ | ✅ |
| Supprimer / rejeter une prédiction | ❌ | ❌ | ✅ | ✅ |
| Suspendre / bannir un utilisateur | ❌ | ❌ | ✅ | ✅ |
| Attribuer un rôle **inférieur au sien** (🟡 configurable) | ❌ | ✅ | ✅ | ✅ |
| Gérer univers / axes / titres | ❌ | ❌ | ❌ | ✅ |

> 🟡 **Ouvert** : un utilisateur peut-il éditer sa propre prédiction ? Et si oui, jusqu'à
> quand — tant qu'elle n'a reçu aucun vote ? pendant N minutes ? jamais une fois publiée ?
> L'enjeu est réel : éditer le texte après des votes change rétroactivement ce sur quoi les
> gens ont voté.

---

## Attribution des rôles — 🟡 point ouvert, à garder configurable

**Qui peut nommer qui n'est pas tranché.** L'implémentation doit donc laisser cette règle
**configurable**, et non la coder en dur dans les vérifications de droits.

Règle par défaut retenue pour démarrer : **chaque rôle attribue les rôles strictement
inférieurs au sien.** Un modérateur nomme des vérificateurs, un vérificateur ne nomme que
des utilisateurs simples, un administrateur nomme tout le monde y compris des
administrateurs.

Forme concrète de la configuration : une table ou un fichier de paramètres disant, pour
chaque rôle, le niveau maximal qu'il peut attribuer. Changer la politique devient une
modification de donnée, pas de code.

Conséquences à noter :

- **Le premier administrateur est créé à la main en base.** Aucun rôle ne peut s'auto-créer,
  donc il n'existe aucun chemin applicatif vers le premier compte administrateur.
- 🟡 Un rôle peut-il **retirer** un rôle qu'il n'a pas attribué lui-même ?
- 🟡 L'attribution d'un rôle est-elle tracée ? Aucune table ne l'enregistre aujourd'hui.

---

## Règles transverses

- **Vérification : un seul vérificateur suffit.** *(décidé)* Pas de quorum. La prédiction
  enregistre **qui** a validé, et rien de plus
  ([DATABASE.md](DATABASE.md) §3.1). Un modérateur peut revenir sur la décision — mais dans
  l'état actuel du schéma, cela écrase l'identifiant du valideur précédent sans en garder
  trace (DATABASE.md §10, point 6).
- **Suppressions logiques.** Rien n'est effacé physiquement : une prédiction supprimée est
  marquée comme telle. Sinon l'arborescence se casse et les enfants deviennent orphelins.
- **Traçabilité des éditions : non implémentée.** Aucune table ne conserve l'état antérieur
  d'une prédiction éditée. Tant que c'est le cas, une édition de modérateur n'est pas
  contestable (DATABASE.md §10, point 7).
- **Le rôle est global**, pas par univers. 🟡 Un vérificateur spécialisé sur un univers
  (ex. quelqu'un qui fait autorité sur Dune mais pas sur la politique) est une évolution
  possible, non retenue pour l'instant.

---

## Points ouverts

1. 🟡 **Qui peut attribuer quel rôle** — non tranché, à garder configurable.
2. 🟡 Édition de sa propre prédiction : autorisée ? jusqu'à quand ?
3. 🟡 Promotion automatique au-delà d'un seuil de réputation / d'un titre, ou uniquement
   manuelle ?
4. 🟡 Retrait d'un rôle : qui, et sous quelles conditions ?
5. 🟡 Traçabilité des attributions de rôle.
6. 🟡 Rôles portés par univers plutôt que globaux.
