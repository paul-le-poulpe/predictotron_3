# predictotron — Titres

> Point d'entrée du projet : [PROJECT.md](PROJECT.md). Décisions et points ouverts :
> [DECISIONS.md](DECISIONS.md).

**Statut : draft v0.1.**

Les titres sont la récompense de l'activité sur le site. Ils s'obtiennent en
**accomplissant des choses**, et ne se perdent jamais.

---

## 1. Principe

- Chaque type d'accomplissement forme une **famille** de titres.
- Chaque famille comporte **plusieurs niveaux**, atteints à des seuils croissants.
- Un titre acquis est **définitif**.
- L'utilisateur choisit un titre à afficher à côté de son nom. 🟡

```
Famille "Prophète"  (métrique : prédictions réalisées)
   ├── niveau 1 : seuil 1     "Apprenti prophète"
   ├── niveau 2 : seuil 5     "Prophète"
   ├── niveau 3 : seuil 25    "Grand prophète"
   └── niveau 4 : seuil 100   "Oracle"
```

Les familles, les niveaux, les seuils et les noms sont **de la donnée**, pas du code : on
en ajoute sans toucher à l'application.

---

## 2. Métriques — ce qui est mesuré

Une métrique est un compteur par utilisateur. Une famille de titres s'appuie sur une
métrique.

| Métrique | Définition | Évoquée par Paul |
|---|---|---|
| `predictions_created` | Nombre de prédictions créées | ✅ « créer dix prédictions » |
| `predictions_realized` | Prédictions créées qui se sont réalisées | ✅ « voir cinq de ses prédictions se réaliser » |
| `correct_probability_votes` | Avoir voté **+1 probabilité** sur un événement qui s'est réalisé, ou **−1** sur un événement qui ne s'est pas réalisé | ✅ « voter positivement sur la probabilité et ensuite ça se réalise » |
| `votes_cast` | Votes émis, tous axes confondus | proposé |
| `verifications_made` | Vérifications effectuées (rôle vérificateur) | proposé |
| `tags_created` | Tags créés | proposé |

> Le verrouillage des votes de l'axe probabilité à la résolution (voir
> [CONCEPTS.md](CONCEPTS.md) §5) existe précisément pour que
> `correct_probability_votes` ne puisse pas être gonflé après coup.

---

## 3. Familles de titres

> 🔴 **À définir par Paul** : la liste exacte des familles, leurs noms, leurs niveaux et
> leurs seuils. Le tableau ci-dessous n'est qu'un squelette pour montrer la forme attendue.

| Famille | Métrique | Niveaux (seuils) | Noms |
|---|---|---|---|
| Créateur | `predictions_created` | 10 / ? / ? | à définir |
| Prophète | `predictions_realized` | 5 / ? / ? | à définir |
| Devin | `correct_probability_votes` | ? / ? / ? | à définir |
| … | … | … | … |

---

## 4. Attribution

Un titre est attribué dès que la métrique atteint le seuil. On enregistre **quand** il a
été obtenu et **avec quelle valeur** de la métrique.

L'attribution est déclenchée par les événements du site :
- création d'une prédiction → recalcul de `predictions_created` ;
- résolution d'un événement → recalcul de `predictions_realized` pour l'auteur **et** de
  `correct_probability_votes` pour tous ceux qui avaient voté sur l'axe probabilité.

Ce dernier point est le plus coûteux : résoudre un événement populaire met à jour les
compteurs de tous ses votants. 🟡 À faire en tâche de fond plutôt que dans la requête de
vérification.

---

## 5. Points ouverts

1. 🔴 Liste des familles, niveaux, seuils et noms (§3).
2. 🟡 Un titre peut-il se perdre ? *(hypothèse retenue : non, jamais)*
3. 🟡 Les axes intérêt et fun donnent-ils droit à des titres ?
4. 🟡 Y a-t-il des titres « négatifs » ou humoristiques (se tromper beaucoup) ?
5. 🟡 Y a-t-il un classement public des utilisateurs par titre / par score ?
