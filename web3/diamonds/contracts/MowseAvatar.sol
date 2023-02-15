// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "hardhat/console.sol";
/*************************************************************************
___  ___                       
|  \/  |                                          ___
| .  . | _____      _____  ___           _  _  .-'   '-.
| |\/| |/ _ \ \ /\ / / __|/ _ \         (.)(.)/         \   
| |  | | (_) \ V  V /\__ \  __/          /@@             ;
\_|  |_/\___/ \_/\_/ |___/\___|         o_\\-mm-......-mm`~~~~~~~~~~~~~~~~` 
                               
/*************************************************************************/

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";

import { GameStorageFacet } from "./facets/GameStorageFacet.sol";
import { AccessControlFacet } from "./facets/AccessControlFacet.sol";
import { MowseFacet } from "./facets/MowseFacet.sol";
import { MowseWearFacet } from "./facets/MowseWearFacet.sol";
import "./MowsePack.sol";
import "./libraries/SetableCounters.sol";

contract MowseAvatar is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721URIStorageUpgradeable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable, IERC721ReceiverUpgradeable {
    using Counters for Counters.Counter;
    using SetableCounters for Counters.Counter;
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MOWSEAVATAR_MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("MOWSEAVATAR_UPGRADER_ROLE");
    
    uint256 public MOWSE_MINT_PRICE;
    
    address private owner;
    address public diamondAddress;
    address payable public teamAddress;
    address payable public backendAddress;
    address payable public treasuryAddress;
    uint256 public backendTaxBasisPoints;
    uint256 public teamTaxBasisPoints;

    MowsePack public mowsepack;

    Counters.Counter private _mowseIds;

    error DidNotSendToTeam();
    error DidNotSendToBackend();
    error DidNotSendToTreasury();

    modifier mustExist(uint256 _tokenId) {
      require(_exists(_tokenId) || _isMowsePack(_tokenId) || _tokenId == 0, 'Mowse/must-exist');
      _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _diamondAddress, address _mowsePackAddress, address _teamAddress, address _backendAddress, address _treasuryAddress) initializer public {
        __ERC721_init("MowseAvatar", "MOWSE");
        __ERC721Enumerable_init();
        __ERC721URIStorage_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        diamondAddress = _diamondAddress;
        teamAddress = payable(_teamAddress);
        backendAddress = payable(_backendAddress);
        treasuryAddress = payable(_treasuryAddress);
        mowsepack = MowsePack(_mowsePackAddress);
        owner = msg.sender;

        // Backend Tax in basis points (default: 5% = 500)
        backendTaxBasisPoints = 500;
        teamTaxBasisPoints = 2500;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        
        setMowseMintPrice(0.1 ether);  // DEV: 0.1 FTM to help test mowse functions
        // setMowseMintPrice(20 ether);
        _mowseIds.set(mowsepack.MINT_MAX());

        // emit events for mowsepack
        for (uint256 mowsePackId = 1; mowsePackId < mowsepack.totalSupply(); mowsePackId += 1) {
          try mowsepack.ownerOf(mowsePackId) returns (address mowsepackOwner) {
            // emit event as though it was just minted
            emit Transfer(address(0), owner, mowsePackId);
          } catch {
            // ignore, not minted
          }
        }
    }
    function mintMowse() external payable {
      require(MOWSE_MINT_PRICE == msg.value, string(abi.encodePacked('Payment amount incorrect. Mowse cost ', MOWSE_MINT_PRICE.toString(), 'FTM')));
      _mint(msg.sender);
      MowseFacet(diamondAddress).mintMowse();

      GameStorageFacet(diamondAddress).testPatchInteraction(msg.sender);
    }
    // For minting new MowsePack
    function mintMowsePack() external payable {
      // Still mint mowsepack from original MowsePack contract
      mowsepack.mintMowse{value: mowsepack.MINT_PRICE()}(1);
      uint256 mowseId = mowsepack.tokenOfOwnerByIndex(address(this), mowsepack.balanceOf(address(this)) - 1);
      mowsepack.safeTransferFrom(address(this), msg.sender, mowseId, 'mowse/wear');
      
      // Additionally mint MowseAvatar from new contract
      _safeMint(msg.sender, mowseId);
      MowseFacet(diamondAddress).mintMowsePack(mowseId);

      GameStorageFacet(diamondAddress).testPatchInteraction(msg.sender);
    }
    // For existing mowsepack
    function mintMowseForExistingMowsePack(address to, uint256 mowseId) external onlyRole(MINTER_ROLE) {
      _safeMint(to, mowseId);
      MowseFacet(diamondAddress).mintMowsePack(mowseId);
    }

    function isMowsePack(uint256 mowseId) external view returns (bool) {
      return _isMowsePack(mowseId);
    }

    // ONLY OWNER
    function freeMint(address to)
        public
        onlyRole(MINTER_ROLE)
    {
      // Mint ERC721 token
      _mint(to);
      // Call MowseFacet freeMint function to save state and setup Mowse
      MowseFacet(diamondAddress).freeMint();
    }
    function setMowseMintPrice(uint256 mintPrice) public onlyRole(DEFAULT_ADMIN_ROLE){
      MOWSE_MINT_PRICE = mintPrice;
    }
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
      _pause();
    }
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
      _unpause();
    }
    function changeTeamAddress(address payable newTeamAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
      teamAddress = newTeamAddress;
    }
    function changeBackendAddress(address payable newBackendAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
      backendAddress = newBackendAddress;
    }
    function changeTreasuryAddress(address payable newTreasuryAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
      treasuryAddress = newTreasuryAddress;
    }
    function changeTeamTax(uint256 newTax) public onlyRole(DEFAULT_ADMIN_ROLE) {
      teamTaxBasisPoints = newTax;
    }
    function changeBackendTax(uint256 newTax) public onlyRole(DEFAULT_ADMIN_ROLE) {
      backendTaxBasisPoints = newTax;
    }
    function withdraw() public payable onlyRole(DEFAULT_ADMIN_ROLE) {
      uint256 teamPayout = address(this).balance * teamTaxBasisPoints / 10000;
      uint256 backendPayout = address(this).balance * backendTaxBasisPoints / 10000;
      uint256 treasuryPayout = address(this).balance - teamPayout - backendPayout;
      
      (bool sentToTeam,) = teamAddress.call{value: teamPayout}("");
      if (!sentToTeam) revert DidNotSendToTeam();
      (bool sentToBackend,) = backendAddress.call{value: backendPayout}("");
      if (!sentToBackend) revert DidNotSendToBackend();
      (bool sendToTreasury,) = treasuryAddress.call{value: treasuryPayout}("");
      if (!sendToTreasury) revert DidNotSendToTreasury();
    }

    // INTERNAL
    function _mint(address to) internal {
      _mowseIds.increment();
      uint256 _mowseId = _mowseIds.current();
      console.log('mint this mowse', _mowseId);
      _safeMint(to, _mowseId);
    }
    function _isMowsePack(uint256 mowseId) internal view returns (bool) {
      return mowseId <= mowsepack.MINT_MAX();
    }
    function _requireMowsePackApprovedOrOwner(address spender, uint256 mowseId) internal view {
      // Supposed to revert if token has not been minted
      mowsepack.tokenPermanentURI(mowseId);
      address mowsepackOwner = mowsepack.ownerOf(mowseId);
      require(
        spender == mowsepackOwner || mowsepack.getApproved(mowseId) == spender || mowsepack.isApprovedForAll(mowsepackOwner, spender),
        'Mowse: transfer caller is not owner or approved'
      );
    }

    // UUPS
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        MowseWearFacet(diamondAddress).unequipAllMowseWear(tokenId);
    }
    function _burn(uint256 tokenId)
        internal
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
    {
        super._burn(tokenId);
    }
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        // return super.tokenURI(tokenId);

        // Override to get tokenURI from MowseFacet
        return MowseFacet(diamondAddress).mowseTokenURI(tokenId);
    }
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) public pure override returns (bytes4) {
      return IERC721ReceiverUpgradeable.onERC721Received.selector;
    }
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}