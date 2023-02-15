// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";
import '@openzeppelin/contracts/utils/Context.sol';

import './interfaces/IMowsePRNG.sol';
// import './libraries/Randomness.sol';

contract MowsePRNG is IMowsePRNG, Context {
    // using Randomness for Randomness.RNG;

    uint256 private nonce;

    // Randomness.RNG public _rng;

    /// @dev Generates a pseudo-random number.
    /// @param max the maximum value that can be returned, exclusive
    function prng(uint256 max) external override returns (uint256) {
        console.log('getting prng', max, block.timestamp, _msgSender());
        return _prng(max, 0);
    }

    /// @dev get a pseudo random number that is provably random when the seed is a VDF proof with an iteration time longer than the block finality
    /// @param max the maximum value that can be returned, exclusive
    /// @param seed the seed to use for the RNG.
    function prng(uint256 max, uint256 seed) external override returns (uint256) {
        return _prng(max, seed);
    }

    // @dev get a PRNG, possibly seeded with a provable random number
    function _prng(uint256 _max, uint256 _seed) internal returns (uint256) {
        // uint256 _randomness;
        // (, uint256 _random) = _rng.getRandomRange(_randomness, _max, _seed);
        nonce += 1;
        return
            uint256(
                keccak256(
                    abi.encodePacked(nonce, _seed, blockhash(block.number - 1), block.timestamp, _msgSender())
                )
            ) % _max;
        // return _random;
    }
}
