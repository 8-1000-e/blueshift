// Exercice 5 : Transaction Request (Avancé)
// Objectif : Créer un serveur qui génère des transactions dynamiques
//
// Contrairement au Transfer Request (tout dans l'URL), ici le wallet
// contacte notre serveur pour recevoir une transaction personnalisée.

// NextRequest = la requête entrante (ce qu'on reçoit du wallet)
// NextResponse = la réponse sortante (ce qu'on renvoie au wallet)
import { NextRequest, NextResponse } from 'next/server';

// SystemProgram = programme natif Solana pour les transferts de SOL
// Transaction = conteneur pour les instructions à exécuter
// Connection = "téléphone" vers le réseau Solana
// PublicKey = adresse Solana (comme un IBAN)
// clusterApiUrl = donne l'URL du réseau (devnet, mainnet, etc.)
import { SystemProgram, Transaction, Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";


// Headers CORS - OBLIGATOIRE pour que les wallets puissent communiquer
// Sans ça, le navigateur bloque les requêtes cross-origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',           // Autorise toutes les origines
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  // Méthodes autorisées
  'Access-Control-Allow-Headers': 'Content-Type',        // Headers autorisés
};

// PREFLIGHT - Le navigateur envoie d'abord OPTIONS avant POST
// pour vérifier si le serveur autorise la requête
// On répond juste "oui c'est ok" avec les headers CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET - Appelé en premier par le wallet pour afficher les infos
// Le wallet montre ces infos à l'utilisateur avant qu'il confirme
export async function GET()
{
  return NextResponse.json({
    label: "Blueshift demo",  // Nom affiché dans le wallet
    icon: "https://public.rootdata.com/images/b6/1747701756176.jpg"  // Logo affiché
    }, {headers: corsHeaders});
}

// POST - Appelé quand l'utilisateur confirme dans le wallet
// Le wallet envoie l'adresse du client, on construit et renvoie la transaction
export async function POST(request: NextRequest)
{
    // 1. Récupérer l'adresse du client depuis le body de la requête
    // Le wallet envoie: { account: "AdresseEnBase58..." }
    const body = await request.json();
    const account = body.account;  // C'est une string
    const publicKey = new PublicKey(account);  // On convertit en objet PublicKey

    // 2. Se connecter au réseau Solana (devnet pour les tests)
    // "confirmed" = niveau de confirmation des transactions
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // 3. Récupérer le blockhash récent
    // Le blockhash est comme un "timestamp" - la transaction expire après ~2 min
    // Sans blockhash valide, la transaction est rejetée
    const lastestBlockhash = await connection.getLatestBlockhash();

    // 4. Créer la transaction
    // feePayer = qui paie les frais de réseau (~0.000005 SOL)
    // recentBlockhash = pour la validité temporelle
    const transac = new Transaction ({
        feePayer: publicKey,  // Le client paie les frais
        recentBlockhash: lastestBlockhash.blockhash
    });

    // 5. Ajouter l'instruction de transfert
    // Une transaction peut contenir plusieurs instructions
    // Ici on fait un simple transfert de SOL
    transac.add(
        SystemProgram.transfer({
            fromPubkey: publicKey,  // Qui envoie (le client)
            toPubkey: new PublicKey("FSjkg8C3GRCaoeYEVr8JD1QEJA8rf1CJKeBGUpZim8NZ"),  // Qui reçoit (toi)
            lamports: 1000000000  // Montant: 1 SOL (1 SOL = 1,000,000,000 lamports)
        })
    );

    // 6. Sérialiser la transaction en base64
    // Le wallet a besoin de la transaction en format texte pour la transporter
    // requireAllSignatures: false = le client n'a pas encore signé
    // verifySignatures: false = on ne vérifie pas les signatures
    const serialized = transac.serialize({
        requireAllSignatures: false,
        verifySignatures: false
    }).toString("base64");

    // 7. Renvoyer la transaction au wallet
    // Le wallet va la décoder, la montrer à l'utilisateur,
    // la faire signer, puis l'envoyer au réseau
    return NextResponse.json({
        transaction: serialized
    }, {headers: corsHeaders});
}