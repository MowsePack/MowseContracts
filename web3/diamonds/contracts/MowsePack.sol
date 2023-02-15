// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol';
import '@openzeppelin/contracts/interfaces/IERC20.sol';
import '@openzeppelin/contracts/interfaces/IERC721.sol';
import '@openzeppelin/contracts/interfaces/IERC1155.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

import './interfaces/IMowsePack.sol';
import './interfaces/IMowseMetadataVisualizer.sol';

contract MowsePack is IMowsePack, ERC721PresetMinterPauserAutoId, Ownable, ReentrancyGuard {
    using Strings for uint256;
    using Counters for Counters.Counter;

    uint8 public constant MINT_PER_TX = 10;
    uint16 public immutable MINT_MAX;
    uint256 public constant MINT_PRICE = 0.1 ether;
    uint256 public immutable MINT_START;

    uint16 public constant BASE = 10000;

    uint16 private royalty = 500; // base 10000, 5%

    address[] private recipients;
    uint256[] private splits;

    mapping(address => bool) private marketplaces;
    mapping(address => bool) private allowedMetadataVisualizers;
    mapping(uint256 => address) private visualizers;
    address defaultMetadataVisualizerAddress;
    bool private active;

    string private suffixTokenURI;

    Counters.Counter private _tokenIds;

    modifier mustExist(uint256 _tokenId) {
        require(_exists(_tokenId), 'This Mowse does not exist.');
        _;
    }

    modifier onlyHolder(uint256 _tokenId) {
        require(msg.sender == ownerOf(_tokenId), 'You must be the owner to set a Mowse metadata visualizer.');
        _;
    }

    /// @notice set the base URI, gift token reservations, and payment manager
    /// @param _baseTokenURI base URI for the Mowse metadata
    /// @param _suffixTokenURI suffix URI for the Mowse metadata
    /// @param _mintStartTime number of Mowse reserved for gifts
    /// @param _gifts number of Mowse reserved for gifts
    /// @param _recipients payout recipients
    /// @param _splits payout splits
    constructor(
        string memory _baseTokenURI,
        string memory _suffixTokenURI,
        uint16 _maxSupply,
        uint256 _mintStartTime,
        uint8 _gifts,
        address[] memory _recipients,
        uint256[] memory _splits
    ) ERC721PresetMinterPauserAutoId('MowsePack', 'MOWSE', _baseTokenURI) {
        // skip the ID for the reserved tokens
        for (; _tokenIds.current() < _gifts; _tokenIds.increment()) {}

        // used if the metadata URI has a suffix
        suffixTokenURI = _suffixTokenURI;

        // set the max supply
        MINT_MAX = _maxSupply;

        // set the start time, this is immutable
        MINT_START = _mintStartTime;

        // configure fee sharing
        uint256 _total = 0;
        for (uint256 i = 0; i < _splits.length; i++) {
            _total += _splits[i];
        }
        require(_total == BASE, 'Total must be equal to 100%');
        recipients = _recipients;
        splits = _splits;

        // default to paused state
        pause();
    }

    /// @notice Mint some mowse
    /// @param _quantity quantity of mowse to mint
    function mintMowse(uint8 _quantity) external payable override {
        require(MINT_PER_TX >= _quantity, 'Too many Mowse for this transaction.');
        require(MINT_PRICE * _quantity == msg.value, 'Not the right payment for all these Mowse.');
        require(MINT_START <= block.timestamp, 'Mowse minting has not started yet.');

        // mint the mowse
        for (uint256 _i = 0; _i < _quantity; _i++) {
            _tokenIds.increment();
            _safeMint(msg.sender, _tokenIds.current());
        }

        emit MowseMinted(msg.sender, _quantity);
    }

    /// @notice Gift a Mowse from the reserved set
    /// @dev Only the owner can call this method
    /// @param _to the address to gift the Mowse to
    /// @param _tokenId the token ID of the Mowse to gift
    function giftMowse(address _to, uint256 _tokenId) external override {
        require(hasRole(MINTER_ROLE, _msgSender()), 'Only minters can gift Mowse.');
        require(!_exists(_tokenId), 'This Mowse id already has an owner.');
        require(_tokenId < _tokenIds.current(), 'This Mowse cannot be gifted.');

        _safeMint(_to, _tokenId);
    }

    /// @notice Minting is only allowed through the mintMowse and giftMowse functions
    /// @dev only allow minting through safe mint
    function mint(address) public pure override {
        require(false, 'You must mintMowse().');
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 _tokenId) public view virtual override mustExist(_tokenId) returns (string memory) {
        // check to see if visualizers are active, enabled for this address, and allowed
        if (active && visualizers[_tokenId] != address(0) && allowedMetadataVisualizers[visualizers[_tokenId]]) {
            // do the thing
            return _getMowseMetadataVisualizer(_tokenId).getMowseTokenUri(_tokenId);
        }
        // default to the base URI
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, _tokenId.toString(), suffixTokenURI)) : '';
    }

    /// @notice Shows the base metadata URI for the Mowse
    /// @dev This is the original metadata published with the contract
    function tokenPermanentURI(uint256 _tokenId) public view override mustExist(_tokenId) returns (string memory) {
        // default to the base URI
        return super.tokenURI(_tokenId);
    }

    /**
     * Override isApprovedForAll to whitelisted marketplaces to enable listings without needing approval.
     * Just makes it easier for users.
     */
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override(ERC721, IERC721)
        returns (bool isOperator)
    {
        if (marketplaces[_operator]) {
            return true;
        }

        return super.isApprovedForAll(_owner, _operator);
    }

    /// @dev Support for IERC-2981, royalties
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(IERC165, ERC721PresetMinterPauserAutoId)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }

    /// @notice Calculate the royalty payment
    /// @param _salePrice the sale price of the token
    function royaltyInfo(uint256, uint256 _salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        return (address(this), (_salePrice * royalty) / BASE);
    }

    /* HOLDER */

    /// @notice Set the metadata visualizer for a Mowse
    /// @dev Only the token owner can call this method
    /// @param _tokenId the token ID of the Mowse to set the metadata visualizer for
    /// @param _visualizer the address of the metadata visualizer
    function setMetadataVisualizer(uint256 _tokenId, address _visualizer)
        external
        override
        mustExist(_tokenId)
        onlyHolder(_tokenId)
    {
        require(allowedMetadataVisualizers[_visualizer], 'This metadata visualizer is not allowed.');

        emit MetadataVisualizerUpdated(_tokenId, _visualizer, visualizers[_tokenId]);

        visualizers[_tokenId] = _visualizer;
    }

    /// @notice Disable the metadata visualizer for a Mowse
    /// @dev Only the token owner can call this method
    /// @param _tokenId the token ID of the Mowse to disable the metadata visualizer for
    function disableMetadataVisualizer(uint256 _tokenId) external override mustExist(_tokenId) onlyHolder(_tokenId) {
        emit MetadataVisualizerDisabled(_tokenId, visualizers[_tokenId]);

        delete visualizers[_tokenId];
    }

    /* OWNER */

    /// @notice set the token URI functionality active state
    /// @dev Only the owner can call this method
    /// @param _active whether or not the token URI functionality is active
    function setActive(bool _active) external onlyOwner {
        emit MetadataVisualizerActive(_active, active);

        active = _active;
    }

    /// @notice set the whitelisted marketplace contract addresses
    /// @dev Only the owner can call this method
    /// @param _marketplace the marketplace contract address to whitelist
    /// @param _allowed the whitelist status
    function setMarketplace(address _marketplace, bool _allowed) external onlyOwner {
        emit MarketplaceUpdated(_marketplace, _allowed, marketplaces[_marketplace]);

        marketplaces[_marketplace] = _allowed;
    }

    /// @notice set the visualizers whitelisted state
    /// @dev Only the owner can call this method
    /// @param _visualizer the metadata visualizer address to whitelist
    /// @param _allowed the whitelist status
    function setAllowedMetadataVisualizer(address _visualizer, bool _allowed) external onlyOwner {
        emit MetadataVisualizerAllowed(_visualizer, _allowed, allowedMetadataVisualizers[_visualizer]);

        allowedMetadataVisualizers[_visualizer] = _allowed;
    }

    /// @dev set the ROYALTY
    /// @param _royalty the ROYALTY
    function setRoyalty(uint16 _royalty) external onlyOwner {
        require(_royalty >= 0, 'Royalty must be greater than or equal to 0%');
        require(_royalty <= 750, 'Royalty must be greater than or equal to 7.5%');

        royalty = _royalty;
    }

    /// @dev get balance in native currency of this contract
    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @dev withdraw native tokens divided by splits
    function withdraw() external nonReentrant {
        uint256 _amount = address(this).balance;
        for (uint256 i = 0; i < recipients.length; i++) {
            (bool sent, ) = payable(recipients[i]).call{value: (_amount * splits[i]) / BASE}('');
            require(sent, 'Failed to send payment');
        }
    }

    /// @dev withdraw ERC20 tokens divided by splits
    function withdrawTokens(address _tokenContract) external nonReentrant {
        IERC20 tokenContract = IERC20(_tokenContract);

        // transfer the token from address of this contract
        uint256 _amount = tokenContract.balanceOf(address(this));
        for (uint256 i = 0; i < recipients.length; i++) {
            tokenContract.transfer(recipients[i], (_amount * splits[i]) / BASE);
        }
    }

    /// @dev withdraw ERC721 tokens to the contract owner
    function withdrawNFT(address _tokenContract, uint256[] memory _id) external nonReentrant {
        IERC721 tokenContract = IERC721(_tokenContract);
        for (uint256 i = 0; i < _id.length; i++) {
            tokenContract.safeTransferFrom(address(this), this.owner(), _id[i]);
        }
    }

    /* PRIVATE */

    /// @dev get the metadata visualizer for a Mowse
    /// @param _tokenId the token ID of the Mowse to get the metadata visualizer for
    function _getMowseMetadataVisualizer(uint256 _tokenId) private view returns (IMowseMetadataVisualizer) {
        if (visualizers[_tokenId] != address(0) && allowedMetadataVisualizers[visualizers[_tokenId]]) {
            return IMowseMetadataVisualizer(visualizers[_tokenId]);
        }
        return IMowseMetadataVisualizer(defaultMetadataVisualizerAddress);
    }

    /// @dev override to check the max supply when minting
    function _mint(address to, uint256 _id) internal override {
        require(_id <= MINT_MAX, 'All the Mowse are minted.');
        super._mint(to, _id);
    }
}
