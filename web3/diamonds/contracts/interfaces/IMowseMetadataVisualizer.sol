// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IMowseMetadataVisualizer {
    function getMowseTokenUri(uint256 mowseId) external view returns (string memory tokenURI);
}
