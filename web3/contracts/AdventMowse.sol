// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/*************************************************************************
___  ___                       
|  \/  |     Advent                               ___
| .  . | _____      _____  ___           _  _  .-'   '-.
| |\/| |/ _ \ \ /\ / / __|/ _ \         (.)(.)/         \   
| |  | | (_) \ V  V /\__ \  __/          /@@             ;
\_|  |_/\___/ \_/\_/ |___/\___|         o_\\-mm-......-mm`~~~~~~~~~~~~~~~~` 
                               
/*************************************************************************/

/// @custom:security-contact mowsepack@gmail.com
contract AdventMowse is ERC721, ERC721Enumerable, Ownable {
  using Counters for Counters.Counter;
  using Strings for uint256;

  Counters.Counter private _tokenIdCounter;
  
  bool public paused = true;
  uint16 public dayIndex;
  string public tokenURIOfTheDay;
  string public baseExtension = ".json";

  struct AdventItem {
    string tokenURI;
    uint256 tokenId;
  }
  mapping(address => mapping(uint16 => AdventItem)) public adventItems;
  mapping(uint256 => string) public mapTokenIdToURI;

  event MowseMinted(uint256 tokenId);

  constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
  }

  modifier canMint () {
    require(adventItems[msg.sender][dayIndex].tokenId == 0, "Cannot mint more than one per day");
    _;
  }

  function walletOfOwner(address _owner) public view returns (uint256[] memory) {
    uint256 ownerTokenCount = balanceOf(_owner);
    uint256[] memory tokenIds = new uint256[](ownerTokenCount);
    for (uint256 i; i < ownerTokenCount; i++) {
      tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
    }
    return tokenIds;
  }

  function safeMint(address to) canMint() public {
    uint256 tokenId = _tokenIdCounter.current();
    _tokenIdCounter.increment();
    _safeMint(to, tokenId);
    emit MowseMinted(tokenId);
  }

  function tokenURI(uint256 tokenId)
  public
  view
  override(ERC721)
  returns(string memory)
  {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
    return bytes(mapTokenIdToURI[tokenId]).length > 0 
      ? string(
        abi.encodePacked(
          mapTokenIdToURI[tokenId],
          tokenId.toString(),
          baseExtension
        )
      ) : "";
  }

  // The following functions are overrides required by Solidity.

  function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
  internal
  override(ERC721, ERC721Enumerable)
  {
    super._beforeTokenTransfer(from, to, tokenId, batchSize);
  }

  function supportsInterface(bytes4 interfaceId)
  public
  view
  override(ERC721, ERC721Enumerable)
  returns(bool)
  {
    return super.supportsInterface(interfaceId);
  }

  // onlyOwner
  function setTokenURIAndDayNumber(string memory newTokenURI, uint16 newDayIndex) public onlyOwner {
    tokenURIOfTheDay = newTokenURI;
    dayIndex = newDayIndex;
  }

  function ownerMint(address to, string memory tokenURIToMint, uint16 dayToMint) public onlyOwner {
    uint256 tokenId = _tokenIdCounter.current();
    _tokenIdCounter.increment();
    adventItems[to][dayToMint].tokenId = tokenId;
    adventItems[to][dayToMint].tokenURI = tokenURIToMint;
    mapTokenIdToURI[tokenId] = tokenURIToMint;
    _safeMint(to, tokenId);
    emit MowseMinted(tokenId);
  }

  function setBaseExtension(string memory _newBaseExtension) public onlyOwner {
    baseExtension = _newBaseExtension;
  }

  function pause(bool _state) public onlyOwner {
    paused = _state;
  }

  function withdraw() public payable onlyOwner {
    (bool os, ) = payable(owner()).call{value: address(this).balance}("");
    require(os);
  }
}