// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMowsePRNG {
    function prng(uint256 max) external returns (uint256);

    function prng(uint256 max, uint256 seed) external returns (uint256);
}
