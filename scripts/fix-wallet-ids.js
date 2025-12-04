/**
 * Script to fix duplicate wallet IDs in db.json
 * json-server doesn't support multiple records with same ID
 * This will regenerate unique IDs for all wallets while maintaining relationships
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db.json');

// Read db.json
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Create a map of old wallet ID -> new wallet ID
const walletIdMap = {};
let nextWalletId = 1000; // Start from 1000 to avoid conflicts

// Generate new unique IDs for all wallets
db.wallets = db.wallets.map(wallet => {
    const oldId = wallet.id;

    // Check if this ID already exists in our map
    if (!walletIdMap[oldId]) {
        walletIdMap[oldId] = String(nextWalletId++);
    }

    return {
        ...wallet,
        id: walletIdMap[oldId]
    };
});

// Update wallet_id references in transactions
db.transactions = db.transactions.map(transaction => {
    if (transaction.wallet_id && walletIdMap[transaction.wallet_id]) {
        return {
            ...transaction,
            wallet_id: walletIdMap[transaction.wallet_id]
        };
    }
    return transaction;
});

// Update wallet_id references in recurring_transactions
db.recurring_transactions = db.recurring_transactions.map(rt => {
    if (rt.wallet_id && walletIdMap[rt.wallet_id]) {
        return {
            ...rt,
            wallet_id: walletIdMap[rt.wallet_id]
        };
    }
    return rt;
});

// Backup original file
const backupPath = path.join(__dirname, '..', 'db.json.backup');
fs.writeFileSync(backupPath, fs.readFileSync(dbPath, 'utf8'));
console.log('✅ Backup created:', backupPath);

// Write updated db.json
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('✅ db.json updated with unique wallet IDs');
console.log('\nID Mapping:');
Object.entries(walletIdMap).forEach(([oldId, newId]) => {
    console.log(`  ${oldId} -> ${newId}`);
});
