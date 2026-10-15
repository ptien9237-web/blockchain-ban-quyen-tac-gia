// Auto-generated ABI and Contract Metadata for BookCopyrightRegistry
export const BookCopyrightRegistryAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "defaultAdmin",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AccessControlBadConfirmation",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "neededRole",
        "type": "bytes32"
      }
    ],
    "name": "AccessControlUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyReasonRequired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "contentHash",
        "type": "bytes32"
      }
    ],
    "name": "HashAlreadyRegistered",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "contentHash",
        "type": "bytes32"
      }
    ],
    "name": "HashNotRegistered",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidBookId",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidContentHash",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidRecordId",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "enum BookCopyrightRegistry.RecordStatus",
        "name": "currentStatus",
        "type": "uint8"
      },
      {
        "internalType": "enum BookCopyrightRegistry.RecordStatus",
        "name": "targetStatus",
        "type": "uint8"
      }
    ],
    "name": "InvalidStatusTransition",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidVersionNumber",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      }
    ],
    "name": "RecordAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      }
    ],
    "name": "RecordAlreadyRevoked",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      }
    ],
    "name": "RecordNotFound",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookId",
        "type": "bytes32"
      },
      {
        "internalType": "uint32",
        "name": "versionNumber",
        "type": "uint32"
      }
    ],
    "name": "VersionAlreadyRegistered",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "bookId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "uint32",
        "name": "versionNumber",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "contentHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "authorWallet",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "registrant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "registeredAt",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "metadataUri",
        "type": "string"
      }
    ],
    "name": "CopyrightRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "enum BookCopyrightRegistry.RecordStatus",
        "name": "previousStatus",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "enum BookCopyrightRegistry.RecordStatus",
        "name": "newStatus",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "updatedBy",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "timestamp",
        "type": "uint64"
      }
    ],
    "name": "CopyrightStatusUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "previousAdminRole",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "newAdminRole",
        "type": "bytes32"
      }
    ],
    "name": "RoleAdminChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
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
    "name": "REGISTRAR_ROLE",
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
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "disputeCopyright",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookId",
        "type": "bytes32"
      }
    ],
    "name": "getBookVersionCount",
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
        "internalType": "bytes32",
        "name": "bookId",
        "type": "bytes32"
      }
    ],
    "name": "getBookVersions",
    "outputs": [
      {
        "internalType": "uint32[]",
        "name": "",
        "type": "uint32[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      }
    ],
    "name": "getCopyright",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "recordId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "bookId",
            "type": "bytes32"
          },
          {
            "internalType": "uint32",
            "name": "versionNumber",
            "type": "uint32"
          },
          {
            "internalType": "bytes32",
            "name": "contentHash",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "authorWallet",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "registrant",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "registeredAt",
            "type": "uint64"
          },
          {
            "internalType": "enum BookCopyrightRegistry.RecordStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "metadataUri",
            "type": "string"
          }
        ],
        "internalType": "struct BookCopyrightRegistry.CopyrightRecord",
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
        "internalType": "bytes32",
        "name": "contentHash",
        "type": "bytes32"
      }
    ],
    "name": "getCopyrightByHash",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "recordId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "bookId",
            "type": "bytes32"
          },
          {
            "internalType": "uint32",
            "name": "versionNumber",
            "type": "uint32"
          },
          {
            "internalType": "bytes32",
            "name": "contentHash",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "authorWallet",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "registrant",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "registeredAt",
            "type": "uint64"
          },
          {
            "internalType": "enum BookCopyrightRegistry.RecordStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "metadataUri",
            "type": "string"
          }
        ],
        "internalType": "struct BookCopyrightRegistry.CopyrightRecord",
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
        "internalType": "bytes32",
        "name": "bookId",
        "type": "bytes32"
      },
      {
        "internalType": "uint32",
        "name": "versionNumber",
        "type": "uint32"
      }
    ],
    "name": "getRecordByBookVersion",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "recordId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "bookId",
            "type": "bytes32"
          },
          {
            "internalType": "uint32",
            "name": "versionNumber",
            "type": "uint32"
          },
          {
            "internalType": "bytes32",
            "name": "contentHash",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "authorWallet",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "registrant",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "registeredAt",
            "type": "uint64"
          },
          {
            "internalType": "enum BookCopyrightRegistry.RecordStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "metadataUri",
            "type": "string"
          }
        ],
        "internalType": "struct BookCopyrightRegistry.CopyrightRecord",
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
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      }
    ],
    "name": "getRoleAdmin",
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
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "hasRole",
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
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
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
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "bookId",
        "type": "bytes32"
      },
      {
        "internalType": "uint32",
        "name": "versionNumber",
        "type": "uint32"
      },
      {
        "internalType": "bytes32",
        "name": "contentHash",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "authorWallet",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "metadataUri",
        "type": "string"
      }
    ],
    "name": "registerCopyright",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "callerConfirmation",
        "type": "address"
      }
    ],
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      },
      {
        "internalType": "enum BookCopyrightRegistry.RecordStatus",
        "name": "newStatus",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "resolveDispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "revokeCopyright",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
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
    "inputs": [],
    "name": "totalRecords",
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
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "contentHash",
        "type": "bytes32"
      }
    ],
    "name": "verifyHash",
    "outputs": [
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      },
      {
        "internalType": "bytes32",
        "name": "recordId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "bookId",
        "type": "bytes32"
      },
      {
        "internalType": "uint32",
        "name": "versionNumber",
        "type": "uint32"
      },
      {
        "internalType": "address",
        "name": "authorWallet",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "registrant",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "registeredAt",
        "type": "uint64"
      },
      {
        "internalType": "enum BookCopyrightRegistry.RecordStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const BOOK_COPYRIGHT_REGISTRY_METADATA = {
  contractName: "BookCopyrightRegistry",
  sourceName: "contracts/BookCopyrightRegistry.sol",
  exportedAt: "2026-10-14T13:45:26.575Z",
} as const;
