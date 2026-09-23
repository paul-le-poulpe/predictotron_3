# predictotron — Authentification

> Point d'entrée du projet : [PROJECT.md](PROJECT.md). Décisions et points ouverts :
> [DECISIONS.md](DECISIONS.md).

**Statut : draft v0.6.**

Principe directeur, posé par Paul : **le plus standard, le plus fiable, le plus simple
possible.** Ce document en tire une conséquence directe.

---

## 1. On n'écrit pas l'authentification soi-même

Une authentification par mot de passe correcte, ce n'est pas un hachage. C'est :

| Élément | Ce qui casse s'il est mal fait |
|---|---|
| Hachage lent et salé | Une fuite de la base livre les mots de passe en clair |
| Comparaison à temps constant | La durée de la réponse indique si l'e-mail existe |
| Confirmation d'adresse | On s'inscrit avec l'adresse de quelqu'un d'autre |
| Jeton de réinitialisation | Réutilisable, devinable, ou sans expiration → prise de contrôle du compte |
| Session | Jeton stocké en clair en base, ou non révocable |
| Limitation des tentatives | Comptes cassés par force brute |
| `state` OAuth | Faux appel de retour accepté → connexion au compte d'un autre |

Chaque ligne est un mode de défaillance documenté, et chacune a déjà fait perdre des bases
de comptes à des équipes compétentes. **Écrire soi-même ces sept éléments est l'option la
moins fiable**, pas la plus simple.

La réponse standard est une bibliothèque éprouvée. Reste à en choisir une qui n'introduit
pas de dépendance à un fournisseur, puisque la portabilité est une contrainte dure du
projet ([PROJECT.md](PROJECT.md) §3).

---

## 2. Choix : Better Auth *(proposition à valider)*

**Une bibliothèque, pas un service.** Elle tourne dans ton application et écrit dans ta
base. Aucun compte chez un tiers, aucun appel sortant, rien à migrer le jour où tu quittes
Cloudflare : tu emportes le code et les tables.

C'est ce qui l'écarte de Clerk, Auth0 ou WorkOS. Ces trois-là sont fiables et simples, mais
ce sont des services : les comptes vivent chez eux, et en partir est un projet.

### Ce que la bibliothèque prend en charge

- e-mail + mot de passe, avec hachage **scrypt** par défaut ;
- fournisseurs OAuth (Google, GitHub, Apple…), `state` et échange de code compris ;
- sessions, création et révocation ;
- confirmation d'adresse et réinitialisation de mot de passe ;
- rattachement de plusieurs méthodes de connexion à un même compte ;
- 2FA et passkeys, si on en veut un jour.

### Compatibilité Cloudflare — vérifiée

Better Auth 1.5 (février 2026) a ajouté **D1 comme base de données de premier rang** : on
passe le binding D1 directement, sans adaptateur maison. Les écritures groupées de D1 sont
utilisées pour l'atomicité, D1 n'ayant pas de transactions interactives.

**Le hachage scrypt résout l'inconnue Argon2/bcrypt** relevée dans les versions précédentes
de ce document : l'implémentation par défaut est du JavaScript pur, donc elle fonctionne
dans un Worker sans module natif. L'OWASP recommande scrypt lorsque Argon2id n'est pas
disponible — ce qui est exactement le cas ici.

> ⚠️ **Deux points à tester tôt, pas à supposer.**
> 1. Un scrypt en JavaScript pur consomme du temps CPU, et un Worker en a un budget limité.
>    Mesurer le temps de hachage réel et ajuster le coût en conséquence. Une discussion
>    ouverte côté Better Auth porte sur l'usage du scrypt natif pour ce cas précis.
> 2. Une anomalie d'initialisation sur Workers + D1 a été signalée en août 2026 et corrigée
>    en septembre 2026. **Fixer une version récente et monter un prototype qui se connecte
>    réellement, avant d'écrire quoi que ce soit d'autre.**

---

## 3. Périmètre V1 *(décidé)*

**Mot de passe ET Google OAuth, tous les deux dès la V1.** Les deux méthodes cohabitent sur
le même compte : quelqu'un inscrit par mot de passe peut lier Google plus tard, et
l'inverse.

### La seule dépendance nouvelle : l'envoi d'e-mails

Confirmation d'adresse et réinitialisation de mot de passe en ont besoin toutes les deux.
La bibliothèque appelle une fonction que **tu** fournis ; le service d'envoi reste ton
choix et ton contrat.

🟡 Fournisseur à choisir. Critère de portabilité : en préférer un joignable par une simple
requête HTTP, pour pouvoir en changer sans réécrire l'application.

### Pseudonyme public unique *(décidé)*

**Chaque compte a un pseudonyme distinct de son adresse e-mail, unique sur le site.**
L'adresse e-mail n'est jamais affichée.

Better Auth fournit un module dédié, qui stocke **deux valeurs** :

| Valeur | Contenu |
|---|---|
| `username` | la forme normalisée, en minuscules — c'est elle qui porte la contrainte d'unicité |
| `displayUsername` | la forme telle que la personne l'a écrite — c'est elle qui s'affiche |

Conséquence : `PaulLePoulpe` s'affiche tel quel, et personne d'autre ne peut prendre
`paullepoulpe`. Sans cette normalisation, deux pseudonymes ne différant que par la casse
coexisteraient, ce qui est un mécanisme d'usurpation.

Le module permet aussi la connexion par pseudonyme plutôt que par e-mail, et de vérifier la
disponibilité d'un pseudonyme avant validation.

#### Normalisation pour l'unicité *(décidé)*

**Les accents sont autorisés à l'affichage. La clé d'unicité, elle, les retire.**

Transformation appliquée pour obtenir la clé :

1. passage en minuscules ;
2. suppression des accents et signes diacritiques (`é` → `e`, `ü` → `u`, `ç` → `c`) ;
3. suppression de tout ce qui n'est ni lettre ni chiffre.

| Saisi | Clé d'unicité |
|---|---|
| `Amélie` | `amelie` |
| `Amelie` | `amelie` → **refusé si le premier existe** |
| `Paul.Le.Poulpe` | `paullepoulpe` |
| `Paul_Le_Poulpe` | `paullepoulpe` → **refusé** |

`Amélie` s'affiche avec son accent ; personne ne peut ensuite prendre `Amelie`.

Trois conséquences à assumer, qui découlent directement de la règle :

- **La ponctuation ne distingue plus deux pseudonymes.** `paul.le.poulpe` et
  `paul_le_poulpe` sont le même. C'est voulu : ce sont précisément les variantes qu'un
  usurpateur utiliserait.
- **Le jeu de caractères doit rester l'alphabet latin.** Autoriser n'importe quel caractère
  Unicode ferait entrer les lettres visuellement identiques d'autres alphabets — un `а`
  cyrillique se lit comme un `a` latin, et l'étape 3 le supprimerait, donnant une clé qui ne
  correspond à rien de ce qui est affiché. Règle : lettres latines (accentuées comprises),
  chiffres, et `_` `.` `-`. Tout le reste est refusé à la saisie.
- **Un pseudonyme dont la clé serait vide ou trop courte est refusé.** Sans cette règle,
  `...` ou `___` passeraient la validation de longueur et produiraient une clé vide.

> 🟡 **À vérifier dans le prototype.** Le module normalise en minuscules par défaut ; il
> reste à confirmer qu'on peut remplacer sa fonction de normalisation par celle ci-dessus.
> Si ce n'est pas possible, il faudra un champ additionnel `username_key` avec sa propre
> contrainte d'unicité, tenu à jour par l'application. Le comportement visé est le même dans
> les deux cas.

> 🟡 **Changement de pseudonyme.** Le module permet de le rendre immuable. S'il est
> modifiable, il faut décider si l'ancien pseudonyme redevient disponible : le libérer
> permet à quelqu'un de reprendre un nom connu et d'hériter de sa réputation.

#### Écran de choix du pseudonyme — un seul, partagé *(décidé)*

Le pseudonyme est requis **quel que soit le mode de connexion**. Google n'en fournit pas, et
l'inscription par e-mail ne doit pas le déduire de l'adresse. C'est donc **le même écran**
dans les deux parcours, affiché après la première authentification réussie.

```
inscription e-mail + mot de passe ─┐
                                   ├─→ [ écran : choisir un pseudonyme ] ─→ site
première connexion Google ─────────┘
```

L'écran vérifie la disponibilité avant validation, et affiche la clé d'unicité calculée
quand elle diffère de la saisie, pour que le refus de `Amelie` après `Amélie` soit
compréhensible.

**Un compte sans pseudonyme est un compte incomplet** : il ne peut ni publier, ni voter, ni
apparaître nulle part, et l'écran revient à la connexion suivante. Sans cette règle, un
abandon à cette étape laisse un compte utilisable mais sans nom affichable.

### Règles de mot de passe

🟡 À fixer. Recommandation : **12 caractères minimum, aucune règle de composition**. Les
exigences du type « une majuscule, un chiffre, un caractère spécial » produisent des mots
de passe plus courts et plus prévisibles.

---

## 4. Schéma

**La bibliothèque possède ses propres tables et ses migrations.** On ne les redéfinit pas
ici : les réécrire à la main reviendrait à reprendre le travail qu'on délègue.

Correspondance avec ce qui était décrit dans les versions précédentes de ce document :

| Ce qu'on avait écrit | Ce que la bibliothèque fournit |
|---|---|
| `users` | sa table utilisateur, **étendue** de nos champs (§4.1) |
| `user_identities` | sa table de comptes liés : une ligne par méthode de connexion |
| `user_sessions` | sa table de sessions |
| `user_tokens` | sa table de vérification (confirmation, réinitialisation) |
| `login_attempts` | sa limitation de débit intégrée |

### 4.1 Nos champs à nous

Les champs propres au produit sont déclarés comme **champs additionnels** du modèle
utilisateur, donc rangés dans la même table :

| Champ | Rôle |
|---|---|
| `role` | 1/2/3/4, cf. [ROLES.md](ROLES.md) |
| `display_title_id` | titre affiché à côté du nom ([TITLES.md](TITLES.md)) |
| `bio`, `avatar_url` | 🟡 profil |
| `status` | `active` / `suspended` / `banned` |
| `deleted_at` | suppression logique |

Tout le reste du schéma ([DATABASE.md](DATABASE.md)) référence l'utilisateur par sa clé,
et ne dépend donc pas de la manière dont il se connecte.

### 4.2 Ce qui reste vrai quelle que soit la bibliothèque

- **L'identité de connexion est une ligne, jamais une colonne de l'utilisateur.** Ajouter
  un fournisseur = insérer des lignes.
- **L'e-mail est une donnée de profil, jamais la clé d'authentification.** La recherche à
  la connexion passe par le couple (fournisseur, identifiant chez le fournisseur). Un
  e-mail change ; un identifiant de fournisseur non.
- **Ne jamais rattacher deux comptes automatiquement sur l'e-mail.** Un fournisseur qui ne
  vérifie pas l'adresse permettrait de prendre le contrôle d'un compte existant en
  déclarant son e-mail. Le rattachement se fait depuis une session déjà authentifiée.

---

## 5. Ordre de travail

1. Prototype minimal : Worker + D1 + Better Auth, une inscription et une connexion qui
   fonctionnent. **Avant tout le reste** — c'est là que se trouvent les deux inconnues du §2.
2. Mesurer le temps CPU du hachage, ajuster le coût.
3. Brancher Google.
4. Brancher l'envoi d'e-mails, puis confirmation et réinitialisation.
5. Ajouter les champs additionnels (`role`, etc.).

---

## 6. Points à trancher

1. 🟡 Valider le choix Better Auth.
2. 🟡 Fournisseur d'envoi d'e-mails.
3. 🟡 Longueur minimale de mot de passe.
4. 🟡 Durée de vie d'une session et renouvellement.
5. 🟡 Que devient le contenu d'un compte supprimé ? Les prédictions d'un compte supprimé ne
   peuvent pas disparaître sans casser l'arborescence — auteur remplacé par « compte
   supprimé » ?
6. 🟡 D'autres fournisseurs OAuth après Google ?

---

Sources :
[Better Auth 1.5 — support D1 natif](https://better-auth.com/blog/1-5),
[Better Auth — Security (hachage scrypt)](https://better-auth.com/docs/reference/security),
[Better Auth — Email & Password](https://better-auth.com/docs/authentication/email-password),
[Issue : scrypt natif pour Cloudflare Workers](https://github.com/better-auth/better-auth/issues/8456)
