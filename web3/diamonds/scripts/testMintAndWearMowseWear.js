const { ethers } = require('hardhat')

async function testMintAndWearMowseWear(diamondAddress) {
  console.log('begin testMintAndWearMowseWear');
  let [contractOwner] = await ethers.getSigners();
  console.log('Contract Owner: ', contractOwner.address);
  // const mowseWearFacet = await ethers.getContractAt('MowseWearFacet', diamondAddress);
  const mowseFacet = await ethers.getContractAt('MowseFacet', '0x6829CC06381EF6a65BcBe9EE51418CA0fCC1709F');
  const mowseWearFacet = await ethers.getContractAt('MowseWearFacet', '0x6829CC06381EF6a65BcBe9EE51418CA0fCC1709F');
  let testAttributes = [
    {trait_type: 'Background Color', value: 'Green'},
    {trait_type: 'Background Feature', value: 'None'},
    {trait_type: 'Body Type', value: 'Default'},
    {trait_type: 'Ear Type', value: 'Default'},
    {trait_type: 'Eye Brow', value: 'Normal'},
    {trait_type: 'Eye Type', value: 'Default'},
    {trait_type: 'Eye Wear', value: 'None'},
    {trait_type: 'Head Wear', value: 'Headband'},
    {trait_type: 'Jewelry', value: 'None'},
    {trait_type: 'Mouth', value: 'Black Bandana'},
    {trait_type: 'Shirt', value: 'Tank Top'},
    {trait_type: 'Skin Color', value: 'White'}
  ]
  let testAddress = '0x36C4C53bB6b0B8C59E98b35a1EABb5d43B5bC27F';
  let mowseId = 104;
  let attributeCount = testAttributes.length;
  let mintedCount = 0;
  let functionGasFees = await mowseFacet.estimateGas.updateMowsePack(testAddress, mowseId);
  let gasLimit = (Math.ceil(parseInt(functionGasFees) * 1.2)).toString();
  let txn = await mowseFacet.updateMowsePack(testAddress, mowseId, { gasLimit });
  await txn.wait();
  for (let i = 0; i < attributeCount; i++) {
    console.log('Attempt gas estimate for updateMowsePack', testAttributes[i].trait_type, testAttributes[i].value)
    let dictionaryValue = await mapAttributeToDictionary(testAttributes[i]);
    console.log('dictionary Value returned', dictionaryValue);
    if (dictionaryValue && Object.keys(dictionaryValue).length > 0) {
      // get gasLimit
      functionGasFees = await mowseWearFacet.estimateGas.mintAndWearMowseWear(testAddress, mowseId, dictionaryValue.traitType, dictionaryValue.traitIndex, false);
      gasLimit = (Math.ceil(parseInt(functionGasFees) * 1.2)).toString();
      // confirm owner of mowseId
      txn = await mowseWearFacet.mintAndWearMowseWear(testAddress, mowseId, dictionaryValue.traitType, dictionaryValue.traitIndex, false, { gasLimit });
      console.log(`Txn for minting [${dictionaryValue.traitType},${dictionaryValue.traitIndex}]: `);
      receipt = await txn.wait();
      // console.log('receipt', receipt)
      if (!receipt.status) {
        throw Error(`Test Mint and Wear failed: ${txn.hash}`)
      }
      mintedCount++;
    }
  }
}

const mapAttributeToDictionary = async (attribute) => {
  let dictionaryValue;
  switch (attribute.trait_type) {
    case 'Background Color':
      switch (attribute.value) {
        case 'None':
          dictionaryValue = { traitType: 0, traitIndex: 0 };
          break;
        case 'Blue':
          dictionaryValue = { traitType: 0, traitIndex: 1 };
          break;
        case 'Charcoal':
          dictionaryValue = { traitType: 0, traitIndex: 2 };
          break;
        case 'Cyan':
          dictionaryValue = { traitType: 0, traitIndex: 3 };
          break;
        case 'Gray':
          dictionaryValue = { traitType: 0, traitIndex: 4 };
          break;
        case 'Green':
          dictionaryValue = { traitType: 0, traitIndex: 5 };
          break;
        case 'Lavender':
          dictionaryValue = { traitType: 0, traitIndex: 6 };
          break;
        case 'Lime Green':
          dictionaryValue = { traitType: 0, traitIndex: 7 };
          break;
        case 'Magenta':
          dictionaryValue = { traitType: 0, traitIndex: 8 };
          break; 
        case 'Mint Green':
          dictionaryValue = { traitType: 0, traitIndex: 9 };
          break;
        case 'Orange':
          dictionaryValue = { traitType: 0, traitIndex: 10 };
          break;
        case 'Pink':
          dictionaryValue = { traitType: 0, traitIndex: 11 };
          break;
        case 'Purple':
          dictionaryValue = { traitType: 0, traitIndex: 12 };
          break;
        case 'Red':
          dictionaryValue = { traitType: 0, traitIndex: 13 };
          break;
        case 'Salmon':
          dictionaryValue = { traitType: 0, traitIndex: 14 };
          break;
        case 'Sky':
          dictionaryValue = { traitType: 0, traitIndex: 15 };
          break;
        case 'Yellow':
          dictionaryValue = { traitType: 0, traitIndex: 16 };
          break;
        default: 
          console.log('Something went wrong fetching traitValue from dictionary', attribute.trait_type, attribute.value);
      }
      break;
    case 'Background Feature':
      switch (attribute.value) {
        case 'None':
          // Don't return anything for None background feature
          break;
        case 'Bitgem':
          dictionaryValue = { traitType: 1, traitIndex: 0 };
          break;
        case 'Cronje':
          dictionaryValue = { traitType: 1, traitIndex: 1 };
          break;
        case 'FTM Alerts':
          dictionaryValue = { traitType: 1, traitIndex: 2 };
          break;
        case 'FTM':
          dictionaryValue = { traitType: 1, traitIndex: 3 };
          break;
        case "Halloween '21":
          dictionaryValue = { traitType: 1, traitIndex: 4 };
          break;
        case 'Moon':
          dictionaryValue = { traitType: 1, traitIndex: 5 };
          break;
        case 'OG':
          dictionaryValue = { traitType: 1, traitIndex: 6 };
          break;
        case 'Paintswap Fire':
          dictionaryValue = { traitType: 1, traitIndex: 7 };
          break;
        case 'Paintswap':
          dictionaryValue = { traitType: 1, traitIndex: 8 };
          break; 
        case 'Party':
          dictionaryValue = { traitType: 1, traitIndex: 9 };
          break;
        case 'Popsicle':
          dictionaryValue = { traitType: 1, traitIndex: 10 };
          break;
        case 'Reaper':
          dictionaryValue = { traitType: 1, traitIndex: 11 };
          break;
        case 'Scream':
          dictionaryValue = { traitType: 1, traitIndex: 12 };
          break;
        case 'Spiritswap':
          dictionaryValue = { traitType: 1, traitIndex: 13 };
          break;
        case 'Spookyswap':
          dictionaryValue = { traitType: 1, traitIndex: 14 };
          break;
        case 'Stake Steak':
          dictionaryValue = { traitType: 1, traitIndex: 15 };
          break;
        case 'Strange Brew':
          dictionaryValue = { traitType: 1, traitIndex: 16 };
          break;
        case 'Tomb':
          dictionaryValue = { traitType: 1, traitIndex: 17 };
          break; 
        case 'Uman Blue':
          dictionaryValue = { traitType: 1, traitIndex: 18 };
          break;
        case 'Uman Green':
          dictionaryValue = { traitType: 1, traitIndex: 19 };
          break;
        case 'Up Only':
          dictionaryValue = { traitType: 1, traitIndex: 20 };
          break;
        case 'Zoo':
          dictionaryValue = { traitType: 1, traitIndex: 21 };
          break;
        default: 
          console.log('Something went wrong fetching traitValue from dictionary', attribute.trait_type, attribute.value);
      }
      break;
    case 'Skin Color':
      switch (attribute.value) {
        case 'White':
          dictionaryValue = { traitType: 2, traitIndex: 0 };
          break;
        case 'Alien':
          dictionaryValue = { traitType: 2, traitIndex: 1 };
          break;
        case 'Black':
          dictionaryValue = { traitType: 2, traitIndex: 2 };
          break;
        case 'Brown':
          dictionaryValue = { traitType: 2, traitIndex: 3 };
          break;
        case "Dark Brown":
          dictionaryValue = { traitType: 2, traitIndex: 4 };
          break;
        case 'Gray Zombie':
          dictionaryValue = { traitType: 2, traitIndex: 5 };
          break;
        case 'Green Zombie':
          dictionaryValue = { traitType: 2, traitIndex: 6 };
          break;
        case 'Pale':
          dictionaryValue = { traitType: 2, traitIndex: 7 };
          break;
        case 'Tanned':
          dictionaryValue = { traitType: 2, traitIndex: 8 };
          break;
        default: 
          console.log('Something went wrong fetching traitValue from dictionary', attribute.trait_type, attribute.value);
        }
      break;
    case 'Ear Type':
      switch (attribute.value) {
        case 'Default':
          dictionaryValue = { traitType: 3, traitIndex: 0 };
          break;
        case 'Big':
          dictionaryValue = { traitType: 3, traitIndex: 1 };
          break;
        case 'Pointy':
          dictionaryValue = { traitType: 3, traitIndex: 2 };
          break;
        default: 
          console.log('Something went wrong fetching traitValue from dictionary', attribute.trait_type, attribute.value);
        }
      break;
    case 'Shirt':
      switch (attribute.value) {
        case 'Artion Shirt':
          dictionaryValue = { traitType: 4, traitIndex: 0 };
          break;
        case 'Bat Shirt':
          dictionaryValue = { traitType: 4, traitIndex: 1 };
          break;
        case 'Blue Hoodie':
          dictionaryValue = { traitType: 4, traitIndex: 2 };
          break;
        case 'Blue T Shirt':
          dictionaryValue = { traitType: 4, traitIndex: 3 };
          break;
        case "Butchers Clothing":
          dictionaryValue = { traitType: 4, traitIndex: 4 };
          break;
        case 'Classy Suit':
          dictionaryValue = { traitType: 4, traitIndex: 5 };
          break;
        case 'Dirty Tank Top':
          dictionaryValue = { traitType: 4, traitIndex: 6 };
          break;
        case 'Gray Deep V Neck':
          dictionaryValue = { traitType: 4, traitIndex: 7 };
          break;
        case 'Gray Ethereum Shirt':
          dictionaryValue = { traitType: 4, traitIndex: 8 };
          break; 
        case 'Gray Hoodie':
          dictionaryValue = { traitType: 4, traitIndex: 9 };
          break;
        case 'Gray T Shirt':
          dictionaryValue = { traitType: 4, traitIndex: 10 };
          break;
        case 'I Love You Shirt':
          dictionaryValue = { traitType: 4, traitIndex: 11 };
          break;
        case 'Incredible Suit':
          dictionaryValue = { traitType: 4, traitIndex: 12 };
          break;
        case 'Light Blue Deep V Neck':
          dictionaryValue = { traitType: 4, traitIndex: 13 };
          break;
        case 'NFTee Shirt':
          dictionaryValue = { traitType: 4, traitIndex: 14 };
          break;
        case 'Ninja Instructor Costume':
          dictionaryValue = { traitType: 4, traitIndex: 15 };
          break;
        case 'Ninja Suit':
          dictionaryValue = { traitType: 4, traitIndex: 16 };
          break;
        case 'No Shirt with Chest Hair':
          dictionaryValue = { traitType: 4, traitIndex: 17 };
          break; 
        case 'No Shirt with Tattoos':
          dictionaryValue = { traitType: 4, traitIndex: 18 };
          break;
        case 'Uman Nurse Outfit':
          dictionaryValue = { traitType: 4, traitIndex: 19 };
          break;
        case 'Officer Outfit':
          dictionaryValue = { traitType: 4, traitIndex: 20 };
          break;
        case 'Olive Deep V Neck':
          dictionaryValue = { traitType: 4, traitIndex: 21 };
          break;
        case 'Orange Tracksuit':
          dictionaryValue = { traitType: 4, traitIndex: 22 };
          break;
        case 'Pink Deep V Neck with Chest Hair':
          dictionaryValue = { traitType: 4, traitIndex: 23 };
          break;
        case 'Pink Deep V Neck':
          dictionaryValue = { traitType: 4, traitIndex: 24 };
          break;
        case 'Police Shirt':
          dictionaryValue = { traitType: 4, traitIndex: 25 };
          break;
        case "Purple Dress":
          dictionaryValue = { traitType: 4, traitIndex: 26 };
          break;
        case 'Red Cloud Coat':
          dictionaryValue = { traitType: 4, traitIndex: 27 };
          break;
        case 'Red Hoodie':
          dictionaryValue = { traitType: 4, traitIndex: 28 };
          break;
        case 'Red Striped Shirt':
          dictionaryValue = { traitType: 4, traitIndex: 29 };
          break;
        case 'Red T Shirt':
          dictionaryValue = { traitType: 4, traitIndex: 30 };
          break; 
        case 'Red Vest':
          dictionaryValue = { traitType: 4, traitIndex: 31 };
          break;
        case 'Robe':
          dictionaryValue = { traitType: 4, traitIndex: 32 };
          break;
        case 'Royal Jacket':
          dictionaryValue = { traitType: 4, traitIndex: 33 };
          break;
        case 'Sergeant Outfit':
          dictionaryValue = { traitType: 4, traitIndex: 34 };
          break;
        case 'Shredded Shirt':
          dictionaryValue = { traitType: 4, traitIndex: 35 };
          break;
        case 'Striped Shirt':
          dictionaryValue = { traitType: 4, traitIndex: 36 };
          break;
        case 'Suit':
          dictionaryValue = { traitType: 4, traitIndex: 37 };
          break;
        case 'Super Suit':
          dictionaryValue = { traitType: 4, traitIndex: 38 };
          break;
        case 'Tank Top':
          dictionaryValue = { traitType: 4, traitIndex: 39 };
          break; 
        case 'White Ethereum Shirt':
          dictionaryValue = { traitType: 4, traitIndex: 40 };
          break;
        case 'White Pierrot Costume':
          dictionaryValue = { traitType: 4, traitIndex: 41 };
          break;
        case 'White Suit':
          dictionaryValue = { traitType: 4, traitIndex: 42 };
          break;
        case 'Yellow Clown Costume':
          dictionaryValue = { traitType: 4, traitIndex: 43 };
          break;
        default: 
          console.log('Something went wrong fetching traitValue from dictionary', attribute.trait_type, attribute.value);
        }
      break;
    case 'Body Type':
      switch (attribute.value) {
        case 'Default':
          dictionaryValue = { traitType: 5, traitIndex: 0 };
          break;
        case 'Buff':
          dictionaryValue = { traitType: 5, traitIndex: 1 };
          break;
        default: 
          console.log('Something went wrong fetching traitValue from dictionary', attribute.trait_type, attribute.value);
        }
      break;
    case 'Mouth':
      switch (attribute.value) {
        case 'Basic Smile':
          dictionaryValue = { traitType: 6, traitIndex: 0 };
          break;
        case 'Artion Smile':
          dictionaryValue = { traitType: 6, traitIndex: 1 };
          break;
        case 'Basic Mask':
          dictionaryValue = { traitType: 6, traitIndex: 2 };
          break;
        case 'Big Smile Mask':
          dictionaryValue = { traitType: 6, traitIndex: 3 };
          break;
        case "Big Teeth Smile":
          dictionaryValue = { traitType: 6, traitIndex: 4 };
          break;
        case 'Black Bandana':
          dictionaryValue = { traitType: 6, traitIndex: 5 };
          break;
        case 'Black Mask':
          dictionaryValue = { traitType: 6, traitIndex: 6 };
          break;
        case 'Broken Mouth':
          dictionaryValue = { traitType: 6, traitIndex: 7 };
          break;
        case 'Broken Teeth':
          dictionaryValue = { traitType: 6, traitIndex: 8 };
          break; 
        case 'Buck Teeth':
          dictionaryValue = { traitType: 6, traitIndex: 9 };
          break;
        case 'Camo Bandana':
          dictionaryValue = { traitType: 6, traitIndex: 10 };
          break;
        case 'Cheeky Smile':
          dictionaryValue = { traitType: 6, traitIndex: 11 };
          break;
        case 'Curly Mustache':
          dictionaryValue = { traitType: 6, traitIndex: 12 };
          break;
        case 'Drooling':
          dictionaryValue = { traitType: 6, traitIndex: 13 };
          break;
        case 'Edgy Mask':
          dictionaryValue = { traitType: 6, traitIndex: 14 };
          break;
        case 'Frown':
          dictionaryValue = { traitType: 6, traitIndex: 15 };
          break;
        case 'Gas Mask':
          dictionaryValue = { traitType: 6, traitIndex: 16 };
          break;
        case 'Gold Teeth':
          dictionaryValue = { traitType: 6, traitIndex: 17 };
          break; 
        case 'K95 Black Mask':
          dictionaryValue = { traitType: 6, traitIndex: 18 };
          break;
        case 'K95 White Mask':
          dictionaryValue = { traitType: 6, traitIndex: 19 };
          break;
        case 'Rainbow Smile':
          dictionaryValue = { traitType: 6, traitIndex: 20 };
          break;
        case 'Red Bandana':
          dictionaryValue = { traitType: 6, traitIndex: 21 };
          break;
        case 'Red Lips':
          dictionaryValue = { traitType: 6, traitIndex: 22 };
          break;
        case 'Shook':
          dictionaryValue = { traitType: 6, traitIndex: 23 };
          break;
        case 'Stitched Mouth':
          dictionaryValue = { traitType: 6, traitIndex: 24 };
          break;
        case 'Surgical Mask':
          dictionaryValue = { traitType: 6, traitIndex: 25 };
          break; 
        case 'Tongue Out Smile Mask':
          dictionaryValue = { traitType: 6, traitIndex: 26 };
          break;
        case 'Vampire Smile':
          dictionaryValue = { traitType: 6, traitIndex: 27 };
          break;
        case 'Vampire Teeth':
          dictionaryValue = { traitType: 6, traitIndex: 28 };
          break;
        case 'Whistling':
          dictionaryValue = { traitType: 6, traitIndex: 29 };
          break;
        case 'Zipper Mouth':
          dictionaryValue = { traitType: 6, traitIndex: 30 };
          break;
        default: 
          console.log('Something went wrong fetching traitValue from dictionary', attribute.trait_type, attribute.value);
        }
      break;
    case 'Eye Brow':
      switch (attribute.value) {
        case 'None':
          dictionaryValue = { traitType: 7, traitIndex: 0 };
          break;
        case 'Ginger':
          dictionaryValue = { traitType: 7, traitIndex: 1 };
          break;
        case 'Normal':
          dictionaryValue = { traitType: 7, traitIndex: 2 };
          break;
        case 'Questioning':
          dictionaryValue = { traitType: 7, traitIndex: 3 };
          break;
        case 'Scarred':
          dictionaryValue = { traitType: 7, traitIndex: 4 };
          break;
        case "Tape":
          dictionaryValue = { traitType: 7, traitIndex: 5 };
          break;
        case 'Unibrow':
          dictionaryValue = { traitType: 7, traitIndex: 6 };
          break;
        case 'Worried':
          dictionaryValue = { traitType: 7, traitIndex: 7 };
          break;
        default: 
          console.log('Something went wrong fetching traitValue from dictionary', attribute.trait_type, attribute.value);
        }
      break;
    case 'Eye Type':
      switch (attribute.value) {
        case 'Default':
          dictionaryValue = { traitType: 8, traitIndex: 0 };
          break;
        case 'Closed':
          dictionaryValue = { traitType: 8, traitIndex: 1 };
          break;
        case 'Cross Eyed':
          dictionaryValue = { traitType: 8, traitIndex: 2 };
          break;
        case 'Dead Eyes':
          dictionaryValue = { traitType: 8, traitIndex: 3 };
          break;
        case "Lazy Eye":
          dictionaryValue = { traitType: 8, traitIndex: 4 };
          break;
        case 'Looking Left':
          dictionaryValue = { traitType: 8, traitIndex: 5 };
          break;
        case 'Looking Right':
          dictionaryValue = { traitType: 8, traitIndex: 6 };
          break;
        case 'Low Eyes':
          dictionaryValue = { traitType: 8, traitIndex: 7 };
          break;
        case 'Red Eyes':
          dictionaryValue = { traitType: 8, traitIndex: 8 };
          break; 
        case 'Throwing Shade':
          dictionaryValue = { traitType: 8, traitIndex: 9 };
          break;
        default: 
          console.log('Something went wrong fetching traitValue from dictionary', attribute.trait_type, attribute.value);
        }
      break;
    case 'Eye Wear':
      switch (attribute.value) {
        case 'None':
          dictionaryValue = { traitType: 9, traitIndex: 0 };
          break;
        case '3D Glasses':
          dictionaryValue = { traitType: 9, traitIndex: 1 };
          break;
        case 'Black Tea Shades':
          dictionaryValue = { traitType: 9, traitIndex: 2 };
          break;
        case 'Circle Glasses':
          dictionaryValue = { traitType: 9, traitIndex: 3 };
          break;
        case "Deal With It Shades":
          dictionaryValue = { traitType: 9, traitIndex: 4 };
          break;
        case 'Eyepatch':
          dictionaryValue = { traitType: 9, traitIndex: 5 };
          break;
        case 'Funky Red Glasses':
          dictionaryValue = { traitType: 9, traitIndex: 6 };
          break;
        case 'Glasses':
          dictionaryValue = { traitType: 9, traitIndex: 7 };
          break;
        case 'Goofy Glasses':
          dictionaryValue = { traitType: 9, traitIndex: 8 };
          break; 
        case 'Money Money':
          dictionaryValue = { traitType: 9, traitIndex: 9 };
          break;
        case 'Monocle':
          dictionaryValue = { traitType: 9, traitIndex: 10 };
          break;
        case 'Opera Mask':
          dictionaryValue = { traitType: 9, traitIndex: 11 };
          break;
        case 'Orange Gamer Glasses':
          dictionaryValue = { traitType: 9, traitIndex: 12 };
          break;
        case 'Red Tea Shades':
          dictionaryValue = { traitType: 9, traitIndex: 13 };
          break;
        case 'Retro':
          dictionaryValue = { traitType: 9, traitIndex: 14 };
          break;
        case 'Scanner':
          dictionaryValue = { traitType: 9, traitIndex: 15 };
          break;
        case 'Sunglasses':
          dictionaryValue = { traitType: 9, traitIndex: 16 };
          break;
        case 'Tear Drop Tattoo':
          dictionaryValue = { traitType: 9, traitIndex: 17 };
          break; 
        case 'VR Headset':
          dictionaryValue = { traitType: 9, traitIndex: 18 };
          break;
        case 'Yellow Gamer Glasses':
          dictionaryValue = { traitType: 9, traitIndex: 19 };
          break;
        default: 
          console.log('Something went wrong fetching traitValue from dictionary', attribute.trait_type, attribute.value);
        }
      break;
    case 'Head Wear':
      switch (attribute.value) {
        case 'Bald':
          dictionaryValue = { traitType: 10, traitIndex: 0 };
          break;
        case 'Anonymous Mask':
          dictionaryValue = { traitType: 10, traitIndex: 1 };
          break;
        case 'Army Helmet':
          dictionaryValue = { traitType: 10, traitIndex: 2 };
          break;
        case 'Artion Hair':
          dictionaryValue = { traitType: 10, traitIndex: 3 };
          break;
        case "Bear Hood":
          dictionaryValue = { traitType: 10, traitIndex: 4 };
          break;
        case 'Bitcoin Crown':
          dictionaryValue = { traitType: 10, traitIndex: 5 };
          break;
        case 'Black Long Hair':
          dictionaryValue = { traitType: 10, traitIndex: 6 };
          break;
        case 'Blonde Long Hair':
          dictionaryValue = { traitType: 10, traitIndex: 7 };
          break;
        case 'Blue Bandana':
          dictionaryValue = { traitType: 10, traitIndex: 8 };
          break; 
        case 'Blue Cap':
          dictionaryValue = { traitType: 10, traitIndex: 9 };
          break;
        case 'Blue Party Hat':
          dictionaryValue = { traitType: 10, traitIndex: 10 };
          break;
        case 'Brown Earmuffs':
          dictionaryValue = { traitType: 10, traitIndex: 11 };
          break;
        case 'Brunette Long Hair':
          dictionaryValue = { traitType: 10, traitIndex: 12 };
          break;
        case 'Burnt Orange Cap':
          dictionaryValue = { traitType: 10, traitIndex: 13 };
          break;
        case 'Captain Hat':
          dictionaryValue = { traitType: 10, traitIndex: 14 };
          break;
        case 'Circle Mask':
          dictionaryValue = { traitType: 10, traitIndex: 15 };
          break;
        case 'Chef Hat':
          dictionaryValue = { traitType: 10, traitIndex: 16 };
          break;
        case 'Cleaver':
          dictionaryValue = { traitType: 10, traitIndex: 17 };
          break; 
        case 'Crazy Hair':
          dictionaryValue = { traitType: 10, traitIndex: 18 };
          break;
        case 'Crown':
          dictionaryValue = { traitType: 10, traitIndex: 19 };
          break;
        case 'Curly Blonde':
          dictionaryValue = { traitType: 10, traitIndex: 20 };
          break;
        case 'Elephant Hood':
          dictionaryValue = { traitType: 10, traitIndex: 21 };
          break;
        case 'Fire':
          dictionaryValue = { traitType: 10, traitIndex: 22 };
          break;
        case 'Frankenstein Head':
          dictionaryValue = { traitType: 10, traitIndex: 23 };
          break;
        case 'Freddy Kreuger Mask':
          dictionaryValue = { traitType: 10, traitIndex: 24 };
          break;
        case 'Froggie Hood':
          dictionaryValue = { traitType: 10, traitIndex: 25 };
          break;
        case "Ghost Mask":
          dictionaryValue = { traitType: 10, traitIndex: 26 };
          break;
        case 'Goth Hair':
          dictionaryValue = { traitType: 10, traitIndex: 27 };
          break;
        case 'Gray Beanie':
          dictionaryValue = { traitType: 10, traitIndex: 28 };
          break;
        case 'Gray Cap':
          dictionaryValue = { traitType: 10, traitIndex: 29 };
          break;
        case 'Headband':
          dictionaryValue = { traitType: 10, traitIndex: 30 };
          break; 
        case 'Huntress Mask':
          dictionaryValue = { traitType: 10, traitIndex: 31 };
          break;
        case 'Jason Voorhees Mask':
          dictionaryValue = { traitType: 10, traitIndex: 32 };
          break;
        case 'Legion Mask':
          dictionaryValue = { traitType: 10, traitIndex: 33 };
          break;
        case 'Marine Helmet':
          dictionaryValue = { traitType: 10, traitIndex: 34 };
          break;
        case 'Michael Myers Mask':
          dictionaryValue = { traitType: 10, traitIndex: 35 };
          break;
        case 'Mohawk':
          dictionaryValue = { traitType: 10, traitIndex: 36 };
          break;
        case 'Ninja Hood':
          dictionaryValue = { traitType: 10, traitIndex: 37 };
          break;
        case 'Mummy':
          dictionaryValue = { traitType: 10, traitIndex: 38 };
          break;
        case 'Orange Beanie':
          dictionaryValue = { traitType: 10, traitIndex: 39 };
          break; 
        case 'Pennywise Mask':
          dictionaryValue = { traitType: 10, traitIndex: 40 };
          break;
        case 'Pinhead Mask':
          dictionaryValue = { traitType: 10, traitIndex: 41 };
          break;
        case 'Pink Cat Headphones':
          dictionaryValue = { traitType: 10, traitIndex: 42 };
          break;
        case 'Pirate Hat':
          dictionaryValue = { traitType: 10, traitIndex: 43 };
          break;
        case 'Pointed Black Hair':
          dictionaryValue = { traitType: 10, traitIndex: 44 };
          break;
        case 'Pointed Brown Hair':
          dictionaryValue = { traitType: 10, traitIndex: 45 };
          break;
        case 'Police Hat':
          dictionaryValue = { traitType: 10, traitIndex: 46 };
          break;
        case 'Pompadour':
          dictionaryValue = { traitType: 10, traitIndex: 47 };
          break;
        case "Pumpkin Head":
          dictionaryValue = { traitType: 10, traitIndex: 48 };
          break;
        case 'Pumpkin Mowse Head':
          dictionaryValue = { traitType: 10, traitIndex: 49 };
          break;
        case 'Rainbow Mohawk':
          dictionaryValue = { traitType: 10, traitIndex: 50 };
          break;
        case 'Red Cap':
          dictionaryValue = { traitType: 10, traitIndex: 51 };
          break;
        case 'Red Headphones':
          dictionaryValue = { traitType: 10, traitIndex: 52 };
          break; 
        case 'Red Party Hat':
          dictionaryValue = { traitType: 10, traitIndex: 53 };
          break;
        case 'Red Riding Hood':
          dictionaryValue = { traitType: 10, traitIndex: 54 };
          break;
        case 'Scream Mask':
          dictionaryValue = { traitType: 10, traitIndex: 55 };
          break;
        case 'Spiky Hair':
          dictionaryValue = { traitType: 10, traitIndex: 56 };
          break;
        case 'Spooky Hat':
          dictionaryValue = { traitType: 10, traitIndex: 57 };
          break;
        case 'Square Mask':
          dictionaryValue = { traitType: 10, traitIndex: 58 };
          break;
        case 'Straw Hat':
          dictionaryValue = { traitType: 10, traitIndex: 59 };
          break;
        case 'Tiara':
          dictionaryValue = { traitType: 10, traitIndex: 60 };
          break;
        case 'Tomb':
          dictionaryValue = { traitType: 10, traitIndex: 61 };
          break; 
        case 'Top Hat':
          dictionaryValue = { traitType: 10, traitIndex: 62 };
          break;
        case 'Triangle Mask':
          dictionaryValue = { traitType: 10, traitIndex: 63 };
          break;
        case 'Twirly Cap':
          dictionaryValue = { traitType: 10, traitIndex: 64 };
          break;
        case 'Witch Hat':
          dictionaryValue = { traitType: 10, traitIndex: 65 };
          break;
        default: 
          console.log('Something went wrong fetching traitValue from dictionary', attribute.trait_type, attribute.value);
        }
      break;
    case 'Jewelry':
      switch (attribute.value) {
        case 'None':
          break;
        case 'Bitcoin Chain':
          dictionaryValue = { traitType: 11, traitIndex: 0 };
          break;
        case 'Diamond Earring':
          dictionaryValue = { traitType: 11, traitIndex: 1 };
          break;
        case 'Ghost':
          dictionaryValue = { traitType: 11, traitIndex: 2 };
          break;
        case 'Gold Earring':
          dictionaryValue = { traitType: 11, traitIndex: 3 };
          break;
        case "Gold Necklace":
          dictionaryValue = { traitType: 11, traitIndex: 4 };
          break;
        case 'Pearl Necklace':
          dictionaryValue = { traitType: 11, traitIndex: 5 };
          break;
        case 'Pumpkin Earrings':
          dictionaryValue = { traitType: 11, traitIndex: 6 };
          break;
        case 'RNDM Ghost':
          dictionaryValue = { traitType: 11, traitIndex: 7 };
          break;
        case 'Shoulder Monkey':
          dictionaryValue = { traitType: 11, traitIndex: 8 };
          break; 
        case 'Shoulder Parrot':
          dictionaryValue = { traitType: 11, traitIndex: 9 };
          break;
        case 'Witch Nose':
          dictionaryValue = { traitType: 11, traitIndex: 10 };
          break;
        default: 
          console.log('Something went wrong fetching traitValue from dictionary', attribute.trait_type, attribute.value);
        }
      break;
    default:
      console.log('Something went wrong fetching traitType from dictionary', attribute.trait_type, attribute.value)
  }
  console.log('dictionaryValue', dictionaryValue);
  // DEV: remove below
  if (dictionaryValue) {
    dictionaryValue.traitIndex = 1;
  }
  console.log('after dictionaryValue', dictionaryValue);
  return dictionaryValue;
}

if (require.main === module) {
  testMintAndWearMowseWear()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
  
}

exports.testMintAndWearMowseWear = testMintAndWearMowseWear
