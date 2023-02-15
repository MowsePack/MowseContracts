// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
import "@openzeppelin/contracts/utils/Strings.sol";

library LibUtils {
  using Strings for uint16;
  // Convert int to string
  function int16ToString(int16 i) internal pure returns (string memory){
    if (i == 0) return "0";
    bool negative = i < 0;
    uint16 int16AsUint16 = uint16(abs16(i));
    return negative ? string(abi.encodePacked('-',int16AsUint16.toString())) : int16AsUint16.toString();
  }
  function abs16(int16 i) internal pure returns (int16) {
    // If i = -32768, absolute value would overflow so set to -32767 first (For more MowseGame purposes this is fine)
    if (i == -32768)
      i = -32767;
    return i >= 0 ? i : -i;
  }
  function getFirstChar(string memory _originString) internal pure returns (string memory _firstChar) {
    bytes memory firstCharByte = new bytes(1);
    firstCharByte[0] = bytes(_originString)[0];
    return string(firstCharByte);
  }
  function substring(string memory str, uint startIndex, uint endIndex) internal pure returns (string memory) {
    bytes memory strBytes = bytes(str);
    bytes memory result = new bytes(endIndex-startIndex);
    for(uint i = startIndex; i < endIndex; i++) {
        result[i-startIndex] = strBytes[i];
    }
    return string(result);
  }
  function utfStringLength(string memory str) internal pure returns (uint length) {
    uint i=0;
    bytes memory string_rep = bytes(str);

    while (i<string_rep.length)
    {
        if (string_rep[i]>>7==0)
            i+=1;
        else if (string_rep[i]>>5==bytes1(uint8(0x6)))
            i+=2;
        else if (string_rep[i]>>4==bytes1(uint8(0xE)))
            i+=3;
        else if (string_rep[i]>>3==bytes1(uint8(0x1E)))
            i+=4;
        else
            //For safety
            i+=1;

        length++;
    }
}
}