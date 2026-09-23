# predictotron — Déduplication et fusion

> Point d'entrée du projet : [PROJECT.md](PROJECT.md). Décisions et points ouverts :
> [DECISIONS.md](DECISIONS.md).

**Statut : draft v0.3.**

**Un point clé du projet : les événements doivent être unitaires et très simples, pour
qu'il n'y ait aucun doute quand deux événements sont les mêmes.** La règle éditoriale
« une phrase = un fait » ([CONCEPTS.md](CONCEPTS.md) §2) n'est pas une préférence de style :
c'est ce qui rend la déduplication décidable.

Trois mécanismes, dans cet ordre.

---

## 1. Garde-fou à la création : proposer les posts similaires *(décidé)*

Au moment où l'utilisateur écrit son post, le site lui **présente les événements
existants qui ressemblent au sien**, pour qu'il vérifie qu'il ne le crée pas en double.

Déclenchement : pendant la saisie du titre, après quelques caractères, et dans tous les cas
avant la validation finale.

Ce que la recherche compare : le **titre**, en priorité à l'intérieur du même univers.

**Technique : FTS5, vérifié disponible sur Cloudflare D1.** Le mécanisme et la limitation
d'export sont décrits dans [LISTS.md](LISTS.md) §5. Aucune solution de repli n'est
nécessaire.

La suggestion utilise le critère de tri `similarite` du composant de liste, c'est-à-dire la
pertinence BM25 calculée par FTS5 sur le titre en cours de saisie.

**Ce garde-fou n'interdit rien.** Il informe. Bloquer la création sur une ressemblance
calculée produirait des faux positifs sur des événements légitimement proches
(« Les Russes atterrissent sur la Lune » / « Les Américains atterrissent sur la Lune »).

---

## 2. Les parents alternatifs préviennent la duplication structurelle *(décidé)*

C'est leur raison d'être, et elle est essentielle — pas optionnelle.

Sans eux : A et B mènent tous deux à C, donc un utilisateur crée C sous A, un autre crée C
sous B, et deux copies de C coexistent avec chacune ses votes et ses enfants.

```
       A            B                  A          B
       |            |                   \        /
       C           C'   ← à éviter       \      /
                                            C     ← un seul C, deux parents
```

Un seul C, avec A comme parent canonique et B comme parent alternatif
([DATABASE.md](DATABASE.md) §3.2).

---

## 3. Fusion par un modérateur — **hors V1** *(décidé)*

> **La fusion ne fait pas partie de la première version.** Ce qui suit est la mémoire de ce
> qu'on a dit, pas une spécification prête à implémenter : le sujet sera exploré en détail
> avant d'être construit.
>
> **En V1**, deux événements en doublon coexistent. Les recours disponibles sont la
> suggestion à la création (§1) et la suppression logique (`deleted_at`) par un modérateur,
> qui perd les votes de l'événement supprimé au lieu de les transférer.

Quand deux événements identiques ou très proches existent malgré tout, **un modérateur
tranche et fusionne**. Ce n'est jamais automatique.

### Lequel survit

| Critère | Règle |
|---|---|
| Par défaut | le **plus ancien** (`created_at` le plus petit) |
| Alternative | celui qui a le **plus de réactions** |

Le modérateur choisit ; les deux critères sont affichés côte à côte pour rendre la décision
évidente. 🟡 Faut-il un critère unique imposé, ou le laisser choisir au cas par cas ?

### Ce que la fusion transfère

**L'événement conservé récupère les réactions de l'autre** *(décidé)*. Concrètement, pour
un événement absorbé `S` (source) et conservé `T` (target) :

| Objet | Traitement |
|---|---|
| **Votes** | Les lignes de `prediction_votes` de `S` sont réaffectées à `T`. |
| **Votes en conflit** | Un utilisateur qui avait voté sur `S` **et** sur `T`, sur le même axe, a déjà une ligne pour `T` : la ligne de `S` est supprimée, celle de `T` est conservée. Sinon la clé primaire `(user_id, prediction_id, axis_id)` est violée. |
| **Enfants** | Les enfants de `S` voient leur `parent_id` basculer sur `T`. |
| **Parents alternatifs** | Les liens de `S` sont réaffectés à `T`, puis dédoublonnés. Un lien devenu `T → T` est supprimé. |
| **Tags** | Union des tags des deux, doublons retirés. |
| **Appartenance aux choix** | Union des lignes `choice_options`, doublons retirés. |
| **Scores** | Recalculés sur `T` après transfert. |
| **Validation** | Si `S` et `T` portent des `is_realized` contradictoires, la fusion s'arrête et demande au modérateur de trancher d'abord. |

### L'événement absorbé n'est pas supprimé

Une colonne `merged_into_id` sur `predictions` pointe de `S` vers `T`. Effet : les anciens
liens et URL vers `S` continuent de résoudre, en redirigeant vers `T`, et la fusion reste
vérifiable après coup. `S` est exclu de tous les affichages et de tous les décomptes.

Cette colonne **n'est pas créée en V1** : sa forme définitive dépend des décisions
ci-dessous. En SQLite, `ALTER TABLE … ADD COLUMN` sur une colonne nullable est une
opération triviale, donc l'ajouter le jour de l'implémentation ne coûte rien.

> 🟡 **À trancher.** L'auteur de `S` garde-t-il son crédit de création dans
> `user_stats.predictions_created` ? Le conserver récompense un doublon ; le retirer punit
> quelqu'un qui n'a peut-être pas vu l'original.

> 🟡 **À trancher.** La fusion est-elle réversible ? Avec `merged_into_id` la structure
> survit, mais les votes en conflit supprimés, eux, ne reviennent pas.

---

## 4. Points à trancher

1. 🟡 Critère de survie imposé, ou choix du modérateur (§3).
2. 🟡 Crédit de création de l'auteur absorbé (§3).
3. 🟡 Réversibilité de la fusion (§3).
4. 🟡 Un utilisateur peut-il **signaler** un doublon, pour alimenter une file de modération ?
   Aucune table de signalement n'existe aujourd'hui.
