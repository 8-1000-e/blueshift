# Guide par Indices : Implémenter les References Solana Pay

## Le Parcours en 4 Grandes Étapes

1. **Générer une reference** → Une adresse Solana aléatoire
2. **Créer l'URL de paiement** → Avec la reference dedans
3. **Surveiller la blockchain** → Chercher si la reference apparaît
4. **Réagir quand trouvé** → Afficher un message de succès

---

## PARTIE 1 : Générer une Reference

### Ce que tu dois faire
Créer une nouvelle adresse Solana qui servira d'identifiant unique pour ce paiement.

### Les outils à utiliser
- La classe `Keypair` de `@solana/web3.js`
- Sa méthode statique `generate()`
- La propriété `publicKey` du keypair généré

### Comment penser
- Tu ne veux PAS garder la clé privée
- Tu veux juste la clé publique (l'adresse)
- Cette adresse ne recevra jamais d'argent, elle sert juste de marqueur

### Où stocker cette reference
- Dans un state React (useState)
- Tu en auras besoin pour construire l'URL ET pour la surveillance

### Comment afficher
- Les PublicKey ont une méthode `.toBase58()` qui les convertit en string lisible

### À tester
- Génère plusieurs references
- Vérifie qu'elles sont différentes à chaque fois
- Console.log pour voir à quoi elles ressemblent

---

## PARTIE 2 : Construire l'URL de Paiement

### La structure d'une URL Solana Pay
```
solana:[ADRESSE_DESTINATAIRE]?param1=value1&param2=value2
```

### Les paramètres obligatoires
- `amount` : Le montant en SOL (nombre décimal)
- `reference` : Ta reference (en string base58)

### Les paramètres optionnels mais recommandés
- `label` : Nom de ton app/commerce
- `message` : Message pour l'utilisateur

### Comment construire l'URL en JavaScript
- Utilise la classe native `URL`
- Le constructeur prend la partie `solana:ADRESSE`
- Utilise `.searchParams.append(nom, valeur)` pour ajouter les paramètres
- `.toString()` pour avoir l'URL complète

### Points d'attention
- Convertis ta reference PublicKey en string avec `.toBase58()`
- Convertis ton montant number en string avec `.toString()`
- Tous les paramètres doivent être des strings

### Où obtenir l'adresse destinataire
- C'est TON adresse Solana où tu veux recevoir l'argent
- Pour tester : utilise devnet
- Phantom wallet : Settings → Developer Settings → Change Network → Devnet
- Copie ton adresse devnet

### À tester
- Génère une URL
- Copie-colle-la dans la barre d'adresse
- Phantom devrait s'ouvrir automatiquement
- Tu dois voir les détails du paiement (montant, destinataire)

---

## PARTIE 3 : La Connexion Solana

### Ce qu'il te faut
Un objet `Connection` qui te permet de communiquer avec le réseau Solana.

### Comment le créer
- Utilise la classe `Connection` de `@solana/web3.js`
- Le constructeur prend une URL de RPC en paramètre

### Les URLs de RPC
- Devnet : `"https://api.devnet.solana.com"`
- Mainnet : `"https://api.mainnet-beta.solana.com"`

### Où le créer
- EN DEHORS de ton composant React (sinon il se recrée à chaque render)
- Ou dans un useEffect sans dépendances si tu veux qu'il soit dans le composant

### À tester
- Appelle `connection.getVersion()` pour vérifier que ça marche
- C'est une fonction async, utilise await
- Tu dois recevoir un objet avec la version de Solana

---

## PARTIE 4 : La Surveillance (Le Gros Morceau)

### L'idée générale
Tu vas créer une boucle qui vérifie toutes les secondes si ta reference est apparue sur la blockchain.

### Les outils React nécessaires

**useState** pour :
- Stocker le statut du paiement ("waiting", "found", "error")
- Pouvoir mettre à jour l'interface

**useRef** pour :
- Garder en mémoire la dernière transaction trouvée
- Sans provoquer de re-render

**useEffect** pour :
- Lancer la surveillance quand la reference est créée
- Nettoyer quand le composant se démonte

### La fonction magique : findReference

**D'où elle vient ?**
- Package `@solana/pay`
- Import : `import { findReference, FindReferenceError } from '@solana/pay';`

**Ses paramètres :**
1. La connection Solana
2. Ta reference (en PublicKey, pas en string)
3. Un objet d'options avec :
   - `until` : Ne cherche que les transactions après celle-ci
   - `finality` : Niveau de confirmation ("confirmed" ou "finalized")

**Ce qu'elle retourne :**
- Si trouvé : un objet avec `.signature` (la signature de la transaction)
- Si pas trouvé : lance une `FindReferenceError`

### Le pattern à utiliser

**setInterval** :
- Fonction JavaScript native
- Exécute du code toutes les X millisecondes
- Premier paramètre : la fonction à exécuter
- Deuxième paramètre : l'intervalle en ms (1000 = 1 seconde)

**async/await** :
- Ta fonction dans setInterval doit être `async`
- Utilise `await` devant `findReference`

**try/catch** :
- Entoure l'appel à `findReference` dans un try
- Dans le catch, vérifie si c'est une `FindReferenceError`
- Si oui : c'est normal, continue de chercher
- Si non : c'est une vraie erreur, log-la

### La gestion de "until"

**Le problème :**
Sans `until`, tu vas retrouver la même transaction en boucle.

**La solution :**
- Crée un useRef pour stocker la dernière signature trouvée
- Passe `mostRecentTransaction.current` dans le paramètre `until`
- Quand tu trouves une transaction, update le ref : `ref.current = signature`

### Le cleanup

**Pourquoi c'est critique :**
Si tu oublies, ton interval va continuer à tourner même quand le composant est démonté = fuite mémoire.

**Comment faire :**
- `useEffect` peut retourner une fonction
- Cette fonction est appelée au démontage
- Dans cette fonction : appelle `clearInterval(interval)`

### Structure du useEffect

```
useEffect(() => {
  // Si pas de reference, ne rien faire
  // Créer le setInterval
  // Dans l'interval : appeler findReference
  // Gérer les deux cas : trouvé / pas trouvé
  // Retourner une fonction qui fait clearInterval
}, [reference]); // Dépendance : se relance si reference change
```

### À tester

**Test 1 : Console logs**
- Ajoute des console.log à chaque étape
- "Début surveillance"
- "Vérification..." à chaque boucle
- "Pas encore trouvé" ou "Trouvé !"

**Test 2 : Sans payer**
- Lance la surveillance
- Laisse tourner quelques secondes
- Tu dois voir les console.log se répéter toutes les secondes

**Test 3 : Avec paiement**
- Génère l'URL
- Ouvre-la dans Phantom
- Approuve le paiement
- Attends quelques secondes
- Tu dois voir "Trouvé !" dans la console

---

## PARTIE 5 : L'Interface Utilisateur

### Les états à afficher

**Avant génération :**
- Un bouton "Générer un paiement"

**Après génération :**
- L'URL de paiement (en texte ou QR code)
- Un message "En attente du paiement..."

**Après détection :**
- Un message "Paiement reçu !"
- Optionnel : la signature de la transaction

### Gérer le statut

**Les états possibles :**
- `"idle"` : Rien n'est lancé
- `"waiting"` : Surveillance en cours
- `"found"` : Paiement détecté
- `"error"` : Problème

**Comment afficher conditionnellement :**
- Utilise des conditions `{status === "waiting" && <div>...</div>}`
- Ou un switch/if pour plus de clarté

### Amélioration : QR Code

Si tu veux afficher un QR code au lieu de l'URL :
- Package : `qrcode.react`
- Composant : `<QRCode value={paymentUrl} />`

---

## ÉTAPES DE TEST COMPLÈTES

### Setup Phantom

1. Installe l'extension Phantom
2. Crée un wallet ou utilise un existant
3. Va dans Settings → Developer Settings
4. Change Network → Devnet
5. Copie ton adresse devnet

### Obtenir des SOL de test

1. Va sur https://faucet.solana.com
2. Colle ton adresse devnet
3. Demande des SOL gratuits (airdrop)
4. Attends quelques secondes
5. Vérifie dans Phantom que tu as des SOL

### Tester ton app

**Première fois :**
1. Clique sur "Générer un paiement"
2. Copie l'URL générée
3. Colle dans la barre d'adresse du navigateur
4. Phantom s'ouvre
5. Vérifie le montant et le destinataire
6. Approuve
7. Attends 2-5 secondes
8. Ton app doit afficher "Paiement reçu !"

**Vérifier la transaction :**
1. Va sur https://explorer.solana.com/?cluster=devnet
2. Colle la signature affichée dans ta console
3. Tu dois voir la transaction avec tous ses détails
4. Dans les comptes, cherche ta reference
5. Elle doit être là, en mode "read-only"

**Tester plusieurs fois :**
- Génère plusieurs paiements
- Vérifie que chaque reference est unique
- Vérifie que chaque paiement est détecté indépendamment

---

## POINTS D'ATTENTION

### La finality

**"confirmed"** :
- Rapide (~400ms)
- Peut être annulé (très rare)
- OK pour petits montants

**"finalized"** :
- Lent (~13 secondes)
- Définitif, ne peut pas être annulé
- Recommandé pour gros montants

### Les erreurs courantes

**"Cannot read property of undefined"** :
- Tu essaies d'utiliser une variable avant qu'elle existe
- Vérifie tes conditions `if (!reference) return;`

**"Invalid public key"** :
- Tu passes une string au lieu d'une PublicKey
- Utilise `new PublicKey(stringValue)` pour convertir

**"Transaction not found"** :
- Normal ! C'est la FindReferenceError
- Ne la traite pas comme une vraie erreur

**L'interval ne s'arrête pas** :
- Tu oublies le `clearInterval` dans le cleanup
- Ajoute des console.log pour vérifier que le cleanup est appelé

### Optimisations possibles

**Timeout** :
- Ne surveille pas indéfiniment
- Arrête après 5-10 minutes si rien trouvé

**Debounce** :
- Si tu veux éviter trop de requêtes
- Augmente l'intervalle à 2-3 secondes

**Backend** :
- Pour la production, mets la surveillance côté serveur
- Le frontend affiche juste le statut

---

## RESSOURCES UTILES

### Documentation
- Solana Pay docs : https://docs.solanapay.com
- Solana Web3.js : https://solana-labs.github.io/solana-web3.js

### Outils
- Solana Explorer : https://explorer.solana.com
- Faucet devnet : https://faucet.solana.com
- Phantom wallet : https://phantom.app

### Debug
- Toujours console.log à chaque étape
- Vérifie dans l'Explorer que la transaction existe
- Compare les adresses (reference, destinataire) pour voir s'ils matchent

---

## RÉCAP : CE QUE TU DOIS CODER

1. **Générer** : Une PublicKey aléatoire
2. **Construire** : Une URL avec cette PublicKey dedans
3. **Surveiller** : Utiliser findReference dans un setInterval
4. **Réagir** : Afficher un message quand trouvé
5. **Nettoyer** : Arrêter l'interval au bon moment

C'est tout ! Maintenant code, teste, debug, et apprends en faisant 🚀