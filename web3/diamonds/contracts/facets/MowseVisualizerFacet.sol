// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
import "hardhat/console.sol";
/*************************************************************************
___  ___                       
|  \/  |                                          ___
| .  . | _____      _____  ___           _  _  .-'   '-.
| |\/| |/ _ \ \ /\ / / __|/ _ \         (.)(.)/         \   
| |  | | (_) \ V  V /\__ \  __/          /@@             ;
\_|  |_/\___/ \_/\_/ |___/\___|         o_\\-mm-......-mm`~~~~~~~~~~~~~~~~` 
                               
/*************************************************************************/

import "@openzeppelin/contracts/utils/Strings.sol";

import { LibDiamond } from "../libraries/LibDiamond.sol";
import '../libraries/Base64.sol';
import "../libraries/LibUtils.sol";
import { WithStorage, GameStorage, MowseWear, MowseWearDimensions, SKILL_TYPE_NUM, EQUIPPED_WEARABLE_SLOTS } from "../libraries/LibStorage.sol"; 

import { MowseFacet } from "./MowseFacet.sol";
import { MowseWearFacet } from "./MowseWearFacet.sol";

contract MowseVisualizerFacet is WithStorage {
  using Strings for uint256;
  using Strings for uint16;
  using Strings for uint8;
  using Strings for int16;

  error MowseWearMustExist(uint256 mowseWearId);

  function getMowseTokenURI(uint256 mowseId) external view returns (string memory) {
    return
      string(
        abi.encodePacked(
          'data:application/json;base64,',
          Base64.encode(
            abi.encodePacked(
              '{',
              _getNameJSON(mowseId),
              _getGenerationJSON(mowseId, ','),
              _getSkillLevelBoostsJSON(mowseId, ','),
              _getBaseAttributesJSON(','),
              _getWearableAttributesJSON(mowseId, ','),
              _getMowseImageJSON(mowseId, ','),
              '}'
            )
          )
        )
      );
  }
  function getMowseWearTokenURI(uint256 mowseWearTokenId) external view returns (string memory) {
    return
      string(
        abi.encodePacked(
          'data:application/json;base64,',
          Base64.encode(
            abi.encodePacked(
              '{"name": "',
              gs().mowsewears[mowseWearTokenId].metadata.traitName,
              '", "description": "On chain tradeable assets to customize your Mowse.", "attributes":',
              _getMowseWearAttributeJSON(mowseWearTokenId),
              ', "image":"',
              getMowseWearImage(mowseWearTokenId),
              '"}'
            )
          )
      )
      );
  }
  function getMowseWearImageFromDictionary(uint8 traitType, uint16 traitIndex) external view returns (string memory) {
    GameStorage storage _gs = gs();
    return string(
      abi.encodePacked(
        'data:image/svg+xml;base64,',
        Base64.encode(
          abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="480" height="480" viewBox="0 0 480 480"><defs><style>.cls-1{fill:#fff;opacity:0;}</style></defs><filter id="blurFilter"><feGaussianBlur stdDeviation="1"/></filter><g id="Layer_2" data-name="Layer 2"><g id="canvas" data-name="canvas"><rect class="cls-1" width="480" height="480"/></g>',
              string(_getMowseWearImageJSON(
                traitType,
                _gs.mowseWearDictionary[traitType][traitIndex].traitName,
                traitIndex,
                _gs.mowseWearDictionary[traitType][traitIndex].baseDimensions
              )),
            '</g></svg>'
          )
        )
      )
    );
  }
  function getMowseWearImage(uint256 mowseWearTokenId) public view returns (string memory) {
    GameStorage storage _gs = gs();
    if (!MowseWearFacet(_gs.diamondAddress).mowseWearExists(mowseWearTokenId)) revert MowseWearMustExist(mowseWearTokenId);

    return string(
      abi.encodePacked(
        'data:image/svg+xml;base64,',
        Base64.encode(
          abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="480" height="480" viewBox="0 0 480 480"><defs><style>.cls-1{fill:#fff;opacity:0;}</style></defs><filter id="blurFilter"><feGaussianBlur stdDeviation="1"/></filter><g id="Layer_2" data-name="Layer 2"><g id="canvas" data-name="canvas"><rect class="cls-1" width="480" height="480"/></g>',
              string(_getMowseWearImageJSON(
                _gs.mowsewears[mowseWearTokenId].metadata.traitType,
                _gs.mowsewears[mowseWearTokenId].metadata.traitName,
                _gs.mowsewears[mowseWearTokenId].metadata.traitIndex,
                _gs.mowsewears[mowseWearTokenId].dimensions
              )),
            '</g></svg>'
          )
        )
      )
    );
  }
  
  function _getNameJSON(uint256 mowseId) private pure returns (bytes memory) {
    return abi.encodePacked('"name":"Mowse #', mowseId.toString(), '","token_id":', mowseId.toString());
  }
  function _getGenerationJSON(uint256 mowseId, string memory prepend) private view returns (bytes memory) {
    return abi.encodePacked(prepend, '"generation":', gs().mowses[mowseId].generation.toString());
  }
  function _getSkillLevelBoostsJSON(uint256 mowseId, string memory prepend) private view returns (bytes memory) {
    return abi.encodePacked(
      prepend,
      '"stats":{',
      _convertSkillStaticArrayToParts(gs().mowses[mowseId].skillLevelBoosts),
      '}');
  }
  function _getBaseAttributesJSON(string memory prepend) private view returns (bytes memory) {
    bytes memory _traitsOne = abi.encodePacked(
      _getBaseAttributeJSON(0, 0, false),
      _getBaseAttributeJSON(2, 0, true),
      _getBaseAttributeJSON(3, 0, true)
    );
    bytes memory _traitsTwo = abi.encodePacked(
      _getBaseAttributeJSON(5, 0, true),
      _getBaseAttributeJSON(6, 0, true),
      _getBaseAttributeJSON(8, 0, true)
    );
    return abi.encodePacked(prepend, '"base_attributes":[', _traitsOne, _traitsTwo, ']');
  }
  function _getBaseAttributeJSON(
    uint8 traitType,
    uint16 traitIndex,
    bool prepend
  ) internal view returns (bytes memory) {
    return
      abi.encodePacked(
        prepend ? ',' : '',
        _getMowseWearBaseAttributeJSON(traitType, traitIndex)
      );
  }
  function _getMowseWearBaseAttributeJSON(uint8 traitType, uint16 traitIndex) internal view returns (string memory) {
    return
      string(abi.encodePacked(
        '{"trait_type":"',
        WithStorage.equippedWearableSlotToString(traitType),
        '","value":"',
        gs().mowseWearDictionary[traitType][traitIndex].traitName,
        '"}'
      ));
  }
  function _getWearableAttributesJSON(uint256 mowseId, string memory prepend) private view returns (bytes memory) {
    bytes memory _traitsOne = abi.encodePacked(
      _getAttributeJSON(mowseId, 0, false),
      _getAttributeJSON(mowseId, 1, true),
      _getAttributeJSON(mowseId, 2, true)
    );
    bytes memory _traitsTwo = abi.encodePacked(
      _getAttributeJSON(mowseId, 3, true),
      _getAttributeJSON(mowseId, 4, true),
      _getAttributeJSON(mowseId, 5, true)
    );
    bytes memory _traitsThree = abi.encodePacked(
      _getAttributeJSON(mowseId, 6, true),
      _getAttributeJSON(mowseId, 7, true),
      _getAttributeJSON(mowseId, 8, true)
    );
    bytes memory _traitsFour = abi.encodePacked(
      _getAttributeJSON(mowseId, 9, true),
      _getAttributeJSON(mowseId, 10, true),
      _getAttributeJSON(mowseId, 11, true)
    );
    // Check if mowse not wearing anything to save gas?
    uint256[EQUIPPED_WEARABLE_SLOTS] memory emptySlots;
    if (keccak256(abi.encodePacked(gs().mowses[mowseId].equippedMowseWearByTokenIds)) == keccak256(abi.encodePacked(emptySlots))) {
      return abi.encodePacked(prepend, '"wearing":[]');
    } 
    // If wearing, make sure JSON is valid
    string memory fullWearableJSON = string(abi.encodePacked(_traitsOne, _traitsTwo, _traitsThree, _traitsFour));
    fullWearableJSON = keccak256(abi.encodePacked(LibUtils.getFirstChar(fullWearableJSON))) == keccak256(abi.encodePacked(",")) ? LibUtils.substring(fullWearableJSON, 1, LibUtils.utfStringLength(fullWearableJSON)) : fullWearableJSON;
    
    return abi.encodePacked(prepend, '"wearing":[', fullWearableJSON, ']');
  }
  function _getAttributeJSON(
    uint256 mowseId,
    uint8 traitType,
    bool prepend
  ) internal view returns (bytes memory) {
    uint256 mowseWearTokenId = gs().mowses[mowseId].equippedMowseWearByTokenIds[traitType];
    return
      mowseWearTokenId > 0
        ? abi.encodePacked(
          prepend ? ',' : '',
          _getMowseWearAttributeJSON(mowseWearTokenId)
        )
        : bytes('');
  }
  
  function _getMowseWearAttributeJSON(uint256 mowseWearTokenId) internal view returns (string memory) {
    GameStorage storage _gs = gs();
    uint8 traitType = _gs.mowsewears[mowseWearTokenId].metadata.traitType;
    uint16 traitIndex = _gs.mowsewears[mowseWearTokenId].metadata.traitIndex;

    return
      string(abi.encodePacked(
        '{"id":',
        mowseWearTokenId.toString(),
        ',"worn_by":',
        _gs.mowsewears[mowseWearTokenId].equippedBy.toString(),
        ',"durability":',
        _gs.mowsewears[mowseWearTokenId].durability.toString(),
        ',"trait_type":"',
        WithStorage.equippedWearableSlotToString(traitType),
        '","value":"',
        _gs.mowsewears[mowseWearTokenId].metadata.traitName,
        '",',
        _getBonusStatsJSON(
          _gs.mowsewears[mowseWearTokenId].bonuses.itemRarity, 
          _gs.mowsewears[mowseWearTokenId].bonuses.baseSkillLevelBoosts, 
          _gs.mowsewears[mowseWearTokenId].bonuses.additionalSkillLevelBoosts
        ),
        ',"frequency":"',
        _getTraitFrequency(traitType, traitIndex),
        '"}'
      )
    );
  }
  function _getTraitFrequency(uint8 traitType, uint16 traitIndex) internal view returns (string memory) {
    GameStorage storage _gs = gs();
    uint256 _frequency = uint32((_gs.mowseWearCountByTraitIndex[traitType][traitIndex] * 100000) / _gs.mowseWearCountByTraitType[traitType]);
    uint256 _whole = _frequency / 1000;
    uint256 _decimals = _frequency % 1000;
    return 
      string(
        abi.encodePacked(
          _whole.toString(),
          '.',
          _decimals < 10 ? '00' : (_decimals < 100 ? '0' : ''),
          _decimals.toString(),
          '%'
        )
      );
  }
  function _getBonusStatsJSON(uint8 itemRarity, int16[SKILL_TYPE_NUM] memory baseSkillLevelBoosts, int16[SKILL_TYPE_NUM] memory additionalSkillLevelBoosts) internal pure returns (string memory) {
    string memory bonusStats = string(
        abi.encodePacked(
          '"item_rarity":"',
          WithStorage.itemRarityToString(itemRarity),
          '","base_skill_level_bonus":{',
          _convertSkillStaticArrayToParts(baseSkillLevelBoosts),
          '},"additional_skill_level_bonus":{',
          _convertSkillStaticArrayToParts(additionalSkillLevelBoosts),
          '}'
        )
      );
    return bonusStats;
  }
  function _convertSkillStaticArrayToParts(int16[SKILL_TYPE_NUM] memory skillLevels) internal pure returns (string memory) {
    return
      string(
        abi.encodePacked(
          '"charisma":',
          LibUtils.int16ToString(skillLevels[0]),
          ',"constitution":',
          LibUtils.int16ToString(skillLevels[1]),
          ',"dexterity":',
          LibUtils.int16ToString(skillLevels[2]),
          ',"intelligence":',
          LibUtils.int16ToString(skillLevels[3]),
          ',"luck":',
          LibUtils.int16ToString(skillLevels[4]),
          ',"strength":',
          LibUtils.int16ToString(skillLevels[5]),
          ',"wisdom":',
          LibUtils.int16ToString(skillLevels[6]),
          ''
        )
      );
  }
  function _getMowseImageJSON(uint256 mowseId, string memory prepend) private view returns (bytes memory) {
    return abi.encodePacked(prepend, '"image":"data:image/svg+xml;base64,', Base64.encode(_getSVG(mowseId)), '"');
  }
  function _getSVG(uint256 mowseId) private view returns (bytes memory) {
    bytes memory _imagesOne = abi.encodePacked(
      _getSvgLayer(mowseId, 0, true),
      _getSvgLayer(mowseId, 1, false),
      _getSvgLayer(mowseId, 2, true),
      _getSvgLayer(mowseId, 3, true),
      _getSvgLayer(mowseId, 4, false),
      _getSvgLayer(mowseId, 5, true)
    );
    bytes memory _imagesTwo = abi.encodePacked(
      _getSvgLayer(mowseId, 6, true),
      _getSvgLayer(mowseId, 7, false),
      _getSvgLayer(mowseId, 8, true),
      _getSvgLayer(mowseId, 9, false),
      _getSvgLayer(mowseId, 10, false),
      _getSvgLayer(mowseId, 11, false)
    );
    return
      abi.encodePacked(
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="480" height="480" viewBox="0 0 480 480"><defs><style><![CDATA[]]></style><filter id="blur" y="-5" height="40"><feGaussianBlur in="SourceGraphic" stdDeviation="5" y="-"/></filter></defs><g id="Mowse" data-name="Mowse">',
        _imagesOne,
        _imagesTwo,
        '</g></svg>'
      );
    }

    function _getSvgLayer(uint256 mowseId, uint8 traitType, bool defaultIfEmpty) internal view returns (bytes memory) {
    GameStorage storage _gs = gs();
    uint256 mowseWearTokenId = _gs.mowses[mowseId].equippedMowseWearByTokenIds[traitType];
    return
      mowseWearTokenId > 0
        ? bytes(_getMowseWearImageJSON(
            traitType,
            _gs.mowsewears[mowseWearTokenId].metadata.traitName,
            _gs.mowsewears[mowseWearTokenId].metadata.traitIndex,
            _gs.mowsewears[mowseWearTokenId].dimensions
          ))
        : (
          defaultIfEmpty 
          ? bytes(_getMowseWearImageJSON(
            traitType,
            _gs.mowseWearDictionary[traitType][0].traitName,
            0,
            _gs.mowseWearDictionary[traitType][0].baseDimensions
            )) 
          : bytes(''));
    }
    function _getMowseWearImageJSON(
      uint8 traitType,
      string memory traitName,
      uint16 traitIndex,
      MowseWearDimensions memory dimensions
    ) internal pure returns(bytes memory imageJSON) {
        return bytes (
              abi.encodePacked(
                '<g id="',
                string(abi.encodePacked(traitType.toString(), '_', traitIndex.toString())),
                '" data-name="',
                traitName,
                '">',
                (
                  keccak256(abi.encodePacked(traitName)) == keccak256(abi.encodePacked("None")) ? 
                    abi.encodePacked('<g></g>')
                  :
                  abi.encodePacked(
                      '<image id="',
                      string(abi.encodePacked(traitType.toString(), '_', traitIndex.toString())),
                      '_Image" data-name="',
                      traitName,
                      ' Image" width="',
                      dimensions.width.toString(),
                      '" height="',
                      dimensions.height.toString(),
                      '" transform="',
                      dimensions.transform,
                      '" style="',
                      dimensions.style,
                      '" xlink:href="',
                      dimensions.image,
                      '"/>'
                  )
                ),
                '</g>'
            )
        );
    }
}