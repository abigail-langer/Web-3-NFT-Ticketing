// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TicketNFT is ERC721, Ownable {
    using Strings for uint256;

    struct EventInfo {
        string name;
        string uriPrefix;   // e.g., ipfs://CID/events/1/
        uint256 maxSupply;  // 0 = unlimited
        uint256 minted;
        bool exists;
    }

    mapping(uint256 => uint256) public ticketEventOf; // tokenId => eventId
    mapping(uint256 => bool) public isBurned;         // tokenId => burned?
    mapping(uint256 => EventInfo) public eventsById;  // eventId => info

    uint256 public nextTokenId = 1;
    string public baseURI;

    event EventCreated(uint256 indexed eventId, string name, uint256 maxSupply, string uriPrefix);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address indexed to);
    event TicketBurned(uint256 indexed tokenId, address indexed owner);

    constructor(string memory _name, string memory _symbol, string memory _baseURI)
        ERC721(_name, _symbol)
        Ownable(msg.sender)
    {
        baseURI = _baseURI;
    }

    function createEvent(
        uint256 eventId,
        string calldata name,
        uint256 maxSupply,
        string calldata uriPrefix
    ) external onlyOwner {
        require(!eventsById[eventId].exists, "event exists");
        eventsById[eventId] = EventInfo({
            name: name,
            uriPrefix: uriPrefix,
            maxSupply: maxSupply,
            minted: 0,
            exists: true
        });
        emit EventCreated(eventId, name, maxSupply, uriPrefix);
    }

    function mintTicket(address to, uint256 eventId) external onlyOwner returns (uint256 tokenId) {
        EventInfo storage ev = eventsById[eventId];
        require(ev.exists, "event !exists");
        if (ev.maxSupply > 0) require(ev.minted < ev.maxSupply, "sold out");

        tokenId = nextTokenId++;
        _safeMint(to, tokenId);
        ticketEventOf[tokenId] = eventId;
        ev.minted += 1;
        emit TicketMinted(tokenId, eventId, to);
    }

    function burn(uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "not owner/approved");
        require(!isBurned[tokenId], "already burned");
        isBurned[tokenId] = true;
        address owner = ownerOf(tokenId);
        _burn(tokenId);
        emit TicketBurned(tokenId, owner);
    }

    function isValidTicket(uint256 tokenId)
        external
        view
        returns (bool valid, uint256 eventId, address owner)
    {
        if (isBurned[tokenId]) return (false, ticketEventOf[tokenId], address(0));
        // ownerOf will revert if it does not exist, so use try/catch to protect it.
        try this.ownerOf(tokenId) returns (address o) {
            return (true, ticketEventOf[tokenId], o);
        } catch {
            return (false, ticketEventOf[tokenId], address(0));
        }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "nonexistent");
        uint256 eventId = ticketEventOf[tokenId];
        EventInfo memory ev = eventsById[eventId];
        string memory prefix = bytes(ev.uriPrefix).length > 0 ? ev.uriPrefix : baseURI;
        return string(abi.encodePacked(prefix, tokenId.toString(), ".json"));
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}
