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

import { WithStorage, MowseGames, GameStorage } from "../libraries/LibStorage.sol"; 

import { AccessControlFacet } from "./AccessControlFacet.sol";
import { GameStorageFacet } from "./GameStorageFacet.sol";

contract MowseGamesFacet is WithStorage {
  using Strings for uint256;

  event MowseGamesScoreSubmit(address player, uint256 gameId, string gameName);

  error MissingAdminRole(string);
  error MissingMowseGameAdminRole(string);
  error ContractPaused(string);
  error MowseGameMustExist(uint256 gameId);
  error DailySubmitsUsed(uint256 gameId);
  error AllFreeSubmitsUsed(string);
  error MowseGameInvalidScoreIndex(uint256 gameId);
  error MowseGameMissingName(string);
  error MowseGameNameAlreadyExists(string);

  modifier notPaused() {
    if (gs().paused) revert ContractPaused('Contract is paused');
    _;
  }
  modifier mowseGameExists(uint256 gameId) {
    if (gameId == 0 || gameId >= gs().mowseGamesCount) revert MowseGameMustExist(gameId);
    _;
  }

  function getMowseGameData(uint256 gameId) external view mowseGameExists(gameId) returns (string memory name, uint256 totalNumberOfSubmits, uint256[] memory uniqueSubmitsByAddress, address[] memory uniqueAddresses, uint256 uniqueAddressesCount, bool rewardBonus) {
    uint256[] memory uniqueSubmits = new uint256[](gs().mowsegames[gameId].uniqueAddressesCount);
    if (gs().mowsegames[gameId].uniqueAddressesCount > 0) {
      for (uint256 i = 0; i < gs().mowsegames[gameId].uniqueAddressesCount; i++) {
        address uniqueAddress = gs().mowsegames[gameId].uniqueAddressesList[i];
        console.log(gs().mowsegames[gameId].uniqueSubmitsByAddress[uniqueAddress]);
        uniqueSubmits[i] = gs().mowsegames[gameId].uniqueSubmitsByAddress[uniqueAddress];
      }
    }
    return (
      gs().mowsegames[gameId].name, 
      gs().mowsegames[gameId].totalNumberOfSubmits, 
      uniqueSubmits, 
      gs().mowsegames[gameId].uniqueAddressesList, 
      gs().mowsegames[gameId].uniqueAddressesCount,
      gs().mowsegames[gameId].rewardBonus);
  }
  function submitScore(uint256 gameId, address user) external mowseGameExists(gameId) notPaused() {
    if (!AccessControlFacet(gs().diamondAddress).hasMowseGameAdminRole(msg.sender)) revert MissingMowseGameAdminRole('Missing MowseGame Admin role');
    if (gs().freeMowseGameSubmits[user] >= 50 && !gs().hasPurchasedMowseGold[user]) revert AllFreeSubmitsUsed('All free submits used. Purchase MGOLD to continue');
    
    console.log('Submit Score', getNextAvailableScoreSubmit(gameId, user), gs().mowsegames[gameId].uniqueSubmitsByAddress[user]);
    if (getNextAvailableScoreSubmit(gameId, user) < 3) {
      // Add 23 hours cuz I hate 24 hour cycles
      gs().mowsegames[gameId].dailySubmits[user][getNextAvailableScoreSubmit(gameId, user)] = block.timestamp + 23 hours;
      bool hasNotBeenSubmittedInThePast = gs().mowsegames[gameId].uniqueSubmitsByAddress[user] == 0;
      gs().mowsegames[gameId].totalNumberOfSubmits++;
      if (hasNotBeenSubmittedInThePast) {     
        gs().mowsegames[gameId].uniqueAddressesList.push(user);
        gs().mowsegames[gameId].uniqueAddressesCount++;
      }
      gs().mowsegames[gameId].uniqueSubmitsByAddress[user]++;
      
      // Reward MGOLD
      if (gs().mowsegames[gameId].rewardBonus) {
        gs().mowsegold.mint(user, 100);
      } else {
        gs().mowsegold.mint(user, 50);
      }
      gs().freeMowseGameSubmits[user]++;

      GameStorageFacet(gs().diamondAddress).testPatchInteraction(user);
    } else {
      // probably redundant since it should revert in the if condition?
      revert DailySubmitsUsed(gameId);
    }
  }
  function getNextAvailableScoreSubmit(uint256 gameId, address user) public view mowseGameExists(gameId) returns (uint256 dailySubmitIndex) {
    if (getScoreSubmitTime(gameId, user, 0) == 0) return 0; // There hasn't been a submit yet
    if (getScoreSubmitTime(gameId, user, 1) == 0) return 1;
    if (getScoreSubmitTime(gameId, user, 2) == 0) return 2;

    if (getScoreSubmitTime(gameId, user, 0) < block.timestamp) {
      return 0;
    } else if (getScoreSubmitTime(gameId, user, 1) < block.timestamp) {
      return 1;
    } else if (getScoreSubmitTime(gameId, user, 2) < block.timestamp) {
      return 2;
    } else {
      revert DailySubmitsUsed(gameId);
    }
  }
  function getAllScoreSubmitTime(uint256 gameId, address user) external view mowseGameExists(gameId) returns (uint256, uint256, uint256) {
    return (gs().mowsegames[gameId].dailySubmits[user][0],gs().mowsegames[gameId].dailySubmits[user][1],gs().mowsegames[gameId].dailySubmits[user][2]);
  }
  function getScoreSubmitTime(uint256 gameId, address user, uint256 index) internal view mowseGameExists(gameId) returns (uint256) { 
    if (index >= 3) revert MowseGameInvalidScoreIndex(gameId);
    
    return gs().mowsegames[gameId].dailySubmits[user][index];
  }
  function addMowseGame(string memory gameName) external {
    if (!AccessControlFacet(gs().diamondAddress).hasMowseAdminRole(msg.sender)) revert MissingAdminRole('Missing Admin role');
    if (bytes(gameName).length == 0) revert MowseGameMissingName('MowseGame must have a name');
    if (gs().getMowseGameByName[gameName] != 0) revert MowseGameNameAlreadyExists('A game with that name already exists');

    gs().mowsegames[gs().mowseGamesCount].name = gameName;
    gs().getMowseGameByName[gameName] = gs().mowseGamesCount;
    gs().mowseGamesCount++;
  }
  function updateMowseGame(uint256 gameId, string memory gameName, bool rewardBonus) external mowseGameExists(gameId) {
    if (!AccessControlFacet(gs().diamondAddress).hasMowseAdminRole(msg.sender)) revert MissingAdminRole('Missing Admin role');
    if (gs().getMowseGameByName[gameName] != 0) revert MowseGameNameAlreadyExists('A game with that name already exists');

    // For renaming an existing game
    if (bytes(gameName).length > 0) {
      // first remove mapping
      delete gs().getMowseGameByName[gs().mowsegames[gameId].name];
      gs().mowsegames[gameId].name = gameName;
      gs().getMowseGameByName[gameName] = gameId;
    }
    gs().mowsegames[gameId].rewardBonus = rewardBonus;
  }
}