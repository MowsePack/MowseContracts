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

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

import { GameStorageFacet } from "./facets/GameStorageFacet.sol";

contract MowseGold is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, AccessControlUpgradeable, ERC20PermitUpgradeable, UUPSUpgradeable {
  using StringsUpgradeable for uint256;

  bytes32 public constant MINTER_ROLE = keccak256("MOWSEGOLD_MINTER_ROLE");
  bytes32 public constant UPGRADER_ROLE = keccak256("MOWSEGOLD_UPGRADER_ROLE");

  uint256 public MOWSE_GOLD_MINT_PRICE;
  address private owner;
  address public diamondAddress;
  address payable public teamAddress;
  address payable public backendAddress;
  address payable public treasuryAddress;
  uint256 public backendTaxBasisPoints;
  uint256 public teamTaxBasisPoints;

  error DidNotSendToTeam();
  error DidNotSendToBackend();
  error DidNotSendToTreasury();
  error PaymentAmountIncorrect(string);
  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(address _diamondAddress, address _teamAddress, address _backendAddress, address _treasuryAddress) public initializer {
    __ERC20_init("MowseGold", "MGOLD");
    __ERC20Burnable_init();
    __AccessControl_init();
    __ERC20Permit_init("MowseGold");
    __UUPSUpgradeable_init();

    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MINTER_ROLE, msg.sender);
    _grantRole(UPGRADER_ROLE, msg.sender);
    
    // DEV: 0.05 FTM to help test mgold minting
    setMowseGoldMintPrice(0.05 ether);
    // setMowseGoldMintPrice(5 ether);
    owner = msg.sender;
    diamondAddress = _diamondAddress;
    teamAddress = payable(_teamAddress);
    backendAddress = payable(_backendAddress);
    treasuryAddress = payable(_treasuryAddress);

    // Backend Tax in basis points (default: 5% = 500)
    backendTaxBasisPoints = 500;
    teamTaxBasisPoints = 2500;
  }

  function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
    _mint(to, amount);
  }

  function purchaseMowseGold() external payable {
    if (MOWSE_GOLD_MINT_PRICE != msg.value) revert PaymentAmountIncorrect(string(abi.encodePacked('Payment amount incorrect. 100 MowseGold costs ', MOWSE_GOLD_MINT_PRICE.toString(), 'FTM')));
    _mint(msg.sender, 100000);  // DEV: 100000 MGOLD to help test mowse functions
    // _mint(msg.sender, 100);
    GameStorageFacet(diamondAddress).setHasPurchasedMowseGold(msg.sender);
    GameStorageFacet(diamondAddress).testPatchInteraction(msg.sender);
  }

  function grantMinterRole(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _grantRole(MINTER_ROLE, to);
  }
  function revokeMinterRole(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _revokeRole(MINTER_ROLE, to);
  }
  function setMowseGoldMintPrice(uint256 price) public onlyRole(DEFAULT_ADMIN_ROLE) {
    MOWSE_GOLD_MINT_PRICE = price;
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

  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
