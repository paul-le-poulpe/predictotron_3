# predictotron — Modèle conceptuel

> Point d'entrée du projet : [PROJECT.md](PROJECT.md). Décisions et points ouverts :
> [DECISIONS.md](DECISIONS.md).

**Statut : draft v0.2.**

Le vocabulaire et les règles du domaine. Ce document ne parle **pas** de base de données
(voir [DATABASE.md](DATABASE.md)) ni d'interface (voir [PAGES.md](PAGES.md)) : il définit
ce que sont les objets et comment ils se comportent.

---

## 1. Vocabulaire

| Terme | Sens |
|---|---|
| **Prédiction** / **Événement** | Un post. Les deux mots désignent la même chose et sont interchangeables. |
| **Univers** | Le contexte dans lequel l'événement se déroule : le futur, le passé, Dune, Game of Thrones… |
| **Présent** | Le point de départ de l'arborescence de l'univers « futur ». Ce n'est pas un événement : c'est une frontière mobile (§4). |
| **Parent** | L'événement qui doit s'être produit **avant** celui-ci pour qu'il puisse advenir. |
| **Parent alternatif** | Un autre chemin menant au même événement. Plusieurs façons qu'un événement se réalise. |
| **Enfant** | Un événement qui a celui-ci pour parent. Jamais stocké : déduit par recherche inverse. |
| **Niveau 1** | Un événement qui découle directement du présent (§4). |
| **Choix** (décision) | Superstructure regroupant des événements mutuellement exclusifs — typiquement une élection. |
| **Axe** | Dimension de vote : probabilité, intérêt, fun. |
| **Titre** | Récompense obtenue par un utilisateur pour un accomplissement. Voir [TITLES.md](TITLES.md). |

---

## 2. Règle éditoriale fondamentale

> **Un événement est simple et indiscutable. Une phrase = un fait.**

Il doit y avoir **zéro ambiguïté** au moment de décider si l'événement s'est produit ou non.

| | Exemple | Pourquoi |
|---|---|---|
| ✅ | « Un homme pose le pied sur la Lune » | Vérifiable, binaire, daté. |
| ❌ | « L'homme conquiert la Lune » | Conquiert à partir de quand ? Atterrissage ? Base permanente ? Ville ? Indécidable. |

Cette règle conditionne tout le reste : la vérification, la modération, et la valeur même
du site. Un événement ambigu est **rejeté** par la modération, pas corrigé au moment de
la vérification.

---

## 3. L'arborescence des événements

Un événement a **un parent** (son parent canonique) et, éventuellement, des **parents
alternatifs**. Le lien parent → enfant signifie : *l'enfant ne peut se produire qu'après
le parent*.

```
        [ LE PRÉSENT ]
              |
        +-----+------+
        |            |
   Événement A   Événement B
        |
   Événement C
```

### Les enfants ne sont pas stockés

On ne stocke que le lien vers le parent. Pour obtenir les enfants d'un événement, on
cherche tous ceux qui l'ont pour parent. Une seule direction, une seule source de vérité.

### Parents alternatifs : densifier, ne pas dupliquer

Un même événement peut être atteint par plusieurs chemins.

```
  "Les Russes atterrissent sur la Lune" ----+
                                            +---> "L'homme atterrit sur la Lune"
  "Les Américains atterrissent sur la Lune"-+
```

Un seul événement « L'homme atterrit sur la Lune », deux parents possibles.

**Ce n'est pas une commodité, c'est un mécanisme anti-duplication essentiel.** Sans les
parents alternatifs, quand A et B mènent tous deux à C, un utilisateur crée C sous A et un
autre crée C sous B : deux copies de C, chacune avec ses votes et ses enfants. Le graphe
prolifère au lieu de se densifier. Voir [DEDUPLICATION.md](DEDUPLICATION.md) §2.

La structure est donc un **graphe orienté acyclique (DAG)**, pas un arbre strict, même si
on l'affiche comme un arbre. Les cycles sont interdits : un événement ne peut pas être son
propre ancêtre.

> 🔴 **Ouvert** : aujourd'hui les parents alternatifs sont en **OU** (l'un d'eux suffit).
> Faut-il un jour exprimer un **ET** (« A et B doivent tous deux s'être produits ») ?
> Non décidé.

---

## 4. Le présent est une frontière mobile

Un événement dont le parent est vide a pour parent implicite **le présent** de son univers.
Le présent n'est pas une ligne en base : c'est une position dans le graphe.

**Définition du niveau 1** :

> Un événement est au niveau 1 si **il n'a pas de parent**, ou si **son parent est déjà
> réalisé**.

Conséquence : quand un événement se réalise, **ses enfants continuent de pointer sur lui**
— rien n'est déplacé, rien n'est réécrit. L'événement réalisé bascule simplement derrière
la frontière, et ses enfants deviennent mécaniquement le nouveau niveau 1.

```
avant :   [présent] --> A(ouvert) --> B(ouvert) --> C(ouvert)
                         ^ niveau 1

A se réalise

après :   [passé] A(réalisé) | [présent] --> B(ouvert) --> C(ouvert)
                                              ^ niveau 1
```

L'historique reste intact et consultable en amont de la frontière. Le graphe ne bouge
jamais ; seule la frontière avance.

---

## 5. Réalisation d'un événement

Un événement porte l'information « s'est-il réalisé ? » sous forme de trois états :

| État | Sens |
|---|---|
| **Indéterminé** | L'événement n'a pas encore été tranché. C'est l'état par défaut. |
| **Réalisé** | L'événement s'est produit. |
| **Non réalisé** | L'événement ne se produira pas (échéance dépassée, option perdante d'un choix, impossibilité avérée). |

Une seule information accompagne la réalisation : **qui** a validé. La décision d'**un seul
vérificateur** suffit — pas de quorum. Un modérateur peut revenir sur la décision d'un
vérificateur.

> Volontairement, rien d'autre n'est enregistré à ce stade : ni la date de validation, ni
> la source, ni l'historique des décisions. Ces points sont listés dans
> [DATABASE.md](DATABASE.md) §10 pour être tranchés plus tard.

### Verrouillage des votes

Dès qu'un événement est tranché, les votes sur l'axe **probabilité** sont **verrouillés** :
on ne peut plus ni voter ni changer son vote. Sans cela, on pourrait voter « probable »
après coup et récolter des titres gratuitement.

> 🟡 Les axes **intérêt** et **fun** restent-ils ouverts après résolution ? Ils ne
> conditionnent aucun titre a priori, donc probablement oui. À confirmer.

---

## 6. Les choix (décisions)

Un **choix** regroupe plusieurs événements **mutuellement exclusifs** : un seul d'entre eux
peut se réaliser.

Exemple — « Élection présidentielle 2027 » :
- « Marine Le Pen est élue »
- « Jean-Luc Mélenchon est élu »
- « Édouard Philippe est élu »

### Le choix ne porte pas la décision *(décidé)*

> **Le choix liste simplement des événements. C'est l'événement qui porte l'information.**

Un choix n'a pas d'état propre, pas de vainqueur enregistré, pas de résolution. Il ne
modifie jamais un événement. L'état d'un choix se **lit** à travers ses membres : s'il en
existe un qui est réalisé, c'est le vainqueur.

Conséquence directe : **un événement peut appartenir à plusieurs choix** *(décidé)*.
« X est élu président » peut figurer dans « Qui est élu en 2027 ? » et dans « Quel parti
gouverne en 2027 ? » sans qu'aucun conflit ne soit possible — il n'a qu'un seul état de
réalisation, posé une seule fois, par un seul vérificateur.

### Rôle de l'exclusivité

Deux formes, qui sont des **indications** et non des automatismes :
- **exactement un** : l'un des événements se réalisera forcément (une élection a un vainqueur) ;
- **au plus un** : il est possible qu'aucun ne se réalise.

L'exclusivité sert à :
1. **assister le vérificateur** — quand il déclare une option réalisée, on lui propose de
   trancher aussi les autres, mais chaque événement est tranché individuellement et
   explicitement ;
2. **signaler les incohérences** à la modération — un choix « exactement un » avec deux
   membres réalisés est une anomalie à examiner, pas une erreur à corriger automatiquement.

---

## 7. Les votes

Trois **axes** de vote, chacun binaire (+1 / −1) :

| Axe | Question posée |
|---|---|
| **Probabilité** | Est-ce que je pense que c'est probable ? |
| **Intérêt** | Est-ce que je trouve ça intéressant ? |
| **Fun** | Est-ce que je trouve ça fun ? |

Les axes sont indépendants : un utilisateur peut voter sur un, deux ou trois axes d'un même
événement. Le score affiché par axe est la somme des votes.

Un vote se retire (retour à « pas de vote »), il ne se met pas à zéro.

> 🟡 **Un auteur peut-il voter sur sa propre prédiction ?** Tu as décrit les notes comme
> « attribuées par d'autres joueurs », ce qui suggère non, mais ça n'a jamais été tranché.
> Rien dans le schéma ne l'interdit aujourd'hui.

**Ce qui compte n'est pas la liste, c'est le principe** : la notation se fait sur
**plusieurs axes**, et les axes exacts ne sont pas figés. Probabilité / intérêt / fun sont
un jeu de départ plausible. L'implémentation doit donc rester générique : `vote_axes` est
une table de données, aucun axe n'est codé en dur, ajouter ou retirer un axe est une ligne
insérée ou désactivée.

> 🔴 **Ouvert** : la liste définitive des axes, à revoir plus tard.

---

## 8. Les tags

Un événement peut porter plusieurs tags, un tag couvre plusieurs événements. Ils servent à
la recherche et au filtrage.

> 🔴 **Ouvert** : tags libres (créés par n'importe quel utilisateur) ou liste fermée gérée
> par les administrateurs ?

---

## 9. Univers

Un univers est le contexte d'un ensemble d'événements. Les événements d'un univers ne se
lient **jamais** à ceux d'un autre univers.

| Univers | Type | Statut |
|---|---|---|
| Le futur | réel, prospectif | **seul univers ouvert au lancement** |
| Le passé | réel, rétrospectif | prévu |
| Dune, Game of Thrones… | fictionnel | prévu |

Chaque univers a son propre point de départ : « le présent » pour le futur. Les règles de
vérification diffèrent selon le type d'univers (un événement fictionnel se vérifie dans
l'œuvre, pas dans l'actualité).

---

## 10. Points ouverts

1. 🔴 ET / OU entre parents multiples (§3).
2. 🔴 Liste définitive des axes de vote (§7).
3. 🔴 Tags libres ou liste fermée (§8).
4. 🟡 Verrouillage des axes intérêt/fun après résolution (§5).
5. 🟡 Un auteur peut-il voter sur sa propre prédiction ? (§7)
