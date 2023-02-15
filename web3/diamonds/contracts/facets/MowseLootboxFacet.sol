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

import "@openzeppelin/contracts/utils/Strings.sol";

import { LibDiamond } from "../libraries/LibDiamond.sol";
import "../libraries/SlothVerifiableDelay.sol";

import { WithStorage, GameStorage } from "../libraries/LibStorage.sol"; 

import { MowseWearFacet } from "./MowseWearFacet.sol";
import { AccessControlFacet } from "./AccessControlFacet.sol";
import { GameStorageFacet } from "./GameStorageFacet.sol";

contract MowseLootboxFacet is WithStorage {
  using Strings for uint256;

  event MowseLootboxChosen(address player, uint256 tokenId);

  error ContractPaused(string);
  error MissingAdminRole(string);
  error NotEnoughFunds(uint256 userBalance);
  error LootPoolNotActive(uint8 lootPoolIndex, bool isActive);
  error LootPoolEmpty(uint8 lootPoolIndex);
  error LootboxPaymentUnsuccessful(uint8 lootPoolIndex);
  error LootboxMustHaveName(uint8 lootPoolIndex);
  error LootboxItemMustExist(uint8 lootPoolIndex);
  error MowseWearNotFromLootbox(uint256 mowseWearTokenId);

  modifier notPaused() {
    if (gs().paused) revert ContractPaused('Contract is paused');
    _;
  }
  
  function getMowseLootboxData(uint8 index) external view returns (string memory lootboxName, uint256 lootboxPrice, bool lootboxActive, uint256[] memory lootboxPool) {
    GameStorage storage _gs = gs();
    uint256[] memory lootPool = new uint256[](_gs.mowselootboxes[index].itemCount);
    for(uint16 i = 0; i < _gs.mowselootboxes[index].itemCount; i++) {
      lootPool[i] = _gs.mowselootboxes[index].lootPool[i];
    }
    return (_gs.mowselootboxes[index].name, _gs.mowselootboxes[index].price, _gs.mowselootboxes[index].active, lootPool);
  }
  function purchaseMowseLootbox(uint8 index) external notPaused {
    GameStorage storage _gs = gs();
    uint256 lootboxPrice = _gs.mowselootboxes[index].price;
    if (_gs.mowsegold.balanceOf(msg.sender) <= lootboxPrice) revert NotEnoughFunds(_gs.mowsegold.balanceOf(msg.sender));
    if (!_gs.mowselootboxes[index].active) revert LootPoolNotActive(index, _gs.mowselootboxes[index].active);
    if (_gs.mowselootboxes[index].itemCount == 0) revert LootPoolEmpty(index);
    if (!_gs.mowsegold.transferFrom(msg.sender, address(GameStorageFacet(_gs.diamondAddress)), lootboxPrice)) revert LootboxPaymentUnsuccessful(index);
    
    uint256 currentMowseWearTokenId = _gs.mowseWearTokenIdCounter;

    randomlyMintLootboxItem(index, msg.sender);

    emit MowseLootboxChosen(msg.sender, currentMowseWearTokenId);

    GameStorageFacet(_gs.diamondAddress).testPatchInteraction(msg.sender);
  }
  function stitchMowseLootbox(address sender) external {
    if (!AccessControlFacet(gs().diamondAddress).hasMowseAdminRole(msg.sender)) revert MissingAdminRole('Must have Admin Role');
    
    // Randomly stitch something from index12 lootpool (all mowsewear)
    randomlyMintLootboxItem(12, sender);
  }
  function randomlyMintLootboxItem(uint8 index, address sender) internal {
    GameStorage storage _gs = gs();
    // first get vdf seed
    uint256 vdfSeed = uint256(keccak256(abi.encodePacked(sender, _gs.mowseLootboxNonce++, block.timestamp, blockhash(block.number - 1))));
    uint256 currentMowseWearTokenId = _gs.mowseWearTokenIdCounter;
    _gs.mowseLootboxTokenIdToSeed[currentMowseWearTokenId] = vdfSeed;
    // mint using this seed
    uint16 randomLootPoolIndex = uint16(vdfSeed % _gs.mowselootboxes[index].itemCount);
    uint256 dictionaryIndex = _gs.mowselootboxes[index].lootPool[randomLootPoolIndex];
    uint8 traitType = _gs.mowseWearDictionaryByDictionaryIndex[dictionaryIndex].traitType;
    uint16 traitIndex = _gs.mowseWearDictionaryByDictionaryIndex[dictionaryIndex].traitIndex;

    MowseWearFacet(_gs.diamondAddress).mintMowseWear(sender, traitType, traitIndex, 0);
  }
  // index is the loot pool index; [0-11] are trait type specific, [12] is general pool, 13+ are any other specific pools
  function updateMowseLootboxItem(uint8 index, uint256 dictionaryIndex, bool justAdding, uint16 poolIndex) external {
    GameStorage storage _gs = gs();
    if (!AccessControlFacet(gs().diamondAddress).hasMowseAdminRole(msg.sender)) revert MissingAdminRole('Must have Admin Role');
    
    // if justAdding = true, ignore poolIndex
    if (justAdding) {
      _gs.mowselootboxes[index].lootPool[_gs.mowselootboxes[index].itemCount] = dictionaryIndex;
      _gs.mowselootboxes[index].itemCount++;
    } else {
      if (poolIndex >= _gs.mowselootboxes[index].itemCount) revert LootboxItemMustExist(index);
      
      // only update traitType and traitIndex
      _gs.mowselootboxes[index].lootPool[poolIndex] = dictionaryIndex;
    }
  }
  
  
  function _prove(uint256 proof, uint256 seed) internal view returns (bool) {
    GameStorage storage _gs = gs();
    return SlothVerifiableDelay.verify(proof, seed, _gs.mowseLootboxPrime, _gs.mowseLootboxIterations);
  }

  function getProofById(uint256 tokenId) external view returns (uint256) {
    GameStorage storage _gs = gs();
    if (_gs.mowseLootboxTokenIdToSeed[tokenId] == 0) revert MowseWearNotFromLootbox(tokenId);

    return SlothVerifiableDelay.compute(_gs.mowseLootboxTokenIdToSeed[tokenId], _gs.mowseLootboxPrime, _gs.mowseLootboxIterations);
  }
  function proveById(uint256 tokenId, uint256 proof) external view returns (bool) {
    GameStorage storage _gs = gs();
    if (_gs.mowseLootboxTokenIdToSeed[tokenId] == 0) revert MowseWearNotFromLootbox(tokenId);

    if (_prove(proof, _gs.mowseLootboxTokenIdToSeed[tokenId])) {
      return true;
    } else {
      return false;
    }
  }

  function resetMowseLootbox(uint8 index) external {
    GameStorage storage _gs = gs();
    if (!AccessControlFacet(_gs.diamondAddress).hasMowseAdminRole(msg.sender)) revert MissingAdminRole('Must have Admin Role');
    
    // de-active lootbox during reset
    _gs.mowselootboxes[index].active = false;
    uint16 currentItemCount = _gs.mowselootboxes[index].itemCount;
    for (uint16 i = 0; i < currentItemCount; i++) {
      delete _gs.mowselootboxes[index].lootPool[i];
    }

    _gs.mowselootboxes[index].itemCount = 0;
  }
  function setMowseLootboxActive(uint8 index, bool active) external {
    GameStorage storage _gs = gs();
    if (!AccessControlFacet(_gs.diamondAddress).hasMowseAdminRole(msg.sender)) revert MissingAdminRole('Must have Admin Role');

    _gs.mowselootboxes[index].active = active;
  }
  function setMowseLootboxPrice(uint8 index, uint256 price) external {
    GameStorage storage _gs = gs();
    if (!AccessControlFacet(_gs.diamondAddress).hasMowseAdminRole(msg.sender)) revert MissingAdminRole('Must have Admin Role');

    _gs.mowselootboxes[index].price = price;
  }
  function setMowseLootboxName(uint8 index, string memory name) external {
    GameStorage storage _gs = gs();
    if (!AccessControlFacet(_gs.diamondAddress).hasMowseAdminRole(msg.sender)) revert MissingAdminRole('Must have Admin Role');
    if (bytes(name).length == 0) revert LootboxMustHaveName(index);

    _gs.mowselootboxes[index].name = name;
  }
}