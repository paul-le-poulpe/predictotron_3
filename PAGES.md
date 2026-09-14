# predictotron — Pages et navigation

Inventaire des pages du site. **Deux d'entre elles sont décrites, la principale est
volontairement laissée ouverte** : Paul la définira, ce n'est pas à Claude de la proposer.

---

## 1. Page principale — navigation dans les événements

**Statut : 🔴 non définie. Paul la définira. Aucune proposition à faire.**

Ce qui est acquis à ce stade :

- C'est le cœur du site : l'utilisateur y **navigue dans les événements**.
- Il y aura **plusieurs vues différentes** du même contenu, pas une seule.
  - Une vue **arborescence**.
  - Une vue **boîtes empilées**.
  - (d'autres possibles)
- Le point d'entrée naturel de l'univers « futur » est **le présent**, donc les événements
  de niveau 1 (voir [CONCEPTS.md](CONCEPTS.md) §4).

Tout le reste — disposition, interactions, filtres, profondeur affichée, transitions entre
vues — reste à définir.

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

> 🟡 Cette page est-elle **privée** (mon activité, visible de moi seul) ou est-elle le
> **profil public** d'un utilisateur, consultable par les autres ? Les deux sont possibles,
> mais la page ne contient pas la même chose selon la réponse.

---

## 3. Autres pages (non détaillées)

| Page | Rôle |
|---|---|
| Création d'un événement | Titre, description, univers, parent, tags, choix éventuel. |
| Détail d'un événement | L'événement, ses trois scores, ses parents, ses enfants, ses tags, son choix. |
| Détail d'un choix | Les options en compétition et leur état. |
| Inscription / connexion | Voir le module Authentification. |
| Modération | File des signalements, des vérifications en attente, des événements contestés. |
| Administration | Rôles, univers, axes, tags, titres. |

---

## Points ouverts

1. 🔴 **Toute la page principale** (§1) — à définir par Paul.
2. 🟡 Page d'activité : privée ou profil public ? (§2)
3. 🟡 Y a-t-il des commentaires sur les événements, en plus des votes ? Jamais évoqué.
4. 🟡 Y a-t-il des notifications ? (« votre prédiction s'est réalisée », « vous avez gagné
   un titre »)
