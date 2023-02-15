const { ethers } = require('hardhat');
const { getSelectors, FacetCutAction } = require('./libraries/diamond');

async function addDiamond() {
  console.log('begin addDiamond');
  let [contractOwner] = await ethers.getSigners();
  console.log('Contract Owner: ', contractOwner.address);
  let diamondAddress = '0xa18017414BA96936A7698DAe027a0b7047a7E406';
  const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
  const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
  const facetToUpgrade = await ethers.getContractAt('MowseFacet', diamondAddress);
  console.log('allSelectors', getSelectors(facetToUpgrade));
  const selectors = getSelectors(facetToUpgrade).get(['isMowsePackUpdated(uint256)'])
  console.log('selectors to upgrade', selectors);
  const deployedFacetAddress = '0xfF9C26AB8095c82A1128538b871B684FEea4c32c'

  let txn = await diamondCutFacet.diamondCut(
    [{
      facetAddress: deployedFacetAddress,
      action: FacetCutAction.Add,
      functionSelectors: selectors
    }],
    ethers.constants.AddressZero, '0x', { gasLimit: 800000 }
  );
  let receipt = await txn.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${txn.hash}`)
  }
  let result = await diamondLoupeFacet.facetFunctionSelectors(deployedFacetAddress)
  console.log('result', result)
}

if (require.main === module) {
  addDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
  
}

exports.addDiamond = addDiamond
