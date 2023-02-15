// SPDX-License-Identifier: MIT
// doublesharp
pragma solidity ^0.8.12;

import '@openzeppelin/contracts/utils/Counters.sol';

library SetableCounters {
    function set(Counters.Counter storage counter, uint256 _value) internal {
        counter._value = _value;
    }
}