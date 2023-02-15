// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/

import {LibDiamond} from "../libraries/LibDiamond.sol";
import { IDiamondLoupe } from "../interfaces/IDiamondLoupe.sol";
import { IDiamondCut } from "../interfaces/IDiamondCut.sol";
import { IERC173 } from "../interfaces/IERC173.sol";
import { IERC165 } from "../interfaces/IERC165.sol";
import { IMowsePRNG } from "../interfaces/IMowsePRNG.sol";
import { IERC721 } from "@solidstate/contracts/interfaces/IERC721.sol";
import { IERC721Metadata } from "@solidstate/contracts/token/ERC721/metadata/IERC721Metadata.sol";
import { IERC721Enumerable } from "@solidstate/contracts/token/ERC721/enumerable/IERC721Enumerable.sol";
import { AccessControl } from "@solidstate/contracts/access/access_control/AccessControl.sol";
import { IAccessControl } from "@solidstate/contracts/access/access_control/IAccessControl.sol";
import { AccessControlStorage } from "@solidstate/contracts/access/access_control/AccessControlStorage.sol";
import { ERC721MetadataStorage } from "@solidstate/contracts/token/ERC721/metadata/ERC721MetadataStorage.sol";

import "../MowseGold.sol";

import { WithStorage, MowseWearMetadata, MowseWearDimensions, TestPatch, 
MOWSE_MINTER_ROLE, MOWSEWEAR_MINTER_ROLE, MOWSE_ADMIN_ROLE, MOWSEWEAR_ADMIN_ROLE,
MOWSEGAME_ADMIN_ROLE } from "../libraries/LibStorage.sol";

struct InitArgs {
  // MowseGold MOWSE_GOLD_CONTRACT;
  address MOWSE_GOLD_ADDRESS;
  address MOWSE_FACET_CONTRACT;
  address MOWSE_WEAR_FACET_CONTRACT;
  address MOWSE_AVATAR_CONTRACT;
  address MOWSE_LOOTBOX_FACET_CONTRACT;
  address GAME_STORAGE_FACET_CONTRACT;
  address BACKEND_ADDRESS;
  address TREASURY_ADDRESS;
}

contract DiamondInit is WithStorage, AccessControl {
  function init(InitArgs memory initArgs) external {
    // adding ERC165 data
    LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    ds.supportedInterfaces[type(IERC165).interfaceId] = true;
    ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
    ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
    ds.supportedInterfaces[type(IERC173).interfaceId] = true;
    ds.supportedInterfaces[type(IERC721).interfaceId] = true;
    ds.supportedInterfaces[type(IERC721Metadata).interfaceId] = true;
    ds.supportedInterfaces[type(IERC721Enumerable).interfaceId] = true;
    ds.supportedInterfaces[type(IMowsePRNG).interfaceId] = true;
    ds.supportedInterfaces[type(IAccessControl).interfaceId] = true;

    // Grant owner default admin role and mowse minter roles
    _grantRole(AccessControlStorage.DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MOWSE_ADMIN_ROLE, msg.sender);
    _grantRole(MOWSEWEAR_MINTER_ROLE, msg.sender);
    _grantRole(MOWSE_MINTER_ROLE, msg.sender);
    _grantRole(MOWSEWEAR_ADMIN_ROLE, msg.sender);
    _grantRole(MOWSEGAME_ADMIN_ROLE, msg.sender);

    _grantRole(MOWSE_ADMIN_ROLE, initArgs.MOWSE_WEAR_FACET_CONTRACT);
    _grantRole(MOWSE_ADMIN_ROLE, initArgs.MOWSE_AVATAR_CONTRACT);
    _grantRole(MOWSE_ADMIN_ROLE, initArgs.GAME_STORAGE_FACET_CONTRACT);
    _grantRole(MOWSE_ADMIN_ROLE, initArgs.MOWSE_GOLD_ADDRESS);
    _grantRole(MOWSE_MINTER_ROLE, initArgs.MOWSE_AVATAR_CONTRACT);
    _grantRole(MOWSEWEAR_MINTER_ROLE, initArgs.MOWSE_FACET_CONTRACT);
    _grantRole(MOWSEWEAR_MINTER_ROLE, initArgs.MOWSE_LOOTBOX_FACET_CONTRACT);
    _grantRole(MOWSEWEAR_MINTER_ROLE, initArgs.BACKEND_ADDRESS);
    _grantRole(MOWSEGAME_ADMIN_ROLE, initArgs.BACKEND_ADDRESS);
    _grantRole(MOWSEWEAR_ADMIN_ROLE, initArgs.MOWSE_AVATAR_CONTRACT);

    gs().diamondAddress = address(this);
    gs().treasuryAddress = initArgs.TREASURY_ADDRESS;
    gs().mowsegold = MowseGold(initArgs.MOWSE_GOLD_ADDRESS);

    // DEV: pause
    gs().paused = false;
    gs().mowseTokenIdCounter = 10001;
    gs().mowseWearTokenIdCounter = 1;
    gs().mowseWearHemPrice = 1000;

    gs().prngSeed = 27000212854774310952921631981309113849886549987316797529147236394264793366778;
    gs().mowseLootboxPrime = 8982557377790134965135840418214982363283;
    gs().mowseLootboxIterations = 1000;

    gs().mowseGamesCount = 1;
    gs().mowsegames[1].rewardBonus = true;
    
    gs().testPatchCount = 1;
    gs().testPatches[1].testPatchVersion = 1;
    
    ERC721MetadataStorage.Layout storage l = ERC721MetadataStorage.layout();
    l.name = "MowseWear";
    l.symbol = "MWEAR";
    
    string[] storage traitNames = gs().initTraitNames;
    traitNames.push("backgroundColor");
    traitNames.push("backgroundFeature");
    traitNames.push("skinColor");
    traitNames.push("earType");
    traitNames.push("shirt");
    traitNames.push("bodyType");
    traitNames.push("mouth");
    traitNames.push("eyeBrow");
    traitNames.push("eyeType");
    traitNames.push("eyeWear");
    traitNames.push("headWear");
    traitNames.push("jewelry");

    for (uint8 i = 0; i < traitNames.length; i++) {
      gs().possibleTraitTypes[i] = traitNames[i];
    }

    // Lootbox
    gs().mowselootboxes[0].name = "Carton of Colors - Only Background Colors";
    gs().mowselootboxes[0].price = 800;
    gs().mowselootboxes[0].active = true;
    gs().mowselootboxes[1].name = "Footlocker of Features - Only Background Features";
    gs().mowselootboxes[1].price = 1200;
    gs().mowselootboxes[1].active = true;
    gs().mowselootboxes[2].name = "Sturdy Strongbox - Only Skin Colors";
    gs().mowselootboxes[2].price = 800;
    gs().mowselootboxes[2].active = true;
    gs().mowselootboxes[3].name = "Wickearwork Box - Only Ear Types";
    gs().mowselootboxes[3].price = 800;
    gs().mowselootboxes[3].active = true;
    gs().mowselootboxes[4].name = "Pile of Shirts - Only Shirts";
    gs().mowselootboxes[4].price = 1200;
    gs().mowselootboxes[4].active = true;
    gs().mowselootboxes[5].name = "Musky Creel - Only Body Types";
    gs().mowselootboxes[5].price = 800;
    gs().mowselootboxes[5].active = true;
    gs().mowselootboxes[6].name = "Stuffed Laundry Machine - Only Mouths";
    gs().mowselootboxes[6].price = 1000;
    gs().mowselootboxes[6].active = true;
    gs().mowselootboxes[7].name = "Caterpillar Linen Basket - Only Eye Brows";
    gs().mowselootboxes[7].price = 1000;
    gs().mowselootboxes[7].active = true;
    gs().mowselootboxes[8].name = "Round Hamper - Only Eye Types";
    gs().mowselootboxes[8].price = 1000;
    gs().mowselootboxes[8].active = true;
    gs().mowselootboxes[9].name = "Cardboard Box - Only Eye Wears";
    gs().mowselootboxes[9].price = 1000;
    gs().mowselootboxes[9].active = true;
    gs().mowselootboxes[10].name = "Top Load Washer - Only Head Wears";
    gs().mowselootboxes[10].price = 1200;
    gs().mowselootboxes[10].active = true;
    gs().mowselootboxes[11].name = "Jar of Jewels - Only Jewelry";
    gs().mowselootboxes[11].price = 1500;
    gs().mowselootboxes[11].active = true;
    gs().mowselootboxes[12].name = "Budget Plastic Hamper - All MowseWear";
    gs().mowselootboxes[12].price = 500;
    gs().mowselootboxes[12].active = true;
  }

  function createBaseDimensions(
    uint16 width, 
    uint16 height, 
    string memory transform, 
    string memory style, 
    string memory image, 
    uint16 weight
    ) internal pure returns (MowseWearDimensions memory) {
    return MowseWearDimensions({
      width: width,
      height: height,
      transform: transform,
      style: style,
      image: image,
      weight: weight
    });
  }
  function createMowseWearMetadata(
    uint8 traitType, 
    string memory traitName, 
    uint16 traitIndex, 
    uint256 dictionaryIndex,
    bool nonSwappable, 
    bool nonTransferrable, 
    MowseWearDimensions memory baseDimensions
    ) internal pure returns (MowseWearMetadata memory) {
    return MowseWearMetadata({
      traitType: traitType,
      traitName: traitName,
      traitIndex: traitIndex,
      dictionaryIndex: dictionaryIndex,
      nonSwappable: nonSwappable,
      nonTransferrable: nonTransferrable,
      baseDimensions: baseDimensions
    });
  }


}
