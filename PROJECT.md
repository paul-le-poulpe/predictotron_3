# predictotron — Définition du projet

Dépôt : https://github.com/paul-le-poulpe/predictotron_3

**Point d'entrée du projet. Commencer ici.**

**État : phase de définition. Aucune ligne de code écrite.**

---

## 0. Pour reprendre le projet

Si tu arrives sur ce projet sans contexte, lis dans cet ordre :

1. **[CONCEPTS.md](CONCEPTS.md)** — ce que sont un événement, un univers, un choix, un axe.
   Rien d'autre n'a de sens sans ça.
2. **[DECISIONS.md](DECISIONS.md)** — tout ce qui est déjà tranché, et tout ce qui ne l'est
   pas. **Ne jamais re-trancher un point de la première liste sans que Paul le demande.**
3. **[DATABASE.md](DATABASE.md)** — le schéma.
4. Les autres documents selon le sujet (§2).

### Règles de travail avec Paul

1. **Paul définit le produit, module par module.** Il a une idée claire de ce qu'il veut.
2. **Ne rien inventer.** Poser la question plutôt que de combler un trou par une hypothèse.
   Quand une hypothèse est nécessaire pour avancer, l'écrire explicitement et la marquer.
3. Un point marqué 🔴 « à définir par Paul » **n'est pas à proposer** — en particulier la
   navigation de la page principale ([PAGES.md](PAGES.md) §1).
4. Rester simple. Une colonne, une table ou un mécanisme qui ne répond à aucun besoin
   exprimé ne doit pas être ajouté « au cas où ».
5. Quand un choix a une conséquence que Paul n'a pas envisagée, la dire en une ou deux
   phrases, puis appliquer sa décision.

### Convention de notation, utilisée dans tous les documents

| Marque | Sens |
|---|---|
| *(décidé)* | Tranché par Paul. Ne pas revenir dessus seul. |
| 🟡 | Proposition de Claude, ou question ouverte, **à valider par Paul**. |
| 🔴 | Laissé ouvert **volontairement**. C'est Paul qui le définira. |
| ⏳ | Fait partie du produit, mais pas de la V1. |

---

## 1. Ce qu'est le produit

Un site où des utilisateurs publient des **prédictions** sur le futur.

Une prédiction est un **événement** : une phrase, un fait, vérifiable sans ambiguïté. Les
événements sont **liés entre eux** par des relations de parent à enfant et forment une
arborescence partant du présent.

Les utilisateurs **notent** les événements des autres sur plusieurs axes, et accumulent des
**titres** quand leurs prédictions se réalisent, ou quand celles sur lesquelles ils ont misé
se réalisent.

---

## 2. Les documents

| Document | Contenu | État |
|---|---|---|
| [CONCEPTS.md](CONCEPTS.md) | Vocabulaire, règle éditoriale, arborescence, frontière du présent, choix, votes, univers | v0.2 |
| [DECISIONS.md](DECISIONS.md) | **Liste unique** de ce qui est tranché et de ce qui reste ouvert | v1.0 |
| [DATABASE.md](DATABASE.md) | Le schéma, table par table, avec les index | v1.0 |
| [AUTH.md](AUTH.md) | Authentification : bibliothèque, mot de passe, OAuth, pseudonyme | v0.6 |
| [ROLES.md](ROLES.md) | Les 4 rôles, la matrice des permissions | v0.3 |
| [LISTS.md](LISTS.md) | Composant de liste unifié, critères de tri, recherche plein texte | v0.1 |
| [DEDUPLICATION.md](DEDUPLICATION.md) | Éviter les doublons d'événements ; fusion (hors V1) | v0.3 |
| [TITLES.md](TITLES.md) | Système de titres | squelette — contenu à définir par Paul |
| [PAGES.md](PAGES.md) | Inventaire des écrans. **Page principale non définie exprès** | v0.2 |
| — | Modération | pas commencé |
| — | Aspect visuel, design | plan précis chez Paul, session dédiée. On démarre par une maquette sans style ([PAGES.md](PAGES.md) §1b) |

---

## 3. Contraintes d'hébergement

- Hébergé sur **Cloudflare**.
- Déployé par une **chaîne GitHub**.
- Base de données : **Cloudflare D1** (SQLite).
- **La portabilité est une contrainte dure.** La pile doit rester aussi agnostique que
  possible pour pouvoir migrer vers un serveur propre ou un autre fournisseur. Pas
  d'enfermement dans des API spécifiques à Cloudflare au-delà de l'inévitable ; ce qui est
  spécifique à la plateforme doit se trouver derrière une couche d'abstraction.
- Outillage : **open source par défaut**.

> ⚠️ Deux conséquences déjà identifiées de la portabilité :
> - l'authentification passe par une **bibliothèque** et non par un service hébergé
>   ([AUTH.md](AUTH.md) §2) ;
> - l'index de recherche FTS5 empêche l'export D1 et doit être supprimé puis recréé lors
>   d'une sauvegarde ([LISTS.md](LISTS.md) §5).

---

## 4. Périmètre V1

Tout ce qui suit fait partie du **produit final**. La colonne dit seulement ce qui est
construit en premier.

| Élément | V1 | Note |
|---|:--:|---|
| Comptes, connexion **mot de passe** | ✅ | Via une bibliothèque éprouvée, jamais écrite à la main ([AUTH.md](AUTH.md)) |
| Connexion Google (OAuth) | ✅ | Cohabite avec le mot de passe sur le même compte |
| Écran de choix du pseudonyme | ✅ | Unique, partagé par les deux parcours, bloquant |
| Créer un événement, arborescence, navigation | ✅ | |
| Parents alternatifs | ✅ | **Essentiel** : mécanisme anti-duplication ([DEDUPLICATION.md](DEDUPLICATION.md) §2) |
| Notation multi-axes | ✅ | Générique : les axes sont des lignes, jamais des colonnes |
| Validation d'un événement par un vérificateur | ✅ | Sans elle, la frontière du présent n'avance jamais |
| Tags | ✅ | |
| Recherche plein texte (FTS5) | ✅ | Alimente la recherche **et** la suggestion anti-doublon |
| Composant de liste trié unifié | ✅ | Date, score par axe, nombre de votes par axe, similarité |
| Titres | ✅ | Familles et seuils à définir par Paul |
| Page d'activité | ✅ | |
| **Choix (décisions)** | ⏳ | Dans le plan. Implémentation repoussable après la V1 |
| Fusion de deux événements | ⏳ | Mémorisée, **à explorer avant d'implémenter** |
| Tri par poids combiné | ⏳ | Ne peut pas utiliser d'index ([LISTS.md](LISTS.md) §4) |
| Autres univers que le futur | ⏳ | La table existe, une seule ligne active |
| Statut de modération, historiques | ⏳ | Écartés volontairement ([DATABASE.md](DATABASE.md) §10) |
| Notifications | ⏳ | Jamais spécifiées |

---

## 5. Prochaines étapes

Dans cet ordre.

### 5.1 Lever les inconnues techniques — avant d'écrire le reste

| # | À vérifier | Pourquoi maintenant |
|---|---|---|
| 1 | Un prototype Worker + D1 + Better Auth qui inscrit et connecte réellement | Une anomalie d'initialisation Workers + D1 a existé en 2026 ; la réponse conditionne toute la pile ([AUTH.md](AUTH.md) §2) |
| 2 | Temps CPU du hachage scrypt dans un Worker | Le budget CPU d'un Worker est limité ; le coût du hachage doit être ajusté en conséquence |
| 3 | Peut-on remplacer la fonction de normalisation du pseudonyme ? | Sinon il faut un champ `username_key` maintenu par l'application ([AUTH.md](AUTH.md) §3) |
| 4 | Créer une table FTS5 sur D1 et mesurer une recherche | Confirme la faisabilité de la recherche et de la suggestion anti-doublon |

### 5.2 Décisions qui manquent pour démarrer

1. **Tri par défaut des enfants d'un événement** ([LISTS.md](LISTS.md) §7) — c'est le tri
   que verront presque tous les utilisateurs.
2. **Les familles de titres, leurs niveaux et leurs seuils** ([TITLES.md](TITLES.md) §3).
3. **La page principale** ([PAGES.md](PAGES.md) §1) — 🔴 Paul la définit, personne d'autre.
4. Le reste des points 🟡 est listé dans [DECISIONS.md](DECISIONS.md).

### 5.3 Ordre de construction proposé

1. Schéma et migrations.
2. Authentification + écran de pseudonyme.
3. Création d'un événement, affichage d'un événement, arborescence.
4. Votes multi-axes.
5. Validation par un vérificateur.
6. Recherche et suggestion anti-doublon.
7. Tags.
8. Titres.
9. Page d'activité.
