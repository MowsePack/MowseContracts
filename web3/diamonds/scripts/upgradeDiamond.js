const { ethers } = require('hardhat');
const { getSelectors } = require('./libraries/diamond');

async function upgradeDiamond() {
  console.log('begin upgradeDiamond');
  let [contractOwner] = await ethers.getSigners();
  console.log('Contract Owner: ', contractOwner.address);
  let diamondAddress = '0xAF7cdb54A1Dd424A92217ac0Ab5184Cb8755520a';
  const diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress)
  const diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
  const facetToUpgrade = await ethers.getContractAt('MowseVisualizerFacet', diamondAddress);
  console.log('allSelectors', getSelectors(facetToUpgrade));
  const selectors = getSelectors(facetToUpgrade).get(['_getNameJSON(uint256)','_getGenerationJSON(uint256,string)'])
  console.log('selectors to upgrade', selectors);
  const deployedFacetAddress = '0x8cA52c2c722602B3A5c6068cd3879Eb8E8593253'

  let txn = await diamondCutFacet.diamondCut(
    [{
      facetAddress: deployedFacetAddress,
      action: FacetCutACtion.Replace,
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
  upgradeDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
  
}

exports.upgradeDiamond = upgradeDiamond
