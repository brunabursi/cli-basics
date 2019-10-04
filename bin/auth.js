const readline = require('readline')

const state = {
    account: null,
    violations: []
}

const processedTransactions = []

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

rl.on('line', item => {
    let operation = JSON.parse(item)

    if (operation.account) {
        if (state.account === null) {
            state.account = operation.account
        } else {
            state.violations.push(rules.ACCOUNT_ALREADY_INITIALIZED)
        }
    }

    if (operation.transaction) {
        if (state.account == null) {
            state.violations.push(rules.CARD_NOT_ACTIVE)
        } else {

            if (processedTransactions.find(txn => {
                let invalidDate = new Date(operation.transaction.time) - new Date(txn.time) < 120000
                let equalAmount = txn.amount === operation.transaction.amount

                return equalAmount && invalidDate
            })
            ) {
                state.violations.push(rules.DOUBLED_TRANSACTION)

            } else if (processedTransactions.filter(txn => {
                let invalidTime = new Date(operation.transaction.time) - new Date(txn.time) < 120000

                return invalidTime
            }).length >= 3) {
                state.violations.push(rules.HIGH_FREQUENCY_SMALL_INTERVAL)
            } else {
                let limit = state.account.availableLimit
                let amount = operation.transaction.amount

                if (limit - amount >= 0) {
                    state.account.availableLimit = limit - amount
                    processedTransactions.push(operation.transaction)
                } else {
                    state.violations.push(rules.INSUFFICIENT_LIMIT)
                }
            }
        }
    }
    console.log(state)
})