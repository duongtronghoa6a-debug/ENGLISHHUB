/**
 * Seed Utilities - Common helper functions for all seeders
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    NUM_FAKE_LEARNERS: 7000,
    DEFAULT_PASSWORD: '111111',
    BATCH_SIZE: 500
};

// Fixed UUIDs for test accounts
const TEST_ACCOUNTS = {
    STUDENT: { id: '00000000-0000-0000-0000-000000000001', email: '01@gmail.com', role: 'learner' },
    TEACHER: { id: '00000000-0000-0000-0000-000000000002', email: '02@gmail.com', role: 'teacher' },
    ADMIN: { id: '00000000-0000-0000-0000-000000000003', email: '03@gmail.com', role: 'admin' }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

function loadJsonFile(filename) {
    const filePath = path.join(__dirname, '../../data/', filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ File not found: ${filename}`);
        return null;
    }
    let data = fs.readFileSync(filePath, 'utf8');
    // Strip BOM
    if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);
    return JSON.parse(data);
}

function progressLog(current, total, label) {
    if (current % 1000 === 0 || current === total) {
        console.log(`  ${label}: ${current}/${total} (${Math.round(current / total * 100)}%)`);
    }
}

function weightedRandom(options) {
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * totalWeight;
    for (const option of options) {
        random -= option.weight;
        if (random <= 0) return option.value;
    }
    return options[0].value;
}

module.exports = {
    CONFIG,
    TEST_ACCOUNTS,
    hashPassword,
    loadJsonFile,
    progressLog,
    weightedRandom,
    faker
};
