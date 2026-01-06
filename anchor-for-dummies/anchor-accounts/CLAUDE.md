# Contexte - Formation Blueshift: Anchor Accounts

## Objectif
Apprendre à gérer les comptes dans Anchor (création, modification, fermeture, PDAs, tokens).

## Progression terminée
- [x] Anchor 101 : Vault basique avec deposit/withdraw (sans PDA)

---

## EXERCICES PAR NOTION

### 1. Structure des comptes Solana
**Objectif** : Comprendre la structure de base d'un compte Solana

**Notion** : Tous les comptes ont : `lamports`, `data`, `owner`, `executable`, `rent_epoch`

**Exercice** :
- Crée un programme qui affiche (via `msg!()`) les infos d'un compte passé en paramètre
- Affiche : le owner, les lamports, si c'est executable, la taille des data

---

### 2. Discriminateurs
**Objectif** : Comprendre comment Anchor identifie les types de comptes

**Notion** : Discriminateur = 8 premiers bytes de `sha256("account:NomDuCompte")`

**Exercice** :
- Crée une struct `UserProfile` avec un champ `name: String` et `level: u8`
- Utilise `#[account(discriminator = 42)]` pour un discriminateur custom
- Vérifie que le compte est bien créé avec ce discriminateur

---

### 3. Création de compte avec `init`
**Objectif** : Créer un compte appartenant à ton programme

**Notion** :
```rust
#[account(
    init,
    payer = signer,
    space = 8 + taille_des_données
)]
pub account: Account<'info, MonType>,
```

**Exercice** :
- Crée une struct `Counter` avec un champ `count: u64`
- Écris une instruction `initialize` qui crée le compte
- Écris une instruction `increment` qui augmente `count` de 1
- Teste les deux instructions

---

### 4. PDAs (Program Derived Addresses)
**Objectif** : Créer des adresses déterministes sans clé privée

**Notion** :
```rust
#[account(
    seeds = [b"vault", signer.key().as_ref()],
    bump
)]
pub vault: SystemAccount<'info>,
```

**Exercice** : REFAIRE LE VAULT AVEC PDA
- Reprends ton vault de anchor-101
- Remplace le Keypair.generate() par un PDA
- Seeds : `[b"vault", user.key().as_ref()]`
- Le withdraw doit fonctionner SANS .signers([vault]) !

---

### 5. Réallocation de compte
**Objectif** : Changer la taille d'un compte existant

**Notion** :
```rust
#[account(
    mut,
    realloc = nouvelle_taille,
    realloc::payer = signer,
    realloc::zero = true
)]
```

**Exercice** :
- Crée un compte `Note` avec un champ `content: String` (max 32 chars)
- Écris une instruction `expand_note` qui agrandit l'espace pour 256 chars
- Teste que tu peux ensuite stocker un texte plus long

---

### 6. Fermeture de compte
**Objectif** : Fermer un compte et récupérer les lamports

**Notion** :
```rust
#[account(
    mut,
    close = destination
)]
pub account: Account<'info, MonType>,
```

**Exercice** :
- Reprends le Counter de l'exercice 3
- Ajoute une instruction `close_counter` qui ferme le compte
- Vérifie que les lamports sont bien récupérés par le signer

---

### 7. Types de comptes : Signer
**Objectif** : Vérifier qu'un compte a signé la transaction

**Notion** : `pub signer: Signer<'info>` vérifie automatiquement la signature

**Exercice** :
- Crée une instruction qui ne peut être appelée que par un "admin"
- L'admin est défini comme une constante Pubkey dans ton programme
- Utilise `constraint = signer.key() == ADMIN_PUBKEY`

---

### 8. Types de comptes : UncheckedAccount
**Objectif** : Travailler avec des comptes non validés

**Notion** :
```rust
/// CHECK: explication de pourquoi c'est safe
pub account: UncheckedAccount<'info>,
```

**Exercice** :
- Crée une instruction qui reçoit un UncheckedAccount
- Vérifie manuellement que le owner est le System Program
- Affiche les infos du compte avec `msg!()`

---

### 9. Types de comptes : Option
**Objectif** : Rendre un compte optionnel

**Notion** : `pub optional: Option<Account<'info, MonType>>`

**Exercice** :
- Crée une instruction `transfer_with_memo`
- Le compte `memo` est optionnel
- Si présent, log le contenu du memo, sinon log "No memo"

---

### 10. Token Accounts avec anchor_spl
**Objectif** : Travailler avec les tokens SPL

**Notion** :
```rust
use anchor_spl::token::{Mint, Token, TokenAccount};

#[account(
    init,
    payer = signer,
    mint::decimals = 9,
    mint::authority = signer
)]
pub mint: Account<'info, Mint>,
```

**Exercice** :
- Crée un programme qui mint un nouveau token
- Crée une instruction pour créer le Mint
- Crée une instruction pour mint des tokens vers un TokenAccount
- Teste avec anchor test

---

### 11. Contraintes de validation
**Objectif** : Ajouter des vérifications de sécurité

**Notion** :
- `address = PUBKEY` : vérifie l'adresse exacte
- `owner = PROGRAM_ID` : vérifie le propriétaire
- `has_one = field` : vérifie qu'un champ correspond
- `constraint = expression` : validation custom

**Exercice** :
- Reprends le Counter et ajoute un champ `authority: Pubkey`
- Seul l'authority peut appeler `increment`
- Utilise `has_one = authority` pour la validation

---

### 12. Remaining Accounts
**Objectif** : Passer des comptes dynamiques

**Notion** :
```rust
// Côté Rust
ctx.remaining_accounts

// Côté client
.remainingAccounts([{ pubkey, isSigner, isWritable }])
```

**Exercice** :
- Crée une instruction `batch_transfer` qui transfère des SOL à plusieurs destinataires
- Les destinataires sont passés via `remaining_accounts`
- Le montant est divisé équitablement entre tous

---

## Ordre recommandé

1. Exercice 3 (init) - base fondamentale
2. Exercice 4 (PDA) - refaire le vault proprement !
3. Exercice 6 (close) - compléter le cycle de vie
4. Exercice 5 (realloc) - cas avancé
5. Exercice 7-9 (types de comptes) - approfondir
6. Exercice 10 (tokens) - SPL tokens
7. Exercice 11-12 (validation, remaining) - patterns avancés

---

## Commandes utiles

```bash
# Créer un nouveau projet
anchor init nom-du-projet

# Build
anchor build

# Test
anchor test

# Déployer sur devnet
anchor deploy --provider.cluster devnet
```
