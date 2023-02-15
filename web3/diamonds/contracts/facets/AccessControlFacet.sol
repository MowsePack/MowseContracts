// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

/*************************************************************************
___  ___                       
|  \/  |                                          ___
| .  . | _____      _____  ___           _  _  .-'   '-.
| |\/| |/ _ \ \ /\ / / __|/ _ \         (.)(.)/         \   
| |  | | (_) \ V  V /\__ \  __/          /@@             ;
\_|  |_/\___/ \_/\_/ |___/\___|         o_\\-mm-......-mm`~~~~~~~~~~~~~~~~` 
                               
/*************************************************************************/

import "@solidstate/contracts/access/access_control/AccessControl.sol";
import { AccessControlStorage } from "@solidstate/contracts/access/access_control/AccessControlStorage.sol";

import { LibDiamond } from "../libraries/LibDiamond.sol";

import { WithStorage, MOWSE_MINTER_ROLE, MOWSEWEAR_MINTER_ROLE, MOWSE_ADMIN_ROLE, 
MOWSEWEAR_ADMIN_ROLE, MOWSEGAME_ADMIN_ROLE } from "../libraries/LibStorage.sol"; 

contract AccessControlFacet is WithStorage, AccessControl {
  error MissingAdminRole(string);

  modifier onlyAdminOrCore() {
    require(msg.sender == gs().diamondAddress || msg.sender == LibDiamond.contractOwner(), "Only the Core or Admin addresses can perform this action");
    _;
  }
  modifier onlyAccessControlAdmin() {
    if (!_hasRole(AccessControlStorage.DEFAULT_ADMIN_ROLE, msg.sender)) revert MissingAdminRole('Missing Admin role');
    _;
  }

  function hasAdminRole(address account) external view returns (bool) {
    return _hasRole(AccessControlStorage.DEFAULT_ADMIN_ROLE, account);
  }
  function hasMowseAdminRole(address account) external view returns (bool) {
    return _hasRole(MOWSE_ADMIN_ROLE, account);
  }
  function hasMowseMinterRole(address account) external view returns (bool) {
    return _hasRole(MOWSE_MINTER_ROLE, account);
  }
  function hasMowseWearMinterRole(address account) external view returns (bool) {
    return _hasRole(MOWSEWEAR_MINTER_ROLE, account);
  }
  function hasMowseWearAdminRole(address account) external view returns (bool) {
    return _hasRole(MOWSEWEAR_ADMIN_ROLE, account);
  }
  function hasMowseGameAdminRole(address account) external view returns (bool) {
    return _hasRole(MOWSEGAME_ADMIN_ROLE, account);
  }
  
  function addAccountToAdminRole(address account) external onlyAdminOrCore {
    _grantRole(AccessControlStorage.DEFAULT_ADMIN_ROLE, account);
  }
  function addAccountToMowseAdminRole(address account) external onlyAccessControlAdmin {
    _grantRole(MOWSE_ADMIN_ROLE, account);
  }
  function addAccountToMowseMinterRole(address account) external onlyAccessControlAdmin {
    _grantRole(MOWSE_MINTER_ROLE, account);
  }
  function addAccountToMowseWearMinterRole(address account) external onlyAccessControlAdmin {
    _grantRole(MOWSEWEAR_MINTER_ROLE, account);
  }
  function addAccountToMowseWearAdminRole(address account) external onlyAccessControlAdmin {
    _grantRole(MOWSEWEAR_ADMIN_ROLE, account);
  }
  function addAccountToMowseGameAdminRole(address account) external onlyAccessControlAdmin {
    _grantRole(MOWSEGAME_ADMIN_ROLE, account);
  }
}