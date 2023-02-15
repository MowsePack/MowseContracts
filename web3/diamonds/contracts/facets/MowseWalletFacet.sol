// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import { IERC165 } from "@solidstate/contracts/interfaces/IERC165.sol";
// import { IERC721 } from "@solidstate/contracts/interfaces/IERC721.sol";

// import { ERC721BaseStorage } from "@solidstate/contracts/token/ERC721/base/ERC721BaseStorage.sol";
// import { MowseERC721MetadataStorage } from "../libraries/MowseERC721MetadataStorage.sol";
import { ERC721MetadataStorage } from "@solidstate/contracts/token/ERC721/metadata/ERC721MetadataStorage.sol";
import { SolidStateERC721 } from "@solidstate/contracts/token/ERC721/SolidStateERC721.sol";

// import "@openzeppelin/contracts/utils/Strings.sol";

// import {LibDiamond} from "../libraries/LibDiamond.sol";

// import { WithStorage } from "../libraries/LibStorage.sol"; 

contract MowseWalletFacet is SolidStateERC721 {

  // function mintMowsePack() external {
  //   // gs().mowseTokenId++;
  //   // mowsepack.mintMowse{value: mowsepack.MINT_PRICE()}(1);
  //   // gs().mowses[gs().mowseTokenId].mowsewearClaimed = true;  // Minted MowsePack through MowseFacet will already update to new version
  // }
  // constructor() {
    // mbs()._walletImplementation = address(new MowseWallet());

    // _setSupportsInterface(type(IERC165).interfaceId, true);
    // _setSupportsInterface(type(IERC721).interfaceId, true);
  // }
}