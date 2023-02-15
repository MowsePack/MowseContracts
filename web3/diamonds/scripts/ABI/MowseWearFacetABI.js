module.exports = [
  {
    "inputs": [],
    "name": "AddressUtils__NotContract",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC165Base__InvalidInterfaceId",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC721Base__BalanceQueryZeroAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC721Base__ERC721ReceiverNotImplemented",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC721Base__InvalidOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC721Base__MintToZeroAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC721Base__NonExistentToken",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC721Base__NotOwnerOrApproved",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC721Base__NotTokenOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC721Base__SelfApproval",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC721Base__TokenAlreadyMinted",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC721Base__TransferToZeroAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC721Metadata__NonExistentToken",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EnumerableMap__IndexOutOfBounds",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EnumerableMap__NonExistentKey",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EnumerableSet__IndexOutOfBounds",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SolidStateERC721__PayableApproveNotSupported",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SolidStateERC721__PayableTransferNotSupported",
    "type": "error"
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
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
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
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "MowseWearMinted",
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
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "traitType",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "traitName",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "nonSwappable",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "nonTransferrable",
        "type": "bool"
      },
      {
        "internalType": "uint16",
        "name": "width",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "height",
        "type": "uint16"
      },
      {
        "internalType": "string",
        "name": "transform",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "style",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "image",
        "type": "string"
      },
      {
        "internalType": "uint16",
        "name": "weight",
        "type": "uint16"
      },
      {
        "internalType": "bool",
        "name": "ignoreFromLootPool",
        "type": "bool"
      }
    ],
    "name": "addMowseWearToDictionary",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "payable",
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
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint8",
            "name": "traitType",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "traitName",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "nonSwappable",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "nonTransferrable",
            "type": "bool"
          },
          {
            "internalType": "uint16",
            "name": "width",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "height",
            "type": "uint16"
          },
          {
            "internalType": "string",
            "name": "transform",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "style",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "image",
            "type": "string"
          },
          {
            "internalType": "uint16",
            "name": "weight",
            "type": "uint16"
          },
          {
            "internalType": "bool",
            "name": "ignoreFromLootPool",
            "type": "bool"
          }
        ],
        "internalType": "struct BulkMowseWear[]",
        "name": "bulkMowseWear",
        "type": "tuple[]"
      }
    ],
    "name": "bulkAddMowseWearToDictionary",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
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
        "internalType": "uint8",
        "name": "traitType",
        "type": "uint8"
      },
      {
        "internalType": "uint16",
        "name": "traitIndex",
        "type": "uint16"
      }
    ],
    "name": "getMowseWearNameFromDictionary",
    "outputs": [
      {
        "internalType": "string",
        "name": "traitName",
        "type": "string"
      }
    ],
    "stateMutability": "view",
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
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
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
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "mowseId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "traitType",
        "type": "uint8"
      },
      {
        "internalType": "uint16",
        "name": "traitIndex",
        "type": "uint16"
      },
      {
        "internalType": "bool",
        "name": "isBaseAttribute",
        "type": "bool"
      }
    ],
    "name": "mintAndWearMowseWear",
    "outputs": [],
    "stateMutability": "nonpayable",
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
        "internalType": "uint8",
        "name": "traitType",
        "type": "uint8"
      },
      {
        "internalType": "uint16",
        "name": "traitIndex",
        "type": "uint16"
      },
      {
        "internalType": "bool",
        "name": "isBaseAttribute",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "minRarity",
        "type": "uint8"
      }
    ],
    "name": "mintMowseWear",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "mowseWearTokenId",
        "type": "uint256"
      }
    ],
    "name": "mowseWearExists",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
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
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "payable",
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
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "status",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenByIndex",
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
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenOfOwnerByIndex",
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
        "name": "mowseWearTokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
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
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "traitType",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "traitName",
        "type": "string"
      },
      {
        "internalType": "uint16",
        "name": "traitIndex",
        "type": "uint16"
      },
      {
        "internalType": "bool",
        "name": "nonSwappable",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "nonTransferrable",
        "type": "bool"
      },
      {
        "internalType": "uint16",
        "name": "width",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "height",
        "type": "uint16"
      },
      {
        "internalType": "string",
        "name": "transform",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "style",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "image",
        "type": "string"
      },
      {
        "internalType": "uint16",
        "name": "weight",
        "type": "uint16"
      }
    ],
    "name": "updateMowseWearDictionary",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "mowseId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "mowseWearId",
        "type": "uint256"
      }
    ],
    "name": "wearMowseWear",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

exports.mowseWearFacetABI = mowseWearFacetABI
