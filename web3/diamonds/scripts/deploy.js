/* global ethers */
/* eslint prefer-const: "off" */
require('dotenv').config();

const { ethers, upgrades } = require('hardhat')
const { getSelectors, FacetCutAction, remove } = require('./libraries/diamond.js')
const { postDeploy } = require('./postDeploy.js')
const { postDeployMintMowseAvatar } = require('./postDeployMintMowseAvatar.js')
// DEV: change to postDeploy
const { postDeployTestAttributes } = require('./postDeployTestAttributes.js')

async function deployDiamond () {
  let [contractOwner] = await ethers.getSigners()
  console.log('Contract Owner: ', contractOwner.address)
  let teamAddress = "0xce1DB19c21da28B70FB663EC0c49C8C8e69a16DA";
  let backendAddress = '0xEc84B1EF0669f088A038060b2E7a976a19572bD1';  // MowseGameBackend
  let treasuryAddress = '0x2C3590F0f6baf2bF06dDC694e00D068E6648910E';  // MowseGameTreasury
  // let backendAddress = '0xae2d4fa7594bd052636664a56c70a63e37959657';  // DEV: testnet
  // let backendAddress = '0x734eb6d3ad9c30769bc58d87ffa9f22fcac61f6e';  // mainnet

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
  const diamondCutFacet = await DiamondCutFacet.deploy()
  await diamondCutFacet.deployed()
  console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

  // deploy Diamond
  const Diamond = await ethers.getContractFactory('Diamond')
  const diamond = await Diamond.deploy(contractOwner.address, diamondCutFacet.address)
  await diamond.deployed()
  console.log('Diamond deployed:', diamond.address)
  console.log('Diamond owner: ', contractOwner.address)

  // const randomnessDeploy = await ethers.getContractFactory('Randomness');
  // const randomness = await randomnessDeploy.deploy();
  // await randomness.deployed();
  // console.log('Randomness deployed: ', randomness.address);

  // DEV: use mowsepackAddress
  console.log('Attempt deploy MowsePack contract');
  const MowsePackDeploy = await ethers.getContractFactory('MowsePack')
  console.log('deploy mowsepack proxy');
  let mowsepacktime = Math.floor(Date.now()/1000) - 1;
  console.log('mowsepacktime', mowsepacktime);
  mowsepack = await MowsePackDeploy.deploy(
    "https://nftdata.mypinata.cloud/ipfs/QmccFaV2PaCxNLsgTBurd2mR8e3jBoiC7hr2YKbxaB8ZpJ/",
    ".json",
    10000,
    mowsepacktime,
    100,
    [contractOwner.address,teamAddress],
    [5000,5000]
  );
  await mowsepack.deployed()
  console.log('MowsePack contract deployed', mowsepack.address);
  let unpauseTxn = await mowsepack.unpause()
  await unpauseTxn.wait();
  console.log('unpaused mowsepack contract');
  // let mowsepackAddress = '0x0b896c9c8d12d0d4cd39d716b84cdde22ad2c3ea';  // mainnet
  // let mowsepackAddress = '0x5DBe53bA3C9DB9a7d6017e45A45B4011E347c47B';  // testnet
  // const mowsepack = await ethers.getContractAt('MowsePack', mowsepackAddress, contractOwner);

  const setableCountersDeploy = await ethers.getContractFactory('SetableCounters');
  const setableCounters = await setableCountersDeploy.deploy();
  await setableCounters.deployed();
  console.log('Setable Counters deployed', setableCounters.address)

  // deploy MowseAvatar
  const mowseAvatarDeploy = await ethers.getContractFactory('MowseAvatar')
  // DEV: use mowsepackAddress
  mowseAvatar = await upgrades.deployProxy(mowseAvatarDeploy, [diamond.address, mowsepack.address, teamAddress, backendAddress, treasuryAddress],
    {
      kind: 'uups',
      initializer: 'initialize'
    })
  await mowseAvatar.deployed()
  console.log('MowseAvatar proxy deployed', mowseAvatar.address)
  let implementationAddress = await upgrades.erc1967.getImplementationAddress(mowseAvatar.address);
  console.log('Implementation address ', await upgrades.erc1967.getImplementationAddress(mowseAvatar.address))
  // deploy MowseGold after facets deployed to add mowseFacet to mowseGold minter role
  const mowseGoldDeploy = await ethers.getContractFactory('MowseGold')
  mowseGold = await upgrades.deployProxy(mowseGoldDeploy, [diamond.address, teamAddress, backendAddress, treasuryAddress],
    {
      kind: 'uups',
      initializer: 'initialize'
    })
  await mowseGold.deployed()
  console.log('MowseGold deployed', mowseGold.address)
  implementationAddress = await upgrades.erc1967.getImplementationAddress(mowseGold.address);
  console.log('Implementation address ', implementationAddress)
  
  // deploy DiamondInit 
  // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
  // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
  const DiamondInit = await ethers.getContractFactory('DiamondInit')
  const diamondInit = await DiamondInit.deploy()
  await diamondInit.deployed()
  console.log('DiamondInit deployed:', diamondInit.address)

  // deploy facets
  console.log('')
  console.log('Deploying facets')
  const FacetNames = [
    'DiamondLoupeFacet',
    'OwnershipFacet',
    'MowseFacet',
    'MowseWearFacet',
    'MowseVisualizerFacet',
    'AccessControlFacet',
    'GameStorageFacet',
    'MowseLootboxFacet',
    'MowseGamesFacet',
  ]
  const FacetsToIgnore = [
    'MowseWearFacet',
  ]
  const cut = []
  for (const FacetName of FacetNames) {
    let Facet;
    // if (FacetName == 'MowseWearFacet') {
    //   Facet = await ethers.getContractFactory(FacetName, {
    //     libraries: {
    //       Randomness: randomness.address
    //     }
    //   })
    // } else {
      Facet = await ethers.getContractFactory(FacetName);
    // }
    const facet = await Facet.deploy()
    await facet.deployed()
    console.log(`${FacetName} deployed: ${facet.address}`)
    let functionSelectors = getSelectors(facet)
    if (FacetsToIgnore.includes(FacetName)) {
      functionSelectors = functionSelectors.remove(['supportsInterface(bytes4)'])
    }
    // console.log('Function selectors:', functionSelectors)
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: functionSelectors
    })
  }
  const mowseWearFacet = await ethers.getContractAt('MowseWearFacet', diamond.address);
  const mowseFacet = await ethers.getContractAt('MowseFacet', diamond.address);
  const mowseLootboxFacet = await ethers.getContractAt('MowseLootboxFacet', diamond.address)
  const mowseGamesFacet = await ethers.getContractAt('MowseGamesFacet', diamond.address);
  const gameStorageFacet = await ethers.getContractAt('GameStorageFacet', diamond.address);

  // upgrade diamond with facets
  console.log('')
  // console.log('Diamond Cut:', cut)
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
  let tx
  let receipt
  // call to init function
  let functionCall = diamondInit.interface.encodeFunctionData('init', [
    { 
      MOWSE_GOLD_CONTRACT: mowseGold.address,
      MOWSE_GOLD_ADDRESS: mowseGold.address,
      MOWSE_FACET_CONTRACT: mowseFacet.address,
      MOWSE_WEAR_FACET_CONTRACT: mowseWearFacet.address,
      MOWSE_AVATAR_CONTRACT: mowseAvatar.address,
      MOWSE_LOOTBOX_FACET_CONTRACT: mowseLootboxFacet.address,
      GAME_STORAGE_FACET_CONTRACT: gameStorageFacet.address,
      BACKEND_ADDRESS: backendAddress,
      TREASURY_ADDRESS: treasuryAddress
    }
  ])

  tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
  console.log('Diamond cut tx: ', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')

  // Post deploy IMPORTANT
  // MowseGold
  console.log('grant mowseFacet minter role')
  let mowseGoldTxn = await mowseGold.grantMinterRole(mowseFacet.address);
  await mowseGoldTxn.wait();
  mowseGoldTxn = await mowseGold.grantMinterRole(mowseGamesFacet.address);
  await mowseGoldTxn.wait();
  mowseGoldTxn = await mowseGold.grantMinterRole(gameStorageFacet.address);
  await mowseGoldTxn.wait();

  // DEV: comment out
  // Add initial MowseWearDictionary
  // console.log('postDeploy')
  await postDeployTestAttributes(diamond.address);
  
  // Mint MowseAvatars for existing MowsePack
  // console.log('Mint MowseAvatars for existing MowsePack');
  // await postDeployMintMowseAvatar(mowsepack.address, mowseAvatar.address);

  return {
    diamond: diamond.address, 
    mowsepack: mowsepack,
    mowseAvatar: mowseAvatar,
    mowseGold: mowseGold,
    treasuryAddress: treasuryAddress
  }
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
  
}

exports.deployDiamond = deployDiamond
