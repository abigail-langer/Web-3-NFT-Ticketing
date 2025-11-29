// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title POAPToken
 * @dev 不可转让的出席证明代币（Proof of Attendance Protocol）
 * 用户参加活动后可领取，持有POAP的用户在未来购票时享有优先权
 */
contract POAPToken is ERC721, Ownable {
    using Strings for uint256;

    uint256 public nextTokenId = 1;
    string public baseURI;
    
    // 授权的铸造者（TicketContract地址）
    mapping(address => bool) public minters;
    
    // tokenId => occasionId 映射
    mapping(uint256 => uint256) public tokenToOccasion;
    
    // 用户在某个活动的POAP tokenId
    mapping(address => mapping(uint256 => uint256)) public userOccasionPOAP;
    
    // 事件
    event POAPMinted(uint256 indexed tokenId, address indexed to, uint256 indexed occasionId);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized minter");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        baseURI = _baseURI;
    }

    /**
     * @dev 添加授权铸造者
     */
    function addMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter address");
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }

    /**
     * @dev 移除授权铸造者
     */
    function removeMinter(address _minter) external onlyOwner {
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }

    /**
     * @dev 铸造POAP（仅授权铸造者）
     * @param to 接收者地址
     * @param occasionId 活动ID
     */
    function mintPOAP(address to, uint256 occasionId) external onlyMinter returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(userOccasionPOAP[to][occasionId] == 0, "POAP already minted for this event");

        uint256 tokenId = nextTokenId++;
        _safeMint(to, tokenId);
        
        tokenToOccasion[tokenId] = occasionId;
        userOccasionPOAP[to][occasionId] = tokenId;

        emit POAPMinted(tokenId, to, occasionId);
        return tokenId;
    }

    /**
     * @dev 批量铸造POAP
     */
    function batchMintPOAP(address[] calldata recipients, uint256 occasionId) 
        external 
        onlyMinter 
        returns (uint256[] memory) 
    {
        uint256 count = recipients.length;
        uint256[] memory tokenIds = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(userOccasionPOAP[recipients[i]][occasionId] == 0, "POAP already exists");

            uint256 tokenId = nextTokenId++;
            _safeMint(recipients[i], tokenId);
            
            tokenToOccasion[tokenId] = occasionId;
            userOccasionPOAP[recipients[i]][occasionId] = tokenId;
            tokenIds[i] = tokenId;

            emit POAPMinted(tokenId, recipients[i], occasionId);
        }

        return tokenIds;
    }

    /**
     * @dev 获取用户在某个活动的POAP tokenId
     */
    function getUserPOAP(address user, uint256 occasionId) external view returns (uint256) {
        return userOccasionPOAP[user][occasionId];
    }

    /**
     * @dev 检查用户是否持有某个活动的POAP
     */
    function hasPOAP(address user, uint256 occasionId) external view returns (bool) {
        uint256 tokenId = userOccasionPOAP[user][occasionId];
        if (tokenId == 0) return false;
        
        // 检查用户是否仍然持有该POAP
        try this.ownerOf(tokenId) returns (address owner) {
            return owner == user;
        } catch {
            return false;
        }
    }

    /**
     * @dev 获取token对应的活动ID
     */
    function getOccasionId(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenToOccasion[tokenId];
    }

    /**
     * @dev 设置baseURI
     */
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }

    /**
     * @dev 返回tokenURI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        uint256 occasionId = tokenToOccasion[tokenId];
        return string(abi.encodePacked(baseURI, "occasion-", occasionId.toString(), "/", tokenId.toString(), ".json"));
    }

    /**
     * @dev 重写_update函数，禁止转让（Soulbound Token）
     * 只允许mint（from == address(0)）和burn（to == address(0)）
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = super._update(to, tokenId, auth);
        
        // 禁止转让（排除mint和burn）
        if (from != address(0) && to != address(0)) {
            revert("POAP tokens are non-transferable (Soulbound)");
        }
        
        return from;
    }

    /**
     * @dev 用户可以销毁自己的POAP（如果不想要了）
     */
    function burn(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _burn(tokenId);
    }
}
