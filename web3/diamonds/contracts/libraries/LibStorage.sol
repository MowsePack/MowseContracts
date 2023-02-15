// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { LibDiamond } from "./LibDiamond.sol";
import "../MowseGold.sol";

uint256 constant SKILL_TYPE_NUM = 7;
uint256 constant EQUIPPED_WEARABLE_SLOTS = 12;
uint256 constant MOWSEPACK_MINT_MAX = 10000;
bytes32 constant MOWSE_ADMIN_ROLE = keccak256('MOWSE_ADMIN_ROLE');
bytes32 constant MOWSEWEAR_MINTER_ROLE = keccak256('MOWSEWEAR_MINTER_ROLE');
bytes32 constant MOWSE_MINTER_ROLE = keccak256('MOWSE_MINTER_ROLE');
bytes32 constant MOWSEWEAR_ADMIN_ROLE = keccak256('MOWSEWEAR_ADMIN_ROLE');
bytes32 constant MOWSEGAME_ADMIN_ROLE = keccak256('MOWSEGAME_ADMIN_ROLE');

struct GameStorage {
  address diamondAddress;
  address treasuryAddress;
  bool paused;
  // Mowse = id > 10,000
  // MowsePack = id <= 10,000
  uint256 mowseMintPrice;
  uint256 mowseTokenIdCounter; // Current tokenId of Mowse for minting purposes
  uint256 mowseWearTotalCount;  // Total Count of MowseWear minted
  uint256 mowseWearTokenIdCounter; // Current tokenId of MowseWear for minting purposes
  mapping(uint256 => Mowse) mowses;
  mapping(uint256 => MowseWear) mowsewears; // map mowsewear tokenId to MowseWear struct
  mapping(uint256 => MowseLineage) mowselineages;
  mapping(uint8 => mapping(uint16 => MowseWearMetadata)) mowseWearDictionary; // map equippable wearable slot index to dictionary index to get unique mowsewear
  mapping(uint256 => MowseWearMetadata) mowseWearDictionaryByDictionaryIndex; // map dictionary index to mowsewear (for lootbox)
  uint256 mowseWearDictionaryCount; // Counts how many items are in the mowseWearDictionary (for lootbox)
  uint16[EQUIPPED_WEARABLE_SLOTS] mowseWearDictionaryTraitCount; // count of each trait (11 shirts, 10 eyeWear, etc), used for incrementing next traitIndex
  mapping(uint8 => mapping(uint16 => uint256)) mowseWearCountByTraitIndex;  // Counts how many mowsewear are minted per traitIndex (3 Blue Headbands)
  mapping(uint8 => uint256) mowseWearCountByTraitType;  // Counts how many shirts were minted
  mapping(uint16 => string) possibleTraitTypes; // mapping of all possible traitTypes to strings
  string[] initTraitNames;  // used in DiamondInit
  // MowseWear
  uint256 mowseWearHemPrice;

  // MowseGold
  MowseGold mowsegold;
  mapping(address => uint256) initialMowseGoldClaimList;

  // MowseLootbox
  // lootbox index is the loot pool index; [0-11] are trait type specific, [12] is general pool, 13+ are any other specific pools
  mapping(uint8 => MowseLootbox) mowselootboxes;  // map lootbox index (traitType + a few more) to MowseLootbox
  // large prime used for VDF
  uint256 mowseLootboxPrime;
  // iterations for VDF
  uint256 mowseLootboxIterations;
  // nonce for VDF
  uint256 mowseLootboxNonce;
  // mapping to get seed from tokenId if minted through mowseLootbox
  mapping(uint256 => uint256) mowseLootboxTokenIdToSeed;

  // random seed for pseudo-rng
  uint256 prngSeed;
  uint256 prngNonce;

  // MowseGame
  mapping(uint256 => MowseGames) mowsegames;
  uint256 mowseGamesCount;
  mapping(string => uint256) getMowseGameByName;
  // Pay for users' gas but it ain't free yo. After x number of submits, purchase MowseGold to continue forever
  mapping(address => uint256) freeMowseGameSubmits;
  mapping(address => bool) hasPurchasedMowseGold;

  // For testnet purposes and rewarding testers
  uint256 testPatchCount;
  mapping(uint256 => TestPatch) testPatches;  // Maps patchVersion to testPatch  
}

struct TestPatch {
  uint256 testPatchVersion;
  uint256 uniqueInteractionCount; // Unique address interactions
  address[] interactedAddresses;  // Addresses that interacted
  mapping(address => uint256) numberOfInteractions; // maps addresses -> number of times interacted
}

struct Mowse {
  uint256 tokenId; // Mowse asset tokenId counter, also used to check if exists
  bool mowsewearClaimed;  // For handling newly minted MowsePack NFTs upgrading to new Mowse wrapper. 
  // BaseTraits required on all Mowse
  uint16 generation;
  MowseWearMetadata baseBackgroundColor; // Index 0
  MowseWearMetadata baseSkinColor;       // Index 2
  MowseWearMetadata baseEarType;         // Index 3
  MowseWearMetadata baseBodyType;        // Index 5
  MowseWearMetadata baseMouth;           // Index 6
  MowseWearMetadata baseEyeType;         // Index 8
  // MowseJob
  int16[SKILL_TYPE_NUM] skillLevelBoosts;  // Additional Skill LEVEL modifiers (-32768 - 32767)
  uint16[SKILL_TYPE_NUM] skillLevel; // Base Skill LEVEL, increases as ExperiencePoints caps [charisma, constitution, dexterity, intelligence, luck, strength, wisdom]
  uint32[SKILL_TYPE_NUM] skillExperiencePoints; // Skill EXPERIENCE points
  uint16[SKILL_TYPE_NUM] skillExperiencePointsBoosts; // Additional Skill EXPERIENCE points boosts
  uint8 primarySkillType;  // Primary skill preference from birth (should be 1-8), cannot change
  uint8 secondarySkillType;  // Secondary skill preference from birth (should be 1-8, can be the same as primary skill), cannot change
  uint8 profession; // Career (should be 0-8), can change. 0 = no profession
  // MowseLife
  uint16 lifeLevel; // LIFE Experience level
  uint32 lifeExperiencePoints;  // Life Experience points
  
  // MowseWear
  uint256[EQUIPPED_WEARABLE_SLOTS] equippedMowseWearByTokenIds;  // Currently equipped mowsewear tokenIds
  // [backgroundColor, backgroundFeature, skinColor, earType, shirt, bodyType, mouth, eyeBrow, eyeType, eyeWear, headWear, jewelry]

}

struct MowseWear {
  uint256 tokenId;  // MowseWear asset tokenId counter, also used to check if exists
  bool isEquipped;  // Quick way to know if a MowseWear is equipped
  uint256 equippedBy; // track which Mowse tokenId is equipped by
  uint256 durability;  // Durability time after stitching
  uint256 alterCount;
  MowseWearMetadata metadata;
  MowseWearDimensions dimensions;
  MowseWearBonuses bonuses;
}

struct MowseWearMetadata {
  uint8 traitType;  // Type of MowseWear (backgroundColor, shirt, eyeWear, etc) (should be 0-11)
  string traitName; // MowseWear item name ("Blue Headband")
  uint16 traitIndex;  // MowseWear trait index (12th headband)
  uint256 dictionaryIndex;  // MowseWear dictionary index (12th item in dictionary)
  bool nonSwappable;  // MowseWear can be equipped or not
  bool nonTransferrable;  // MowseWear can be traded or not (soulbound)
  MowseWearDimensions baseDimensions; // Base SVG Dimensions
}

struct MowseWearBonuses {
  uint256 itemRarityIV;  // Item Rarity inherent value (pseudorandom number between 0-65535)
  uint8 itemRarity; // Item Rarity (common, uncommon, rare, epic, legendary, unique) (should be 0-5)
  int16[SKILL_TYPE_NUM] baseSkillLevelBoosts; // Base Skill LEVEL modifiers from IV
  int16[SKILL_TYPE_NUM] additionalSkillLevelBoosts;  // Additional Skill LEVEL modifiers from other factors (set bonuses?)
}

struct MowseSkillTypes {
  int16 charisma;
  int16 constitution;
  int16 dexterity;
  int16 intelligence;
  int16 luck;
  int16 strength;
  int16 wisdom;
}

struct MowseWearDimensions {
  uint16 width;
  uint16 height;
  string transform;
  string style;
  string image;
  uint16 weight;
}

struct MowseLootbox {
  bool active;  // Is lootbox active and can be minted from?
  uint256 price;  // Price per MowseGold (generic loot pool cheapest -> specific trait type more expensive -> event specific)
  string name;
  mapping(uint16 => uint256) lootPool;  // TraitTypes & TraitIndexes in the lootPool for minting
  uint16 itemCount; // Number of items in lootpool
}

struct MowseLineage {
  uint16 generation;
  uint256 parent1;
  uint256 parent2;
  uint256[] children;
}

struct MowseBank {
  address _walletImplementation;
  mapping(address => uint256) balances;
  mapping(address => uint256) getTokenIdForWallet;
}

struct MowseGames {
  string name;
  uint256 totalNumberOfSubmits;
  mapping(address => uint256) uniqueSubmitsByAddress;
  address[] uniqueAddressesList;
  uint256 uniqueAddressesCount;
  mapping(address => uint256[3]) dailySubmits;
  // For granting additional bonuses for special event days
  bool rewardBonus;
}

struct BulkMowseWear {
  uint8 traitType;
  string traitName;
  bool nonSwappable;
  bool nonTransferrable;
  uint16 width;
  uint16 height;
  string transform;
  string style;
  string image;
  uint16 weight;
  bool ignoreFromLootPool;
}

library LibStorage {
  bytes32 constant GAME_STORAGE_POSITION = keccak256("mowse.game.storage");
  bytes32 constant TEST_PATCH_POSITION = keccak256("mowse.test.patch");
  bytes32 constant MOWSE_TOKEN_POSITION = keccak256("mowse.token.mowse");
  bytes32 constant MOWSEWEAR_TOKEN_POSITION = keccak256("mowse.token.mowsewear");
  bytes32 constant MOWSEWEAR_METADATA_POSITION = keccak256("mowse.mowsewear.metadata");
  bytes32 constant MOWSEWEAR_DIMENSIONS_POSITION = keccak256("mowse.mowsewear.dimensions");
  bytes32 constant MOWSE_LINEAGE_POSITION = keccak256("mowse.mowse.lineage");
  bytes32 constant MOWSEWEAR_BONUSES_POSITION = keccak256("mowse.mowsewear.bonuses");
  bytes32 constant MOWSE_BANK_POSITION = keccak256("mowse.mowse.bank");
  bytes32 constant MOWSE_SKILL_TYPES_POSITION = keccak256("mowse.skill.types");
  bytes32 constant MOWSE_LOOTBOX_POSITION = keccak256("mowse.lootbox.pool");
  bytes32 constant BULK_MOWSE_WEAR_POSITION = keccak256("mowse.bulk.mowse.wear");
  bytes32 constant MOWSE_GAMES_POSITION = keccak256("mowse.mowse.games");

  function gameStorage() internal pure returns (GameStorage storage gs) {
    bytes32 position = GAME_STORAGE_POSITION;
    assembly {
      gs.slot := position
    }
  }
  function testPatch() internal pure returns (TestPatch storage tps) {
    bytes32 position = TEST_PATCH_POSITION;
    assembly {
      tps.slot := position
    }
  }
  function mowse() internal pure returns (Mowse storage ms) {
    bytes32 position = MOWSE_TOKEN_POSITION;
    assembly {
      ms.slot := position
    }
  }
  function mowseWear() internal pure returns (MowseWear storage mws) {
    bytes32 position = MOWSEWEAR_TOKEN_POSITION;
    assembly {
      mws.slot := position
    }
  }
  function mowseWearMetadata() internal pure returns (MowseWearMetadata storage mwms) {
    bytes32 position = MOWSEWEAR_METADATA_POSITION;
    assembly {
      mwms.slot := position
    }
  }
  function mowseWearBonuses() internal pure returns (MowseWearBonuses storage mwbs) {
    bytes32 position = MOWSEWEAR_BONUSES_POSITION;
    assembly {
      mwbs.slot := position
    }
  }
  function mowseWearDimensions() internal pure returns (MowseWearDimensions storage mwds) {
    bytes32 position = MOWSEWEAR_DIMENSIONS_POSITION;
    assembly {
      mwds.slot := position
    }
  }
  function mowseLineage() internal pure returns (MowseLineage storage mls) {
    bytes32 position = MOWSE_LINEAGE_POSITION;
    assembly {
      mls.slot := position
    }
  }
  function mowseBank() internal pure returns (MowseBank storage mbs) {
    bytes32 position = MOWSE_BANK_POSITION;
    assembly {
      mbs.slot := position
    }
  }
  function mowseSkillTypes() internal pure returns (MowseSkillTypes storage mst) {
    bytes32 position = MOWSE_SKILL_TYPES_POSITION;
    assembly {
      mst.slot := position
    }
  }
  function mowseLootbox() internal pure returns (MowseLootbox storage mlb) {
    bytes32 position = MOWSE_LOOTBOX_POSITION;
    assembly {
      mlb.slot := position
    }
  }
  function bulkMowseWear() internal pure returns (BulkMowseWear storage bmw) {
    bytes32 position = BULK_MOWSE_WEAR_POSITION;
    assembly {
      bmw.slot := position
    }
  }
  function mowseGames() internal pure returns (MowseGames storage mgs) {
    bytes32 position = MOWSE_GAMES_POSITION;
    assembly {
      mgs.slot := position
    }
  }
  function skillTypeToString(uint16 x) internal pure returns (string memory skillTypeString) {
    require(x < SKILL_TYPE_NUM, "LibStorage: Invalid Skill Type");

    if (x == 0) return "charisma";
    if (x == 1) return "constitution";
    if (x == 2) return "dexterity";
    if (x == 3) return "intelligence";
    if (x == 4) return "luck";
    if (x == 5) return "strength";
    if (x == 6) return "wisdom";
  }
  function equippableWearableSlotToString(uint8 traitType) internal pure returns (string memory wearableSlotString) {
    require(traitType < EQUIPPED_WEARABLE_SLOTS, "LibStorage: Invalid Trait Type");

    if (traitType == 0) return "backgroundColor"; 
    if (traitType == 1) return "backgroundFeature"; 
    if (traitType == 2) return "skinColor"; 
    if (traitType == 3) return "earType"; 
    if (traitType == 4) return "shirt"; 
    if (traitType == 5) return "bodyType"; 
    if (traitType == 6) return "mouth"; 
    if (traitType == 7) return "eyeBrow"; 
    if (traitType == 8) return "eyeType"; 
    if (traitType == 9) return "eyeWear"; 
    if (traitType == 10) return "headWear"; 
    if (traitType == 11) return "jewelry";
  }
  function itemRarityToString(uint8 itemRarity) internal pure returns (string memory itemRarityString) {
    if (itemRarity == 0) return "common";
    if (itemRarity == 1) return "uncommon";
    if (itemRarity == 2) return "rare";
    if (itemRarity == 3) return "epic";
    if (itemRarity == 4) return "legendary";
    if (itemRarity == 5) return "unique";
  }
  function isMowsePack(uint256 mowseId) internal pure returns (bool) {
    return mowseId <= MOWSEPACK_MINT_MAX;
  }
}
contract WithStorage {
  function gs() internal pure returns (GameStorage storage) {
    return LibStorage.gameStorage();
  }
  function tps() internal pure returns (TestPatch storage) {
    return LibStorage.testPatch();
  }
  function ms() internal pure returns (Mowse storage) {
    return LibStorage.mowse();
  }
  function mws() internal pure returns (MowseWear storage) {
    return LibStorage.mowseWear();
  }
  function mwms() internal pure returns (MowseWearMetadata storage) {
    return LibStorage.mowseWearMetadata();
  }
  function mwds() internal pure returns (MowseWearDimensions storage) {
    return LibStorage.mowseWearDimensions();
  }
  function mls() internal pure returns (MowseLineage storage) {
    return LibStorage.mowseLineage();
  }
  function mwbs() internal pure returns (MowseWearBonuses storage) {
    return LibStorage.mowseWearBonuses();
  }
  function mbs() internal pure returns (MowseBank storage) {
    return LibStorage.mowseBank();
  }
  function mst() internal pure returns (MowseSkillTypes storage) {
    return LibStorage.mowseSkillTypes();
  }
  function mlb() internal pure returns (MowseLootbox storage) {
    return LibStorage.mowseLootbox();
  }
  function bmw() internal pure returns (BulkMowseWear storage) {
    return LibStorage.bulkMowseWear();
  }
  function mgs() internal pure returns (MowseGames storage) {
    return LibStorage.mowseGames();
  }
  function skillTypeToString(uint16 skillType) internal pure returns (string memory) {
    return LibStorage.skillTypeToString(skillType);
  }
  function equippedWearableSlotToString(uint8 traitType) internal pure returns (string memory) {
    return LibStorage.equippableWearableSlotToString(traitType);
  }
  function itemRarityToString(uint8 itemRarity) internal pure returns (string memory) {
    return LibStorage.itemRarityToString(itemRarity);
  }
  function isMowsePack(uint256 mowseId) internal pure returns (bool) {
    return LibStorage.isMowsePack(mowseId);
  }
}