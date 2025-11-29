// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPOAPToken {
    function balanceOf(address owner) external view returns (uint256);
    function mintPOAP(address to, uint256 occasionId) external returns (uint256);
}

contract TicketContract is ERC721, ReentrancyGuard {
    address public owner;
    uint256 public totalOccasions;
    uint256 public totalSupply;
    
    // 平台手续费率 (basis points: 250 = 2.5%)
    uint256 public platformFeeRate = 250;
    // 组织者在二级市场的分成比例 (basis points: 500 = 5%)
    uint256 public organizerRoyaltyRate = 500;
    
    // POAP 合约地址
    address public poapContract;
    
    struct Occasion {
        uint256 id;
        string name;
        uint256 cost;
        uint256 tickets;
        uint256 maxTickets;
        string date;
        string time;
        string location;
        address organizer;      // 活动组织者
        bool resellable;        // 是否允许转卖
        uint256 eventEndTime;   // 活动结束时间（Unix时间戳）
        uint256 publicSaleStart; // 公开售票开始时间（POAP持有者可提前购买）
        bool poapEnabled;       // 是否启用POAP奖励
    }

    struct Listing {
        uint256 price;
        address seller;
        bool isActive;
    }

    // 活动信息
    mapping(uint256 => Occasion) public occasions;
    // 用户是否购买过某活动的票
    mapping(uint256 => mapping(address => bool)) public hasBought;
    // 某活动的某座位被谁占用
    mapping(uint256 => mapping(uint256 => address)) public seatTaken;
    // 某活动已被占用的座位列表
    mapping(uint256 => uint256[]) seatsTaken;
    // tokenId 对应的活动ID
    mapping(uint256 => uint256) public tokenToOccasion;
    // tokenId 对应的座位号
    mapping(uint256 => uint256) public tokenToSeat;
    // 二级市场挂单信息
    mapping(uint256 => Listing) public listings;
    // 用户是否已领取某活动的POAP
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    // POAP持有者优先选座（预留座位）
    mapping(uint256 => uint256[]) public prioritySeats; // 活动ID => 优先座位号数组
    // 门票是否已检票
    mapping(uint256 => bool) public hasCheckedIn; // tokenId => 是否已检票

    // 事件
    event OccasionCreated(uint256 indexed occasionId, string name, address organizer, bool resellable, bool poapEnabled);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed occasionId, uint256 seat, address buyer);
    event TicketListed(uint256 indexed tokenId, uint256 price, address seller);
    event TicketDelisted(uint256 indexed tokenId);
    event TicketSold(uint256 indexed tokenId, address from, address to, uint256 price);
    event FeeRatesUpdated(uint256 platformFee, uint256 organizerRoyalty);
    event POAPClaimed(uint256 indexed occasionId, address indexed user, uint256 poapTokenId);
    event POAPContractUpdated(address indexed newPoapContract);
    event TicketCheckedIn(uint256 indexed tokenId, uint256 indexed occasionId, address indexed holder, uint256 checkInTime);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        owner = msg.sender;
    }

    /**
     * @dev 设置POAP合约地址
     */
    function setPOAPContract(address _poapContract) external onlyOwner {
        require(_poapContract != address(0), "Invalid POAP contract");
        poapContract = _poapContract;
        emit POAPContractUpdated(_poapContract);
    }

    /**
     * @dev 创建活动（组织者调用）
     * @param _name 活动名称
     * @param _cost 门票价格（从组织者直接购买时为0，只需gas费）
     * @param _maxTickets 最大票数
     * @param _date 活动日期
     * @param _time 活动时间
     * @param _location 活动地点
     * @param _resellable 是否允许转卖
     * @param _eventEndTime 活动结束时间（Unix时间戳）
     * @param _publicSaleStart 公开售票时间（POAP持有者可提前购买）
     * @param _poapEnabled 是否启用POAP奖励
     */
    function list(
        string memory _name,
        uint256 _cost,
        uint256 _maxTickets,
        string memory _date,
        string memory _time,
        string memory _location,
        bool _resellable,
        uint256 _eventEndTime,
        uint256 _publicSaleStart,
        bool _poapEnabled
    ) public {
        require(_eventEndTime > block.timestamp, "Event end time must be in future");
        require(_publicSaleStart <= _eventEndTime, "Public sale must start before event ends");
        
        totalOccasions++;
        occasions[totalOccasions] = Occasion(
            totalOccasions,
            _name,
            _cost,
            _maxTickets,
            _maxTickets,
            _date,
            _time,
            _location,
            msg.sender,      // 调用者即为组织者
            _resellable,
            _eventEndTime,
            _publicSaleStart,
            _poapEnabled
        );
        
        emit OccasionCreated(totalOccasions, _name, msg.sender, _resellable, _poapEnabled);
    }

    /**
     * @dev 设置优先座位（仅活动组织者或合约owner）
     * @param _occasionId 活动ID
     * @param _prioritySeats 优先座位号数组
     */
    function setPrioritySeats(uint256 _occasionId, uint256[] memory _prioritySeats) public {
        require(_occasionId > 0 && _occasionId <= totalOccasions, "Invalid occasion ID");
        Occasion memory occasion = occasions[_occasionId];
        require(
            msg.sender == occasion.organizer || msg.sender == owner,
            "Only organizer or owner"
        );
        
        prioritySeats[_occasionId] = _prioritySeats;
    }

    /**
     * @dev 检查座位是否为优先座位
     */
    function isPrioritySeat(uint256 _occasionId, uint256 _seat) public view returns (bool) {
        uint256[] memory seats = prioritySeats[_occasionId];
        for (uint256 i = 0; i < seats.length; i++) {
            if (seats[i] == _seat) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev 获取用户的POAP数量
     */
    function getUserPOAPBalance(address _user) public view returns (uint256) {
        if (poapContract == address(0)) return 0;
        return IPOAPToken(poapContract).balanceOf(_user);
    }

    /**
     * @dev 从活动组织者处购买门票（一级市场，免费，只需gas）
     * @param _id 活动ID
     * @param _seat 座位号
     */
    function mint(uint256 _id, uint256 _seat) public payable nonReentrant {
        require(_id != 0 && _id <= totalOccasions, "Invalid occasion ID");
        
        Occasion storage occasion = occasions[_id];
        
        // 检查购票时间权限（POAP持有者优先）
        uint256 userPOAPBalance = getUserPOAPBalance(msg.sender);
        if (userPOAPBalance == 0) {
            require(block.timestamp >= occasion.publicSaleStart, "POAP holders only at this time");
        }
        // POAP持有者可以提前购买
        
        // 从组织者直接购买门票免费（cost设为0），只需支付gas费
        require(msg.value >= occasion.cost, "Insufficient payment");

        // 检查座位
        require(seatTaken[_id][_seat] == address(0), "Seat already taken");
        require(_seat > 0 && _seat <= occasion.maxTickets, "Invalid seat number");
        
        // 检查优先座位权限
        if (isPrioritySeat(_id, _seat)) {
            require(userPOAPBalance > 0, "Priority seat reserved for POAP holders");
        }

        // 更新状态
        occasion.tickets -= 1;
        hasBought[_id][msg.sender] = true;
        seatTaken[_id][_seat] = msg.sender;
        seatsTaken[_id].push(_seat);

        totalSupply++;
        
        // 记录 tokenId 与活动、座位的映射
        tokenToOccasion[totalSupply] = _id;
        tokenToSeat[totalSupply] = _seat;

        _safeMint(msg.sender, totalSupply);
        
        // 如果有费用，转给组织者
        if (msg.value > 0) {
            (bool success, ) = occasion.organizer.call{value: msg.value}("");
            require(success, "Transfer to organizer failed");
        }
        
        emit TicketMinted(totalSupply, _id, _seat, msg.sender);
    }

    /**
     * @dev 在二级市场挂单出售门票
     * @param _tokenId NFT tokenId
     * @param _price 挂单价格
     */
    function listTicket(uint256 _tokenId, uint256 _price) public {
        require(ownerOf(_tokenId) == msg.sender, "Not ticket owner");
        require(_price > 0, "Price must be greater than 0");
        
        uint256 occasionId = tokenToOccasion[_tokenId];
        Occasion memory occasion = occasions[occasionId];
        require(occasion.resellable, "Ticket not resellable");
        
        // ⭐ 新增：价格不能超过初始价格
        require(_price <= occasion.cost, "Price cannot exceed initial cost");
        
        require(!listings[_tokenId].isActive, "Already listed");

        listings[_tokenId] = Listing({
            price: _price,
            seller: msg.sender,
            isActive: true
        });

        emit TicketListed(_tokenId, _price, msg.sender);
    }

    /**
     * @dev 取消挂单
     * @param _tokenId NFT tokenId
     */
    function delistTicket(uint256 _tokenId) public {
        require(listings[_tokenId].seller == msg.sender, "Not the seller");
        require(listings[_tokenId].isActive, "Not listed");

        listings[_tokenId].isActive = false;

        emit TicketDelisted(_tokenId);
    }

    /**
     * @dev 从二级市场购买门票
     * @param _tokenId NFT tokenId
     */
    function buyTicket(uint256 _tokenId) public payable nonReentrant {
        Listing storage listing = listings[_tokenId];
        require(listing.isActive, "Ticket not for sale");
        require(msg.value >= listing.price, "Insufficient payment");

        address seller = listing.seller;
        uint256 price = listing.price;
        uint256 occasionId = tokenToOccasion[_tokenId];
        address organizer = occasions[occasionId].organizer;

        // 取消挂单
        listing.isActive = false;

        // 计算手续费分配
        uint256 platformFee = (price * platformFeeRate) / 10000;
        uint256 organizerRoyalty = (price * organizerRoyaltyRate) / 10000;
        uint256 sellerProceeds = price - platformFee - organizerRoyalty;

        // 转移NFT
        _transfer(seller, msg.sender, _tokenId);

        // 分配资金
        (bool success1, ) = seller.call{value: sellerProceeds}("");
        require(success1, "Transfer to seller failed");

        (bool success2, ) = organizer.call{value: organizerRoyalty}("");
        require(success2, "Transfer to organizer failed");

        (bool success3, ) = owner.call{value: platformFee}("");
        require(success3, "Transfer to platform failed");

        // 退还多余的ETH
        if (msg.value > price) {
            (bool success4, ) = msg.sender.call{value: msg.value - price}("");
            require(success4, "Refund failed");
        }

        emit TicketSold(_tokenId, seller, msg.sender, price);
    }

    /**
     * @dev 更新手续费率（仅合约拥有者）
     * @param _platformFeeRate 平台手续费率 (basis points)
     * @param _organizerRoyaltyRate 组织者分成比例 (basis points)
     */
    function updateFeeRates(uint256 _platformFeeRate, uint256 _organizerRoyaltyRate) public onlyOwner {
        require(_platformFeeRate + _organizerRoyaltyRate < 10000, "Total fees too high");
        platformFeeRate = _platformFeeRate;
        organizerRoyaltyRate = _organizerRoyaltyRate;
        
        emit FeeRatesUpdated(_platformFeeRate, _organizerRoyaltyRate);
    }

    /**
     * @dev 获取活动信息
     */
    function getOccasion(uint256 _id) public view returns (Occasion memory) {
        return occasions[_id];
    }

    /**
     * @dev 获取某活动已占用的座位
     */
    function getSeatsTaken(uint256 _id) public view returns (uint256[] memory) {
        return seatsTaken[_id];
    }

    /**
     * @dev 获取某个NFT的挂单信息
     */
    function getListing(uint256 _tokenId) public view returns (Listing memory) {
        return listings[_tokenId];
    }

    /**
     * @dev 获取某个NFT对应的活动和座位信息
     */
    function getTicketInfo(uint256 _tokenId) public view returns (uint256 occasionId, uint256 seat) {
        return (tokenToOccasion[_tokenId], tokenToSeat[_tokenId]);
    }

    /**
     * @dev 提取合约余额（平台手续费）
     */
    function withdraw() public onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev 检票（仅活动组织者可调用）
     * @param _tokenId 门票 tokenId
     */
    function checkIn(uint256 _tokenId) public {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        
        uint256 occasionId = tokenToOccasion[_tokenId];
        Occasion memory occasion = occasions[occasionId];
        
        // 只有活动组织者可以检票
        require(msg.sender == occasion.organizer, "Only organizer can check in");
        
        // 检查是否已检票
        require(!hasCheckedIn[_tokenId], "Already checked in");
        
        // 标记为已检票
        hasCheckedIn[_tokenId] = true;
        
        emit TicketCheckedIn(_tokenId, occasionId, ownerOf(_tokenId), block.timestamp);
    }

    /**
     * @dev 领取POAP（检票后）
     * @param _occasionId 活动ID
     */
    function claimPOAP(uint256 _occasionId) public nonReentrant {
        require(_occasionId > 0 && _occasionId <= totalOccasions, "Invalid occasion ID");
        Occasion memory occasion = occasions[_occasionId];
        
        require(occasion.poapEnabled, "POAP not enabled for this event");
        require(hasBought[_occasionId][msg.sender], "Did not attend this event");
        require(!hasClaimed[_occasionId][msg.sender], "POAP already claimed");
        require(poapContract != address(0), "POAP contract not set");
        
        // 检查用户是否持有该活动的票，并且已检票
        bool hasValidCheckedInTicket = false;
        for (uint256 i = 1; i <= totalSupply; i++) {
            if (tokenToOccasion[i] == _occasionId && 
                _ownerOf(i) == msg.sender && 
                hasCheckedIn[i]) {
                hasValidCheckedInTicket = true;
                break;
            }
        }
        require(hasValidCheckedInTicket, "No checked-in ticket found");
        
        // 标记为已领取
        hasClaimed[_occasionId][msg.sender] = true;
        
        // 调用POAP合约铸造代币
        uint256 poapTokenId = IPOAPToken(poapContract).mintPOAP(msg.sender, _occasionId);
        
        emit POAPClaimed(_occasionId, msg.sender, poapTokenId);
    }

    /**
     * @dev 获取优先座位列表
     */
    function getPrioritySeats(uint256 _occasionId) public view returns (uint256[] memory) {
        return prioritySeats[_occasionId];
    }

    /**
     * @dev 检查门票是否已检票
     */
    function isCheckedIn(uint256 _tokenId) public view returns (bool) {
        return hasCheckedIn[_tokenId];
    }

    /**
     * @dev 获取用户在某活动的所有门票及检票状态
     */
    function getUserTicketsCheckInStatus(uint256 _occasionId, address _user) 
        public view returns (uint256[] memory tokenIds, bool[] memory checkedIn) 
    {
        // 先统计数量
        uint256 count = 0;
        for (uint256 i = 1; i <= totalSupply; i++) {
            if (tokenToOccasion[i] == _occasionId && _ownerOf(i) == _user) {
                count++;
            }
        }
        
        // 填充数组
        tokenIds = new uint256[](count);
        checkedIn = new bool[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalSupply; i++) {
            if (tokenToOccasion[i] == _occasionId && _ownerOf(i) == _user) {
                tokenIds[index] = i;
                checkedIn[index] = hasCheckedIn[i];
                index++;
            }
        }
    }

    /**
     * @dev 检查用户是否可以领取POAP（需要已检票）
     */
    function canClaimPOAP(uint256 _occasionId, address _user) public view returns (bool) {
        if (_occasionId == 0 || _occasionId > totalOccasions) return false;
        Occasion memory occasion = occasions[_occasionId];
        
        if (!occasion.poapEnabled || hasClaimed[_occasionId][_user] || poapContract == address(0)) {
            return false;
        }
        
        // 检查是否有已检票的门票
        for (uint256 i = 1; i <= totalSupply; i++) {
            if (tokenToOccasion[i] == _occasionId && 
                _ownerOf(i) == _user && 
                hasCheckedIn[i]) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * @dev 重写_update函数，转移时自动取消挂单（OpenZeppelin v5）
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = super._update(to, tokenId, auth);
        
        // 如果NFT正在挂单，转移时自动取消（排除mint操作）
        if (from != address(0) && listings[tokenId].isActive) {
            listings[tokenId].isActive = false;
            emit TicketDelisted(tokenId);
        }
        
        return from;
    }
}
