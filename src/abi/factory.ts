export const factoryAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "quoteAdmin_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "quoteSigner_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "EmptyContractURI",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyName",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptySymbol",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidPhase3Config",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidQuoteAdmin",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidQuoteCreator",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidQuoteSalt",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidQuoteSignature",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidQuoteSigner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidQuotedFrame",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidShortString",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OnlyConfigAdmin",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OnlyQuoteAdmin",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Phase3AlreadyConfigured",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "predicted",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "created",
        "type": "address"
      }
    ],
    "name": "PredictionMismatch",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "QuoteExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "str",
        "type": "string"
      }
    ],
    "name": "StringTooLong",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "EIP712DomainChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "poolId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "profileHash",
        "type": "bytes32"
      }
    ],
    "name": "Launch",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "int24",
        "name": "quotedFrame",
        "type": "int24"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "validUntil",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "quoteDigest",
        "type": "bytes32"
      }
    ],
    "name": "LaunchQuoteUsed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "poolManager",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "hook",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "vvv",
        "type": "address"
      }
    ],
    "name": "Phase3Configured",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousSigner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newSigner",
        "type": "address"
      }
    ],
    "name": "QuoteSignerUpdated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "HOOK_FEE_BPS",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "LAUNCH_QUOTE_TYPEHASH",
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
    "name": "MAX_QUOTED_FRAME",
    "outputs": [
      {
        "internalType": "int24",
        "name": "",
        "type": "int24"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_QUOTED_FRAME",
    "outputs": [
      {
        "internalType": "int24",
        "name": "",
        "type": "int24"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "STUB_POOL_ID",
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
    "name": "TICK_SPACING",
    "outputs": [
      {
        "internalType": "int24",
        "name": "",
        "type": "int24"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TOKEN_DECIMALS",
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
    "inputs": [],
    "name": "TOKEN_SUPPLY",
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
    "name": "VVV",
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
    "name": "b20Factory",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "configAdmin",
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
        "internalType": "contract IPoolManager",
        "name": "manager",
        "type": "address"
      },
      {
        "internalType": "contract ILiqpadLaunchHook",
        "name": "hook",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "vvv",
        "type": "address"
      },
      {
        "internalType": "contract IFeeRouterBinding",
        "name": "router",
        "type": "address"
      },
      {
        "internalType": "contract ILiqpadLiquidityLocker",
        "name": "locker",
        "type": "address"
      }
    ],
    "name": "configurePhase3",
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
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "symbol",
            "type": "string"
          },
          {
            "internalType": "bytes32",
            "name": "salt",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "contractURI",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "logoURI",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "website",
            "type": "string"
          },
          {
            "components": [
              {
                "internalType": "string",
                "name": "twitter",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "telegram",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "farcaster",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "discord",
                "type": "string"
              }
            ],
            "internalType": "struct LiqpadFactory.Socials",
            "name": "socials",
            "type": "tuple"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          }
        ],
        "internalType": "struct LiqpadFactory.LaunchParams",
        "name": "params",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "int24",
            "name": "quotedFrame",
            "type": "int24"
          },
          {
            "internalType": "uint64",
            "name": "validUntil",
            "type": "uint64"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "launchSalt",
            "type": "bytes32"
          }
        ],
        "internalType": "struct LiqpadFactory.LaunchQuote",
        "name": "quote",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "createLaunch",
    "outputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      }
    ],
    "name": "creatorTokens",
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
    "name": "eip712Domain",
    "outputs": [
      {
        "internalType": "bytes1",
        "name": "fields",
        "type": "bytes1"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "version",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "chainId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "verifyingContract",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "salt",
        "type": "bytes32"
      },
      {
        "internalType": "uint256[]",
        "name": "extensions",
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
        "name": "token",
        "type": "address"
      }
    ],
    "name": "getProfile",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "symbol",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "contractURI",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "logoURI",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "website",
            "type": "string"
          },
          {
            "components": [
              {
                "internalType": "string",
                "name": "twitter",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "telegram",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "farcaster",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "discord",
                "type": "string"
              }
            ],
            "internalType": "struct LiqpadFactory.Socials",
            "name": "socials",
            "type": "tuple"
          },
          {
            "internalType": "bytes32",
            "name": "poolId",
            "type": "bytes32"
          },
          {
            "internalType": "uint64",
            "name": "launchedAt",
            "type": "uint64"
          }
        ],
        "internalType": "struct LiqpadFactory.Profile",
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
            "internalType": "int24",
            "name": "quotedFrame",
            "type": "int24"
          },
          {
            "internalType": "uint64",
            "name": "validUntil",
            "type": "uint64"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "launchSalt",
            "type": "bytes32"
          }
        ],
        "internalType": "struct LiqpadFactory.LaunchQuote",
        "name": "quote",
        "type": "tuple"
      }
    ],
    "name": "hashLaunchQuote",
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
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "isLiqpadLaunch",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isLaunch",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "launchHook",
    "outputs": [
      {
        "internalType": "contract ILiqpadLaunchHook",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "liquidityLocker",
    "outputs": [
      {
        "internalType": "contract ILiqpadLiquidityLocker",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "poolManager",
    "outputs": [
      {
        "internalType": "contract IPoolManager",
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
        "internalType": "bytes32",
        "name": "salt",
        "type": "bytes32"
      }
    ],
    "name": "predictAddress",
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
        "name": "token",
        "type": "address"
      }
    ],
    "name": "profileHash",
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
    "name": "quoteAdmin",
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
    "name": "quoteSigner",
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
        "name": "newSigner",
        "type": "address"
      }
    ],
    "name": "setQuoteSigner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "int24",
        "name": "frame",
        "type": "int24"
      }
    ],
    "name": "ticksFor",
    "outputs": [
      {
        "internalType": "int24",
        "name": "poolTick",
        "type": "int24"
      },
      {
        "internalType": "int24",
        "name": "tickLower",
        "type": "int24"
      },
      {
        "internalType": "int24",
        "name": "tickUpper",
        "type": "int24"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
