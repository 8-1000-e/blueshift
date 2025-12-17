# 🎓 Guide d'Apprentissage - Solana Pay (Blueshift)

## Tu es débutant complet ? Pas de panique !

Ce guide va t'accompagner étape par étape pour comprendre et réussir les exercices du cours Solana Pay sur Blueshift. Je ne te donne pas le code directement - je t'explique les concepts et te guide pour que tu apprennes vraiment.

---

## 📚 ÉTAPE 0 : Prérequis à installer

Avant de commencer, assure-toi d'avoir :

### 1. Node.js
```bash
# Vérifie si tu l'as
node --version

# Si non, télécharge sur https://nodejs.org (version LTS)
```

### 2. Un éditeur de code
- **VS Code** (recommandé) : https://code.visualstudio.com
- Extensions utiles : "Solana" et "TypeScript"

### 3. Un wallet Solana (pour tester)
- **Phantom** : https://phantom.app
- Mets-le en mode "Devnet" dans les settings

### 4. Créer ton projet
```bash
# Crée un dossier
mkdir solana-pay-learning
cd solana-pay-learning

# Initialise le projet
npm init -y

# Installe TypeScript
npm install typescript ts-node @types/node --save-dev

# Crée le fichier de config TypeScript
npx tsc --init
```

### 5. Installer les dépendances Solana
```bash
npm install @solana/web3.js @solana/pay bignumber.js
```

---

## 🧠 LEÇON 1 : Comprendre les bases

### C'est quoi Solana Pay ?

Imagine que tu veux recevoir un paiement. Traditionnellement :
```
Client → Banque → Processeur (Stripe/PayPal) → Ta banque → Toi
         ↑              ↑                         ↑
       Délai         Frais 2-3%               2-3 jours
```

Avec Solana Pay :
```
Client → Toi
    ↑
  Instantané, ~0.00025$ de frais
```

### Les 2 types de requêtes

| Type | C'est quoi | Exemple |
|------|------------|---------|
| **Transfer Request** | Tout est dans l'URL, simple | "Paie 5$ à cette adresse" |
| **Transaction Request** | Le serveur construit la transaction | "Achète ce NFT au prix actuel" |

### L'URL Solana Pay - Anatomie

```
solana:<DESTINATAIRE>?amount=<MONTANT>&label=<NOM>&message=<MESSAGE>
```

**Décomposition :**
- `solana:` → Le protocole (comme `https:`)
- `<DESTINATAIRE>` → L'adresse publique qui reçoit
- `amount` → Combien (en SOL ou tokens)
- `label` → Qui demande le paiement
- `message` → Pourquoi

---

## 🔧 EXERCICE 1 : Générer une Keypair

### Objectif
Créer ta première adresse Solana en TypeScript.

### Ce que tu dois comprendre

Une **Keypair** c'est :
- Une **clé publique** = ton adresse (comme un IBAN)
- Une **clé privée** = ton mot de passe (NE JAMAIS PARTAGER)

### Indices pour y arriver

1. Tu dois importer `Keypair` depuis `@solana/web3.js`
2. La méthode pour générer une nouvelle keypair s'appelle... `generate()` 🤔
3. Pour afficher la clé publique, il y a une propriété `.publicKey`
4. Pour la convertir en texte lisible, utilise `.toBase58()`

### Structure de ton fichier

Crée `exercice1.ts` :
```typescript
// 1. Importe Keypair depuis @solana/web3.js
// ÉCRIS TON IMPORT ICI

// 2. Génère une nouvelle keypair
// ÉCRIS TON CODE ICI

// 3. Affiche la clé publique
// ÉCRIS TON CODE ICI
```

### Pour exécuter
```bash
npx ts-node exercice1.ts
```

### Résultat attendu
Tu devrais voir quelque chose comme :
```
Clé publique : 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

### ❓ Bloqué ?
<details>
<summary>Indice 1</summary>
L'import ressemble à : `import { Keypair } from "@solana/web3.js";`
</details>

<details>
<summary>Indice 2</summary>
Pour générer : `const keypair = Keypair.generate();`
</details>

---

## 🔧 EXERCICE 2 : Créer une URL de Transfer Request

### Objectif
Créer un lien de paiement Solana Pay.

### Ce que tu dois comprendre

L'URL encode toutes les infos du paiement :
- Qui reçoit ?
- Combien ?
- Pourquoi ?

### Indices pour y arriver

1. Tu dois importer `encodeURL` depuis `@solana/pay`
2. Tu as besoin d'un `PublicKey` pour le destinataire
3. Le montant utilise `BigNumber` (pas un simple number)
4. La fonction `encodeURL()` prend un objet avec les paramètres

### Les paramètres possibles

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `recipient` | PublicKey | ✅ | Qui reçoit le paiement |
| `amount` | BigNumber | ❌ | Montant en SOL |
| `label` | string | ❌ | Nom du marchand |
| `message` | string | ❌ | Description |
| `memo` | string | ❌ | Note on-chain |
| `reference` | PublicKey | ❌ | ID unique pour tracker |

### Structure de ton fichier

Crée `exercice2.ts` :
```typescript
// 1. Imports nécessaires
// - Keypair, PublicKey depuis @solana/web3.js
// - encodeURL depuis @solana/pay
// - BigNumber depuis bignumber.js

// 2. Crée ou utilise une adresse de destinataire
// Tu peux utiliser ta keypair de l'exercice 1
// Ou une adresse en dur pour tester

// 3. Définis les paramètres du paiement
// - recipient: l'adresse
// - amount: utilise new BigNumber(0.01) pour 0.01 SOL
// - label: "Mon Magasin"
// - message: "Merci pour ton achat !"

// 4. Génère l'URL avec encodeURL()

// 5. Affiche l'URL
```

### Résultat attendu
```
URL Solana Pay : solana:7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?amount=0.01&label=Mon+Magasin&message=Merci+pour+ton+achat+%21
```

### ❓ Bloqué ?
<details>
<summary>Indice : structure de encodeURL</summary>

```typescript
const url = encodeURL({
  recipient: new PublicKey("..."),
  amount: new BigNumber(0.01),
  label: "...",
  message: "...",
});
```
</details>

---

## 🔧 EXERCICE 3 : Générer un QR Code

### Objectif
Transformer ton URL en QR code scannable.

### Ce que tu dois comprendre

Un QR code c'est juste une façon visuelle d'encoder une URL.
Le wallet Phantom peut scanner ce QR et lire l'URL Solana Pay.

### Indices pour y arriver

1. Importe `createQR` depuis `@solana/pay`
2. `createQR()` prend l'URL et des options (taille, couleur)
3. Le QR peut être sauvegardé en fichier ou affiché

### Structure de ton fichier

Crée `exercice3.ts` :
```typescript
// 1. Reprends le code de l'exercice 2 pour générer l'URL

// 2. Importe createQR depuis @solana/pay

// 3. Crée le QR code
// createQR(url, taille, couleurFond)
// Exemple de taille : 400
// Couleur de fond : "white" ou "transparent"

// 4. Pour sauvegarder le QR en fichier PNG
// Tu auras besoin de la méthode .getRawData('png')
// Et du module 'fs' pour écrire le fichier
```

### Pour tester
1. Génère le QR code
2. Ouvre-le avec une app de visualisation
3. Scanne-le avec Phantom (en mode Devnet)
4. Tu devrais voir la demande de paiement !

### ❓ Bloqué ?
<details>
<summary>Indice : créer et sauvegarder le QR</summary>

```typescript
import { writeFile } from 'fs/promises';

const qr = createQR(url, 400, "white");
const qrBuffer = await qr.getRawData('png');
await writeFile('qrcode.png', qrBuffer);
```
</details>

---

## 🔧 EXERCICE 4 : Utiliser une Reference

### Objectif
Comprendre et utiliser le système de `reference` pour tracker les paiements.

### Ce que tu dois comprendre

**Le problème** : Comment savoir si quelqu'un a payé ?
- On n'a pas la signature de transaction
- On ne sait pas quand ça va arriver

**La solution** : La `reference`
- C'est une clé publique unique qu'on ajoute à la transaction
- On peut ensuite chercher "toutes les transactions qui contiennent cette reference"

### Le flux

```
1. Tu génères une reference unique (une Keypair)
2. Tu l'ajoutes à l'URL Solana Pay
3. Le client paie → la reference est incluse dans la transaction
4. Tu polls le réseau pour trouver une transaction avec cette reference
5. Tu trouves → le client a payé !
```

### Indices pour y arriver

1. Génère une nouvelle `Keypair` pour la reference
2. Ajoute `.publicKey` comme paramètre `reference` dans `encodeURL()`
3. Utilise `findReference` de `@solana/pay` pour chercher la transaction

### Structure de ton fichier

Crée `exercice4.ts` :
```typescript
// 1. Imports
// - Connection, Keypair, PublicKey de @solana/web3.js
// - encodeURL, findReference de @solana/pay
// - BigNumber

// 2. Connexion au réseau (devnet)
// new Connection(clusterApiUrl("devnet"), "confirmed")

// 3. Génère une reference unique
// C'est juste une Keypair dont tu utilises la publicKey

// 4. Crée l'URL avec la reference

// 5. Affiche l'URL et le QR

// 6. Boucle qui cherche la transaction
// Utilise setInterval pour vérifier toutes les secondes
// findReference(connection, reference) va chercher

// 7. Quand trouvé, affiche "Paiement reçu !"
```

### ❓ Bloqué ?
<details>
<summary>Indice : structure de findReference</summary>

```typescript
try {
  const signatureInfo = await findReference(connection, reference, {
    finality: "confirmed",
  });
  console.log("Paiement trouvé !", signatureInfo.signature);
} catch (e) {
  // Pas encore trouvé, on réessaie
}
```
</details>

---

## 🔧 EXERCICE 5 : Transaction Request (Avancé)

### Objectif
Créer un serveur qui génère des transactions dynamiques.

### Ce que tu dois comprendre

Contrairement au Transfer Request (tout dans l'URL), ici :
1. L'URL pointe vers ton serveur
2. Le wallet fait une requête HTTP à ton serveur
3. Ton serveur construit et renvoie une transaction
4. Le wallet la signe et l'envoie

### Pourquoi c'est utile ?
- Prix dynamiques
- Logique métier complexe
- NFT minting
- Programmes de fidélité

### Le protocole

**GET** `/api/pay`
→ Renvoie des infos d'affichage (label, icon)

**POST** `/api/pay`
→ Reçoit l'adresse du client, renvoie la transaction à signer

### Ce dont tu as besoin

1. Un framework web (Next.js, Express, ou Hono)
2. Gérer les CORS (obligatoire pour les wallets)
3. Construire une Transaction Solana

### Structure de base

```typescript
// Route GET - Infos d'affichage
// Renvoie { label: "...", icon: "..." }

// Route POST - Construction de la transaction
// 1. Récupère l'adresse du client dans le body
// 2. Connecte-toi au réseau pour avoir le blockhash
// 3. Crée une Transaction avec le client comme feePayer
// 4. Ajoute tes instructions (transfert, etc.)
// 5. Sérialise et renvoie la transaction
```

### ❓ Bloqué ?
<details>
<summary>Indice : structure de la réponse POST</summary>

```typescript
// La transaction doit être sérialisée en base64
const serialized = transaction.serialize({
  requireAllSignatures: false,
  verifySignatures: false,
});
const base64 = serialized.toString('base64');

// Réponse
return { transaction: base64 };
```
</details>

---

## 📝 CHECKLIST DE PROGRESSION

- [ ] J'ai installé Node.js et les dépendances
- [ ] J'ai créé mon premier wallet (Keypair)
- [ ] Je comprends la différence clé publique / clé privée
- [ ] J'ai créé une URL de Transfer Request
- [ ] J'ai généré un QR code
- [ ] Je comprends le concept de Reference
- [ ] J'ai implémenté la détection de paiement avec findReference
- [ ] (Bonus) J'ai créé un endpoint de Transaction Request

---

## 🆘 RESSOURCES SI TU BLOQUES

### Documentation officielle
- Solana Pay : https://docs.solanapay.com
- Solana Web3.js : https://solana-labs.github.io/solana-web3.js

### Erreurs courantes

| Erreur | Solution |
|--------|----------|
| `Cannot find module '@solana/pay'` | `npm install @solana/pay` |
| `BigNumber is not a constructor` | `import BigNumber from 'bignumber.js'` |
| `Connection refused` | Vérifie que tu es en devnet |
| `FindReferenceError` | Normal si pas de paiement, continue à poll |

### Pour tester sans dépenser de vrai SOL
1. Mets Phantom en mode **Devnet**
2. Va sur https://faucet.solana.com
3. Demande des SOL de test gratuits

---

## 🎯 NEXT STEPS

Une fois ces exercices terminés, tu peux :

1. **Intégrer dans une vraie app** - Ajoute Solana Pay à un site web
2. **Créer des paiements en tokens** - Utilise le paramètre `spl-token`
3. **Construire un Point of Sale** - Interface complète pour marchands
4. **Explorer les Transaction Requests** - Logique serveur avancée

---

## 💬 CONSEILS FINAUX

1. **Ne copie pas** - Tape le code toi-même, même si c'est lent
2. **Expérimente** - Change les valeurs, casse des trucs, répare
3. **Lis les erreurs** - Elles te disent exactement le problème
4. **Une étape à la fois** - Ne passe pas à la suite tant que tu comprends pas

Bonne chance ! 🚀