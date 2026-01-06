import * as readline from "readline";

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  category: string;
}

const questions: Question[] = [
  // ============================================
  // STRUCTURE DES COMPTES SOLANA
  // ============================================
  {
    category: "Structure des comptes",
    question: "Quels sont les 5 champs de base d'un compte Solana ?",
    options: [
      "A) lamports, data, owner, executable, rent_epoch",
      "B) balance, info, program, type, fee",
      "C) sol, bytes, authority, code, slot",
      "D) amount, storage, creator, runnable, epoch"
    ],
    correct: 0,
    explanation: `Tous les comptes Solana partagent la meme structure :

pub struct Account {
    pub lamports: u64,           // solde en lamports
    pub data: Vec<u8>,           // donnees brutes
    pub owner: Pubkey,           // programme proprietaire
    pub executable: bool,        // est-ce un programme ?
    pub rent_epoch: Epoch,       // (deprecie, toujours 0)
}

Ce qui distingue les comptes :
1. Le owner : qui peut modifier le compte
2. Les data : interpretees par le owner`
  },
  {
    category: "Structure des comptes",
    question: "Qui peut modifier les donnees et les lamports d'un compte ?",
    options: [
      "A) N'importe qui",
      "B) Seulement le programme owner du compte",
      "C) Seulement le createur du compte",
      "D) Seulement le System Program"
    ],
    correct: 1,
    explanation: `Seul le programme "owner" peut modifier les donnees et les lamports d'un compte.

C'est une regle fondamentale de Solana :
- Si owner = System Program -> seul System Program peut modifier
- Si owner = ton programme -> seul ton programme peut modifier
- Si owner = Token Program -> seul Token Program peut modifier

C'est pour ca qu'on utilise des CPI (Cross-Program Invocation) pour demander a un autre programme de faire des modifications.`
  },

  // ============================================
  // DISCRIMINATEURS
  // ============================================
  {
    category: "Discriminateurs",
    question: "C'est quoi un discriminateur dans Anchor ?",
    options: [
      "A) Un identifiant unique de 8 bytes pour distinguer les types de comptes",
      "B) Le nom du compte en base64",
      "C) L'adresse du programme owner",
      "D) Le hash de la transaction"
    ],
    correct: 0,
    explanation: `Le discriminateur est un prefixe de 8 bytes qui identifie le type de compte.

Calcul par defaut :
sha256("account:NomDeLaStruct")[0..8]

Pour les instructions :
sha256("global:nom_instruction")[0..8]

Depuis Anchor v0.31.0, tu peux le customiser :
#[account(discriminator = 42)]

Important :
- Doit etre unique dans ton programme
- [0] est reserve pour les comptes non initialises
- Taille max d'un discriminateur custom : 10,240 bytes`
  },
  {
    category: "Discriminateurs",
    question: "Pourquoi ne peut-on pas utiliser [0] comme discriminateur custom ?",
    options: [
      "A) C'est trop petit",
      "B) Il est reserve pour les comptes non initialises",
      "C) Anchor ne le supporte pas",
      "D) Ca causerait une erreur de compilation"
    ],
    correct: 1,
    explanation: `[0] est reserve pour identifier les comptes NON INITIALISES.

Quand tu fermes un compte avec 'close', Anchor met le discriminateur a 0.
Ca permet de distinguer :
- Compte initialise : discriminateur != 0
- Compte non initialise / ferme : discriminateur == 0

Si tu utilisais [0] comme discriminateur, Anchor penserait que ton compte n'est pas initialise !`
  },

  // ============================================
  // CREATION DE COMPTE (init)
  // ============================================
  {
    category: "Creation de compte",
    question: "Que fait la contrainte #[account(init)] ?",
    options: [
      "A) Verifie que le compte existe deja",
      "B) Cree un nouveau compte appartenant au programme",
      "C) Supprime le compte",
      "D) Transfere des lamports"
    ],
    correct: 1,
    explanation: `#[account(init)] cree un nouveau compte.

Tu dois specifier :
- payer = qui paie le loyer (rent)
- space = taille en bytes

#[account(
    init,
    payer = signer,
    space = 8 + 8  // discriminateur + donnees
)]
pub counter: Account<'info, Counter>,

Anchor fait automatiquement :
1. Calcule le loyer necessaire
2. Cree le compte via System Program
3. Assigne le owner a ton programme
4. Ecrit le discriminateur`
  },
  {
    category: "Creation de compte",
    question: "Comment calculer le 'space' pour un compte avec un u64 ?",
    options: [
      "A) 8 bytes seulement",
      "B) 16 bytes (8 discriminateur + 8 u64)",
      "C) 64 bytes",
      "D) Ca depend du runtime"
    ],
    correct: 1,
    explanation: `Space = taille du discriminateur + taille des donnees

Tailles courantes :
- bool : 1 byte
- u8/i8 : 1 byte
- u16/i16 : 2 bytes
- u32/i32 : 4 bytes
- u64/i64 : 8 bytes
- u128/i128 : 16 bytes
- Pubkey : 32 bytes
- String : 4 + len (le 4 c'est pour stocker la taille)
- Vec<T> : 4 + (len * size_of::<T>())
- Option<T> : 1 + size_of::<T>()

Astuce : #[derive(InitSpace)] calcule automatiquement !
space = MonType::DISCRIMINATOR.len() + MonType::INIT_SPACE`
  },
  {
    category: "Creation de compte",
    question: "Que fait init_if_needed ?",
    options: [
      "A) Initialise le compte seulement s'il n'existe pas",
      "B) Reinitialise le compte a chaque fois",
      "C) Verifie si le compte a besoin de plus d'espace",
      "D) Supprime le compte s'il existe"
    ],
    correct: 0,
    explanation: `init_if_needed cree le compte SEULEMENT s'il n'existe pas deja.

#[account(init_if_needed, payer = signer, space = 8 + 8)]
pub counter: Account<'info, Counter>,

Si le compte existe -> ne fait rien
Si le compte n'existe pas -> le cree

Utile pour :
- Token Accounts (cree le ATA si besoin)
- Comptes utilisateur (cree au premier usage)

Attention : peut etre dangereux si mal utilise !
Active avec : features = ["init-if-needed"] dans Cargo.toml`
  },

  // ============================================
  // PDA (Program Derived Address)
  // ============================================
  {
    category: "PDA",
    question: "C'est quoi un PDA (Program Derived Address) ?",
    options: [
      "A) Un compte avec une cle privee speciale",
      "B) Une adresse derivee de seeds, sans cle privee, controlee par le programme",
      "C) L'adresse du deployer du programme",
      "D) Un type de token SPL"
    ],
    correct: 1,
    explanation: `PDA = Program Derived Address

C'est une adresse calculee a partir de :
- seeds : des donnees que tu choisis
- program_id : l'adresse de ton programme
- bump : garantit que l'adresse est hors de la courbe ed25519

#[account(
    seeds = [b"vault", user.key().as_ref()],
    bump
)]

Avantages :
- PAS de cle privee -> impossible a signer par un humain
- Seul ton programme peut "signer" pour ce compte
- Adresse deterministe : memes seeds = meme adresse

Pattern standard pour : vaults, escrows, pools, etc.`
  },
  {
    category: "PDA",
    question: "Pourquoi utiliser [b\"vault\", user.key().as_ref()] comme seeds ?",
    options: [
      "A) C'est obligatoire par Anchor",
      "B) Pour creer une adresse unique par utilisateur",
      "C) Pour economiser des lamports",
      "D) Pour accelerer les transactions"
    ],
    correct: 1,
    explanation: `Les seeds determinent l'adresse du PDA.

[b"vault", user.key().as_ref()] =
- "vault" : prefixe pour identifier le type de compte
- user.key() : cle publique de l'utilisateur

Resultat : chaque user a son propre vault !

Exemples de patterns :
- [b"user-profile", user.key()] -> 1 profil par user
- [b"game", game_id.to_le_bytes()] -> 1 compte par game
- [b"order", user.key(), order_id] -> plusieurs ordres par user`
  },
  {
    category: "PDA",
    question: "C'est quoi le 'bump' dans un PDA ?",
    options: [
      "A) Le numero de version du compte",
      "B) Un byte (0-255) qui garantit que l'adresse est hors de la courbe ed25519",
      "C) Le nombre de transactions",
      "D) L'index du compte dans le programme"
    ],
    correct: 1,
    explanation: `Le bump est un byte (0-255) ajoute aux seeds.

Il garantit que l'adresse resultante n'a PAS de cle privee (hors courbe ed25519).

Anchor cherche automatiquement avec 'bump' :
#[account(seeds = [b"vault"], bump)]

Pour economiser des CU, sauvegarde le bump :
#[account(seeds = [b"vault"], bump = vault.bump)]

Le "canonical bump" = le plus grand bump valide.
Anchor commence a 255 et descend jusqu'a trouver un bump valide.`
  },
  {
    category: "PDA",
    question: "Comment deriver un PDA d'un AUTRE programme ?",
    options: [
      "A) C'est impossible",
      "B) Avec seeds::program = autre_program.key()",
      "C) Avec owner = autre_program",
      "D) Avec external = true"
    ],
    correct: 1,
    explanation: `Tu peux deriver un PDA d'un autre programme avec seeds::program :

#[account(
    seeds = [b"config"],
    bump,
    seeds::program = other_program.key()
)]
pub external_pda: Account<'info, SomeType>,

Utile pour :
- Verifier des comptes d'autres programmes
- Interagir avec des PDAs externes
- Cross-program references`
  },

  // ============================================
  // REALLOCATION
  // ============================================
  {
    category: "Reallocation",
    question: "A quoi sert realloc ?",
    options: [
      "A) A reinitialiser un compte",
      "B) A changer la taille d'un compte existant",
      "C) A deplacer un compte",
      "D) A copier un compte"
    ],
    correct: 1,
    explanation: `realloc permet de redimensionner un compte existant.

#[account(
    mut,
    realloc = nouvelle_taille,
    realloc::payer = signer,
    realloc::zero = true
)]

- Si tu agrandis : le payer paie le surplus de loyer
- Si tu reduis : le payer recoit le surplus de loyer
- realloc::zero = true : met les nouveaux bytes a 0

Utile pour :
- Agrandir un String
- Ajouter des elements a un Vec
- Evoluer la structure d'un compte`
  },
  {
    category: "Reallocation",
    question: "Que fait realloc::zero = true ?",
    options: [
      "A) Met le compte a zero lamports",
      "B) Met les nouveaux bytes alloues a zero",
      "C) Supprime le discriminateur",
      "D) Reinitialise le compte"
    ],
    correct: 1,
    explanation: `realloc::zero = true met les NOUVEAUX bytes a zero.

Quand tu agrandis un compte, les nouveaux bytes contiennent des donnees aleatoires.
Avec realloc::zero = true, ils sont initialises a 0.

Important : quand tu REDUIS la taille, utilise realloc::zero = true pour effacer les anciennes donnees. Sinon, elles restent en memoire (meme si "hors" du compte).`
  },

  // ============================================
  // FERMETURE DE COMPTE
  // ============================================
  {
    category: "Fermeture de compte",
    question: "Que fait #[account(close = target)] ?",
    options: [
      "A) Ferme la connexion RPC",
      "B) Supprime le compte et envoie les lamports vers target",
      "C) Bloque le compte",
      "D) Change le owner du compte"
    ],
    correct: 1,
    explanation: `#[account(close = destination)] ferme le compte :

1. Transfere tous les lamports vers 'destination'
2. Met le discriminateur a 0
3. Vide les donnees
4. Le compte devient "non-initialise"

#[account(mut, close = signer)]
pub counter: Account<'info, Counter>,

Apres fermeture, les lamports du loyer sont recuperes.
Le compte peut etre reutilise/recree plus tard.`
  },

  // ============================================
  // LAZY ACCOUNT
  // ============================================
  {
    category: "LazyAccount",
    question: "Quel est l'avantage de LazyAccount ?",
    options: [
      "A) Il permet de modifier les donnees plus vite",
      "B) Il utilise seulement 24 bytes de pile et charge les champs a la demande",
      "C) Il est automatiquement persiste",
      "D) Il ne coute pas de loyer"
    ],
    correct: 1,
    explanation: `LazyAccount (Anchor 0.31.0+) est optimise pour la lecture.

Avantages :
- 24 bytes sur la pile (vs tout le compte deserialise)
- Charge les champs a la demande
- Alloue sur le heap, pas la stack

pub account: LazyAccount<'info, MyType>

// Charger un champ specifique
let balance = ctx.accounts.account.get_balance()?;

Limitations :
- LECTURE SEULE ! Modifier = panic
- Apres un CPI, utiliser unload() pour rafraichir

Activer dans Cargo.toml :
anchor-lang = { features = ["lazy-account"] }`
  },

  // ============================================
  // TYPES DE COMPTES
  // ============================================
  {
    category: "Types de comptes",
    question: "Quelle est la difference entre Signer<'info> et SystemAccount<'info> ?",
    options: [
      "A) Aucune difference",
      "B) Signer verifie que le compte a signe la transaction",
      "C) SystemAccount peut modifier les donnees",
      "D) Signer est plus rapide"
    ],
    correct: 1,
    explanation: `Signer<'info> :
- Verifie automatiquement la signature
- Si pas signe -> transaction echoue
- Utilise pour : payer, authority, etc.

SystemAccount<'info> :
- Juste un compte systeme (owner = System Program)
- Pas de verification de signature
- Utilise pour : destination de transfert, etc.

#[derive(Accounts)]
pub struct MyInstruction<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,        // doit signer
    pub recipient: SystemAccount<'info>, // pas besoin de signer
}`
  },
  {
    category: "Types de comptes",
    question: "Pourquoi faut-il mettre /// CHECK: devant un UncheckedAccount ?",
    options: [
      "A) Pour la documentation",
      "B) Pour indiquer qu'Anchor ne fait aucune validation et que tu geres toi-meme",
      "C) Pour activer le mode debug",
      "D) C'est optionnel"
    ],
    correct: 1,
    explanation: `UncheckedAccount = compte sans AUCUNE validation.

Anchor ne verifie :
- Ni le owner
- Ni les donnees
- Ni rien !

Le commentaire /// CHECK: est OBLIGATOIRE.
Il explique pourquoi c'est safe ou quelle validation tu fais.

/// CHECK: On verifie manuellement que owner == System Program
pub account: UncheckedAccount<'info>,

Meme chose pour AccountInfo<'info> (equivalent).`
  },
  {
    category: "Types de comptes",
    question: "Que se passe-t-il si un compte Option est None ?",
    options: [
      "A) Erreur a l'execution",
      "B) Anchor utilise l'ID du programme comme adresse",
      "C) Le compte est ignore",
      "D) Anchor cree un compte vide"
    ],
    correct: 1,
    explanation: `Quand un Option<Account<...>> est None, Anchor utilise le program ID comme placeholder.

pub optional: Option<Account<'info, MyType>>

Cote client, tu passes null ou tu omets le compte.

Dans ton code :
if let Some(account) = &ctx.accounts.optional {
    // le compte existe, utilise-le
} else {
    // le compte est None
}

Utile pour :
- Comptes optionnels
- Features conditionnelles
- Retrocompatibilite`
  },
  {
    category: "Types de comptes",
    question: "A quoi sert Box<Account<...>> ?",
    options: [
      "A) A crypter le compte",
      "B) A stocker le compte sur le heap au lieu de la stack",
      "C) A rendre le compte immutable",
      "D) A compresser les donnees"
    ],
    correct: 1,
    explanation: `Box<T> alloue sur le HEAP au lieu de la STACK.

La stack Solana est limitee (~4KB).
Les gros comptes peuvent la faire deborder.

pub big_account: Box<Account<'info, BigStruct>>

Utilise Box quand :
- Struct avec beaucoup de champs
- Vec ou String volumineux
- Erreur "stack overflow"

Ca ne change pas la logique, juste l'allocation memoire.`
  },
  {
    category: "Types de comptes",
    question: "Quelle est la difference entre Program et Interface ?",
    options: [
      "A) Aucune difference",
      "B) Interface supporte plusieurs programmes (ex: Token et Token2022)",
      "C) Program est plus securise",
      "D) Interface est deprecie"
    ],
    correct: 1,
    explanation: `Program<'info, T> : valide UN programme specifique
pub token_program: Program<'info, Token>,

Interface<'info, T> : valide PLUSIEURS programmes compatibles
pub token_program: Interface<'info, TokenInterface>,

Interface est utile pour Token vs Token2022 :
- Meme interface, programmes differents
- Ton code marche avec les deux !

Pareil pour les comptes :
Account<'info, Mint>           -> Token seulement
InterfaceAccount<'info, Mint>  -> Token OU Token2022`
  },

  // ============================================
  // TOKEN ACCOUNTS
  // ============================================
  {
    category: "Token Accounts",
    question: "Quelle est la difference entre un Mint et un TokenAccount ?",
    options: [
      "A) Mint = solde, TokenAccount = metadata",
      "B) Mint = metadata du token, TokenAccount = solde d'un user",
      "C) C'est la meme chose",
      "D) Mint est pour SOL, TokenAccount pour les autres"
    ],
    correct: 1,
    explanation: `Mint : les infos GLOBALES du token
- supply : combien existent
- decimals : precision (ex: 9)
- mint_authority : qui peut creer
- freeze_authority : qui peut geler

TokenAccount : le portefeuille d'UN user pour CE token
- mint : quel token
- owner : qui possede
- amount : combien

Relation :
1 Mint -> N TokenAccounts
(1 type de token, plein de holders)`
  },
  {
    category: "Token Accounts",
    question: "Que fait mint::authority dans les contraintes ?",
    options: [
      "A) Definit qui peut detruire le mint",
      "B) Definit qui peut creer de nouveaux tokens",
      "C) Definit le owner du compte",
      "D) Definit les decimales"
    ],
    correct: 1,
    explanation: `mint::authority specifie qui peut MINT (creer) de nouveaux tokens.

#[account(
    init,
    payer = signer,
    mint::decimals = 9,
    mint::authority = signer,
    mint::freeze_authority = signer
)]
pub mint: Account<'info, Mint>,

- mint::decimals : precision du token
- mint::authority : qui peut mint
- mint::freeze_authority : qui peut freeze (optionnel)

Apres creation, seul l'authority peut appeler mint_to().`
  },

  // ============================================
  // CONTRAINTES DE VALIDATION
  // ============================================
  {
    category: "Contraintes",
    question: "Que verifie la contrainte 'address' ?",
    options: [
      "A) Que le compte a une adresse valide",
      "B) Que la pubkey du compte correspond exactement a une valeur",
      "C) Que le compte est sur le bon cluster",
      "D) Que l'adresse est un PDA"
    ],
    correct: 1,
    explanation: `address = PUBKEY verifie que le compte a EXACTEMENT cette adresse.

const ADMIN: Pubkey = pubkey!("Admin111...");

#[account(address = ADMIN)]
pub admin: Signer<'info>,

Avec erreur custom :
#[account(address = ADMIN @ MyError::NotAdmin)]

Utile pour :
- Verifier des comptes specifiques (admin, treasury)
- S'assurer qu'on interagit avec le bon programme`
  },
  {
    category: "Contraintes",
    question: "Que verifie la contrainte 'owner' ?",
    options: [
      "A) Que le compte appartient a un user specifique",
      "B) Que le owner du compte est un programme specifique",
      "C) Que le compte a ete cree par quelqu'un",
      "D) Que le compte peut etre modifie"
    ],
    correct: 1,
    explanation: `owner = PROGRAM_ID verifie le champ 'owner' du compte.

#[account(owner = token::ID)]
pub token_account: AccountInfo<'info>,

Rappel : sur Solana, chaque compte a un 'owner' (un programme).
Seul le owner peut modifier les donnees et lamports.

Utile pour :
- Verifier qu'un compte appartient bien au Token Program
- S'assurer qu'un compte est gere par ton programme`
  },
  {
    category: "Contraintes",
    question: "Que verifie has_one = authority ?",
    options: [
      "A) Que le compte 'authority' existe",
      "B) Que le champ 'authority' du compte correspond a la pubkey passee",
      "C) Que authority est un Signer",
      "D) Que authority a assez de lamports"
    ],
    correct: 1,
    explanation: `has_one = field verifie que :
compte.field == ctx.accounts.field.key()

Exemple :
pub struct Counter {
    authority: Pubkey,  // qui controle ce counter
    count: u64,
}

#[account(has_one = authority)]
pub counter: Account<'info, Counter>,
pub authority: Signer<'info>,

Si counter.authority != authority.key() -> ERREUR !

Super pour les relations compte-authority.`
  },
  {
    category: "Contraintes",
    question: "Quelle contrainte permet d'ecrire sa propre logique de validation ?",
    options: [
      "A) custom",
      "B) validate",
      "C) constraint",
      "D) check"
    ],
    correct: 2,
    explanation: `constraint = expression permet une validation custom.

#[account(
    constraint = counter.count < 100 @ MyError::MaxReached
)]
pub counter: Account<'info, Counter>,

L'expression doit retourner un bool.
Si false -> erreur (custom ou ConstraintViolated).

Exemples :
- constraint = amount > 0
- constraint = user.level >= 5
- constraint = clock.unix_timestamp > deadline`
  },
  {
    category: "Contraintes",
    question: "Que fait la contrainte 'executable' ?",
    options: [
      "A) Rend le compte executable",
      "B) Verifie que le compte est un programme (executable = true)",
      "C) Execute le compte",
      "D) Compile le compte"
    ],
    correct: 1,
    explanation: `executable verifie que le compte est un PROGRAMME.

#[account(executable)]
pub some_program: AccountInfo<'info>,

Sur Solana, les programmes ont executable = true.
Les comptes de donnees ont executable = false.

Utile pour :
- CPI : s'assurer qu'on appelle bien un programme
- Verification de securite`
  },

  // ============================================
  // REMAINING ACCOUNTS
  // ============================================
  {
    category: "Remaining Accounts",
    question: "A quoi servent les remaining_accounts ?",
    options: [
      "A) A stocker les erreurs",
      "B) A passer un nombre variable de comptes a une instruction",
      "C) A recuperer les comptes supprimes",
      "D) A debugger"
    ],
    correct: 1,
    explanation: `remaining_accounts = comptes supplementaires dynamiques.

Normalement tu declares tes comptes dans la struct.
Mais parfois tu as besoin d'un nombre VARIABLE de comptes.

Cote Rust :
let accounts = &ctx.remaining_accounts;
for account in accounts {
    // traiter chaque compte
}

Cote client :
.remainingAccounts([
    { pubkey: addr1, isSigner: false, isWritable: true },
    { pubkey: addr2, isSigner: false, isWritable: true },
])

Use cases : batch transfers, airdrops, multi-sig`
  },
  {
    category: "Remaining Accounts",
    question: "Quel type ont les remaining_accounts ?",
    options: [
      "A) Account<'info, T>",
      "B) Signer<'info>",
      "C) AccountInfo (UncheckedAccount)",
      "D) Program<'info, T>"
    ],
    correct: 2,
    explanation: `Les remaining_accounts sont des AccountInfo (non valides).

Anchor ne fait AUCUNE validation sur eux !
C'est a toi de verifier :
- Le owner
- Les donnees
- S'ils doivent signer
- S'ils sont mutables

for account in ctx.remaining_accounts {
    // Validation manuelle obligatoire !
    require!(
        account.owner == &my_program::ID,
        MyError::InvalidOwner
    );
}

ATTENTION : source courante de vulnerabilites !`
  },

  // ============================================
  // CPI
  // ============================================
  {
    category: "CPI",
    question: "C'est quoi un CPI ?",
    options: [
      "A) Central Processing Instruction",
      "B) Cross-Program Invocation - appeler un autre programme",
      "C) Compte Programme Initial",
      "D) Crypto Payment Interface"
    ],
    correct: 1,
    explanation: `CPI = Cross-Program Invocation

Appeler un AUTRE programme depuis le tien.

Exemple : transferer des SOL via System Program

let cpi_ctx = CpiContext::new(
    ctx.accounts.system_program.to_account_info(),
    Transfer {
        from: ctx.accounts.payer.to_account_info(),
        to: ctx.accounts.recipient.to_account_info(),
    }
);
system_program::transfer(cpi_ctx, amount)?;

Pourquoi : ton programme ne peut pas modifier des comptes qu'il ne possede pas. Il demande a leur owner de le faire.`
  },
  {
    category: "CPI",
    question: "Comment un PDA peut-il 'signer' un CPI ?",
    options: [
      "A) Avec une cle privee speciale",
      "B) Avec CpiContext::new_with_signer et les seeds",
      "C) Les PDAs ne peuvent pas signer",
      "D) Avec .signers([pda])"
    ],
    correct: 1,
    explanation: `Un PDA signe via new_with_signer avec ses seeds.

let seeds = &[b"vault", user.key().as_ref(), &[bump]];
let signer_seeds = &[&seeds[..]];

let cpi_ctx = CpiContext::new_with_signer(
    program.to_account_info(),
    accounts,
    signer_seeds
);

Anchor verifie que les seeds produisent bien l'adresse du PDA.
C'est comme ca que ton programme "signe" pour ses PDAs.

Note : le bump doit etre inclus dans les seeds !`
  },
];

// Shuffle array
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function runQuiz() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve));

  console.log("\n" + "=".repeat(70));
  console.log("        QUIZ COMPLET : ANCHOR ACCOUNTS - Formation Blueshift");
  console.log("=".repeat(70));

  // Get unique categories
  const categories = [...new Set(questions.map(q => q.category))];
  console.log(`\n${questions.length} questions couvrant ${categories.length} categories :`);
  categories.forEach(cat => {
    const count = questions.filter(q => q.category === cat).length;
    console.log(`  - ${cat} (${count} questions)`);
  });

  console.log("\nReponds avec A, B, C ou D.");
  console.log("Tape 'q' pour quitter, 's' pour skip une question.\n");

  await ask("Appuie sur Entree pour commencer...");

  const shuffledQuestions = shuffle(questions);
  let score = 0;
  let total = 0;
  let skipped = 0;
  const wrongByCategory: Record<string, number> = {};

  for (const q of shuffledQuestions) {
    console.log("\n" + "-".repeat(70));
    console.log(`[${q.category}]`);
    console.log(`\nQuestion ${total + 1}/${shuffledQuestions.length}:`);
    console.log(`\n${q.question}\n`);

    q.options.forEach((opt) => console.log(`  ${opt}`));

    const answer = await ask("\nTa reponse (A/B/C/D/s/q) : ");

    if (answer.toLowerCase() === "q") {
      console.log("\nQuiz interrompu !");
      break;
    }

    if (answer.toLowerCase() === "s") {
      skipped++;
      console.log("\n⏭️  Question passee");
      console.log("\n📚 EXPLICATION (pour info) :");
      console.log("-".repeat(40));
      console.log(q.explanation);
      await ask("\nAppuie sur Entree pour continuer...");
      continue;
    }

    total++;
    const answerIndex = answer.toUpperCase().charCodeAt(0) - 65;

    if (answerIndex === q.correct) {
      score++;
      console.log("\n✅ CORRECT !\n");
    } else {
      console.log(`\n❌ FAUX ! La bonne reponse etait : ${q.options[q.correct].charAt(0)}\n`);
      wrongByCategory[q.category] = (wrongByCategory[q.category] || 0) + 1;
    }

    console.log("📚 EXPLICATION :");
    console.log("-".repeat(40));
    console.log(q.explanation);

    await ask("\nAppuie sur Entree pour continuer...");
  }

  console.log("\n" + "=".repeat(70));
  console.log(`        RESULTATS FINAUX`);
  console.log("=".repeat(70));
  console.log(`\n  Score : ${score}/${total} (${total > 0 ? Math.round((score / total) * 100) : 0}%)`);
  if (skipped > 0) console.log(`  Questions passees : ${skipped}`);

  if (Object.keys(wrongByCategory).length > 0) {
    console.log("\n  Categories a revoir :");
    Object.entries(wrongByCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`    - ${cat} : ${count} erreur(s)`);
      });
  }

  console.log("\n" + "-".repeat(70));
  if (total === 0) {
    console.log("  Aucune question repondue.");
  } else if (score === total) {
    console.log("  🏆 PARFAIT ! Tu maitrises les comptes Anchor !");
  } else if (score >= total * 0.8) {
    console.log("  🌟 Excellent ! Tu as de tres bonnes bases.");
  } else if (score >= total * 0.6) {
    console.log("  👍 Bien joue ! Quelques notions a consolider.");
  } else if (score >= total * 0.4) {
    console.log("  📖 Pas mal ! Relis le cours pour progresser.");
  } else {
    console.log("  💪 Continue a apprendre ! Rome ne s'est pas faite en un jour.");
  }

  console.log("\n");
  rl.close();
}

runQuiz().catch(console.error);
