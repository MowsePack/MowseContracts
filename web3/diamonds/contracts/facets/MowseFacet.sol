// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
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

import { WithStorage, MOWSE_MINTER_ROLE, GameStorage } from "../libraries/LibStorage.sol"; 

import { MowseWearFacet } from "./MowseWearFacet.sol";
import { MowseVisualizerFacet } from "./MowseVisualizerFacet.sol";
import { AccessControlFacet } from "./AccessControlFacet.sol";
import { GameStorageFacet } from "./GameStorageFacet.sol";

contract MowseFacet is WithStorage {
  using Strings for uint256;

  event MowseMinted(address player, uint256 tokenId);

  error MissingMowseMinterRole(string);
  error MissingMowseAdminRole(string);
  error ContractPaused(string);
  error MowseMustExist(uint256 tokenId);
  error MowseAlreadyUpdated(uint256 tokenId);

  modifier notPaused() {
    if (gs().paused) revert ContractPaused('Contract is paused');
    _;
  }
  modifier mowseMustExist(uint256 _tokenId) {
    if (gs().mowses[_tokenId].tokenId == 0) revert MowseMustExist(_tokenId);
    _;
  }
  // Only allow Mowse Minting through MowseAvatar contract
  function mintMowse() external notPaused {
    if (!AccessControlFacet(address(this)).hasMowseMinterRole(msg.sender)) revert MissingMowseMinterRole('Must have Mowse Minter role');
    _mint();
  }
  function freeMint() external {
    if (!AccessControlFacet(address(this)).hasMowseAdminRole(msg.sender)) revert MissingMowseAdminRole('Must have Mowse Admin role');
    _mint();
  }
  // Only called from MowseAvatar contract
  function mintMowsePack(uint256 mowsepackId) external notPaused {
    if (!AccessControlFacet(address(this)).hasMowseMinterRole(msg.sender)) revert MissingMowseMinterRole('Must have Mowse Minter role');
    _setupMowse(mowsepackId, 0);
    console.log('setting mowseId with mowsepackId', mowsepackId);
    gs().mowses[mowsepackId].tokenId = mowsepackId;  // Flag for a mowse was minted
  }
  function mowseExists(uint256 _tokenId) external view returns(bool) {
    return gs().mowses[_tokenId].tokenId > 0;
  }
  function isMowsePackUpdated(uint256 mowseId) external view mowseMustExist(mowseId) returns(bool) {
    return gs().mowses[mowseId].mowsewearClaimed;
  }
  // Update MowsePack NFTs if they minted through original contract
  function updateMowsePack(address to, uint256 mowseId) external mowseMustExist(mowseId) notPaused {
    GameStorage storage _gs = gs();
    if (_gs.mowses[mowseId].mowsewearClaimed) revert MowseAlreadyUpdated(mowseId);

    _setupMowse(mowseId, 0);
    _gs.mowses[mowseId].tokenId = mowseId;
    _gs.mowses[mowseId].mowsewearClaimed = true;
 
    _gs.mowsegold.mint(to, 20000);

    GameStorageFacet(_gs.diamondAddress).testPatchInteraction(msg.sender);
  }
  function mowseTokenURI(uint256 mowseId) external view mowseMustExist(mowseId) returns (string memory) {
    return MowseVisualizerFacet(gs().diamondAddress).getMowseTokenURI(mowseId);
  }
  function _mint() internal {
    GameStorage storage _gs = gs();

    _setupMowse(_gs.mowseTokenIdCounter, 2);
    _gs.mowses[_gs.mowseTokenIdCounter].tokenId = _gs.mowseTokenIdCounter;  // Flag for a mowse was minted
    _gs.mowses[_gs.mowseTokenIdCounter].mowsewearClaimed = true; // Minted Mowse always true 
    _gs.mowseTokenIdCounter++;
  }
  // Set up Mowse with individual MowseWear assets and other randomly generated stats
  function _setupMowse(uint256 mowseId, uint16 generation) internal {
    GameStorage storage _gs = gs();
    
    // Set individual traits as base
    _gs.mowses[mowseId].baseBackgroundColor = _gs.mowseWearDictionary[0][0];
    _gs.mowses[mowseId].baseSkinColor = _gs.mowseWearDictionary[2][0];
    _gs.mowses[mowseId].baseEarType = _gs.mowseWearDictionary[3][0];
    _gs.mowses[mowseId].baseBodyType = _gs.mowseWearDictionary[5][0];
    _gs.mowses[mowseId].baseMouth = _gs.mowseWearDictionary[6][0];
    _gs.mowses[mowseId].baseEyeType = _gs.mowseWearDictionary[8][0];

    // Set generation
    _gs.mowses[mowseId].generation = generation;
  }
}