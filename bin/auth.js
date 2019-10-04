#! /usr/bin/env node
const program = require('commander')
const readline = require('readline')
const pkg = require('../package.json')

// Initialize the state of the aplication
const state = {
    account: null,
    violations: []
}

// Saves the transactions made for future comparison
const processedTransactions = []

// Rules to be followed
const rules = {
    ACCOUNT_ALREADY_INITIALIZED: "account-already-initialized",
    INSUFFICIENT_LIMIT: "insufficient-limit",
    HIGH_FREQUENCY_SMALL_INTERVAL: "high-frequency-small-interval",
    DOUBLED_TRANSACTION: "doubled-transaction",
    CARD_NOT_ACTIVE: "card-not-active"
}

const rl = readline.createInterface({
    input: process.stdin
})

// Using the readline in the mode 'line' and item so it splits the JSON file lines into single lines as user inputs
rl.on('line', item => {
    // If path not informed the progam returns the helper
    if (!item) {
        program
            .version(pkg.version)
            .name(pkg.name)
            .usage('<JSON-lines-path>')
            .outputHelp()

        process.exit(1)
    } else {
        // Operation is the line active at the moment
        let operation = JSON.parse(item)

        // Check if the operation is trying to create an account
        if (operation.account) {
            // If no account exists yet it creates one 
            if (state.account === null) {
                state.account = operation.account
            } else {
                // If theres already an active account it sends an error to the status of the account
                state.violations.push(rules.ACCOUNT_ALREADY_INITIALIZED)
            }
        }

        // Checks if the operation is trying to make a transaction
        if (operation.transaction) {
            // Checks if theres an active account
            if (state.account == null) {
                state.violations.push(rules.CARD_NOT_ACTIVE)
            } else {
                // Compares the already processed transactions to the one running now 
                if (processedTransactions.find(txn => {
                    let invalidTime = new Date(operation.transaction.time) - new Date(txn.time) < 120000
                    let equalAmount = txn.amount === operation.transaction.amount
                    // The find() returns a boolean that says if it breaks this rules. This function stops at the first found obj
                    return equalAmount && invalidTime
                })
                ) {
                    state.violations.push(rules.DOUBLED_TRANSACTION)

                } else if (processedTransactions.filter(txn => {
                    let invalidTime = new Date(operation.transaction.time) - new Date(txn.time) < 120000
                    // The filter() returns an array with all the results found so we check if theres more than 3 results for this rule
                    return invalidTime
                }).length >= 3) {
                    state.violations.push(rules.HIGH_FREQUENCY_SMALL_INTERVAL)
                } else {
                    // At least it just takes to check if theres avaiable limit for the transaction
                    let limit = state.account.availableLimit
                    let amount = operation.transaction.amount

                    if (limit - amount >= 0) {
                        // Update the value of limit in the active account
                        state.account.availableLimit = limit - amount
                        processedTransactions.push(operation.transaction)
                    } else {
                        // Update the violations for insufficient limit break rule
                        state.violations.push(rules.INSUFFICIENT_LIMIT)
                    }
                }
            }
        }
        // It logs the user for the state of the account after each interation
        console.log(state)
    }
})