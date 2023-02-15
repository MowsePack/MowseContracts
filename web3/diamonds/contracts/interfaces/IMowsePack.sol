// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/interfaces/IERC721.sol';
import '@openzeppelin/contracts/interfaces/IERC721Enumerable.sol';
import '@openzeppelin/contracts/interfaces/IERC2981.sol';

interface IMowsePack is IERC721, IERC2981 {
    event MowseMinted(address indexed owner, uint256 indexed quantity);
    event MetadataVisualizerUpdated(
        uint256 indexed tokenId,
        address indexed newVisualizer,
        address indexed oldVisualizer
    );
    event MetadataVisualizerDisabled(uint256 indexed tokenId, address indexed previousVisualizer);

    event MetadataVisualizerActive(bool newState, bool oldState);
    event MetadataVisualizerAllowed(address indexed visualizer, bool newState, bool oldState);
    event MarketplaceUpdated(address indexed marketplace, bool newStatus, bool oldStatus);

    function mintMowse(uint8 quantity) external payable;

    function giftMowse(address to, uint256 id) external;

    function setMetadataVisualizer(uint256 tokenId, address visualizer) external;

    function disableMetadataVisualizer(uint256 tokenId) external;

    function tokenPermanentURI(uint256 tokenId) external returns (string memory);
}
