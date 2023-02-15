// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";
/*************************************************************************
___  ___                       
|  \/  |                                          ___
| .  . | _____      _____  ___           _  _  .-'   '-.
| |\/| |/ _ \ \ /\ / / __|/ _ \         (.)(.)/         \   
| |  | | (_) \ V  V /\__ \  __/          /@@             ;
\_|  |_/\___/ \_/\_/ |___/\___|         o_\\-mm-......-mm`~~~~~~~~~~~~~~~~` 
                               
/*************************************************************************/

import { SolidStateERC721 } from "@solidstate/contracts/token/ERC721/SolidStateERC721.sol";
import { ERC721Metadata } from "@solidstate/contracts/token/ERC721/metadata/ERC721Metadata.sol";
import { IERC721Metadata } from "@solidstate/contracts/token/ERC721/metadata/IERC721Metadata.sol";

import "@openzeppelin/contracts/utils/Strings.sol";

import { LibDiamond } from "../libraries/LibDiamond.sol";

import { WithStorage, GameStorage, MowseWear, MowseSkillTypes, MowseWearMetadata, SKILL_TYPE_NUM, EQUIPPED_WEARABLE_SLOTS, BulkMowseWear } from "../libraries/LibStorage.sol"; 

import { MowseFacet } from "./MowseFacet.sol";
import { MowseVisualizerFacet } from "./MowseVisualizerFacet.sol";
import { AccessControlFacet } from "./AccessControlFacet.sol";
import { GameStorageFacet } from "./GameStorageFacet.sol";
import { MowseLootboxFacet } from "./MowseLootboxFacet.sol";

contract MowseWearFacet is WithStorage, SolidStateERC721 {
  using Strings for uint256;

  event MowseWearMinted(address player, uint256 tokenId);

  error MissingAdminRole(string);
  error MissingMowseWearMinterRole(string);
  error MissingMowseWearAdminRole(string);
  error ContractPaused(string);
  error MowseWearMustExist(uint256 tokenId);
  error CannotFindMowseWear(uint8 traitType, uint16 traitIndex);
  error MustOwnMowseWear(uint256 tokenId);
  error NotEnoughFunds(uint256 userBalance);
  error LootPoolNotActive(uint8 lootPoolIndex, bool isActive);
  error LootPoolEmpty(uint8 lootPoolIndex);
  error LootboxPaymentUnsuccessful(uint8 lootPoolIndex);
  error InvalidDictionaryIndex(uint256 dictionaryIndex);
  error MowseWearIsTooWorn(uint256 tokenId, uint256 durability);
  error MowseWearIsTooAltered(uint256 tokenId);
  error MowseWearMustBeUnequipped(string);
  error MowseWearNotApprovedToTransfer(uint256 tokenId);
  error MowseWearPaymentNotSuccessful(uint256 tokenId);
  error DictionaryInvalidTraitType(uint8 traitType);
  error DictionaryMissingTraitName(uint8 traitType);

  modifier onlyAdmin() {
    if (!AccessControlFacet(gs().diamondAddress).hasMowseAdminRole(msg.sender)) revert MissingAdminRole('Must have Admin Role');
    _;
  }
  modifier notPaused() {
    if (gs().paused) revert ContractPaused('Contract is paused');
    _;
  }
  modifier mowseWearMustExist(uint256 _tokenId) {
    if (!_exists(_tokenId) || _tokenId == 0) revert MowseWearMustExist(_tokenId);
    _;
  }
  modifier ownsMowseWear(uint256 mowseWearId) {
    if (msg.sender != _ownerOf(mowseWearId)) revert MustOwnMowseWear(mowseWearId);
    _;
  }
  // Only used for mowsepack minting, other minting for general purposes
  function mintAndWearMowseWear(address to, uint256 mowseId, uint8 traitType, uint16 traitIndex) external {
    GameStorage storage _gs = gs();
    if (!AccessControlFacet(_gs.diamondAddress).hasMowseWearMinterRole(msg.sender)) revert MissingMowseWearMinterRole('Must have MowseWear Minter Role');
    if (bytes(_gs.mowseWearDictionary[traitType][traitIndex].traitName).length == 0) revert CannotFindMowseWear(traitType, traitIndex);
    
    uint256 currentMowseWearTokenId = _gs.mowseWearTokenIdCounter;
    _mint(to, currentMowseWearTokenId);
    _gs.mowsewears[currentMowseWearTokenId].tokenId = currentMowseWearTokenId;
    
    _setupMowseWear(currentMowseWearTokenId, traitType, traitIndex, 0);

    _gs.mowseWearCountByTraitIndex[traitType][traitIndex]++;
    _gs.mowseWearCountByTraitType[traitType]++;

    // Wear newly minted mowsewear
    _gs.mowses[mowseId].equippedMowseWearByTokenIds[traitType] = currentMowseWearTokenId;
    _gs.mowsewears[currentMowseWearTokenId].isEquipped = true;
    _gs.mowsewears[currentMowseWearTokenId].equippedBy = mowseId;
    _updateMowseStats(mowseId);

    _gs.mowseWearTokenIdCounter++;
  }
  function stitchMowseWear(uint256 mowseWearId1, uint256 mowseWearId2, uint256 mowseWearId3) external ownsMowseWear(mowseWearId1) ownsMowseWear(mowseWearId2) ownsMowseWear(mowseWearId3) notPaused {
    GameStorage storage _gs = gs();
    if (_gs.mowsewears[mowseWearId1].isEquipped || _gs.mowsewears[mowseWearId2].isEquipped || _gs.mowsewears[mowseWearId3].isEquipped) revert MowseWearMustBeUnequipped('MowseWear must be unequipped to stitch');
    if (_gs.mowsewears[mowseWearId1].durability > block.timestamp) revert MowseWearIsTooWorn(mowseWearId1, _gs.mowsewears[mowseWearId1].durability);
    if (_gs.mowsewears[mowseWearId2].durability > block.timestamp) revert MowseWearIsTooWorn(mowseWearId2, _gs.mowsewears[mowseWearId2].durability);
    if (_gs.mowsewears[mowseWearId3].durability > block.timestamp) revert MowseWearIsTooWorn(mowseWearId3, _gs.mowsewears[mowseWearId3].durability);
    if (_gs.mowsewears[mowseWearId1].alterCount > 5) revert MowseWearIsTooAltered(mowseWearId1);
    if (_gs.mowsewears[mowseWearId2].alterCount > 5) revert MowseWearIsTooAltered(mowseWearId2);
    if (_gs.mowsewears[mowseWearId3].alterCount > 5) revert MowseWearIsTooAltered(mowseWearId3);

    MowseLootboxFacet(_gs.diamondAddress).stitchMowseLootbox(msg.sender);

    _gs.mowsewears[mowseWearId1].durability = block.timestamp + getDurabilityDays(mowseWearId1);
    _gs.mowsewears[mowseWearId2].durability = block.timestamp + getDurabilityDays(mowseWearId2);
    _gs.mowsewears[mowseWearId3].durability = block.timestamp + getDurabilityDays(mowseWearId3);
    _gs.mowsewears[mowseWearId1].alterCount++;
    _gs.mowsewears[mowseWearId2].alterCount++;
    _gs.mowsewears[mowseWearId3].alterCount++;

    GameStorageFacet(_gs.diamondAddress).testPatchInteraction(msg.sender);
  }
  function getDurabilityDays(uint256 mowseWearId) internal view returns (uint256 durabilityDays) {
    GameStorage storage _gs = gs();
    if (_gs.mowsewears[mowseWearId].bonuses.itemRarity == 0) return 7 days;
    if (_gs.mowsewears[mowseWearId].bonuses.itemRarity == 1) return 6 days;
    if (_gs.mowsewears[mowseWearId].bonuses.itemRarity == 2) return 5 days;
    if (_gs.mowsewears[mowseWearId].bonuses.itemRarity == 3) return 4 days;
    if (_gs.mowsewears[mowseWearId].bonuses.itemRarity == 4) return 3 days;
    if (_gs.mowsewears[mowseWearId].bonuses.itemRarity == 5) return 2 days;
  }
  function wearMowseWear(uint256 mowseId, uint256 mowseWearId) external ownsMowseWear(mowseWearId) notPaused {
    GameStorage storage _gs = gs();
    if (_gs.mowsewears[mowseWearId].durability > block.timestamp) revert MowseWearIsTooWorn(mowseWearId, _gs.mowsewears[mowseWearId].durability);
    uint8 traitType = _gs.mowsewears[mowseWearId].metadata.traitType;
    bool isEquippedCurrently = _gs.mowses[mowseId].equippedMowseWearByTokenIds[traitType] == mowseWearId;
    // Iff same mowseWear is equipped, unequip, else 
    if (isEquippedCurrently) {
      delete _gs.mowses[mowseId].equippedMowseWearByTokenIds[traitType];
      delete _gs.mowsewears[mowseWearId].isEquipped;
      delete _gs.mowsewears[mowseWearId].equippedBy;
    } else {
      _gs.mowses[mowseId].equippedMowseWearByTokenIds[traitType] = mowseWearId;
      _gs.mowsewears[mowseWearId].isEquipped = true;
      _gs.mowsewears[mowseWearId].equippedBy = mowseId;
    }
    _updateMowseStats(mowseId);
    
    GameStorageFacet(_gs.diamondAddress).testPatchInteraction(msg.sender);
  }
  function mintMowseWear(address to, uint8 traitType, uint16 traitIndex, uint8 minRarity) external notPaused {
    GameStorage storage _gs = gs();
    if (!AccessControlFacet(_gs.diamondAddress).hasMowseWearMinterRole(msg.sender)) revert MissingMowseWearMinterRole('Must have MowseWear Minter Role');
    if (bytes(_gs.mowseWearDictionary[traitType][traitIndex].traitName).length == 0) revert CannotFindMowseWear(traitType, traitIndex);
    
    uint256 currentMowseWearTokenId = _gs.mowseWearTokenIdCounter;
    console.log('Minted MowseWear ', currentMowseWearTokenId);

    _mint(to, currentMowseWearTokenId);
    _gs.mowsewears[currentMowseWearTokenId].tokenId = currentMowseWearTokenId;
    
    _setupMowseWear(currentMowseWearTokenId, traitType, traitIndex, minRarity);

    _gs.mowseWearCountByTraitIndex[traitType][traitIndex]++;
    _gs.mowseWearCountByTraitType[traitType]++;
    _gs.mowseWearTokenIdCounter++;
  }
  function unequipAllMowseWear(uint256 tokenId) external {
    GameStorage storage _gs = gs();
    if (!AccessControlFacet(gs().diamondAddress).hasMowseWearAdminRole(msg.sender)) revert MissingMowseWearAdminRole('Must have MowseWear Admin Role');
    for(uint8 i = 0; i < EQUIPPED_WEARABLE_SLOTS; i++) {
      uint256 equippedMowseWearTokenId = _gs.mowses[tokenId].equippedMowseWearByTokenIds[i];
      if (equippedMowseWearTokenId > 0) {
        delete _gs.mowsewears[equippedMowseWearTokenId].isEquipped;
        delete _gs.mowsewears[equippedMowseWearTokenId].equippedBy;
        delete _gs.mowses[tokenId].equippedMowseWearByTokenIds[i];
      }
    }
    _updateMowseStats(tokenId);
  }
  function getMowseWearNameFromDictionary(uint8 traitType, uint16 traitIndex) public view returns (string memory traitName){
    GameStorage storage _gs = gs();
    if (bytes(_gs.mowseWearDictionary[traitType][traitIndex].traitName).length == 0) revert CannotFindMowseWear(traitType, traitIndex);
    
    return _gs.mowseWearDictionary[traitType][traitIndex].traitName;
  }
  function getMowseWearByDictionaryIndex(uint256 index) external view returns (string memory, string memory) {
    GameStorage storage _gs = gs();
    if (index >= _gs.mowseWearDictionaryCount) revert InvalidDictionaryIndex(index);

    string memory name = _gs.mowseWearDictionaryByDictionaryIndex[index].traitName;
    uint8 traitType = _gs.mowseWearDictionaryByDictionaryIndex[index].traitType;
    uint16 traitIndex = _gs.mowseWearDictionaryByDictionaryIndex[index].traitIndex;
    string memory image = MowseVisualizerFacet(_gs.diamondAddress).getMowseWearImageFromDictionary(traitType, traitIndex);
    return (name, image);
  }
  // For admin purposes to add multiple mowsewear at once using a script
  function bulkAddMowseWearToDictionary(BulkMowseWear[] memory bulkMowseWear) external onlyAdmin {
    for(uint256 i = 0; i < bulkMowseWear.length; i++) {
      addMowseWearToDictionary(
        bulkMowseWear[i].traitType,
        bulkMowseWear[i].traitName,
        bulkMowseWear[i].nonSwappable,
        bulkMowseWear[i].nonTransferrable,
        bulkMowseWear[i].width,
        bulkMowseWear[i].height,
        bulkMowseWear[i].transform,
        bulkMowseWear[i].style,
        bulkMowseWear[i].image,
        bulkMowseWear[i].weight,
        bulkMowseWear[i].ignoreFromLootPool);
    }
  }
  function addMowseWearToDictionary(
    uint8 traitType, 
    string memory traitName,
    bool nonSwappable,
    bool nonTransferrable,
    uint16 width,
    uint16 height,
    string memory transform,
    string memory style,
    string memory image,
    uint16 weight,
    bool ignoreFromLootPool
    ) public onlyAdmin {
      console.log('Adding MowseWear to Dictionary', traitName);
      if (traitType >= EQUIPPED_WEARABLE_SLOTS) revert DictionaryInvalidTraitType(traitType);
      if (bytes(traitName).length == 0) revert DictionaryMissingTraitName(traitType);

      uint16 currentTraitIndex = gs().mowseWearDictionaryTraitCount[traitType];
      console.log('Should add index', currentTraitIndex);
      uint256 dictionaryIndex = gs().mowseWearDictionaryCount;
      _updateMowseWearDictionary(
        traitType, 
        traitName, 
        currentTraitIndex,
        dictionaryIndex,
        nonSwappable, 
        nonTransferrable, 
        width, 
        height, 
        transform, 
        style, 
        image, 
        weight);

      // For event items, don't add to loot pool. Manually add them as admin
      if (!ignoreFromLootPool) {  
        // Add mowsewear to dictionary index
        gs().mowseWearDictionaryByDictionaryIndex[dictionaryIndex] = gs().mowseWearDictionary[traitType][currentTraitIndex];
        // Add mowseWear to general lootpool [12]
        MowseLootboxFacet(gs().diamondAddress).updateMowseLootboxItem(12, dictionaryIndex, true, 0);
        // Add to trait-specific lootpool [0-11]
        MowseLootboxFacet(gs().diamondAddress).updateMowseLootboxItem(traitType, dictionaryIndex, true, 0);
      }

      gs().mowseWearDictionaryTraitCount[traitType]++;
      gs().mowseWearDictionaryCount++;

      console.log('Added ', dictionaryIndex, ' to dictionary');
  }
  function updateMowseWearDictionary(
    uint8 traitType,
    string memory traitName,
    uint16 traitIndex,
    bool nonSwappable,
    bool nonTransferrable,
    uint16 width,
    uint16 height,
    string memory transform,
    string memory style,
    string memory image,
    uint16 weight
    ) external onlyAdmin {
      GameStorage storage _gs = gs();
      if (bytes(_gs.mowseWearDictionary[traitType][traitIndex].traitName).length == 0) revert CannotFindMowseWear(traitType, traitIndex);
      if (traitType >= EQUIPPED_WEARABLE_SLOTS) revert DictionaryInvalidTraitType(traitType);
      if (bytes(traitName).length == 0) revert DictionaryMissingTraitName(traitType);
      
      uint256 dictionaryIndex = _gs.mowseWearDictionary[traitType][traitIndex].dictionaryIndex;
      _updateMowseWearDictionary(
      traitType, 
      traitName, 
      traitIndex, 
      dictionaryIndex,
      nonSwappable,
      nonTransferrable,
      width,
      height,
      transform,
      style,
      image,
      weight);
  }
  function _updateMowseWearDictionary (
    uint8 traitType, 
    string memory traitName,
    uint16 traitIndex,
    uint256 dictionaryIndex,
    bool nonSwappable,
    bool nonTransferrable,
    uint16 width,
    uint16 height,
    string memory transform,
    string memory style,
    string memory image,
    uint16 weight
    ) internal {
      MowseWearMetadata storage metadata = gs().mowseWearDictionary[traitType][traitIndex];
      metadata.traitType = traitType;
      metadata.traitName = traitName;
      metadata.traitIndex = traitIndex;
      metadata.dictionaryIndex = dictionaryIndex;
      metadata.nonSwappable = nonSwappable;
      metadata.nonTransferrable = nonTransferrable;
      metadata.baseDimensions.width = width;
      metadata.baseDimensions.height = height;
      metadata.baseDimensions.transform = transform;
      metadata.baseDimensions.style = style;
      metadata.baseDimensions.image = image;
      metadata.baseDimensions.weight = weight;
  }
  function tokenURI(uint256 mowseWearTokenId) public view override(ERC721Metadata, IERC721Metadata) mowseWearMustExist(mowseWearTokenId) returns (string memory) {
    return MowseVisualizerFacet(gs().diamondAddress).getMowseWearTokenURI(mowseWearTokenId);
  }
  function mowseWearExists(uint256 mowseWearTokenId) external view returns (bool) {
    return _exists(mowseWearTokenId);
  }
  function hemMowseWear(uint256 mowseWearTokenId) external ownsMowseWear(mowseWearTokenId) notPaused {
    GameStorage storage _gs = gs();
    uint256 costToHem = (_gs.mowsewears[mowseWearTokenId].alterCount * _gs.mowseWearHemPrice) + _gs.mowseWearHemPrice;
    if (_gs.mowsewears[mowseWearTokenId].isEquipped) revert MowseWearMustBeUnequipped('MowseWear must be unequipped to hem');
    if (!_isApprovedOrOwner(address(this), mowseWearTokenId)) revert MowseWearNotApprovedToTransfer(mowseWearTokenId);
    if (!_gs.mowsegold.transferFrom(msg.sender, address(GameStorageFacet(_gs.diamondAddress)), costToHem)) revert MowseWearPaymentNotSuccessful(mowseWearTokenId);
    
    (uint256 _randomness, uint256 _randomSeed) = _getRandomSeed();
    // 5% chance to burn when hemming
    if (_randomness % 20 == 0) {
      console.log('Burned by hem');
      // Burned. Oofies.
      _burn(mowseWearTokenId);
    } else {
      updateMowseWearSkillPoints(mowseWearTokenId, _randomness, _randomSeed, 0);
      _gs.mowsewears[mowseWearTokenId].alterCount++;
    }

    GameStorageFacet(_gs.diamondAddress).testPatchInteraction(msg.sender);
  }
  function getHemPrice() external view returns (uint256 hemPrice) {
    return gs().mowseWearHemPrice;
  }
  function setHemPrice(uint256 newHemPrice) external onlyAdmin {
    gs().mowseWearHemPrice = newHemPrice;
  }
  function _setupMowseWear(uint256 mowseWearTokenId, uint8 traitType, uint16 traitIndex, uint8 minRarity) internal {
    GameStorage storage _gs = gs();
    // get MowseWear from dictionary
    MowseWearMetadata memory baseMetadata = _gs.mowseWearDictionary[traitType][traitIndex];

    _gs.mowsewears[mowseWearTokenId].tokenId = mowseWearTokenId;
    _gs.mowsewears[mowseWearTokenId].metadata.traitType = traitType;
    _gs.mowsewears[mowseWearTokenId].metadata.traitName = baseMetadata.traitName;
    _gs.mowsewears[mowseWearTokenId].metadata.traitIndex = traitIndex;
    _gs.mowsewears[mowseWearTokenId].metadata.dictionaryIndex = baseMetadata.dictionaryIndex;
    _gs.mowsewears[mowseWearTokenId].metadata.nonSwappable = baseMetadata.nonSwappable;
    _gs.mowsewears[mowseWearTokenId].metadata.nonTransferrable = baseMetadata.nonTransferrable;

    // set base dimensions (There may be future updates to modify svg elements/filters)
    _gs.mowsewears[mowseWearTokenId].metadata.baseDimensions.width = baseMetadata.baseDimensions.width;
    _gs.mowsewears[mowseWearTokenId].metadata.baseDimensions.height = baseMetadata.baseDimensions.height;
    _gs.mowsewears[mowseWearTokenId].metadata.baseDimensions.transform = baseMetadata.baseDimensions.transform;
    _gs.mowsewears[mowseWearTokenId].metadata.baseDimensions.style = baseMetadata.baseDimensions.style;
    _gs.mowsewears[mowseWearTokenId].metadata.baseDimensions.image = baseMetadata.baseDimensions.image;
    _gs.mowsewears[mowseWearTokenId].metadata.baseDimensions.weight = baseMetadata.baseDimensions.weight;

    // These dimensions may be updated in the future
    _gs.mowsewears[mowseWearTokenId].dimensions.width = baseMetadata.baseDimensions.width;
    _gs.mowsewears[mowseWearTokenId].dimensions.height = baseMetadata.baseDimensions.height;
    _gs.mowsewears[mowseWearTokenId].dimensions.transform = baseMetadata.baseDimensions.transform;
    _gs.mowsewears[mowseWearTokenId].dimensions.style = baseMetadata.baseDimensions.style;
    _gs.mowsewears[mowseWearTokenId].dimensions.image = baseMetadata.baseDimensions.image;
    _gs.mowsewears[mowseWearTokenId].dimensions.weight = baseMetadata.baseDimensions.weight;

    // random number max 65535 bc bonus stats are uint16
    (uint256 _randomness, uint256 _randomSeed) = _getRandomSeed();
    updateMowseWearSkillPoints(mowseWearTokenId, _randomness, _randomSeed, minRarity);
  }
  function _getRandomSeed() internal returns(uint256 randomness, uint256 randomSeed) {
    uint256 _randomness = uint256(keccak256(abi.encodePacked(gs().prngSeed, gs().prngNonce++, block.timestamp, msg.sender, blockhash(block.number - 1))));
    uint256 _randomSeed = _randomness % 65535;
    return (_randomness, _randomSeed);
  }
  function updateMowseWearSkillPoints(uint256 mowseWearTokenId, uint256 _randomness, uint256 _randomSeed, uint8 minRarity) internal {
    GameStorage storage _gs = gs();
    (uint256 itemRarityIV, uint8 itemRarity, MowseSkillTypes memory mowseSkillTypes) = _setupBonuses(_randomness, _randomSeed, minRarity);
    _gs.mowsewears[mowseWearTokenId].bonuses.itemRarityIV = itemRarityIV;
    _gs.mowsewears[mowseWearTokenId].bonuses.itemRarity = itemRarity;
    _gs.mowsewears[mowseWearTokenId].bonuses.baseSkillLevelBoosts[0] = mowseSkillTypes.charisma;
    _gs.mowsewears[mowseWearTokenId].bonuses.baseSkillLevelBoosts[1] = mowseSkillTypes.constitution;
    _gs.mowsewears[mowseWearTokenId].bonuses.baseSkillLevelBoosts[2] = mowseSkillTypes.dexterity;
    _gs.mowsewears[mowseWearTokenId].bonuses.baseSkillLevelBoosts[3] = mowseSkillTypes.intelligence;
    _gs.mowsewears[mowseWearTokenId].bonuses.baseSkillLevelBoosts[4] = mowseSkillTypes.luck;
    _gs.mowsewears[mowseWearTokenId].bonuses.baseSkillLevelBoosts[5] = mowseSkillTypes.strength;
    _gs.mowsewears[mowseWearTokenId].bonuses.baseSkillLevelBoosts[6] = mowseSkillTypes.wisdom;
  }
  function _setupBonuses(uint256 _randomness, uint256 itemRarityIV, uint8 minRarity) internal pure returns (uint256 itemIV, uint8 rarity, MowseSkillTypes memory skillTypes) {
    uint8 itemRarity;
    int16[SKILL_TYPE_NUM] memory bonusLevels;
    if (itemRarityIV < 30000) {
      itemRarity = 0; // Common       // 1 bonus level
    } else if (itemRarityIV < 50000) {
      itemRarity = 1; // Uncommon     // 2 bonus levels
    } else if (itemRarityIV < 60000) {
      itemRarity = 2; // Rare         // 4 bonus levels
    } else if (itemRarityIV < 65000) {
      itemRarity = 3; // Epic         // 8 bonus levels
    } else if (itemRarityIV < 65534) {
      itemRarity = 4; // Legendary    // 16 bonus levels
    } else if (itemRarityIV == 65534) {
      itemRarity = 5; // 5 is Unique  // 32 bonus levels
    }
    // override itemRarity if minRarity is input
    if (itemRarity < minRarity) {
      itemRarity = minRarity;
    }
    uint256 randomness = _randomness;
    // Minimum 3 bonuses, max 35
    for (uint16 i = 0; i < (2**itemRarity + 2); i++) {
      randomness >>= 2;
      uint256 bonusIndex = randomness % SKILL_TYPE_NUM;
      // 75% chance to have positive value, 25% negative
      uint256 bonusValue = randomness % 4;
      if (bonusValue < 3) {
        bonusLevels[bonusIndex]++;
      } else {
        bonusLevels[bonusIndex]--;
      }
    }
    MowseSkillTypes memory mowseSkillTypes;
    mowseSkillTypes.charisma = bonusLevels[0];
    mowseSkillTypes.constitution = bonusLevels[1];
    mowseSkillTypes.dexterity = bonusLevels[2];
    mowseSkillTypes.intelligence = bonusLevels[3];
    mowseSkillTypes.luck = bonusLevels[4];
    mowseSkillTypes.strength = bonusLevels[5];
    mowseSkillTypes.wisdom = bonusLevels[6];

    return (itemRarityIV, itemRarity, mowseSkillTypes);
  }
  function _updateMowseStats(uint256 mowseId) internal {
    GameStorage storage _gs = gs();
    int16[SKILL_TYPE_NUM] memory stats;
    for (uint16 i = 0; i < EQUIPPED_WEARABLE_SLOTS; i++) {
      // Needs to have a mowsewear equipped
      if (_gs.mowses[mowseId].equippedMowseWearByTokenIds[i] != 0) {
        for (uint16 j = 0; j < SKILL_TYPE_NUM; j++) {
          stats[j] += _gs.mowsewears[_gs.mowses[mowseId].equippedMowseWearByTokenIds[i]].bonuses.baseSkillLevelBoosts[j];
          stats[j] += _gs.mowsewears[_gs.mowses[mowseId].equippedMowseWearByTokenIds[i]].bonuses.additionalSkillLevelBoosts[j];
        }
      }
    }

    _gs.mowses[mowseId].skillLevelBoosts = stats;
  }
}