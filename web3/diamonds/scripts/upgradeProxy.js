/* global ethers */
/* eslint prefer-const: "off" */

const { ethers, upgrades } = require('hardhat')

async function upgradeProxy () {
  let [contractOwner] = await ethers.getSigners()
  console.log('Contract Owner: ', contractOwner.address)
  // console.log('ethers', ethers);
  let proxyAddress = "0x42D6b6555C3Bb4210fFa90e06a50C4d2FC5bE8d0";

  // deploy MowseAvatar
  const mowseAvatarDeploy = await ethers.getContractFactory('TestMowseAvatarv2')
  mowseAvatar = await upgrades.upgradeProxy(proxyAddress, mowseAvatarDeploy);
  await mowseAvatar.deployed()
  console.log('MowseAvatar proxy deployed', mowseAvatar.address)
  let implementationAddress = await upgrades.erc1967.getImplementationAddress(mowseAvatar.address);
  console.log('Implementation address ', implementationAddress)
  return mowseAvatar.address
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  upgradeProxy()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
  
}

exports.upgradeProxy = upgradeProxy
