# Instructions pour Claude - Formation Blueshift

## Contexte
L'utilisateur suit la formation Blueshift pour apprendre Anchor/Solana.
Mode d'accompagnement : **pedagogique** - guider sans donner le code directement.

## Workflow pour chaque nouvelle page de cours

Quand l'utilisateur donne une URL de page Blueshift (ex: `https://learn.blueshift.gg/fr/courses/...`), tu dois :

### 1. Identifier le module
- Extraire le nom du module depuis l'URL (ex: `anchor-accounts`, `anchor-instructions`)
- Verifier si le dossier existe dans `anchor-for-dummies/`
- Si non, le creer

### 2. Fetcher le contenu
- Utiliser l'URL raw GitHub : `https://raw.githubusercontent.com/blueshift-gg/blueshift-dashboard/refs/heads/master/src/app/content/courses/anchor-for-dummies/{module}/fr.mdx`
- Extraire TOUTES les notions, concepts, et exemples de code

### 3. Creer le CLAUDE.md du module
Dans `anchor-for-dummies/{module}/CLAUDE.md`, inclure :
- Objectif du module
- Liste des notions cles avec explications
- Snippets de code importants
- Exercices pratiques (un par notion)
- Ordre recommande

### 4. Creer la todo
Utiliser TodoWrite pour lister tous les exercices a faire.

### 5. Generer le quiz
Lancer un subagent pour creer `quiz.html` avec :
- Questions QCM sur chaque notion
- 4 options par question
- Explications detaillees apres chaque reponse
- Categories pour identifier les points faibles
- Design moderne (comme le quiz anchor-accounts)

## Template de quiz

Le quiz doit suivre le format de `/anchor-for-dummies/anchor-accounts/quiz.html` :
- Interface web responsive
- Questions melangees aleatoirement
- Score en temps reel
- Bouton "Passer" pour skip
- Resultats avec categories a revoir
- Bouton "Revoir les erreurs"

## Modules deja traites
- [x] anchor-101 (vault basique)
- [x] anchor-accounts (comptes, PDAs, contraintes)

## Structure des dossiers
```
anchor-for-dummies/
├── anchor-101/
│   └── anchor-vault/
├── anchor-accounts/
│   ├── CLAUDE.md
│   ├── quiz.html
│   ├── quiz.ts
│   └── package.json
├── anchor-instructions/
├── testing-program/
├── client-side-development/
├── program-deployment/
└── advanced-anchor/
```

## Commandes utiles
```bash
# Ouvrir le quiz dans le navigateur
open ~/Documents/blueshift/anchor-for-dummies/{module}/quiz.html

# Lancer le quiz en terminal
cd ~/Documents/blueshift/anchor-for-dummies/{module}
npm install && npm run quiz
```
