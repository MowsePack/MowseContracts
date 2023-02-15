require('dotenv').config();

/* global ethers task */
require('@nomicfoundation/hardhat-chai-matchers');
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-ethers');
// require('@nomiclabs/hardhat-waffle')
require('hardhat-deploy');
require('hardhat-deploy-ethers');
require('hardhat-contract-sizer')
require('@openzeppelin/hardhat-upgrades')
require('hardhat-gas-reporter');
require('solidity-coverage');
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: 'hardhat',
  solidity: {
    compilers: [
      { 
        version: '0.8.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      { version: '0.8.9',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      { 
        version: '0.8.0',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      { 
        version: '0.7.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    hardhat: {
      chainId: 1337,
      // gasPrice: 100000000000,
      // gas: 2100000,
      gasMultiplier: 1.2
    },
    ftmtest: {
      url: process.env.FTM_TESTNET_URL,
      gasPrice: 'auto',
      gas: 'auto',
      gasMultiplier: 1.3,
      accounts: [process.env.MOWSEGAME_DEPLOYER_PRIVATE_KEY],
      timeout: 60000
    },
    opera: {
      url: process.env.FTM_MAINNET_URL,
      gasPrice: 'auto',
      gas: 'auto',
      gasMultiplier: 1.2,
      accounts: [process.env.MOWSEGAME_DEPLOYER_PRIVATE_KEY],
      timeout: 60000
    }
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  etherscan: {
    apiKey: process.env.FTMSCAN_API_KEY
  }
}
