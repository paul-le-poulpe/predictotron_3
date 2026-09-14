# predictotron — Rôles et permissions

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
| Attribuer un rôle | ❌ | ❌ | ❌ | ✅ |
| Gérer univers / axes / titres | ❌ | ❌ | ❌ | ✅ |

> 🟡 **Ouvert** : un utilisateur peut-il éditer sa propre prédiction ? Et si oui, jusqu'à
> quand — tant qu'elle n'a reçu aucun vote ? pendant N minutes ? jamais une fois publiée ?
> L'enjeu est réel : éditer le texte après des votes change rétroactivement ce sur quoi les
> gens ont voté.

---

## Règles transverses

- **Vérification : un seul vérificateur suffit.** *(décidé)* Pas de quorum. La décision est
  tracée (qui, quand, avec quelle source éventuelle) et reste contestable par un modérateur.
- **Suppressions logiques.** Rien n'est effacé physiquement : une prédiction supprimée est
  marquée comme telle. Sinon l'arborescence se casse et les enfants deviennent orphelins.
- **Traçabilité des éditions.** Toute édition par un modérateur conserve l'ancienne version,
  l'auteur de la modification et la date. Sans cela une édition n'est pas contestable.
- **Le rôle est global**, pas par univers. 🟡 Un vérificateur spécialisé sur un univers
  (ex. quelqu'un qui fait autorité sur Dune mais pas sur la politique) est une évolution
  possible, non retenue pour l'instant.

---

## Points ouverts

1. 🟡 Édition de sa propre prédiction : autorisée ? jusqu'à quand ?
2. 🟡 Comment devient-on vérificateur ? (promotion manuelle par un admin ? automatique
   au-delà d'un seuil de réputation / d'un titre ?)
3. 🟡 Rôles portés par univers plutôt que globaux.
