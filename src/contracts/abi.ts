export const Approval = 'Approval' as const;export const Transfer = 'Transfer' as const;export const RewardsClaimed = 'RewardsClaimed' as const;export const TcbBenchmarkChanged = 'TcbBenchmarkChanged' as const;export const TcbCompleted = 'TcbCompleted' as const;export const TcbInitialized = 'TcbInitialized' as const;export const TcbBanned = 'TcbBanned' as const;export const DepositPartLocked = 'DepositPartLocked' as const;export const DepositPartUnlocked = 'DepositPartUnlocked' as const;export const DepositReplenished = 'DepositReplenished' as const;export const DepositWithdrawn = 'DepositWithdrawn' as const;export const OfferCreated = 'OfferCreated' as const;export const OfferDisabled = 'OfferDisabled' as const;export const OfferEnabled = 'OfferEnabled' as const;export const SetValueOfferRestrictions = 'SetValueOfferRestrictions' as const;export const TeeOfferCreated = 'TeeOfferCreated' as const;export const TeeOfferViolationRateChanged = 'TeeOfferViolationRateChanged' as const;export const OrdersGroupCreated = 'OrdersGroupCreated' as const;export const OrderCreated = 'OrderCreated' as const;export const OrderStatusUpdated = 'OrderStatusUpdated' as const;export const OrderAwaitingPaymentChanged = 'OrderAwaitingPaymentChanged' as const;export const OrderDepositRefilled = 'OrderDepositRefilled' as const;export const OrderOptionsDepositSpentChanged = 'OrderOptionsDepositSpentChanged' as const;export const OrderProfitUnlocked = 'OrderProfitUnlocked' as const;export const OrderChangeWithdrawn = 'OrderChangeWithdrawn' as const;export const OrderEncryptedResultUpdated = 'OrderEncryptedResultUpdated' as const;export const OrderProfitWithdrawn = 'OrderProfitWithdrawn' as const;export const OrderStarted = 'OrderStarted' as const;export const OrderOptionsChangeRequested = 'OrderOptionsChangeRequested' as const;export const OrderOptionsChanged = 'OrderOptionsChanged' as const;export const OrderSlotCountUpdateRequested = 'OrderSlotCountUpdateRequested' as const;export const OrderSlotCountUpdated = 'OrderSlotCountUpdated' as const;export const ProviderModified = 'ProviderModified' as const;export const ProviderRegistered = 'ProviderRegistered' as const;export const ProviderSecurityDepoRefilled = 'ProviderSecurityDepoRefilled' as const;export const ProviderSecurityDepoUnlocked = 'ProviderSecurityDepoUnlocked' as const;export const ProviderViolationRateIncremented = 'ProviderViolationRateIncremented' as const;export const OptionAdded = 'OptionAdded' as const;export const OptionDeleted = 'OptionDeleted' as const;export const OptionUpdated = 'OptionUpdated' as const;export const TeeSlotAdded = 'TeeSlotAdded' as const;export const TeeSlotDeleted = 'TeeSlotDeleted' as const;export const TeeSlotUpdated = 'TeeSlotUpdated' as const;export const TcbRewardUnlocked = 'TcbRewardUnlocked' as const;export const WarningMessage = 'WarningMessage' as const;export const ValueSlotAdded = 'ValueSlotAdded' as const;export const ValueSlotDeleted = 'ValueSlotDeleted' as const;export const ValueSlotUpdated = 'ValueSlotUpdated' as const;export const DiamondCut = 'DiamondCut' as const;export const OwnershipTransferred = 'OwnershipTransferred' as const;export const LoaderSecretPublicKeySessionUpdated = 'LoaderSecretPublicKeySessionUpdated' as const;export const LoaderSessionKeyUpdated = 'LoaderSessionKeyUpdated' as const;export const OfferResourceCreated = 'OfferResourceCreated' as const;export const OrderResourceCreated = 'OrderResourceCreated' as const;export const OfferStorageRequestCanceled = 'OfferStorageRequestCanceled' as const;export const OfferStorageRequestCreated = 'OfferStorageRequestCreated' as const;export const SecretRequestCreated = 'SecretRequestCreated' as const;
export type AbiEvent = typeof Approval | typeof Transfer | typeof RewardsClaimed | typeof TcbBenchmarkChanged | typeof TcbCompleted | typeof TcbInitialized | typeof TcbBanned | typeof DepositPartLocked | typeof DepositPartUnlocked | typeof DepositReplenished | typeof DepositWithdrawn | typeof OfferCreated | typeof OfferDisabled | typeof OfferEnabled | typeof SetValueOfferRestrictions | typeof TeeOfferCreated | typeof TeeOfferViolationRateChanged | typeof OrdersGroupCreated | typeof OrderCreated | typeof OrderStatusUpdated | typeof OrderAwaitingPaymentChanged | typeof OrderDepositRefilled | typeof OrderOptionsDepositSpentChanged | typeof OrderProfitUnlocked | typeof OrderChangeWithdrawn | typeof OrderEncryptedResultUpdated | typeof OrderProfitWithdrawn | typeof OrderStarted | typeof OrderOptionsChangeRequested | typeof OrderOptionsChanged | typeof OrderSlotCountUpdateRequested | typeof OrderSlotCountUpdated | typeof ProviderModified | typeof ProviderRegistered | typeof ProviderSecurityDepoRefilled | typeof ProviderSecurityDepoUnlocked | typeof ProviderViolationRateIncremented | typeof OptionAdded | typeof OptionDeleted | typeof OptionUpdated | typeof TeeSlotAdded | typeof TeeSlotDeleted | typeof TeeSlotUpdated | typeof TcbRewardUnlocked | typeof WarningMessage | typeof ValueSlotAdded | typeof ValueSlotDeleted | typeof ValueSlotUpdated | typeof DiamondCut | typeof OwnershipTransferred | typeof LoaderSecretPublicKeySessionUpdated | typeof LoaderSessionKeyUpdated | typeof OfferResourceCreated | typeof OrderResourceCreated | typeof OfferStorageRequestCanceled | typeof OfferStorageRequestCreated | typeof SecretRequestCreated;
export const abi = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "subtractedValue",
                "type": "uint256"
            }
        ],
        "name": "decreaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "addedValue",
                "type": "uint256"
            }
        ],
        "name": "increaseAllowance",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "burn",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "burnFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "begin",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "end",
                "type": "uint256"
            }
        ],
        "name": "getListOfActiveOffersRange",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getListOfActiveOffersSize",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "onOfferDisabled",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "onOfferEnabled",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "begin",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "end",
                "type": "uint256"
            }
        ],
        "name": "getListOfActiveOrdersRange",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getListOfActiveOrdersSize",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getOfferActiveOrdersCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "begin",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "end",
                "type": "uint256"
            }
        ],
        "name": "getOfferActiveOrdersRange",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getWorkingOffersCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "begin",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "end",
                "type": "uint256"
            }
        ],
        "name": "getWorkingOffersRange",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "onOrderActivated",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "onOrderDeactivated",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "claimer",
                "type": "address"
            }
        ],
        "name": "RewardsClaimed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "provider",
                "type": "address"
            }
        ],
        "name": "TcbBenchmarkChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "provider",
                "type": "address"
            }
        ],
        "name": "TcbCompleted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "provider",
                "type": "address"
            }
        ],
        "name": "TcbInitialized",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "addTcbToSupply",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "enum TcbVerifiedStatus[]",
                "name": "marks",
                "type": "uint8[]"
            },
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "applyTcbMarks",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "assignLastBlocksToCheck",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "assignSuspiciousBlocksToCheck",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "claimRewards",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            }
        ],
        "name": "getActualTcbId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getConsensusConstants",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            },
            {
                "internalType": "uint32",
                "name": "",
                "type": "uint32"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "getEpoch",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "reward",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "benchmark",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "penaltyBenchmark",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct Epoch",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbTime",
                "type": "uint256"
            }
        ],
        "name": "getEpochTime",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "epochStart",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "epochEnd",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "epochIndex",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            }
        ],
        "name": "getInitializedTcbId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getLastBlockTable",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getLastBlockTableSize",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getSuspiciousBlockTable",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getSuspiciousBlockTableSize",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "getTcbById",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "enum TcbStatus",
                        "name": "status",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "previousTcb",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timeInitialized",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timeAdded",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "lastBlocksTakenAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "suspiciousBlocksTakenAmount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint16",
                        "name": "negative",
                        "type": "uint16"
                    },
                    {
                        "internalType": "uint16",
                        "name": "positive",
                        "type": "uint16"
                    },
                    {
                        "internalType": "bool",
                        "name": "lastBlocksTaken",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "suspiciousBlocksTaken",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "checked",
                        "type": "bool"
                    },
                    {
                        "internalType": "bool",
                        "name": "rewardClaimed",
                        "type": "bool"
                    }
                ],
                "internalType": "struct Tcb",
                "name": "response",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "getTcbReward",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTcbsCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "tcbIds",
                "type": "uint256[]"
            }
        ],
        "name": "getTcbsPublicData",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256[]",
                        "name": "checkingTcbIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "enum TcbVerifiedStatus[]",
                        "name": "checkingTcbMarks",
                        "type": "uint8[]"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "deviceId",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "uint256",
                        "name": "benchmark",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "properties",
                        "type": "string"
                    }
                ],
                "internalType": "struct TcbPublicData[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "tcbIds",
                "type": "uint256[]"
            }
        ],
        "name": "getTcbsUtilityData",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "teeOfferId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "pubKey",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "quote",
                        "type": "string"
                    }
                ],
                "internalType": "struct TcbUtilityData[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "newDeviceId",
                "type": "bytes32"
            }
        ],
        "name": "initializeTcb",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "isBenchmarkChangedByLastbBlock",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "deviceId",
                "type": "bytes32"
            }
        ],
        "name": "isTcbCreationAvailable",
        "outputs": [
            {
                "internalType": "bool",
                "name": "offerNotBlocked",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "newEpochStarted",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "halfEpochPassed",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "benchmarkVerified",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "isTeeOfferVerified",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "benchmark",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "properties",
                "type": "string"
            },
            {
                "internalType": "bytes32",
                "name": "deviceId",
                "type": "bytes32"
            },
            {
                "internalType": "string",
                "name": "quote",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "pubKey",
                "type": "string"
            }
        ],
        "name": "setTcbData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            },
            {
                "internalType": "enum TcbStatus",
                "name": "status",
                "type": "uint8"
            }
        ],
        "name": "setTcbStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "provider",
                "type": "address"
            }
        ],
        "name": "TcbBanned",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "addLastBlock",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "addSuspiciousBlock",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "addTcbToEpoch",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "compareWithThreshold",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "intruderTcbId",
                "type": "uint256"
            }
        ],
        "name": "compensateEpochDamage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "findAccomplices",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "compensation",
                "type": "uint256"
            }
        ],
        "name": "increaseNextEpochCompensation",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "removeLastBlock",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "removeSuspiciousBlock",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "updateConsensusTables",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "totalLocked",
                "type": "uint256"
            }
        ],
        "name": "DepositPartLocked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "totalLocked",
                "type": "uint256"
            }
        ],
        "name": "DepositPartUnlocked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "totalAmount",
                "type": "uint256"
            }
        ],
        "name": "DepositReplenished",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "totalAmount",
                "type": "uint256"
            }
        ],
        "name": "DepositWithdrawn",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "depositOwner",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "addProfit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "depositOwner",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "confiscateTokensFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "depositOwner",
                "type": "address"
            }
        ],
        "name": "getDepositInfo",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "totalLocked",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "profit",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct DepositInfo",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "depositOwner",
                "type": "address"
            }
        ],
        "name": "getLockedTokensAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "beneficiary",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "increaseForByApp",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "depositOwner",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "lockDeposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "replenish",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "beneficiary",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "replenishFor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "funder",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "beneficiary",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "replenishForByApp",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "depositOwner",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "unlockDeposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrderMark",
        "outputs": [
            {
                "internalType": "enum Mark",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "provider",
                "type": "address"
            }
        ],
        "name": "getProviderMarks",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "positive",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "negative",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct ProviderMarksCount",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "internalType": "enum Mark",
                "name": "mark",
                "type": "uint8"
            }
        ],
        "name": "setOrderMark",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "externalId",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "OfferCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "enum OfferType",
                "name": "offerType",
                "type": "uint8"
            }
        ],
        "name": "OfferDisabled",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "enum OfferType",
                "name": "offerType",
                "type": "uint8"
            }
        ],
        "name": "OfferEnabled",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "uint256[]",
                        "name": "offers",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "enum OfferType[]",
                        "name": "types",
                        "type": "uint8[]"
                    },
                    {
                        "internalType": "uint64[]",
                        "name": "versions",
                        "type": "uint64[]"
                    }
                ],
                "indexed": false,
                "internalType": "struct ValueOfferRestrictionsSpecification",
                "name": "specification",
                "type": "tuple"
            }
        ],
        "name": "SetValueOfferRestrictions",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "externalId",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "TeeOfferCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "violationRate",
                "type": "uint256"
            }
        ],
        "name": "TeeOfferViolationRateChanged",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "teeType",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "properties",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "tlb_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "argsPublicKey",
                        "type": "string"
                    },
                    {
                        "internalType": "enum TeeOfferSubtype",
                        "name": "subtype",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct TeeOfferInfo",
                "name": "info",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint64",
                        "name": "cpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "ram",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "diskUsage",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "gpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "vram",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotInfo",
                "name": "slotInfo",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "data",
                        "type": "string"
                    }
                ],
                "internalType": "struct OptionInfo",
                "name": "optionInfo",
                "type": "tuple"
            },
            {
                "internalType": "bytes32",
                "name": "externalId",
                "type": "bytes32"
            },
            {
                "internalType": "bool",
                "name": "enabled",
                "type": "bool"
            }
        ],
        "name": "createTeeOffer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            },
            {
                "internalType": "enum OfferType",
                "name": "offerType",
                "type": "uint8"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OfferGroup",
                        "name": "group_DEPRECATED",
                        "type": "uint8"
                    },
                    {
                        "internalType": "enum OfferType",
                        "name": "offerType_DEPRECATED",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bool",
                        "name": "cancelable",
                        "type": "bool"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "input",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "output",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "allowedArgs",
                        "type": "string"
                    },
                    {
                        "internalType": "address[]",
                        "name": "allowedAccounts",
                        "type": "address[]"
                    },
                    {
                        "internalType": "string",
                        "name": "argsPublicKey",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "resultResource",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "linkage_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "hash",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "metadata",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "signatureKeyHash",
                        "type": "string"
                    },
                    {
                        "internalType": "enum ValueOfferSubtype",
                        "name": "subtype",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "hardwareContext",
                        "type": "string"
                    }
                ],
                "internalType": "struct ValueOfferInfo",
                "name": "info",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint256[]",
                        "name": "offers",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "enum OfferType[]",
                        "name": "types",
                        "type": "uint8[]"
                    },
                    {
                        "internalType": "uint64[]",
                        "name": "versions",
                        "type": "uint64[]"
                    }
                ],
                "internalType": "struct ValueOfferRestrictionsSpecification",
                "name": "restrictionsSpecification",
                "type": "tuple"
            },
            {
                "internalType": "bytes32",
                "name": "externalId",
                "type": "bytes32"
            },
            {
                "internalType": "bool",
                "name": "enabled",
                "type": "bool"
            }
        ],
        "name": "createValueOffer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "version",
                "type": "uint64"
            }
        ],
        "name": "deleteOfferVersion",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "disableOffer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "enableOffer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "description",
                "type": "string"
            }
        ],
        "name": "setOfferDescription",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            }
        ],
        "name": "setOfferName",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "newVersion",
                "type": "uint64"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "mrenclave",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "mrsigner",
                        "type": "string"
                    }
                ],
                "internalType": "struct OfferVersionInfo",
                "name": "newVersionInfo",
                "type": "tuple"
            }
        ],
        "name": "setOfferNewVersion",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "publicKey",
                "type": "string"
            }
        ],
        "name": "setOfferPublicKey",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "uint64",
                        "name": "cpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "ram",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "diskUsage",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "gpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "vram",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotInfo",
                "name": "newSlotInfo",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "data",
                        "type": "string"
                    }
                ],
                "internalType": "struct OptionInfo",
                "name": "newOptionInfo",
                "type": "tuple"
            }
        ],
        "name": "setTeeOfferHardwareInfo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "teeType",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "properties",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "tlb_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "argsPublicKey",
                        "type": "string"
                    },
                    {
                        "internalType": "enum TeeOfferSubtype",
                        "name": "subtype",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct TeeOfferInfo",
                "name": "newInfo",
                "type": "tuple"
            }
        ],
        "name": "setTeeOfferInfo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "enum TeeOfferSubtype",
                "name": "newSubtype",
                "type": "uint8"
            }
        ],
        "name": "setTeeOfferSubtype",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OfferGroup",
                        "name": "group_DEPRECATED",
                        "type": "uint8"
                    },
                    {
                        "internalType": "enum OfferType",
                        "name": "offerType_DEPRECATED",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bool",
                        "name": "cancelable",
                        "type": "bool"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "input",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "output",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "allowedArgs",
                        "type": "string"
                    },
                    {
                        "internalType": "address[]",
                        "name": "allowedAccounts",
                        "type": "address[]"
                    },
                    {
                        "internalType": "string",
                        "name": "argsPublicKey",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "resultResource",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "linkage_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "hash",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "metadata",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "signatureKeyHash",
                        "type": "string"
                    },
                    {
                        "internalType": "enum ValueOfferSubtype",
                        "name": "subtype",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "hardwareContext",
                        "type": "string"
                    }
                ],
                "internalType": "struct ValueOfferInfo",
                "name": "newInfo",
                "type": "tuple"
            }
        ],
        "name": "setValueOfferInfo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "uint256[]",
                        "name": "offers",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "enum OfferType[]",
                        "name": "types",
                        "type": "uint8[]"
                    },
                    {
                        "internalType": "uint64[]",
                        "name": "versions",
                        "type": "uint64[]"
                    }
                ],
                "internalType": "struct ValueOfferRestrictionsSpecification",
                "name": "newSpecification",
                "type": "tuple"
            }
        ],
        "name": "setValueOfferRestrictionsSpecification",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "enum ValueOfferSubtype",
                "name": "newSubtype",
                "type": "uint8"
            }
        ],
        "name": "setValueOfferSubtype",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "begin",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "end",
                "type": "uint256"
            }
        ],
        "name": "getTeeOffersRange",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "providerAuth",
                        "type": "address"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "name",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "description",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "teeType",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "properties",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "tlb_DEPRECATED",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "argsPublicKey",
                                "type": "string"
                            },
                            {
                                "internalType": "enum TeeOfferSubtype",
                                "name": "subtype",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct TeeOfferInfo",
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "internalType": "bool",
                        "name": "enabled",
                        "type": "bool"
                    }
                ],
                "internalType": "struct TeeOfferData[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "enum OfferType",
                "name": "offerType",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "begin",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "end",
                "type": "uint256"
            }
        ],
        "name": "getValueOffersRange",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "providerAuth",
                        "type": "address"
                    },
                    {
                        "internalType": "enum OfferType",
                        "name": "offerType",
                        "type": "uint8"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "name",
                                "type": "string"
                            },
                            {
                                "internalType": "enum OfferGroup",
                                "name": "group_DEPRECATED",
                                "type": "uint8"
                            },
                            {
                                "internalType": "enum OfferType",
                                "name": "offerType_DEPRECATED",
                                "type": "uint8"
                            },
                            {
                                "internalType": "bool",
                                "name": "cancelable",
                                "type": "bool"
                            },
                            {
                                "internalType": "string",
                                "name": "description",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "input",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "output",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "allowedArgs",
                                "type": "string"
                            },
                            {
                                "internalType": "address[]",
                                "name": "allowedAccounts",
                                "type": "address[]"
                            },
                            {
                                "internalType": "string",
                                "name": "argsPublicKey",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "resultResource",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "linkage_DEPRECATED",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "hash",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "metadata",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "signatureKeyHash",
                                "type": "string"
                            },
                            {
                                "internalType": "enum ValueOfferSubtype",
                                "name": "subtype",
                                "type": "uint8"
                            },
                            {
                                "internalType": "string",
                                "name": "hardwareContext",
                                "type": "string"
                            }
                        ],
                        "internalType": "struct ValueOfferInfo",
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "internalType": "bool",
                        "name": "enabled",
                        "type": "bool"
                    }
                ],
                "internalType": "struct ValueOfferData[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getOfferGroup",
        "outputs": [
            {
                "internalType": "enum OfferGroup",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            },
            {
                "internalType": "uint32",
                "name": "slotCount",
                "type": "uint32"
            },
            {
                "internalType": "uint256[]",
                "name": "optionsIds",
                "type": "uint256[]"
            },
            {
                "internalType": "uint32[]",
                "name": "optionsCount",
                "type": "uint32[]"
            }
        ],
        "name": "getOfferMinDeposit",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getOfferOrigins",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "createdDate",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "createdBy",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "modifiedDate",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "modifiedBy",
                        "type": "address"
                    }
                ],
                "internalType": "struct Origins",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getOfferProviderActionAccount",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getOfferProviderAuthority",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getOfferRestrictionsSpecification",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256[]",
                        "name": "offers",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "enum OfferType[]",
                        "name": "types",
                        "type": "uint8[]"
                    },
                    {
                        "internalType": "uint64[]",
                        "name": "versions",
                        "type": "uint64[]"
                    }
                ],
                "internalType": "struct ValueOfferRestrictionsSpecification",
                "name": "ret",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getOfferType",
        "outputs": [
            {
                "internalType": "enum OfferType",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "version",
                "type": "uint64"
            }
        ],
        "name": "getOfferVersion",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint64",
                        "name": "version",
                        "type": "uint64"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "mrenclave",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "mrsigner",
                                "type": "string"
                            }
                        ],
                        "internalType": "struct OfferVersionInfo",
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "internalType": "enum OfferVersionStatus",
                        "name": "status",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct OfferVersion",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getOfferVersionsCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "enum OfferType",
                "name": "offerType",
                "type": "uint8"
            }
        ],
        "name": "getOffersCountByType",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getOffersTotalCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getTeeOffer",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "providerAuth",
                        "type": "address"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "name",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "description",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "teeType",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "properties",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "tlb_DEPRECATED",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "argsPublicKey",
                                "type": "string"
                            },
                            {
                                "internalType": "enum TeeOfferSubtype",
                                "name": "subtype",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct TeeOfferInfo",
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "internalType": "bool",
                        "name": "enabled",
                        "type": "bool"
                    }
                ],
                "internalType": "struct TeeOfferData",
                "name": "ret",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            }
        ],
        "name": "getTeeOfferHardwareInfo",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint64",
                        "name": "cpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "ram",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "diskUsage",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "gpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "vram",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotInfo",
                "name": "",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "data",
                        "type": "string"
                    }
                ],
                "internalType": "struct OptionInfo",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getTeeOfferSubtype",
        "outputs": [
            {
                "internalType": "enum TeeOfferSubtype",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getValueOffer",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "providerAuth",
                        "type": "address"
                    },
                    {
                        "internalType": "enum OfferType",
                        "name": "offerType",
                        "type": "uint8"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "name",
                                "type": "string"
                            },
                            {
                                "internalType": "enum OfferGroup",
                                "name": "group_DEPRECATED",
                                "type": "uint8"
                            },
                            {
                                "internalType": "enum OfferType",
                                "name": "offerType_DEPRECATED",
                                "type": "uint8"
                            },
                            {
                                "internalType": "bool",
                                "name": "cancelable",
                                "type": "bool"
                            },
                            {
                                "internalType": "string",
                                "name": "description",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "input",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "output",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "allowedArgs",
                                "type": "string"
                            },
                            {
                                "internalType": "address[]",
                                "name": "allowedAccounts",
                                "type": "address[]"
                            },
                            {
                                "internalType": "string",
                                "name": "argsPublicKey",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "resultResource",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "linkage_DEPRECATED",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "hash",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "metadata",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "signatureKeyHash",
                                "type": "string"
                            },
                            {
                                "internalType": "enum ValueOfferSubtype",
                                "name": "subtype",
                                "type": "uint8"
                            },
                            {
                                "internalType": "string",
                                "name": "hardwareContext",
                                "type": "string"
                            }
                        ],
                        "internalType": "struct ValueOfferInfo",
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "internalType": "bool",
                        "name": "enabled",
                        "type": "bool"
                    }
                ],
                "internalType": "struct ValueOfferData",
                "name": "ret",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getValueOfferSubtype",
        "outputs": [
            {
                "internalType": "enum ValueOfferSubtype",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "isAutoCompleteOffer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "firstId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "firstVersion",
                "type": "uint64"
            },
            {
                "internalType": "uint256",
                "name": "secondId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "secondVersion",
                "type": "uint64"
            }
        ],
        "name": "isMagicallySameOfferVersion",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            }
        ],
        "name": "isOfferAllowedForConsumer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "isOfferCancelable",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "isOfferEnabled",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "isOfferExists",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "enum OfferType",
                "name": "offerType",
                "type": "uint8"
            }
        ],
        "name": "isOfferRestrictedByOfferType",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "otherOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "otherOfferVersion",
                "type": "uint64"
            }
        ],
        "name": "isOfferRestrictionsPermitOtherOffer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "version",
                "type": "uint64"
            }
        ],
        "name": "isOfferVersionAvailable",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "isTeeOfferBanned",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "groupId",
                "type": "uint256"
            }
        ],
        "name": "OrdersGroupCreated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "groupId",
                "type": "uint256"
            },
            {
                "internalType": "uint256[]",
                "name": "ordersIds",
                "type": "uint256[]"
            }
        ],
        "name": "addOrdersToGroup",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "ordersIds",
                "type": "uint256[]"
            }
        ],
        "name": "createGroupOfOrders",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "groupId",
                "type": "uint256"
            }
        ],
        "name": "getGroupOrders",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrderGroupId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "groupId",
                "type": "uint256"
            },
            {
                "internalType": "uint256[]",
                "name": "ordersIds",
                "type": "uint256[]"
            }
        ],
        "name": "removeOrdersFromGroup",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "externalId",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "parentOrderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "deposit",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "enum OrderStatus",
                "name": "status",
                "type": "uint8"
            }
        ],
        "name": "OrderCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "enum OrderStatus",
                "name": "status",
                "type": "uint8"
            }
        ],
        "name": "OrderStatusUpdated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "deposit",
                "type": "uint256"
            }
        ],
        "name": "adjustOrderDepositByApp",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "resultInfo",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedRequirements_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedArgs_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OrderStatus",
                        "name": "status",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "externalId",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "uint256",
                        "name": "expectedPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPriceSlippage",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderInfo",
                "name": "info",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "slotId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint32",
                        "name": "slotCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint256[]",
                        "name": "optionsIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint32[]",
                        "name": "optionsCount",
                        "type": "uint32[]"
                    }
                ],
                "internalType": "struct OrderSlots",
                "name": "slots",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint256[]",
                        "name": "inputOffersIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "outputOfferId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64[]",
                        "name": "inputOffersVersions",
                        "type": "uint64[]"
                    },
                    {
                        "internalType": "uint64",
                        "name": "outputOfferVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderArgs",
                "name": "args",
                "type": "tuple"
            },
            {
                "internalType": "uint256",
                "name": "deposit",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "suspended",
                "type": "bool"
            }
        ],
        "name": "createOrder",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "resultInfo",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedRequirements_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedArgs_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OrderStatus",
                        "name": "status",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "externalId",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "uint256",
                        "name": "expectedPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPriceSlippage",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderInfo",
                "name": "info",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "slotId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint32",
                        "name": "slotCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint256[]",
                        "name": "optionsIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint32[]",
                        "name": "optionsCount",
                        "type": "uint32[]"
                    }
                ],
                "internalType": "struct OrderSlots",
                "name": "slots",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint256[]",
                        "name": "inputOffersIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "outputOfferId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64[]",
                        "name": "inputOffersVersions",
                        "type": "uint64[]"
                    },
                    {
                        "internalType": "uint64",
                        "name": "outputOfferVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderArgs",
                "name": "args",
                "type": "tuple"
            },
            {
                "internalType": "uint256",
                "name": "deposit",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "suspended",
                "type": "bool"
            }
        ],
        "name": "createOrderByApp",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "parentOrderId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "resultInfo",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedRequirements_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedArgs_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OrderStatus",
                        "name": "status",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "externalId",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "uint256",
                        "name": "expectedPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPriceSlippage",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderInfo",
                "name": "suborderInfo",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "slotId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint32",
                        "name": "slotCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint256[]",
                        "name": "optionsIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint32[]",
                        "name": "optionsCount",
                        "type": "uint32[]"
                    }
                ],
                "internalType": "struct OrderSlots",
                "name": "suborderSlots",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint256[]",
                        "name": "inputOffersIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "outputOfferId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64[]",
                        "name": "inputOffersVersions",
                        "type": "uint64[]"
                    },
                    {
                        "internalType": "uint64",
                        "name": "outputOfferVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderArgs",
                "name": "suborderArgs",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "bool",
                        "name": "blockParentOrder",
                        "type": "bool"
                    },
                    {
                        "internalType": "uint256",
                        "name": "deposit",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct SubOrderParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "createSubOrder",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "parentOrderId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "resultInfo",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedRequirements_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedArgs_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OrderStatus",
                        "name": "status",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "externalId",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "uint256",
                        "name": "expectedPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPriceSlippage",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderInfo",
                "name": "suborderInfo",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "slotId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint32",
                        "name": "slotCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint256[]",
                        "name": "optionsIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint32[]",
                        "name": "optionsCount",
                        "type": "uint32[]"
                    }
                ],
                "internalType": "struct OrderSlots",
                "name": "suborderSlots",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint256[]",
                        "name": "inputOffersIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "outputOfferId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64[]",
                        "name": "inputOffersVersions",
                        "type": "uint64[]"
                    },
                    {
                        "internalType": "uint64",
                        "name": "outputOfferVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderArgs",
                "name": "suborderArgs",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "bool",
                        "name": "blockParentOrder",
                        "type": "bool"
                    },
                    {
                        "internalType": "uint256",
                        "name": "deposit",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct SubOrderParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "createSubOrderByApp",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bool",
                "name": "value",
                "type": "bool"
            }
        ],
        "name": "OrderAwaitingPaymentChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "OrderDepositRefilled",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "OrderOptionsDepositSpentChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "tokenReceiver",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "profit",
                "type": "uint256"
            }
        ],
        "name": "OrderProfitUnlocked",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "debitOrderDepositByApp",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "isOrderProfitAvailable",
        "outputs": [
            {
                "internalType": "bool",
                "name": "available",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "profit",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "refillOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "value",
                "type": "bool"
            }
        ],
        "name": "setAwaitingPayment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "setOptionsDepositSpent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "unlockProfit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "orderIds",
                "type": "uint256[]"
            }
        ],
        "name": "unlockProfitByList",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "ulockedIndex",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "change",
                "type": "uint256"
            }
        ],
        "name": "OrderChangeWithdrawn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "encryptedResult",
                "type": "string"
            }
        ],
        "name": "OrderEncryptedResultUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "tokenReceiver",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "profit",
                "type": "uint256"
            }
        ],
        "name": "OrderProfitWithdrawn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "OrderStarted",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "calculateOrderCurrentPrice",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "resultedPrice",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "cancelOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "cancelOrderByApp",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "internalType": "enum OrderStatus",
                "name": "status",
                "type": "uint8"
            },
            {
                "internalType": "string",
                "name": "encryptedResult",
                "type": "string"
            }
        ],
        "name": "completeOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "processOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "newCertificate",
                "type": "string"
            }
        ],
        "name": "setOrderCertificate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "startOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "startOrderByApp",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "encryptedResult",
                "type": "string"
            }
        ],
        "name": "updateOrderResult",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "OrderOptionsChangeRequested",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "OrderOptionsChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newSlotCount",
                "type": "uint256"
            }
        ],
        "name": "OrderSlotCountUpdateRequested",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "consumer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newSlotCount",
                "type": "uint256"
            }
        ],
        "name": "OrderSlotCountUpdated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "slotId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint32",
                        "name": "slotCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint256[]",
                        "name": "optionsIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint32[]",
                        "name": "optionsCount",
                        "type": "uint32[]"
                    }
                ],
                "internalType": "struct OrderSlots",
                "name": "orderSlotsSetup",
                "type": "tuple"
            }
        ],
        "name": "setTeeOrderSelectedUsageAndOptions",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            }
        ],
        "name": "setValueOrderUsage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "calculateOrderOutputReserve",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "calculateOrderTime",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "calculateTotalDepositSpent",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "depositSpent",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "calculateTotalDepositUnspent",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "depositUnspent",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "calculateTotalOrderDeposit",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "deposit",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "enum OfferGroup",
                "name": "parentOfferGroup",
                "type": "uint8"
            },
            {
                "internalType": "enum OfferGroup",
                "name": "subOfferGroup",
                "type": "uint8"
            }
        ],
        "name": "checkOrderAllowedGroup",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "enum OrderStatus",
                "name": "prev",
                "type": "uint8"
            },
            {
                "internalType": "enum OrderStatus",
                "name": "next",
                "type": "uint8"
            }
        ],
        "name": "checkOrderAllowedStatus",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "parentOrderId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "subOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "subOfferVersion",
                "type": "uint64"
            }
        ],
        "name": "checkParentOrderArgsCompliesWithSubOfferRestrictions",
        "outputs": [],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getAwaitingPayment",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getFinalizationDate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOptionsDepositSpent",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrder",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "resultInfo",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedRequirements_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedArgs_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OrderStatus",
                        "name": "status",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "externalId",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "uint256",
                        "name": "expectedPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPriceSlippage",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderInfo",
                "name": "",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "encryptedResult",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "orderPrice",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct OrderResult",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrderArgs",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256[]",
                        "name": "inputOffersIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "outputOfferId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64[]",
                        "name": "inputOffersVersions",
                        "type": "uint64[]"
                    },
                    {
                        "internalType": "uint64",
                        "name": "outputOfferVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderArgs",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrderCertificate",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrderConsumer",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrderDeposit",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrderOrigins",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "createdDate",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "createdBy",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "modifiedDate",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "modifiedBy",
                        "type": "address"
                    }
                ],
                "internalType": "struct Origins",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrderParentOrder",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrderPrice",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrderSelectedUsage",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint32",
                        "name": "slotCount",
                        "type": "uint32"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "data",
                                "type": "string"
                            }
                        ],
                        "internalType": "struct OptionInfo[]",
                        "name": "optionInfo",
                        "type": "tuple[]"
                    },
                    {
                        "components": [
                            {
                                "internalType": "enum PriceType",
                                "name": "priceType",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint256",
                                "name": "price",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint64",
                                "name": "minTimeMinutes",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "maxTimeMinutes",
                                "type": "uint64"
                            }
                        ],
                        "internalType": "struct SlotUsage[]",
                        "name": "optionUsage",
                        "type": "tuple[]"
                    },
                    {
                        "internalType": "uint256[]",
                        "name": "optionIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint32[]",
                        "name": "optionsCount",
                        "type": "uint32[]"
                    }
                ],
                "internalType": "struct OrderUsage",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrderSelectedUsageSlotInfo",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint64",
                        "name": "cpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "ram",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "diskUsage",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "gpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "vram",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotInfo",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrderSelectedUsageSlotUsage",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "enum PriceType",
                        "name": "priceType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "minTimeMinutes",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "maxTimeMinutes",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotUsage",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getOrderSubOrders",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getOrdersCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "getStartDate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "isOrderCompleted",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "isOrderProcessing",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "isOrderStarted",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "isOrderValid",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "auth",
                "type": "address"
            }
        ],
        "name": "ProviderModified",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "auth",
                "type": "address"
            }
        ],
        "name": "ProviderRegistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "auth",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "ProviderSecurityDepoRefilled",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "auth",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "ProviderSecurityDepoUnlocked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "auth",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newViolationRate",
                "type": "uint256"
            }
        ],
        "name": "ProviderViolationRateIncremented",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "getProviderActionAccount",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "getProviderInfo",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "tokenReceiver",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "actionAccount",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "metadata",
                        "type": "string"
                    }
                ],
                "internalType": "struct ProviderInfo",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "getProviderOrigins",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "createdDate",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "createdBy",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "modifiedDate",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "modifiedBy",
                        "type": "address"
                    }
                ],
                "internalType": "struct Origins",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "getProviderSecurityDeposit",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "getProviderTokenReceiver",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "getProviderViolationRate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getProvidersAuths",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getProvidersCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "incrProviderViolationRate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "isProviderRegistered",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "tokenReceiver",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "actionAccount",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "metadata",
                        "type": "string"
                    }
                ],
                "internalType": "struct ProviderInfo",
                "name": "info",
                "type": "tuple"
            }
        ],
        "name": "modifyProvider",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "refillProviderSecurityDepo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "refillProviderSecurityDepoFor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "tokenReceiver",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "actionAccount",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "metadata",
                        "type": "string"
                    }
                ],
                "internalType": "struct ProviderInfo",
                "name": "info",
                "type": "tuple"
            }
        ],
        "name": "registerProvider",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "returnProviderSecurityDepo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "authority",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "addLockedOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "authority",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "addLockedTcb",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "orderIds",
                "type": "uint256[]"
            }
        ],
        "name": "getAvaliableOrderRewardsAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "tcbIds",
                "type": "uint256[]"
            }
        ],
        "name": "getAvaliableTcbRewardsAmount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "authority",
                "type": "address"
            }
        ],
        "name": "getOrdersLockedProfitList",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "authority",
                "type": "address"
            }
        ],
        "name": "getTcbLockedProfitList",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "authority",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "removeLockedOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "authority",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "removeLockedTcb",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "enum OfferType",
                "name": "offerType",
                "type": "uint8"
            },
            {
                "internalType": "bool",
                "name": "enabled",
                "type": "bool"
            }
        ],
        "name": "addProviderOffer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "getProviderOffersDisabledTime",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "getProviderOffersState",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "teeEnabled",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "valueEnabled",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "disabledTime",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct ProviderOffersState",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "additional",
                "type": "uint256"
            }
        ],
        "name": "getProviderRequiredSecDepo",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "getProviderTeeOffers",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "getProviderValueOffers",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "isProviderHasEnabledOffers",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "isProviderHasEnoughSecurityDeposit",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            },
            {
                "internalType": "enum OfferType",
                "name": "offerType",
                "type": "uint8"
            },
            {
                "internalType": "bool",
                "name": "enabled",
                "type": "bool"
            }
        ],
        "name": "setProviderOfferState",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "tokenContractAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "uint32",
                        "name": "protocolCommissionPercent",
                        "type": "uint32"
                    }
                ],
                "internalType": "struct TokenInfo[]",
                "name": "newTokens",
                "type": "tuple[]"
            }
        ],
        "name": "addTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "enum ParamName",
                "name": "name",
                "type": "uint8"
            }
        ],
        "name": "getConfigParam",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getProtocolCommissionDenominator",
        "outputs": [
            {
                "internalType": "uint32",
                "name": "",
                "type": "uint32"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getProtocolIncomeDistribution",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "recipient",
                        "type": "address"
                    },
                    {
                        "internalType": "uint16",
                        "name": "percent",
                        "type": "uint16"
                    }
                ],
                "internalType": "struct ProtocolIncomeRecipient[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getProtocolIncomePercent",
        "outputs": [
            {
                "internalType": "uint32",
                "name": "",
                "type": "uint32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getProtocolTotalIncomeDistributionRatio",
        "outputs": [
            {
                "internalType": "uint32",
                "name": "",
                "type": "uint32"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getToken",
        "outputs": [
            {
                "internalType": "contract ISuperproToken",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTokens",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "tokenContractAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "uint32",
                        "name": "protocolCommissionPercent",
                        "type": "uint32"
                    }
                ],
                "internalType": "struct TokenInfo[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenContractAddress",
                "type": "address"
            }
        ],
        "name": "isTokenExists",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "tokensAddresses",
                "type": "address[]"
            }
        ],
        "name": "removeTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "enum ParamName",
                "name": "name",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "setConfigParam",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "token",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "orderMinimumDeposit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "profitWithdrawDelaySeconds",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "minSecurityDeposit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "stopDelaySeconds",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferSecurityDeposit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "offerSecurityDeposit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeRewardPerEpoch",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageRequestFee",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct SuperproParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "setConfigParams",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bool",
                "name": "isLocked",
                "type": "bool"
            }
        ],
        "name": "setLockData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "recipient",
                        "type": "address"
                    },
                    {
                        "internalType": "uint16",
                        "name": "percent",
                        "type": "uint16"
                    }
                ],
                "internalType": "struct ProtocolIncomeRecipient[]",
                "name": "recipients",
                "type": "tuple[]"
            }
        ],
        "name": "setProtocolIncomeDistribution",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint32",
                "name": "percent",
                "type": "uint32"
            }
        ],
        "name": "setProtocolIncomePercent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "optionId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "externalId",
                "type": "bytes32"
            }
        ],
        "name": "OptionAdded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "optionId",
                "type": "uint256"
            }
        ],
        "name": "OptionDeleted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "optionId",
                "type": "uint256"
            }
        ],
        "name": "OptionUpdated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "externalId",
                "type": "bytes32"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "data",
                        "type": "string"
                    }
                ],
                "internalType": "struct OptionInfo",
                "name": "info",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "enum PriceType",
                        "name": "priceType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "minTimeMinutes",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "maxTimeMinutes",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotUsage",
                "name": "usage",
                "type": "tuple"
            }
        ],
        "name": "addOption",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "optionId",
                "type": "uint256"
            }
        ],
        "name": "deleteOption",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "optionId",
                "type": "uint256"
            }
        ],
        "name": "getOptionById",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "data",
                                "type": "string"
                            }
                        ],
                        "internalType": "struct OptionInfo",
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "enum PriceType",
                                "name": "priceType",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint256",
                                "name": "price",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint64",
                                "name": "minTimeMinutes",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "maxTimeMinutes",
                                "type": "uint64"
                            }
                        ],
                        "internalType": "struct SlotUsage",
                        "name": "usage",
                        "type": "tuple"
                    }
                ],
                "internalType": "struct TeeOfferOption",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getOptionsCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "begin",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "end",
                "type": "uint256"
            }
        ],
        "name": "getTeeOfferOptions",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "data",
                                "type": "string"
                            }
                        ],
                        "internalType": "struct OptionInfo",
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "enum PriceType",
                                "name": "priceType",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint256",
                                "name": "price",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint64",
                                "name": "minTimeMinutes",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "maxTimeMinutes",
                                "type": "uint64"
                            }
                        ],
                        "internalType": "struct SlotUsage",
                        "name": "usage",
                        "type": "tuple"
                    }
                ],
                "internalType": "struct TeeOfferOption[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            }
        ],
        "name": "getTeeOfferOptionsCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "optionId",
                "type": "uint256"
            }
        ],
        "name": "isOptionExists",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "optionId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "data",
                        "type": "string"
                    }
                ],
                "internalType": "struct OptionInfo",
                "name": "newInfo",
                "type": "tuple"
            }
        ],
        "name": "updateOptionInfo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "optionId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "enum PriceType",
                        "name": "priceType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "minTimeMinutes",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "maxTimeMinutes",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotUsage",
                "name": "newUsage",
                "type": "tuple"
            }
        ],
        "name": "updateOptionUsage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "externalId",
                "type": "bytes32"
            }
        ],
        "name": "TeeSlotAdded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            }
        ],
        "name": "TeeSlotDeleted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            }
        ],
        "name": "TeeSlotUpdated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "externalId",
                "type": "bytes32"
            },
            {
                "components": [
                    {
                        "internalType": "uint64",
                        "name": "cpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "ram",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "diskUsage",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "gpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "vram",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotInfo",
                "name": "info",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "enum PriceType",
                        "name": "priceType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "minTimeMinutes",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "maxTimeMinutes",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotUsage",
                "name": "usage",
                "type": "tuple"
            }
        ],
        "name": "addTeeOfferSlot",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            }
        ],
        "name": "deleteTeeOfferSlot",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCpuDenominator",
        "outputs": [
            {
                "internalType": "uint16",
                "name": "",
                "type": "uint16"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            }
        ],
        "name": "getTeeOfferSlotById",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "components": [
                            {
                                "internalType": "uint64",
                                "name": "cpuCores",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "ram",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "diskUsage",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "gpuCores",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "vram",
                                "type": "uint64"
                            }
                        ],
                        "internalType": "struct SlotInfo",
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "enum PriceType",
                                "name": "priceType",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint256",
                                "name": "price",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint64",
                                "name": "minTimeMinutes",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "maxTimeMinutes",
                                "type": "uint64"
                            }
                        ],
                        "internalType": "struct SlotUsage",
                        "name": "usage",
                        "type": "tuple"
                    }
                ],
                "internalType": "struct TeeOfferSlot",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "begin",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "end",
                "type": "uint256"
            }
        ],
        "name": "getTeeOfferSlots",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "components": [
                            {
                                "internalType": "uint64",
                                "name": "cpuCores",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "ram",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "diskUsage",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "gpuCores",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "vram",
                                "type": "uint64"
                            }
                        ],
                        "internalType": "struct SlotInfo",
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "enum PriceType",
                                "name": "priceType",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint256",
                                "name": "price",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint64",
                                "name": "minTimeMinutes",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "maxTimeMinutes",
                                "type": "uint64"
                            }
                        ],
                        "internalType": "struct SlotUsage",
                        "name": "usage",
                        "type": "tuple"
                    }
                ],
                "internalType": "struct TeeOfferSlot[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            }
        ],
        "name": "getTeeOfferSlotsCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTeeOffersSlotsCountTotal",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            }
        ],
        "name": "isTeeOfferSlotExists",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "uint64",
                        "name": "cpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "ram",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "diskUsage",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "gpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "vram",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotInfo",
                "name": "newInfo",
                "type": "tuple"
            }
        ],
        "name": "updateTeeOfferSlotInfo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "enum PriceType",
                        "name": "priceType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "minTimeMinutes",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "maxTimeMinutes",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotUsage",
                "name": "newUsage",
                "type": "tuple"
            }
        ],
        "name": "updateTeeOfferSlotUsage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "rewards",
                "type": "uint256"
            }
        ],
        "name": "TcbRewardUnlocked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "message",
                "type": "string"
            }
        ],
        "name": "WarningMessage",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "_unlockTcbReward",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "deviceId",
                "type": "bytes32"
            }
        ],
        "name": "banTeeOffer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "deviceId",
                "type": "bytes32"
            }
        ],
        "name": "blockTeeOffer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            }
        ],
        "name": "confiscateAllRewards",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "deviceId",
                "type": "bytes32"
            }
        ],
        "name": "getTeeOfferByDeviceId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            }
        ],
        "name": "getTeeOfferViolationRate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            }
        ],
        "name": "getTeeVerifiedBenchmark",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            }
        ],
        "name": "incrTeeOfferViolationRate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "isTcbProfitAvailable",
        "outputs": [
            {
                "internalType": "bool",
                "name": "available",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "reward",
                "type": "uint256"
            }
        ],
        "name": "lockTcbReward",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "deviceId",
                "type": "bytes32"
            }
        ],
        "name": "setTeeDeviceId",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "unlockTcbReward",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256[]",
                "name": "tcbIds",
                "type": "uint256[]"
            }
        ],
        "name": "unlockTcbRewardByList",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "ulockedIndex",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "benchmark",
                "type": "uint256"
            }
        ],
        "name": "updateVerifiedTeeBenchmark",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "externalId",
                "type": "bytes32"
            }
        ],
        "name": "ValueSlotAdded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            }
        ],
        "name": "ValueSlotDeleted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            }
        ],
        "name": "ValueSlotUpdated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "externalId",
                "type": "bytes32"
            },
            {
                "components": [
                    {
                        "internalType": "uint64",
                        "name": "cpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "ram",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "diskUsage",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "gpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "vram",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotInfo",
                "name": "info",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "data",
                        "type": "string"
                    }
                ],
                "internalType": "struct OptionInfo",
                "name": "option",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "enum PriceType",
                        "name": "priceType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "minTimeMinutes",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "maxTimeMinutes",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotUsage",
                "name": "usage",
                "type": "tuple"
            }
        ],
        "name": "addValueOfferSlot",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            }
        ],
        "name": "deleteValueOfferSlot",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getCheapestValueOffersPrice",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            }
        ],
        "name": "getValueOfferSlotById",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "components": [
                            {
                                "internalType": "uint64",
                                "name": "cpuCores",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "ram",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "diskUsage",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "gpuCores",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "vram",
                                "type": "uint64"
                            }
                        ],
                        "internalType": "struct SlotInfo",
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "data",
                                "type": "string"
                            }
                        ],
                        "internalType": "struct OptionInfo",
                        "name": "option",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "enum PriceType",
                                "name": "priceType",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint256",
                                "name": "price",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint64",
                                "name": "minTimeMinutes",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "maxTimeMinutes",
                                "type": "uint64"
                            }
                        ],
                        "internalType": "struct SlotUsage",
                        "name": "usage",
                        "type": "tuple"
                    }
                ],
                "internalType": "struct ValueOfferSlot",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "begin",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "end",
                "type": "uint256"
            }
        ],
        "name": "getValueOfferSlots",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "components": [
                            {
                                "internalType": "uint64",
                                "name": "cpuCores",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "ram",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "diskUsage",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "gpuCores",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "vram",
                                "type": "uint64"
                            }
                        ],
                        "internalType": "struct SlotInfo",
                        "name": "info",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "data",
                                "type": "string"
                            }
                        ],
                        "internalType": "struct OptionInfo",
                        "name": "option",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "enum PriceType",
                                "name": "priceType",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint256",
                                "name": "price",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint64",
                                "name": "minTimeMinutes",
                                "type": "uint64"
                            },
                            {
                                "internalType": "uint64",
                                "name": "maxTimeMinutes",
                                "type": "uint64"
                            }
                        ],
                        "internalType": "struct SlotUsage",
                        "name": "usage",
                        "type": "tuple"
                    }
                ],
                "internalType": "struct ValueOfferSlot[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            }
        ],
        "name": "getValueOfferSlotsCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getValueOffersSlotsCountTotal",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            }
        ],
        "name": "isValueOfferSlotExists",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "uint64",
                        "name": "cpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "ram",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "diskUsage",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "gpuCores",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "vram",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotInfo",
                "name": "newInfo",
                "type": "tuple"
            }
        ],
        "name": "updateValueOfferSlotInfo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "data",
                        "type": "string"
                    }
                ],
                "internalType": "struct OptionInfo",
                "name": "newOption",
                "type": "tuple"
            }
        ],
        "name": "updateValueOfferSlotOption",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "slotId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "enum PriceType",
                        "name": "priceType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "price",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "minTimeMinutes",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint64",
                        "name": "maxTimeMinutes",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct SlotUsage",
                "name": "newUsage",
                "type": "tuple"
            }
        ],
        "name": "updateValueOfferSlotUsage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "parentOrderId",
                "type": "uint256"
            }
        ],
        "name": "cancelWorkflow",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "resultInfo",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedRequirements_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedArgs_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OrderStatus",
                        "name": "status",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "externalId",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "uint256",
                        "name": "expectedPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPriceSlippage",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderInfo",
                "name": "parentOrderInfo",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "slotId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint32",
                        "name": "slotCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint256[]",
                        "name": "optionsIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint32[]",
                        "name": "optionsCount",
                        "type": "uint32[]"
                    }
                ],
                "internalType": "struct OrderSlots",
                "name": "parentOrderSlots",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint256[]",
                        "name": "inputOffersIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "outputOfferId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64[]",
                        "name": "inputOffersVersions",
                        "type": "uint64[]"
                    },
                    {
                        "internalType": "uint64",
                        "name": "outputOfferVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderArgs",
                "name": "parentOrderArgs",
                "type": "tuple"
            },
            {
                "internalType": "uint256",
                "name": "workflowDeposit",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "resultInfo",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedRequirements_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "encryptedArgs_DEPRECATED",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OrderStatus",
                        "name": "status",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "externalId",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "uint256",
                        "name": "expectedPrice",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "maxPriceSlippage",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderInfo[]",
                "name": "subOrdersInfos",
                "type": "tuple[]"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "slotId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint32",
                        "name": "slotCount",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint256[]",
                        "name": "optionsIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint32[]",
                        "name": "optionsCount",
                        "type": "uint32[]"
                    }
                ],
                "internalType": "struct OrderSlots[]",
                "name": "subOrdersSlots",
                "type": "tuple[]"
            },
            {
                "components": [
                    {
                        "internalType": "uint256[]",
                        "name": "inputOffersIds",
                        "type": "uint256[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "outputOfferId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64[]",
                        "name": "inputOffersVersions",
                        "type": "uint64[]"
                    },
                    {
                        "internalType": "uint64",
                        "name": "outputOfferVersion",
                        "type": "uint64"
                    }
                ],
                "internalType": "struct OrderArgs[]",
                "name": "subOrdersArgs",
                "type": "tuple[]"
            }
        ],
        "name": "createWorkflow",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "deployer",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "deploymentBlockNumber",
        "outputs": [
            {
                "internalType": "uint64",
                "name": "",
                "type": "uint64"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "facetAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "enum IDiamondCut.FacetCutAction",
                        "name": "action",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes4[]",
                        "name": "functionSelectors",
                        "type": "bytes4[]"
                    }
                ],
                "indexed": false,
                "internalType": "struct IDiamondCut.FacetCut[]",
                "name": "_diamondCut",
                "type": "tuple[]"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "_init",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "_calldata",
                "type": "bytes"
            }
        ],
        "name": "DiamondCut",
        "type": "event"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "facetAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "enum IDiamondCut.FacetCutAction",
                        "name": "action",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes4[]",
                        "name": "functionSelectors",
                        "type": "bytes4[]"
                    }
                ],
                "internalType": "struct IDiamondCut.FacetCut[]",
                "name": "_diamondCut",
                "type": "tuple[]"
            },
            {
                "internalType": "bytes32",
                "name": "version",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "_init",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "_calldata",
                "type": "bytes"
            }
        ],
        "name": "diamondCut",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes4",
                "name": "_functionSelector",
                "type": "bytes4"
            }
        ],
        "name": "facetAddress",
        "outputs": [
            {
                "internalType": "address",
                "name": "facetAddress_",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "facetAddresses",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_facet",
                "type": "address"
            }
        ],
        "name": "facetFunctionSelectors",
        "outputs": [
            {
                "internalType": "bytes4[]",
                "name": "",
                "type": "bytes4[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "facets",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "address",
                        "name": "facetAddress",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes4[]",
                        "name": "functionSelectors",
                        "type": "bytes4[]"
                    }
                ],
                "internalType": "struct IDiamondLoupe.Facet[]",
                "name": "facets_",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getVersion",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getVersionHistory",
        "outputs": [
            {
                "internalType": "bytes32[]",
                "name": "",
                "type": "bytes32[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes4",
                "name": "_interfaceId",
                "type": "bytes4"
            }
        ],
        "name": "supportsInterface",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "owner_",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "init",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "teeOfferIssuerId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "kty",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "crv",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "pointX",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "pointY",
                        "type": "bytes32"
                    }
                ],
                "indexed": false,
                "internalType": "struct PublicKey",
                "name": "secretPublicKey",
                "type": "tuple"
            }
        ],
        "name": "LoaderSecretPublicKeySessionUpdated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            }
        ],
        "name": "getLoaderSecretPublicKey",
        "outputs": [
            {
                "components": [
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "kty",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "crv",
                                "type": "string"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "pointX",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "pointY",
                                "type": "bytes32"
                            }
                        ],
                        "internalType": "struct PublicKey",
                        "name": "secretPublicKey",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "der",
                                "type": "string"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "r",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "s",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "uint8",
                                "name": "v",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct Signature",
                        "name": "signature",
                        "type": "tuple"
                    },
                    {
                        "internalType": "uint32",
                        "name": "signedTime",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    }
                ],
                "internalType": "struct LoaderSecretPublicKey",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "der",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "r",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "s",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "uint8",
                        "name": "v",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct Signature",
                "name": "signature",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "kty",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "crv",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "pointX",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "pointY",
                        "type": "bytes32"
                    }
                ],
                "internalType": "struct PublicKey",
                "name": "secretPublicKey",
                "type": "tuple"
            },
            {
                "internalType": "uint32",
                "name": "signedTime",
                "type": "uint32"
            }
        ],
        "name": "setLoaderSecretPublicKey",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "teeOfferIssuerId",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "kty",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "crv",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "pointX",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "pointY",
                        "type": "bytes32"
                    }
                ],
                "indexed": false,
                "internalType": "struct PublicKey",
                "name": "publicSessionsKey",
                "type": "tuple"
            }
        ],
        "name": "LoaderSessionKeyUpdated",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "getDisabledLoaders",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getEnabledLoaders",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            }
        ],
        "name": "getLoaderSession",
        "outputs": [
            {
                "components": [
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "kty",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "crv",
                                "type": "string"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "pointX",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "pointY",
                                "type": "bytes32"
                            }
                        ],
                        "internalType": "struct PublicKey",
                        "name": "sessionPublicKey",
                        "type": "tuple"
                    },
                    {
                        "internalType": "string",
                        "name": "signature",
                        "type": "string"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "signedTime",
                        "type": "uint32"
                    }
                ],
                "internalType": "struct LoaderSession",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferId",
                "type": "uint256"
            }
        ],
        "name": "removeLoaderKeys",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "kty",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "crv",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "pointX",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "pointY",
                        "type": "bytes32"
                    }
                ],
                "internalType": "struct PublicKey",
                "name": "sessionPublicKey",
                "type": "tuple"
            },
            {
                "internalType": "string",
                "name": "signature",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "teeOfferIssuerId",
                "type": "uint256"
            },
            {
                "internalType": "uint32",
                "name": "signedTime",
                "type": "uint32"
            }
        ],
        "name": "setLoaderSession",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "secretKeeperId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "secretRequestorId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    }
                ],
                "internalType": "struct SecretRequest",
                "name": "request",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "kty",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "crv",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "pointX",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "pointY",
                        "type": "bytes32"
                    }
                ],
                "internalType": "struct PublicKey",
                "name": "sessionPublicKey",
                "type": "tuple"
            },
            {
                "internalType": "string",
                "name": "signature",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "teeOfferIssuerId",
                "type": "uint256"
            },
            {
                "internalType": "uint32",
                "name": "signedTime",
                "type": "uint32"
            }
        ],
        "name": "setLoaderSessionAndRequestSecret",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "offerVersion",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "teeOfferKeeperId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "teeOfferIssuerId",
                "type": "uint256"
            }
        ],
        "name": "OfferResourceCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "requestOfferId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "requestOfferVersion",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "OrderResourceCreated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferKeeperId",
                "type": "uint256"
            }
        ],
        "name": "clearOfferResources",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "requestOfferId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "requestOfferVersion",
                "type": "uint64"
            },
            {
                "internalType": "string",
                "name": "resultInfo",
                "type": "string"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "der",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "r",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "s",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "uint8",
                        "name": "v",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct Signature",
                "name": "resultInfoSignatureBySecretKey",
                "type": "tuple"
            },
            {
                "internalType": "uint32",
                "name": "signedTime",
                "type": "uint32"
            }
        ],
        "name": "createResourceOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferIssuerId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "teeOfferKeeperId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "offerVersion",
                "type": "uint64"
            }
        ],
        "name": "getOfferResource",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferIssuerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferKeeperId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageOrderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "signedTime",
                        "type": "uint32"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "der",
                                "type": "string"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "r",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "s",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "uint8",
                                "name": "v",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct Signature",
                        "name": "signature",
                        "type": "tuple"
                    },
                    {
                        "internalType": "string",
                        "name": "signedEncryptedData",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OfferType",
                        "name": "offerType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "solutionHash",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "previousDataCopied",
                        "type": "bool"
                    }
                ],
                "internalType": "struct OfferResource",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferIssuerId",
                "type": "uint256"
            }
        ],
        "name": "getOfferResourcesByIssuerId",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferIssuerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferKeeperId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageOrderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "signedTime",
                        "type": "uint32"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "der",
                                "type": "string"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "r",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "s",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "uint8",
                                "name": "v",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct Signature",
                        "name": "signature",
                        "type": "tuple"
                    },
                    {
                        "internalType": "string",
                        "name": "signedEncryptedData",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OfferType",
                        "name": "offerType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "solutionHash",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "previousDataCopied",
                        "type": "bool"
                    }
                ],
                "internalType": "struct OfferResource[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeKeeperId",
                "type": "uint256"
            }
        ],
        "name": "getOfferResourcesByKeeperId",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferIssuerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferKeeperId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageOrderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "signedTime",
                        "type": "uint32"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "der",
                                "type": "string"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "r",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "s",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "uint8",
                                "name": "v",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct Signature",
                        "name": "signature",
                        "type": "tuple"
                    },
                    {
                        "internalType": "string",
                        "name": "signedEncryptedData",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OfferType",
                        "name": "offerType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "solutionHash",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "previousDataCopied",
                        "type": "bool"
                    }
                ],
                "internalType": "struct OfferResource[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "version",
                "type": "uint64"
            }
        ],
        "name": "getOfferResourcesByOfferVersion",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferIssuerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferKeeperId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageOrderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "signedTime",
                        "type": "uint32"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "der",
                                "type": "string"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "r",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "s",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "uint8",
                                "name": "v",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct Signature",
                        "name": "signature",
                        "type": "tuple"
                    },
                    {
                        "internalType": "string",
                        "name": "signedEncryptedData",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OfferType",
                        "name": "offerType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "solutionHash",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "previousDataCopied",
                        "type": "bool"
                    }
                ],
                "internalType": "struct OfferResource[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeKeeperId",
                "type": "uint256"
            }
        ],
        "name": "getOfferResourcesCountByKeeperId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint32",
                "name": "offerVersion",
                "type": "uint32"
            }
        ],
        "name": "getReplicationFactorFulfilled",
        "outputs": [
            {
                "internalType": "uint32",
                "name": "",
                "type": "uint32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferIssuerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferKeeperId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageOrderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "signedTime",
                        "type": "uint32"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "der",
                                "type": "string"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "r",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "s",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "uint8",
                                "name": "v",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct Signature",
                        "name": "signature",
                        "type": "tuple"
                    },
                    {
                        "internalType": "string",
                        "name": "signedEncryptedData",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OfferType",
                        "name": "offerType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "solutionHash",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "previousDataCopied",
                        "type": "bool"
                    }
                ],
                "internalType": "struct OfferResource",
                "name": "resource",
                "type": "tuple"
            },
            {
                "internalType": "uint32",
                "name": "n",
                "type": "uint32"
            }
        ],
        "name": "incrementReplicationFactor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferIssuerId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "teeOfferKeeperId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "offerVersion",
                "type": "uint64"
            }
        ],
        "name": "removeOfferResource",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferIssuerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferKeeperId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageOrderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "signedTime",
                        "type": "uint32"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "der",
                                "type": "string"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "r",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "s",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "uint8",
                                "name": "v",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct Signature",
                        "name": "signature",
                        "type": "tuple"
                    },
                    {
                        "internalType": "string",
                        "name": "signedEncryptedData",
                        "type": "string"
                    },
                    {
                        "internalType": "enum OfferType",
                        "name": "offerType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "solutionHash",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "previousDataCopied",
                        "type": "bool"
                    }
                ],
                "internalType": "struct OfferResource",
                "name": "resource",
                "type": "tuple"
            }
        ],
        "name": "setOfferResource",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint32",
                "name": "offerVersion",
                "type": "uint32"
            }
        ],
        "name": "getStorageOrdersAllocated",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "teeOfferIssuerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageOrderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint32",
                        "name": "distributionReplicationFactor",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct OfferStorageAllocated",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferIssurId",
                "type": "uint256"
            }
        ],
        "name": "getStorageOrdersAllocatedByIssuer",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "teeOfferIssuerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageOrderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint32",
                        "name": "distributionReplicationFactor",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct OfferStorageAllocated[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint64",
                "name": "offerVersion",
                "type": "uint64"
            }
        ],
        "name": "OfferStorageRequestCanceled",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint64",
                "name": "offerVersion",
                "type": "uint64"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "teeOfferIssuerId",
                "type": "uint256"
            }
        ],
        "name": "OfferStorageRequestCreated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "version",
                "type": "uint64"
            }
        ],
        "name": "cancelOfferStorageRequest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferIssuerId",
                "type": "uint256"
            }
        ],
        "name": "getOfferStorageRequestsCountByIssuerId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferIssuerId",
                "type": "uint256"
            }
        ],
        "name": "getOffersStorageRequestsByIssuerId",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferIssuerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageOfferId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageSlotId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "deposit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "orderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "replicationFactor",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    },
                    {
                        "internalType": "bool",
                        "name": "copyPreviousData",
                        "type": "bool"
                    }
                ],
                "internalType": "struct OfferStorageRequest[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "internalType": "uint64",
                "name": "version",
                "type": "uint64"
            }
        ],
        "name": "getOffersStorageRequestsByOfferVersion",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferIssuerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageOfferId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageSlotId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "deposit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "orderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "replicationFactor",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    },
                    {
                        "internalType": "bool",
                        "name": "copyPreviousData",
                        "type": "bool"
                    }
                ],
                "internalType": "struct OfferStorageRequest",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "teeOfferIssuerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageOfferId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "storageSlotId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "deposit",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "orderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "replicationFactor",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    },
                    {
                        "internalType": "bool",
                        "name": "copyPreviousData",
                        "type": "bool"
                    }
                ],
                "internalType": "struct OfferStorageRequest",
                "name": "request",
                "type": "tuple"
            }
        ],
        "name": "setOffersStorageRequest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "secretRequestorId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "secretKeeperId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "offerId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint64",
                "name": "offerVersion",
                "type": "uint64"
            }
        ],
        "name": "SecretRequestCreated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "secretKeeperId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "secretRequestorId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    }
                ],
                "internalType": "struct SecretRequest",
                "name": "request",
                "type": "tuple"
            }
        ],
        "name": "cancelSecretRequest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferKeeperId",
                "type": "uint256"
            }
        ],
        "name": "clearSecretRequests",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferKeeperId",
                "type": "uint256"
            }
        ],
        "name": "getSecretRequestsByKeeperId",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "secretKeeperId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "secretRequestorId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    }
                ],
                "internalType": "struct SecretRequest[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferRequestorId",
                "type": "uint256"
            }
        ],
        "name": "getSecretRequestsByRequestorId",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "secretKeeperId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "secretRequestorId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    }
                ],
                "internalType": "struct SecretRequest[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferKeeperId",
                "type": "uint256"
            }
        ],
        "name": "getSecretRequestsCountByKeeperId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "teeOfferRequestorId",
                "type": "uint256"
            }
        ],
        "name": "getSecretRequestsCountByRequestorId",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "secretKeeperId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "secretRequestorId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    }
                ],
                "internalType": "struct SecretRequest",
                "name": "request",
                "type": "tuple"
            }
        ],
        "name": "setSecretRequest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "secretKeeperId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "secretRequestorId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "offerId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint64",
                        "name": "offerVersion",
                        "type": "uint64"
                    },
                    {
                        "internalType": "uint32",
                        "name": "timestamp",
                        "type": "uint32"
                    }
                ],
                "internalType": "struct SecretRequest",
                "name": "request",
                "type": "tuple"
            }
        ],
        "name": "setSecretRequestByApp",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "updateLastBlocks",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "tcbId",
                "type": "uint256"
            }
        ],
        "name": "updateSuspicious",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "orderId",
                "type": "uint256"
            }
        ],
        "name": "withdrawChangeByApp",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "providerAuth",
                "type": "address"
            }
        ],
        "name": "confiscateSecurityDeposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "item",
                "type": "uint256"
            }
        ],
        "name": "add",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "clear",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAll",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "item",
                "type": "uint256"
            }
        ],
        "name": "getItemIndex",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "isEmpty",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "item",
                "type": "uint256"
            }
        ],
        "name": "isExists",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "item",
                "type": "uint256"
            }
        ],
        "name": "remove",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const; export default abi;