/* global describe it before ethers */

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../scripts/libraries/diamond.js')

const { deployDiamond } = require('../scripts/deploy.js')

const { assert, expect } = require('chai')
const { ethers } = require('hardhat')
const { parseEther, formatEther, formatUnits, parseUnits } = require('@ethersproject/units')
const { BigNumber } = require('@ethersproject/bignumber')

describe('DiamondTest', async function () {
  let diamondAddress
  let treasuryAddress
  let diamondCutFacet
  let diamondLoupeFacet
  let ownershipFacet
  let accessControlFacet
  let mowseFacet
  let mowseWearFacet
  let mowseVisualizerFacet
  let gameStorageFacet
  let mowseGamesFacet
  let tx
  let receipt
  let result
  const addresses = []
  let mowsepack
  let mowseAvatar
  let diamondDeploy

  let owner
  let team
  let dev1
  let user1
  let user2

  before(async function () {
    [owner, team, dev1, user1, user2] = await ethers.getSigners()

    diamondDeploy = await deployDiamond()
    diamondAddress = diamondDeploy.diamond;
    mowsepack = diamondDeploy.mowsepack;
    mowseAvatar = diamondDeploy.mowseAvatar;
    mowseGold = diamondDeploy.mowseGold;
    treasuryAddress = diamondDeploy.treasuryAddress;

    console.log('Diamond Address: ', diamondAddress);
    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
    diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
    mowseFacet = await ethers.getContractAt('MowseFacet', diamondAddress)
    mowseWearFacet = await ethers.getContractAt('MowseWearFacet', diamondAddress)
    mowseVisualizerFacet = await ethers.getContractAt('MowseVisualizerFacet', diamondAddress)
    accessControlFacet = await ethers.getContractAt('AccessControlFacet', diamondAddress)
    gameStorageFacet = await ethers.getContractAt('GameStorageFacet', diamondAddress)
    mowseLootboxFacet = await ethers.getContractAt('MowseLootboxFacet', diamondAddress)
    mowseGamesFacet = await ethers.getContractAt('MowseGamesFacet', diamondAddress);
  })

  it('should have three facets -- call to facetAddresses function', async () => {
    for (const address of await diamondLoupeFacet.facetAddresses()) {
      addresses.push(address)
    }
    console.log('ADDRESSES =================================================== ', addresses.length)
    assert.equal(addresses.length, 10)
  })

  it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
    let selectors = getSelectors(diamondCutFacet)
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(diamondLoupeFacet)
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1])
    assert.sameMembers(result, selectors)
    selectors = getSelectors(ownershipFacet)
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2])
    assert.sameMembers(result, selectors)
    // selectors = getSelectors(mowseFacet)
    // result = await diamondLoupeFacet.facetFunctionSelectors(addresses[3])
    // assert.sameMembers(result, selectors)
    // selectors = getSelectors(mowseWearFacet)
    // result = await diamondLoupeFacet.facetFunctionSelectors(addresses[4])
    // assert.sameMembers(result, selectors)
    // selectors = getSelectors(mowseVisualizerFacet)
    // result = await diamondLoupeFacet.facetFunctionSelectors(addresses[5])
    // assert.sameMembers(result, selectors)
  })

  it('selectors should be associated to facets correctly -- multiple calls to facetAddress function', async () => {
    assert.equal(
      addresses[0],
      await diamondLoupeFacet.facetAddress('0x1f931c1c')
    )
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress('0xcdffacc6')
    )
    assert.equal(
      addresses[1],
      await diamondLoupeFacet.facetAddress('0x01ffc9a7')
    )
    assert.equal(
      addresses[2],
      await diamondLoupeFacet.facetAddress('0xf2fde38b')
    )
  })

  it('should test access control', async () => {
    // mowsepack = await ethers.getContract('MowsePack')
    console.log('check mowsepack contract', mowsepack.address)
    // mowseAvatar = await ethers.getContractAt('MowseAvatar')
    console.log('check mowseAvatar contract', mowseAvatar.address)
    console.log('Owner ', owner.address)
    console.log('User1 ', user1.address)
    console.log('User2 ', user2.address)
    let hasRole = await accessControlFacet.hasMowseWearMinterRole(owner.address);
    console.log('Owner has minter role: ', hasRole);
    hasRole = await accessControlFacet.hasMowseWearMinterRole(user1.address);
    console.log('user1 has minter role: ', hasRole);
    hasRole = await accessControlFacet.hasMowseWearMinterRole(user2.address);
    console.log('user2 has minter role: ', hasRole);
    hasRole = await accessControlFacet.hasMowseWearMinterRole(mowseAvatar.address);
    console.log('MowseAvatar has minter role: ', hasRole);
    await expect(accessControlFacet.connect(user1).addAccountToAdminRole(user1.address)).to.be.reverted;
    await expect(accessControlFacet.addAccountToMowseAdminRole(owner.address)).to.not.be.reverted;
    await expect(accessControlFacet.addAccountToAdminRole(owner.address)).to.not.be.reverted;
    await expect(accessControlFacet.addAccountToMowseMinterRole(owner.address)).to.not.be.reverted;
    await expect(accessControlFacet.addAccountToMowseWearAdminRole(owner.address)).to.not.be.reverted;
    await expect(accessControlFacet.addAccountToMowseGameAdminRole(owner.address)).to.not.be.reverted;
    await expect(await accessControlFacet.hasAdminRole(owner.address)).to.equal(true);

  })
  it('should test bulk add mowse wear', async () => {
    await mowseWearFacet.bulkAddMowseWearToDictionary([
      { traitType: 0, traitName: "bob", nonSwappable: false, nonTransferrable: false, width: 0, height: 0, transform: "", style: "", image: "", weight: 0, ignoreFromLootPool: false },
      { traitType: 0, traitName: "bad", nonSwappable: false, nonTransferrable: false, width: 0, height: 0, transform: "", style: "", image: "", weight: 0, ignoreFromLootPool: false }
    ]);
    let name = await mowseWearFacet.getMowseWearNameFromDictionary(0,2);
    console.log('name should be bob', name)
    name = await mowseWearFacet.getMowseWearNameFromDictionary(0,3);
    console.log('name should be bad', name)
  })
  it('should test mowsegold functions', async () => {
    console.log('mowseGold contract', mowseGold.address)
    console.log('owner mgold balance', await mowseGold.balanceOf(owner.address))
    console.log('user1 mgold balance', await mowseGold.balanceOf(user1.address))
    console.log('user2 mgold balance', await mowseGold.balanceOf(user2.address))
    await expect(mowseGold.mint(owner.address, parseEther('10'))).to.not.be.reverted
    console.log('owner mgold balance', await mowseGold.balanceOf(owner.address))
    await expect(mowseGold.connect(user1).mint(user1.address, parseEther('10'))).to.be.reverted;
    console.log('user1 mgold balance', await mowseGold.balanceOf(user1.address))
    await expect(mowseGold.connect(user1).grantMinterRole(user1.address)).to.be.reverted
    await expect(mowseGold.grantMinterRole(user1.address)).to.not.be.reverted
    await expect(mowseGold.connect(user1).mint(user1.address, parseEther('11'))).to.not.be.reverted;
    console.log('user1 mgold balance1', await mowseGold.balanceOf(user1.address))
    await expect(mowseGold.connect(user1).revokeMinterRole(user1.address)).to.be.reverted
    await expect(mowseGold.revokeMinterRole(user1.address)).to.not.be.reverted
    await expect(mowseGold.connect(user1).mint(user1.address, parseEther('12'))).to.be.reverted
    console.log('user1 mgold balance', await mowseGold.balanceOf(user1.address))
    console.log('user1 ether balance2', await user1.getBalance());
    await expect(mowseGold.connect(user1).setMowseGoldMintPrice(parseEther('100'))).to.be.reverted;
    console.log('user1 mgold balance', await mowseGold.balanceOf(user1.address))
    console.log('user1 ether balance3', await user1.getBalance());
    console.log('mowse gold mint price', await mowseGold.MOWSE_GOLD_MINT_PRICE());
    let mowseGoldMintPrice = await mowseGold.MOWSE_GOLD_MINT_PRICE();
    await expect(mowseGold.connect(user1).purchaseMowseGold({ value: parseEther('6') })).to.be.reverted;
    await expect(mowseGold.connect(user1).purchaseMowseGold({ value: mowseGoldMintPrice })).to.not.be.reverted;
    console.log('user1 mgold balance', await mowseGold.balanceOf(user1.address))
    console.log('user1 ether balance4', await user1.getBalance());
    await expect(mowseGold.setMowseGoldMintPrice(parseEther('10'))).to.not.be.reverted;
    await expect(mowseGold.connect(user1).purchaseMowseGold({ value: parseEther('5') })).to.be.reverted;
    await expect(mowseGold.connect(user1).purchaseMowseGold({ value: parseEther('10') })).to.not.be.reverted;
    console.log('user1 mgold balance', await mowseGold.balanceOf(user1.address))
    console.log('user1 ether balance5', await user1.getBalance());
    console.log('owner balance before withdraw', await owner.getBalance());
    await expect(mowseGold.connect(user1).withdraw()).to.be.reverted;
    let teamAddress = '0xce1DB19c21da28B70FB663EC0c49C8C8e69a16DA';
    let backendAddress = '0xEc84B1EF0669f088A038060b2E7a976a19572bD1';  // MowseGameBackend
    let treasuryAddress = '0x2C3590F0f6baf2bF06dDC694e00D068E6648910E';
    console.log('teamBalance', await ethers.provider.getBalance(teamAddress));
    console.log('backendBalance', await ethers.provider.getBalance(backendAddress));
    console.log('treasuryBalance', await ethers.provider.getBalance(treasuryAddress));
    await expect(mowseGold.withdraw()).to.not.be.reverted;
    console.log('owner balance after withdraw', await owner.getBalance());
    console.log('teamBalance2', await ethers.provider.getBalance(teamAddress));
    console.log('backendBalance2', await ethers.provider.getBalance(backendAddress));
    console.log('treasuryBalance2', await ethers.provider.getBalance(treasuryAddress));
    let gsfacetbalance = await mowseGold.balanceOf(gameStorageFacet.address);
    console.log('GameStorageFacet balance', gsfacetbalance);
    console.log('GameStorageFacet ether balance', await ethers.provider.getBalance(gameStorageFacet.address));
    await gameStorageFacet.withdraw();
    gsfacetbalance = await mowseGold.balanceOf(gameStorageFacet.address);
    console.log('GameStorageFacet balance', gsfacetbalance);
  })
  it('should test mowsewear functions', async () => {
    console.log('Owner ', owner.address)
    console.log('User1 ', user1.address)
    console.log('User2 ', user2.address)
    console.log('MowseWearFacet: ', mowseWearFacet.address)
    console.log('getMowseWearNameFromDictionary', mowseWearFacet.getMowseWearNameFromDictionary)
    let mowseWearDictionary1 = await mowseWearFacet.getMowseWearNameFromDictionary(0,0);
    // let mowseWearDictionary2 = await mowseWearFacet.getMowseWearNameFromDictionary(0,1);

    console.log('MowseWearDictionary 1: ', mowseWearDictionary1)
    assert.equal(mowseWearDictionary1, 'None')
    await expect(mowseWearFacet.getMowseWearNameFromDictionary(0,18)).to.be.revertedWithCustomError(mowseWearFacet,'CannotFindMowseWear').withArgs(0,18);
    console.log('Adding Blue BG to MowseWearToDictionary')
    await mowseWearFacet.addMowseWearToDictionary(0,"Blue",false,false,480,480,"","",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAAHgCAYAAAB91L6VAAAACXBIWXMAAAsSAAALEgHS3X78AAAHaElEQVR4Xu3VsRGAIADAQGRe5nI7Z5ARaDzT/Nfpc637eQcA8Kt5CgCA7xkwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASCwAQ3oBr4pTgi8AAAAAElFTkSuQmCC"
      ,0,false);
    console.log('Adding bg with no traitName')
    await expect(mowseWearFacet.addMowseWearToDictionary(0,"",false,false,480,480,"","",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAAHgCAYAAAB91L6VAAAACXBIWXMAAAsSAAALEgHS3X78AAAHaElEQVR4Xu3VsRGAIADAQGRe5nI7Z5ARaDzT/Nfpc637eQcA8Kt5CgCA7xkwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASCwAQ3oBr4pTgi8AAAAAElFTkSuQmCC"
      ,0,false)).to.be.reverted;
    console.log('Check to see Blue BG was added')
    let mowseWearName = await mowseWearFacet.getMowseWearNameFromDictionary(0,1);
    console.log('mowsewearName1', mowseWearName);
    console.log('Attempt to add Charcoal BG using user1, expect to revert: not admin')
    await expect(mowseWearFacet.connect(user1).addMowseWearToDictionary(0,"Charcoal",false,false,480,480,"","",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAAHgCAYAAAB91L6VAAAACXBIWXMAAAsSAAALEgHS3X78AAAHZklEQVR4Xu3VMRHAMBDAsDRYnz+FFkKXXLxIs3c/M/MuAOCq/RcAAOcZMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEg8AGmaQXrZb+yNAAAAABJRU5ErkJggg=="
      ,0,false)).to.be.revertedWithCustomError(mowseWearFacet,'MissingAdminRole').withArgs('Must have Admin Role');
    console.log('Check to see if Charcoal was added')
    await expect(mowseWearFacet.getMowseWearNameFromDictionary(0,19)).to.be.reverted;
    console.log('Check tokenURI of token 0');
    await expect(mowseWearFacet.tokenURI(0)).to.be.revertedWithCustomError(mowseWearFacet,'MowseWearMustExist').withArgs(0);
    await expect(mowseWearFacet.tokenURI(1)).to.be.revertedWithCustomError(mowseWearFacet,'MowseWearMustExist').withArgs(1);
    console.log('Mint Blue BG MowseWear')
    await mowseWearFacet.mintMowseWear(owner.address, 0, 0, 0)
    console.log('Check tokenURI again');
    await expect(mowseWearFacet.tokenURI(0)).to.be.revertedWithCustomError(mowseWearFacet,'MowseWearMustExist').withArgs(0);
    let tokenUri = await mowseWearFacet.tokenURI(1);
    console.log('Token URI for tokenId 1');
    console.log('Attempt to mint a MowseWear that doesnt exist')
    await expect(mowseWearFacet.mintMowseWear(owner.address, 0, 19, 0)).to.be.revertedWithCustomError(mowseWearFacet,'CannotFindMowseWear').withArgs(0,19);
    console.log('updateMowseWearDictionary for Blank Bg -> Red Bg')
    await mowseWearFacet.updateMowseWearDictionary(0, "Red", 1, false, false, 480,480,"","","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAAHgCAYAAAB91L6VAAAACXBIWXMAAAsSAAALEgHS3X78AAAHZklEQVR4Xu3VMRHAIADAQEA/XpHQSmDpNcv/nD3z7P0MAOBX6xYAAN8zYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNA4AWkTAbGIFks/gAAAABJRU5ErkJggg==",0);
    await mowseWearFacet.mintMowseWear(owner.address, 0, 0, 0)
    tokenUri = await mowseWearFacet.tokenURI(2);
    console.log('TokenURI 2: ');
    console.log('Attempt and fail to updateMowseWearDictionary with non existant dictionary item')
    await expect(mowseWearFacet.updateMowseWearDictionary(0,"None",20,false,false,480,480,"","","",0)).to.be.reverted;
    console.log('Mint BG Feature to user1')
    await mowseWearFacet.mintMowseWear(user1.address, 1, 0, 0);
    tokenUri = await mowseWearFacet.tokenURI(3);
    console.log('Minted BG Feature 3');
    console.log('Attempt to mint another mowseWear with no baseAttributes')
    await mowseWearFacet.mintMowseWear(user1.address, 1, 0, 0)
    tokenUri = await mowseWearFacet.tokenURI(4);
    console.log('Minted BG Feature 4');
  })

  it('should test mowseFacet functions', async () => {
    console.log('Expect to revert tokenURI(10001)')
    await expect(mowseAvatar.tokenURI(10001)).to.be.revertedWithCustomError(mowseFacet,'MowseMustExist').withArgs(10001)
    console.log('Expect to revert mowseTokenURI(10001)')
    await expect(mowseFacet.mowseTokenURI(10001)).to.be.revertedWithCustomError(mowseFacet,'MowseMustExist').withArgs(10001);
    await expect(mowseAvatar.connect(team).freeMint(team.address)).to.be.reverted;
    console.log('Attempt freeMint')
    await mowseAvatar.freeMint(owner.address);
    console.log('freemint success')
    // await expect(mowseAvatar.tokenURI(10001)).to.not.be.reverted;
    let tokenUri = await mowseAvatar.tokenURI(10001);
    console.log('Plain Mowse TokenURI')
    console.log('Attempt to updateMowsePack, should revert')
    await expect(mowseFacet.updateMowsePack(mowseAvatar.ownerOf(10001),10001)).to.be.revertedWithCustomError(mowseFacet,'MowseAlreadyUpdated').withArgs(10001);
    console.log('Try to wear MowseWear, should revert')
    let mowseWearDictionary1 = await mowseWearFacet.getMowseWearNameFromDictionary(1,0);
    console.log('Mint this mowsewear: ', mowseWearDictionary1)
    await mowseWearFacet.mintMowseWear(owner.address,1,0,0)
    // await expect(mowseWearFacet.tokenURI(5)).to.not.be.reverted;
    tokenUri = await mowseWearFacet.tokenURI(5);
    console.log('Equip this mowseWear: ')
    await expect(mowseWearFacet.wearMowseWear(10001, 4)).to.be.revertedWithCustomError(mowseWearFacet,'MustOwnMowseWear').withArgs(4);
    console.log('Expect to not revert wearMowseWear(10001, 5)') 
    await expect(mowseWearFacet.wearMowseWear(10001, 5)).to.not.be.reverted
    console.log('wearMowseWear(10001, 5)')
    // await mowseWearFacet.wearMowseWear(10001, 5)
    tokenUri = await mowseFacet.mowseTokenURI(10001);
    console.log('Mowse should be wearing new bg')
    await expect(mowseWearFacet.wearMowseWear(10001, 5)).to.not.be.reverted
    // await mowseWearFacet.wearMowseWear(10001, 5);
    tokenUri = await mowseFacet.mowseTokenURI(10001)
    console.log('Mowse should now not be wearing new bg')
    console.log('Mint new mowsewear')
    await mowseWearFacet.mintMowseWear(owner.address,4,0,0)
    console.log('wear both mowsewear and see stats increase')
    await expect(mowseWearFacet.wearMowseWear(10001, 5)).to.not.be.reverted
    await expect(mowseWearFacet.wearMowseWear(10001, 6)).to.not.be.reverted
    tokenUri = await mowseFacet.mowseTokenURI(10001)
    console.log('mowse with 2 mowsewear')


    await expect(mowseWearFacet.connect(team).mintMowseWear(owner.address,1,0,0)).to.be.reverted
    await mowseWearFacet.mintMowseWear(owner.address,0,1,0);
    tokenUri = await mowseWearFacet.tokenURI(7);
    console.log('check mowsewear 7 frequency');
  })

  it('should test minting price', async () => {
    let bal1 = await owner.getBalance();
    let bal2 = await team.getBalance();
    console.log('owner balance: ', bal1)
    console.log('team balance: ', bal2)
    console.log('msg.value', parseEther('20'));
    await expect(mowseAvatar.mintMowse({ value: parseEther('0.1') })).to.not.be.reverted
    await expect(mowseAvatar.mintMowse({ value: parseEther('0.2') })).to.be.reverted
    await mowseAvatar.connect(team).mintMowse({ value: parseEther('0.1') })
    bal1 = await owner.getBalance();
    console.log('old owner balance', bal1)
    await mowseAvatar.withdraw();
    bal1 = await owner.getBalance();
    console.log('new owner balance', bal1);
  })

  it('should test testPatch', async () => {
    let patchVersion = await gameStorageFacet.getPatchVersion();
    console.log('patchVersion', patchVersion, patchVersion.toNumber())
    assert.equal(patchVersion.toNumber(),1)
    let uniqueInteractionCount = await gameStorageFacet.getUniqueInteractionCount(1)
    let interactedAddresses = await gameStorageFacet.getInteractedAddresses(1)
    let getNumberOfInteractionsByAddress = await gameStorageFacet.getNumberOfInteractionsByAddress(1,owner.address)
    console.log('uniqueInteractionCount', uniqueInteractionCount)
    console.log('interactedAddresses', interactedAddresses)
    console.log('getNumberOfInteractionsByAddress', getNumberOfInteractionsByAddress)
    await gameStorageFacet.nextPatch();
    patchVersion = await gameStorageFacet.getPatchVersion()
    uniqueInteractionCount = await gameStorageFacet.getUniqueInteractionCount(patchVersion)
    interactedAddresses = await gameStorageFacet.getInteractedAddresses(patchVersion)
    getNumberOfInteractionsByAddress = await gameStorageFacet.getNumberOfInteractionsByAddress(patchVersion,owner.address)
    console.log('uniqueInteractionCount', uniqueInteractionCount)
    console.log('interactedAddresses', interactedAddresses)
    console.log('getNumberOfInteractionsByAddress', getNumberOfInteractionsByAddress)
    assert.equal(patchVersion.toNumber(),2)
    assert.equal(uniqueInteractionCount,0)
    assert.equal(interactedAddresses.length,0)
    assert.equal(getNumberOfInteractionsByAddress,0)
  })

  it('should test mowsefacet functions if reverted', async () => {
    let tokenSupply = await mowseAvatar.totalSupply();
    console.log('tokenSupply', tokenSupply);
    await expect(mowseAvatar.connect(team).mintMowse({ value: parseEther('19') })).to.be.reverted;
    tokenSupply = await mowseAvatar.totalSupply();
    console.log('tokenSupply', tokenSupply);
    let mowseTokenIdCounter = await gameStorageFacet.getMowseTokenIdCounter();
    console.log('mowseTokenIdCounter', mowseTokenIdCounter);
  })

  it('should test accesscontrol grantrole', async () => {
    await expect(mowseWearFacet.connect(team).mintMowseWear(team.address, 0, 0,0)).to.be.reverted
    await accessControlFacet.addAccountToMowseWearMinterRole(team.address)
    await expect(mowseWearFacet.connect(team).mintMowseWear(team.address, 0, 0,0)).to.not.be.reverted
  })

  it('should check who owns mowsewear', async () => {
    console.log('owner', owner.address)
    console.log('team', team.address)
    console.log('dev1', dev1.address)
    let whoOwns = await mowseWearFacet.ownerOf(1);
    console.log('mowseWear1', whoOwns);
    whoOwns = await mowseWearFacet.ownerOf(5);
    console.log('mowseWear5', whoOwns);
    whoOwns = await mowseWearFacet.ownerOf(6);
    console.log('mowseWear6', whoOwns);
    whoOwns = await mowseWearFacet.ownerOf(7);
    console.log('mowseWear7', whoOwns);
    whoOwns = await mowseWearFacet.ownerOf(8);
    console.log('mowseWear8', whoOwns);
    let image = await mowseVisualizerFacet.getMowseWearImage(5);
    console.log('mowsewear5', image)
    image = await mowseVisualizerFacet.getMowseWearImage(6);
    console.log('mowsewear6', image)
    image = await mowseVisualizerFacet.getMowseWearImage(7);
    console.log('mowsewear7', image)
    image = await mowseVisualizerFacet.getMowseWearImage(8);
    console.log('mowsewear8', image)
    await expect(mowseVisualizerFacet.getMowseWearImage(9)).to.be.reverted;
  })

  it('should test lootbox functions', async () => {
    let ownerBal = await mowseGold.balanceOf(owner.address);
    console.log('owner mgold balance', ownerBal)
    let box = await mowseLootboxFacet.getMowseLootboxData(0);
    let box0Price = box.lootboxPrice;
    let box0Active = box.lootboxActive;
    let box0Name = box.lootboxName;
    let box0Pool = box.lootboxPool;
    // let box0Price = await mowseLootboxFacet.getMowseLootboxPrice(0);
    // let box0Active = await mowseLootboxFacet.getMowseLootboxActive(0);
    // let box0Name = await mowseLootboxFacet.getMowseLootboxName(0);
    // let box0Pool = await mowseLootboxFacet.getMowseLootboxPool(0);
    console.log('Pool 0: ', box0Price, box0Active, box0Name, box0Pool);
    await expect(mowseLootboxFacet.setMowseLootboxName(13, "")).to.be.reverted;
    box = await mowseLootboxFacet.getMowseLootboxData(13);
    let box13Pool = box.lootboxPool;
    let box13Active = box.lootboxActive;
    // let box13Pool = await mowseLootboxFacet.getMowseLootboxPool(13);
    // let box13Active = await mowseLootboxFacet.getMowseLootboxActive(13);
    console.log('Pool 13: ', box13Pool, box13Active);
    await expect(mowseLootboxFacet.setMowseLootboxActive(13, true)).to.not.be.reverted;
    box = await mowseLootboxFacet.getMowseLootboxData(13);
    // let box13Pool = box.lootboxPool;
    box13Active = box.lootboxActive;
    // box13Active = await mowseLootboxFacet.getMowseLootboxActive(13);
    console.log('13 active: ', box13Active);
    await expect(mowseLootboxFacet.updateMowseLootboxItem(13, 4, false, 0)).to.be.reverted;
    await expect(mowseLootboxFacet.updateMowseLootboxItem(13, 4, true, 0)).to.not.be.reverted;
    box = await mowseLootboxFacet.getMowseLootboxData(13);
    box13Pool = box.lootboxPool;
    // let box13Active = box.lootboxActive;
    // box13Pool = await mowseLootboxFacet.getMowseLootboxPool(13);
    console.log('Pool 13, expect [4]: ', box13Pool);
    await expect(mowseLootboxFacet.updateMowseLootboxItem(13, 5, false, 0))
    box = await mowseLootboxFacet.getMowseLootboxData(13);
    box13Pool = box.lootboxPool;
    // box13Pool = await mowseLootboxFacet.getMowseLootboxPool(13);
    console.log('Pool 13, expect [5]: ', box13Pool);
    await expect(mowseLootboxFacet.resetMowseLootbox(13)).to.not.be.reverted;
    box = await mowseLootboxFacet.getMowseLootboxData(13);
    box13Pool = box.lootboxPool;
    bot13Active = box.lootboxActive;
    // box13Pool = await mowseLootboxFacet.getMowseLootboxPool(13);
    // box13Active = await mowseLootboxFacet.getMowseLootboxActive(13);
    console.log('Pool 13, expect []: ', box13Pool, box13Active);
    console.log('owner funds', await mowseGold.balanceOf(owner.address));
    // await mowseGold.approve(mowseLootboxFacet.address, parseEther('1000000'));
    let ownerAllowance = await mowseGold.allowance(owner.address, mowseLootboxFacet.address);
    console.log('owner Allowance', ownerAllowance);
    await mowseGold.approve(mowseLootboxFacet.address, parseEther('1000000'));
    ownerAllowance = await mowseGold.allowance(owner.address, mowseLootboxFacet.address);
    console.log('owner Allowance', ownerAllowance);
    await gameStorageFacet.pause(true);
    console.log('paused');
    await expect(mowseLootboxFacet.connect(user2).purchaseMowseLootbox(1)).to.be.revertedWithCustomError(mowseLootboxFacet,'ContractPaused').withArgs('Contract is paused');
    console.log('contract reverted cuz pause')
    await gameStorageFacet.pause(false)
    console.log('unpaused')
    // await expect(mowseLootboxFacet.purchaseMowseLootbox(0)).to.be.revertedWith('MowseLootbox/Not enough funds')
    let user2mgBalance = await mowseGold.balanceOf(user2.address);
    console.log('user balance', user2mgBalance);
    await expect(mowseLootboxFacet.connect(user2).purchaseMowseLootbox(1)).to.be.revertedWithCustomError(mowseLootboxFacet,'NotEnoughFunds').withArgs(user2mgBalance)
    console.log('approve mg spend');
    // await expect(mowseLootboxFacet.connect(user2).purchaseMowseLootbox(1)).to.be.revertedWithCustomError(mowseLootboxFacet,'NotEnoughFunds').withArgs(user2mgBalance)
    await mowseGold.mint(user2.address, parseEther('10000'))
    console.log('added funds to user', await mowseGold.balanceOf(owner.address));
    await expect(mowseLootboxFacet.connect(user2).purchaseMowseLootbox(1)).to.be.revertedWith('ERC20: insufficient allowance');
    console.log('reverted with erc20')
    await mowseGold.connect(user2).approve(mowseLootboxFacet.address, parseEther('1000000'));
    await mowseLootboxFacet.setMowseLootboxActive(1, false);
    await expect(mowseLootboxFacet.connect(user2).purchaseMowseLootbox(1)).to.be.revertedWithCustomError(mowseLootboxFacet,'LootPoolNotActive').withArgs(1, false)
    await mowseLootboxFacet.setMowseLootboxActive(1, true);
    console.log('Loot pool now active')
    await mowseLootboxFacet.setMowseLootboxActive(13, true);
    await expect(mowseLootboxFacet.connect(user2).purchaseMowseLootbox(13)).to.be.revertedWithCustomError(mowseLootboxFacet,'LootPoolEmpty').withArgs(13)
    // await expect(mowseLootboxFacet.connect(user2).purchaseMowseLootbox(1)).to.be.revertedWith('ERC20: insufficient allowance');
    // console.log('reverted with erc20')
    // await mowseGold.connect(user2).approve(mowseLootboxFacet.address, parseEther('1000000'));
    // await expect(mowseLootboxFacet.purchaseMowseLootbox(13)).to.be.revertedWith('MowseLootbox/No items in loot pool')
    await expect(mowseLootboxFacet.connect(user2).purchaseMowseLootbox(1)).to.not.be.reverted;
    let mowseweartokenuri = await mowseWearFacet.tokenURI(9);
    // console.log('mowsewear', mowseweartokenuri)
    let proof = await mowseLootboxFacet.getProofById(9);
    console.log('proof', proof);
    let proven = await mowseLootboxFacet.proveById(9, proof);
    console.log('proof proven', proven);
    await expect(mowseLootboxFacet.getProofById(2)).to.be.reverted;
    console.log('proveById')
    await expect(mowseLootboxFacet.proveById(2, proof)).to.be.reverted;
    proven = await mowseLootboxFacet.proveById(9, 123123123123);
    console.log('proof failed', proven);
    ownerAllownace = await mowseGold.allowance(owner.address, mowseLootboxFacet.address);
    ownerBal = await mowseGold.balanceOf(owner.address)
    console.log('recheck allowance and balance', ownerAllowance, ownerBal)
    await mowseLootboxFacet.setMowseLootboxActive(12, true);
    await mowseLootboxFacet.purchaseMowseLootbox(12);
    ownerBal = await mowseGold.balanceOf(owner.address)
    console.log('recheck balance', ownerBal)
    mowseweartokenuri = await mowseWearFacet.tokenURI(2);
    // console.log('tokenURI2', mowseweartokenuri);
    console.log('symbol', await mowseWearFacet.symbol());
    console.log('name', await mowseWearFacet.name());
    let mwname = await mowseWearFacet.getMowseWearNameFromDictionary(0,1);
    console.log('mwname 242', mwname);
    // let txn = await mowseWearFacet.bulkAddMowseWearToDictionary([
    //   { traitType: 0, traitName: "None", nonSwappable: false, nonTransferrable: false, width: 0, height: 0, transform: "", style: "", image: "", weight: 0, ignoreFromLootPool: false },
    //   { traitType: 0, traitName: "Blue", nonSwappable: false, nonTransferrable: false, width: 480, height: 480, transform: "", style: "", image: 
    //   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAAHgCAYAAAB91L6VAAAACXBIWXMAAAsSAAALEgHS3X78AAAHaElEQVR4Xu3VsRGAIADAQGRe5nI7Z5ARaDzT/Nfpc637eQcA8Kt5CgCA7xkwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASCwAQ3oBr4pTgi8AAAAAElFTkSuQmCC",
    //   weight: 0, ignoreFromLootPool: false },
    //   { traitType: 0, traitName: "Charcoal", nonSwappable: false, nonTransferrable: false, width: 480, height: 480, transform: "", style: "", image:
    //   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeAAAAHgCAYAAAB91L6VAAAACXBIWXMAAAsSAAALEgHS3X78AAAHZklEQVR4Xu3VMRHAMBDAsDRYnz+FFkKXXLxIs3c/M/MuAOCq/RcAAOcZMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEgYMAAEDBgAAgYMAAEDBgAAgYMAAEDBoCAAQNAwIABIGDAABAwYAAIGDAABAwYAAIGDAABAwaAgAEDQMCAASBgwAAQMGAACBgwAAQMGAACBgwAAQMGgIABA0DAgAEg8AGmaQXrZb+yNAAAAABJRU5ErkJggg==",
    //   weight: 0, ignoreFromLootPool: false }
    // ]);
    // console.log('bulk add txn', txn);
    // await txn.wait();
    mwname = await mowseWearFacet.getMowseWearNameFromDictionary(0,2);
    console.log('mwname 243', mwname);
    // mwname = await mowseWearFacet.getMowseWearNameFromDictionary(0,3);
    // console.log('mwname 244', mwname);
    // mwname = await mowseWearFacet.getMowseWearNameFromDictionary(0,4);
    // console.log('mwname 244', mwname);
    await mowseLootboxFacet.purchaseMowseLootbox(0);
    let tokenuri = await mowseWearFacet.tokenURI(3);
    // console.log(tokenuri);
    await mowseLootboxFacet.purchaseMowseLootbox(0);
    await mowseLootboxFacet.purchaseMowseLootbox(0);
    await mowseLootboxFacet.purchaseMowseLootbox(0);
  })
  it('should test mowsepack and mowseavatar functions together', async () => {
    console.log('Mowsepack address', mowsepack.address);
    console.log('balance of MowsePack, mowseAvatar', await mowsepack.totalSupply(), await mowseAvatar.totalSupply())
    let mintPrice = await mowsepack.MINT_PRICE();
    console.log('mint price', mintPrice, formatEther(mintPrice));
    await expect(mowsepack.connect(user1).mintMowse(1, {value: mintPrice })).to.not.be.reverted;
    console.log('balance of MowsePack, mowseAvatar', await mowsepack.totalSupply(), await mowseAvatar.totalSupply())
    await mowseAvatar.connect(user1).mintMowsePack({value: mintPrice })
    console.log('finished minting from both contracts');
    console.log('balance of MowsePack, mowseAvatar', await mowsepack.totalSupply(), await mowseAvatar.totalSupply())
    console.log('new mowse token uri')
    let mowseURI = await mowseAvatar.tokenURI(102);
    // console.log('mowseURI', mowseURI)
    let mowseavatarmintprice = await mowseAvatar.MOWSE_MINT_PRICE();
    await mowseAvatar.connect(user1).mintMowse({ value: mowseavatarmintprice });
    console.log('owner of mowsepack 102', await mowsepack.ownerOf(102))
    let mowseavatartotalbalance = await mowseAvatar.totalSupply();
    let mowseavatarbalance = await mowseAvatar.balanceOf(user1.address);
    console.log('mowseavatar balance of test', mowseavatartotalbalance, mowseavatarbalance);
    let txn = await mowseAvatar.mintMowsePack({value: mintPrice});
    await txn.wait();
    let isUpdated = await mowseFacet.isMowsePackUpdated(103);
    console.log('IsUpdated',isUpdated);
  });
  it('should test removing comma from wearableJson', async () => {
    let mintPrice = await mowsepack.MINT_PRICE();
    let txn = await mowseAvatar.mintMowsePack({value: mintPrice})
    await txn.wait();
    let tokenURI = await mowseAvatar.tokenURI(104);
    console.log('tokenURI before wearing: ');
    await mowseWearFacet.mintAndWearMowseWear(owner.address, 104, 0, 1)
    tokenURI = await mowseAvatar.tokenURI(104);
    console.log('tokenURI after wearing: ');
    await mowseWearFacet.mintAndWearMowseWear(owner.address, 104, 3, 1)
    tokenURI = await mowseAvatar.tokenURI(104);
    console.log('tokenURI after wearing2: ');
    await mowseWearFacet.unequipAllMowseWear(104);
    tokenURI = await mowseAvatar.tokenURI(104);
    console.log('tokenURI unequipping all: ');
    await mowseWearFacet.mintAndWearMowseWear(owner.address, 104, 5, 1);
    await mowseWearFacet.mintAndWearMowseWear(owner.address, 104, 6, 1);
    await mowseWearFacet.mintAndWearMowseWear(owner.address, 104, 7, 1);
    tokenURI = await mowseAvatar.tokenURI(104);
    console.log('tokenURI remint mowsewear: ');
    let mowner = await mowseAvatar.ownerOf(104);
    console.log('mowner', mowner);
    await mowseAvatar.transferFrom(owner.address, user1.address, 104);
    mowner = await mowseAvatar.ownerOf(104);
    console.log('mwoner2', mowner);
    tokenURI = await mowseAvatar.tokenURI(104);
    console.log('tokenURI after transfer: ');
    await expect(mowseAvatar.transferFrom(user1.address, owner.address, 104)).to.be.reverted;
    let lootboxData = await mowseLootboxFacet.getMowseLootboxData(0);
    console.log('lootboxdata', lootboxData)
    await mowseWearFacet.mintMowseWear(owner.address, 0, 1, 5)
    await mowseWearFacet.mintMowseWear(owner.address, 0, 1, 5)
    await mowseWearFacet.mintMowseWear(owner.address, 0, 1, 5)
  })
  it('should test mowsegame functions', async () => {
    let ownerBal = await mowseGold.balanceOf(owner.address);
    console.log('owner mgold balance', ownerBal)
    let gameData = await mowseGamesFacet.getMowseGameData(1);
    console.log('GameData 1', gameData);
    await expect(mowseGamesFacet.updateMowseGame(1, "", true)).to.not.be.reverted;
    gameData = await mowseGamesFacet.getMowseGameData(1);
    console.log('GameData 1a', gameData);
    await expect(mowseGamesFacet.updateMowseGame(0, "Mwr", false)).to.be.reverted;
    console.log('update mwr')
    await expect(mowseGamesFacet.updateMowseGame(1, "Werkshop", false)).to.be.reverted;
    await expect(mowseGamesFacet.updateMowseGame(1, "Workshop", false)).to.not.be.reverted;
    gameData = await mowseGamesFacet.getMowseGameData(1);
    console.log('GameData 1b', gameData);
    let scoreSubmit = await mowseGamesFacet.getNextAvailableScoreSubmit(1, owner.address);
    console.log('scoreSubmit', scoreSubmit);
    await expect(mowseGamesFacet.connect(user1).submitScore(1, user1.address)).to.be.reverted;
    await mowseGamesFacet.submitScore(1, owner.address);
    scoreSubmit = await mowseGamesFacet.getNextAvailableScoreSubmit(1, owner.address);
    console.log('scoreSubmit2', scoreSubmit);
    ownerBal = await mowseGold.balanceOf(owner.address);
    gameData = await mowseGamesFacet.getMowseGameData(1);
    console.log('GameData 1c', gameData);
    await mowseGamesFacet.submitScore(1, owner.address);
    scoreSubmit = await mowseGamesFacet.getNextAvailableScoreSubmit(1, owner.address);
    console.log('scoreSubmit3', scoreSubmit);
    ownerBal = await mowseGold.balanceOf(owner.address);
    gameData = await mowseGamesFacet.getMowseGameData(1);
    console.log('GameData 1d', gameData);
    await mowseGamesFacet.updateMowseGame(1, "Werkshop", true);
    await mowseGamesFacet.submitScore(1, owner.address);
    console.log('submitted 3x');
    await expect(mowseGamesFacet.getNextAvailableScoreSubmit(1, owner.address)).to.be.reverted;
    ownerBal = await mowseGold.balanceOf(owner.address);
    gameData = await mowseGamesFacet.getMowseGameData(1);
    console.log('GameData 1e', gameData);
    await expect(mowseGamesFacet.submitScore(1, owner.address)).to.be.reverted;
    console.log('owner mgold balance', ownerBal)
    await mowseGamesFacet.submitScore(1, user1.address);
    await mowseGamesFacet.submitScore(1, user1.address);
    await mowseGamesFacet.submitScore(1, user1.address);
    ownerBal = await mowseGold.balanceOf(user1.address);
    gameData = await mowseGamesFacet.getMowseGameData(1);
    console.log('GameData 1f', gameData);
  })
  it('should test stitching', async () => {
    await mowseWearFacet.mintMowseWear(owner.address, 0, 1, 0);
    await mowseWearFacet.mintMowseWear(owner.address, 0, 1, 0);
    await mowseWearFacet.mintMowseWear(owner.address, 0, 1, 0);
    await mowseWearFacet.mintMowseWear(user1.address, 0, 1, 0);
    console.log('Prep to stitch');
    await expect(mowseWearFacet.stitchMowseWear(23,24,26)).to.be.reverted;
    console.log('reverted')
    await expect(mowseWearFacet.stitchMowseWear(23,24,25)).to.not.be.reverted;
    console.log('not revert')
    await expect(mowseWearFacet.stitchMowseWear(23,24,25)).to.be.reverted;
    console.log('revert')
    await expect(mowseWearFacet.wearMowseWear(10001, 23)).to.be.reverted;
  })
  it('should test burning', async () => {
    let mgold = await mowseGold.balanceOf(gameStorageFacet.address);
    console.log('mgold', mgold)
    let tokenuri = await mowseWearFacet.tokenURI(15);
    console.log('Tokenuri 15', tokenuri);
    await expect(mowseWearFacet.hemMowseWear(15)).to.be.reverted;
    let approvedAddy = await mowseWearFacet.getApproved(15);
    console.log('approved address', approvedAddy)
    await mowseWearFacet.approve(mowseWearFacet.address, 15);
    approvedAddy = await mowseWearFacet.getApproved(15);
    console.log('approved address2', approvedAddy)
    await expect(mowseWearFacet.hemMowseWear(15)).to.not.be.reverted;
    console.log('hemmed')
    tokenuri = await mowseWearFacet.tokenURI(15);
    mgold = await mowseGold.balanceOf(gameStorageFacet.address);
    console.log('mgold', mgold)
    // await expect(mowseWearFacet.tokenURI(15)).to.be.reverted;
    console.log('Tokenuri 15a');
    await mowseWearFacet.mintMowseWear(owner.address, 0, 0, 0);
    await mowseWearFacet.tokenURI(20);
    console.log('Tokenuri 15b');
    await expect(mowseWearFacet.connect(user1).hemMowseWear(20)).to.be.reverted;
    await expect(mowseWearFacet.connect(user1).approve(mowseWearFacet.address, 20)).to.be.reverted;
    await mowseWearFacet.approve(mowseWearFacet.address, 20);
    console.log('approved1');
    await mowseWearFacet.approve(mowseWearFacet.address, 20);
  });
  it('should test gamestoragewithdraw', async() => {
    console.log('withdraw');
    gsfacetbalance = await mowseGold.balanceOf(gameStorageFacet.address);
    console.log('GameStorageFacet balance', gsfacetbalance);
    let treasuryBalance = await mowseGold.balanceOf(treasuryAddress);
    console.log('Treasury balance', treasuryBalance)
    await gameStorageFacet.withdraw();
    gsfacetbalance = await mowseGold.balanceOf(gameStorageFacet.address);
    console.log('GameStorageFacet balance2', gsfacetbalance);
    treasuryBalance = await mowseGold.balanceOf(treasuryAddress);
    console.log('Treasury balance', treasuryBalance)
  })
})
