// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

library Randomness {

    // memory struct for rand
    struct RNG {
        uint256 seed;
        uint256 nonce;
    }

    /// @dev get a random number
    function getRandom(RNG storage _rng) external returns (uint256 randomness, uint256 random) {
        return _getRandom(_rng, 0, 2**256 - 1, _rng.seed);
    }

    /// @dev get a random number
    function getRandom(RNG storage _rng, uint256 _randomness) external returns (uint256 randomness, uint256 random) {
        return _getRandom(_rng, _randomness, 2**256 - 1, _rng.seed);
    }

    /// @dev get a random number passing in a custom seed
    function getRandom(
        RNG storage _rng,
        uint256 _randomness,
        uint256 _seed
    ) external returns (uint256 randomness, uint256 random) {
        return _getRandom(_rng, _randomness, 2**256 - 1, _seed);
    }

    /// @dev get a random number in range (0, _max)
    function getRandomRange(
        RNG storage _rng,
        uint256 _max
    ) external returns (uint256 randomness, uint256 random) {
        return _getRandom(_rng, 0, _max, _rng.seed);
    }

    /// @dev get a random number in range (0, _max)
    function getRandomRange(
        RNG storage _rng,
        uint256 _randomness,
        uint256 _max
    ) external returns (uint256 randomness, uint256 random) {
        return _getRandom(_rng, _randomness, _max, _rng.seed);
    }

    /// @dev get a random number in range (0, _max) passing in a custom seed
    function getRandomRange(
        RNG storage _rng,
        uint256 _randomness,
        uint256 _max,
        uint256 _seed
    ) external returns (uint256 randomness, uint256 random) {
        return _getRandom(_rng, _randomness, _max, _seed);
    }

    /// @dev fullfill a random number request for the given inputs, incrementing the nonce, and returning the random number
    function _getRandom(
        RNG storage _rng,
        uint256 _randomness,
        uint256 _max,
        uint256 _seed
    ) internal returns (uint256 randomness, uint256 random) {
        // if the randomness is zero, we need to fill it
        if (_randomness <= 0) {
            // increment the nonce in case we roll over
            _randomness = uint256(
                keccak256(
                    abi.encodePacked(_seed, _rng.nonce++, block.timestamp, msg.sender, blockhash(block.number - 1))
                )
            );
        }
        // mod to the requested range
        random = _randomness % _max;
        // shift bits to the right to get a new random number
        randomness = _randomness >>= 4;
    }
}