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
        uint256 price;      // 票价（wei）
    }

    mapping(uint256 => uint256) public ticketEventOf; // tokenId => eventId
    mapping(uint256 => bool) public isBurned;         // tokenId => burned?
    mapping(uint256 => EventInfo) public eventsById;  // eventId => info

    uint256 public nextTokenId = 1;
    string public baseURI;

    event EventCreated(uint256 indexed eventId, string name, uint256 maxSupply, string uriPrefix);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address indexed to);
    event TicketBurned(uint256 indexed tokenId, address indexed owner);
    event TicketPurchased(address indexed buyer, uint256 indexed eventId, uint256 indexed tokenId, uint256 quantity, uint256 totalPrice);

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
        string calldata uriPrefix,
        uint256 price
    ) external onlyOwner {
        require(!eventsById[eventId].exists, "event exists");
        eventsById[eventId] = EventInfo({
            name: name,
            uriPrefix: uriPrefix,
            maxSupply: maxSupply,
            minted: 0,
            exists: true,
            price: price
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
        address owner = ownerOf(tokenId);
        require(
            msg.sender == owner ||
            getApproved(tokenId) == msg.sender ||
            isApprovedForAll(owner, msg.sender),
            "not owner/approved"
        );
        require(!isBurned[tokenId], "already burned");
        isBurned[tokenId] = true;
        _burn(tokenId);
        emit TicketBurned(tokenId, owner);
    }

    // 购买票（payable）- 必需函数
    function purchaseTicket(uint256 eventId, uint256 quantity) external payable returns (uint256[] memory tokenIds) {
        require(quantity > 0, "qty>0");
        EventInfo storage ev = eventsById[eventId];
        require(ev.exists, "event !exists");
        if (ev.maxSupply > 0) require(ev.minted + quantity <= ev.maxSupply, "sold out");

        uint256 totalPrice = ev.price * quantity;
        require(msg.value >= totalPrice, "insufficient payment");

        tokenIds = new uint256[](quantity);
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = nextTokenId++;
            _safeMint(msg.sender, tokenId);
            ticketEventOf[tokenId] = eventId;
            ev.minted += 1;
            tokenIds[i] = tokenId;
            emit TicketMinted(tokenId, eventId, msg.sender);
            emit TicketPurchased(msg.sender, eventId, tokenId, quantity, totalPrice);
        }

        // 退款多余的 ETH
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
    }

    // 获取事件信息 - 必需函数
    function getEventInfo(uint256 eventId) external view returns (
        string memory name,
        uint256 price,
        uint256 totalSupply,
        uint256 remaining
    ) {
        EventInfo memory ev = eventsById[eventId];
        require(ev.exists, "no event");
        uint256 rem = ev.maxSupply == 0 ? type(uint256).max : (ev.maxSupply - ev.minted);
        return (ev.name, ev.price, ev.maxSupply, rem);
    }

    // 获取用户持有的票 - 必需函数
    function getOwnedTickets(address ownerAddr) external view returns (uint256[] memory) {
        uint256 total = 0;
        uint256 maxId = nextTokenId;
        
        // 第一遍：计数
        for (uint256 id = 1; id < maxId; id++) {
            if (_ownerOf(id) == ownerAddr) {
                total++;
            }
        }
        
        // 第二遍：收集
        uint256[] memory list = new uint256[](total);
        uint256 idx = 0;
        for (uint256 id = 1; id < maxId; id++) {
            if (_ownerOf(id) == ownerAddr) {
                list[idx++] = id;
            }
        }
        return list;
    }

    function isValidTicket(uint256 tokenId)
        external
        view
        returns (bool valid, uint256 eventId, address owner)
    {
        if (isBurned[tokenId]) return (false, ticketEventOf[tokenId], address(0));
        
        address tokenOwner = _ownerOf(tokenId);
        if (tokenOwner == address(0)) {
            return (false, ticketEventOf[tokenId], address(0));
        }
        return (true, ticketEventOf[tokenId], tokenOwner);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint256 eventId = ticketEventOf[tokenId];
        EventInfo memory ev = eventsById[eventId];
        string memory prefix = bytes(ev.uriPrefix).length > 0 ? ev.uriPrefix : baseURI;
        return string(abi.encodePacked(prefix, tokenId.toString(), ".json"));
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    // 提取合约余额
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "no balance");
        payable(owner()).transfer(balance);
    }
}
