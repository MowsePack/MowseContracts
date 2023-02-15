// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import './IMowseMetadataVisualizer.sol';

interface IMowseWearVisualizer is IMowseMetadataVisualizer {
    function setTraitTokenIds(uint256 mowseId, uint256[] memory mowsewearIds) external;

    function setTraitTokenId(uint256 mowseId, uint256 mowseWearId) external;

    function isBeingWorn(uint256 mowseWearId) external view returns (bool);
}
