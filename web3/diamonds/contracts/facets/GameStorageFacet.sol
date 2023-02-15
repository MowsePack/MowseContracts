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

import { LibDiamond } from "../libraries/LibDiamond.sol";

import { WithStorage, GameStorage } from "../libraries/LibStorage.sol"; 
import { AccessControlFacet } from "./AccessControlFacet.sol";

contract GameStorageFacet is WithStorage {
  modifier onlyAdminOrCore() {
    require(msg.sender == gs().diamondAddress || msg.sender == LibDiamond.contractOwner(), "Only the Core or Admin addresses can perform this action");
    _;
  }
  modifier testPatchExists(uint256 patchVersion) {
    require(gs().testPatchCount >= patchVersion, 'Test Patch does not exist');
    _;

  }
  function isPaused() external view returns (bool) {
    return gs().paused;
  }
  function getMowseTokenIdCounter() external view returns (uint256) {
    return gs().mowseTokenIdCounter;
  }

  // For MowseGames
  function setHasPurchasedMowseGold(address account) external {
    require(AccessControlFacet(gs().diamondAddress).hasMowseAdminRole(msg.sender), "Only MowseGame Admin addresses can perform this action");
    gs().hasPurchasedMowseGold[account] = true;
  }

  // Claim MGOLD
  function getMowseGoldToClaim(address account) public view returns (uint256) {
    return gs().initialMowseGoldClaimList[account];
  }
  function setMowseGoldToClaim(address account, uint256 amount) public {
    require(AccessControlFacet(gs().diamondAddress).hasMowseAdminRole(msg.sender), "Only MowseGame Admin addresses can perform this action");
    gs().initialMowseGoldClaimList[account] = amount;
  }
  function claimInitialMowseGold(address account) external {
    require(getMowseGoldToClaim(account) > 0, "GameStorage/No MGOLD to claim");
    gs().mowsegold.mint(account, getMowseGoldToClaim(account));
    setMowseGoldToClaim(account, 0);
  }

  // TestPatch methods
  function getPatchVersion() external view returns (uint256) {
    return gs().testPatchCount;
  }
  function getUniqueInteractionCount(uint256 patchVersion) external view testPatchExists(patchVersion) returns(uint256) {
    return gs().testPatches[patchVersion].uniqueInteractionCount;
  }
  function getInteractedAddresses(uint256 patchVersion) external view testPatchExists(patchVersion) returns (address[] memory) {
    return gs().testPatches[patchVersion].interactedAddresses;
  }
  function getNumberOfInteractionsByAddress(uint256 patchVersion, address account) external view testPatchExists(patchVersion) returns (uint256) {
    return gs().testPatches[patchVersion].numberOfInteractions[account];
  }
  function testPatchInteraction(address account) external {
    console.log('Test Patch Interaction', account, msg.sender);
    GameStorage storage _gs = gs();
    uint256 patchVersion = _gs.testPatchCount;
    if (_gs.testPatches[patchVersion].numberOfInteractions[account] == 0) {
      _gs.testPatches[patchVersion].uniqueInteractionCount++;
      _gs.testPatches[patchVersion].interactedAddresses.push(account);
    }
    _gs.testPatches[patchVersion].numberOfInteractions[account]++;
  }
  function nextPatch() external onlyAdminOrCore {
    GameStorage storage _gs = gs();
    _gs.testPatchCount++;
    _gs.testPatches[_gs.testPatchCount].testPatchVersion++;
  }

  function setTreasuryAddress(address newTreasuryAddress) external onlyAdminOrCore {
    gs().treasuryAddress = newTreasuryAddress;
  }
  function pause(bool _state) external onlyAdminOrCore {
    gs().paused = _state;
  }
  function approveMowseGold(address recipient) external onlyAdminOrCore {
    uint256 approve_amount = 115792089237316195423570985008687907853269984665640564039457584007913129639935; //(2^256 - 1 )
    // Approve unlimited
    gs().mowsegold.approve(recipient, approve_amount);
  }
  function withdraw() public onlyAdminOrCore {
    GameStorage storage _gs = gs();

    uint256 mowseGoldBalance = _gs.mowsegold.balanceOf(address(this));
    console.log('Withdraw', mowseGoldBalance);
    _gs.mowsegold.transferFrom(address(this), _gs.treasuryAddress, mowseGoldBalance);

    (bool os,) = payable(_gs.treasuryAddress).call{value: address(this).balance}("");
    require(os);
  }
}