const { ethers } = require('hardhat')

async function postDeployMintMowseAvatar(mowsepackAddress, mowseAvatarAddress) {
  console.log('begin postDeployMintMowseAvatar');
  let [contractOwner] = await ethers.getSigners();
  console.log('Contract Owner: ', contractOwner.address);
  // const mowsepack = await ethers.getContractAt('MowsePack', mowsepackAddress);
  // const mowseAvatar = await ethers.getContractAt('MowseAvatar', mowseAvatarAddress);
  // DEV: fix addresses
  const mowsepack = await ethers.getContractAt('MowsePack', '0x5DBe53bA3C9DB9a7d6017e45A45B4011E347c47B');
  const mowseAvatar = await ethers.getContractAt('MowseAvatar', '0x89e31Ee3B7b31aa8c705F4681dD386CFA254C0Df');
  const mowseGold = await ethers.getContractAt('MowseGold', '0x1604d71AeEd490b103642366103297F87de633E4');
  const mowseWearFacet = await ethers.getContractAt('MowseWearFacet', '0xb8Ff4d84f277d0AcfC9f1b304A46566C27f736d3');
  
  let mowsepackSupply = await mowsepack.totalSupply();
  console.log('Mowsepack Supply: ', mowsepackSupply)
  for (let i = 0; i < mowsepackSupply + 100; i++) {
    let tokenOwner;
    try{
      tokenOwner = await mowsepack.ownerOf(i);
    } catch(e) {
      // console.log('no token owner', e)
    }
    if (tokenOwner) {
      console.log('Owner found', tokenOwner, i);
      // mint MowseAvatar
      let txn = await mowseAvatar.mintMowseForExistingMowsePack(tokenOwner, i);
      await txn.wait();
      // Existing MowsePack (OG)
      txn = await mowseGold.mint(tokenOwner, 40000);
      await txn.wait();
      // DEV: uncomment
      // OG BG Feature is 1,6
      // Halloween '21 is 1,4
      // txn = await mowseWearFacet.mintMowseWear(tokenOwner, 1, 6, 2);
      // await txn.wait();
      // txn = await mowseWearFacet.mintMowseWear(tokenOwner, 1, 4, 0);
      // await txn.wait();
    }
  }
  console.log('Finished postDeployMintMowseAvatar');
  return;
}

if (require.main === module) {
  postDeployMintMowseAvatar()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
  
}

exports.postDeployMintMowseAvatar = postDeployMintMowseAvatar
