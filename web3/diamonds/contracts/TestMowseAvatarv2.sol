// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.9;

// import "./TestMowseAvatar.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

// contract TestMowseAvatarv2 is TestMowseAvatar, IERC721ReceiverUpgradeable {
//     function mintMowsePackv2() external payable {
//       mowsepack.mintMowse{value: mowsepack.MINT_PRICE()}(1);
//       uint256 mowseId = mowsepack.tokenOfOwnerByIndex(address(this), mowsepack.balanceOf(address(this)) - 1);
//       mowsepack.safeTransferFrom(address(this), msg.sender, mowseId, 'mowse/wear');
//       MowseFacet(diamondAddress).mintMowsePack(msg.sender, mowseId);

//       GameStorageFacet(diamondAddress).testPatchInteraction(msg.sender);
//     }

//     function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) public pure override returns (bytes4) {
//       return IERC721ReceiverUpgradeable.onERC721Received.selector;
//     }
// }