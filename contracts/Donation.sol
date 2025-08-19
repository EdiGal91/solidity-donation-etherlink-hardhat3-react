// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Donation Contract
 * @author Senior Smart Contract Developer
 * @notice A secure donation contract where anyone can donate but only the owner can withdraw
 * @dev Implements OpenZeppelin-style security patterns and gas optimizations
 */
contract Donation {
    // =============================================================================
    // STATE VARIABLES
    // =============================================================================
    
    /// @notice The owner of the contract (deployer) - only address that can withdraw
    address public immutable owner;
    
    /// @notice Total amount donated to the contract
    uint256 public totalDonated;
    
    /// @notice Total amount withdrawn by the owner
    uint256 public totalWithdrawn;
    
    /// @notice Mapping of donor address to total amount donated
    mapping(address => uint256) public donorContributions;
    
    /// @notice Array of all unique donors for enumeration
    address[] public donors;
    
    /// @notice Mapping to check if address has donated before (to avoid duplicate entries in donors array)
    mapping(address => bool) public hasDonated;
    
    /// @notice Reentrancy guard state
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private reentrancyStatus;

    // =============================================================================
    // EVENTS
    // =============================================================================
    
    /// @notice Emitted when a donation is received
    /// @param donor The address of the donor
    /// @param amount The amount donated
    /// @param newTotal The new total balance of the contract
    event DonationReceived(address indexed donor, uint256 amount, uint256 newTotal);
    
    /// @notice Emitted when funds are withdrawn by the owner
    /// @param owner The address of the owner
    /// @param amount The amount withdrawn
    /// @param remainingBalance The remaining balance in the contract
    event FundsWithdrawn(address indexed owner, uint256 amount, uint256 remainingBalance);
    
    /// @notice Emitted when the contract receives direct ETH transfers
    /// @param sender The address that sent ETH
    /// @param amount The amount of ETH received
    event DirectTransferReceived(address indexed sender, uint256 amount);

    // =============================================================================
    // ERRORS
    // =============================================================================
    
    /// @notice Thrown when caller is not the owner
    error NotOwner();
    
    /// @notice Thrown when donation amount is zero
    error ZeroDonation();
    
    /// @notice Thrown when withdrawal amount is zero or exceeds balance
    error InvalidWithdrawalAmount();
    
    /// @notice Thrown when ETH transfer fails
    error TransferFailed();
    
    /// @notice Thrown when reentrancy is detected
    error ReentrancyGuard();

    // =============================================================================
    // MODIFIERS
    // =============================================================================
    
    /// @notice Restricts function access to contract owner only
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    
    /// @notice Prevents reentrancy attacks
    modifier nonReentrant() {
        if (reentrancyStatus == ENTERED) revert ReentrancyGuard();
        reentrancyStatus = ENTERED;
        _;
        reentrancyStatus = NOT_ENTERED;
    }

    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================
    
    /// @notice Initialize the contract with the deployer as owner
    constructor() {
        owner = msg.sender;
        reentrancyStatus = NOT_ENTERED;
    }

    // =============================================================================
    // EXTERNAL FUNCTIONS
    // =============================================================================
    
    /// @notice Donate ETH to the contract
    /// @dev Anyone can call this function to donate ETH
    function donate() external payable {
        if (msg.value == 0) revert ZeroDonation();
        
        // Update donor contributions
        donorContributions[msg.sender] += msg.value;
        
        // Add to donors array if first time donating
        if (!hasDonated[msg.sender]) {
            hasDonated[msg.sender] = true;
            donors.push(msg.sender);
        }
        
        // Update total donated
        totalDonated += msg.value;
        
        emit DonationReceived(msg.sender, msg.value, address(this).balance);
    }
    
    /// @notice Withdraw the full balance to owner's address
    /// @dev Only the contract owner can call this function
    function withdrawAll() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InvalidWithdrawalAmount();
        
        totalWithdrawn += balance;
        
        // Use call instead of transfer for better gas handling
        (bool success, ) = payable(owner).call{value: balance}("");
        if (!success) revert TransferFailed();
        
        emit FundsWithdrawn(owner, balance, 0);
    }
    
    /// @notice Withdraw a specific amount to owner's address
    /// @param amount The amount of ETH to withdraw (in wei)
    /// @dev Only the contract owner can call this function
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0 || amount > address(this).balance) {
            revert InvalidWithdrawalAmount();
        }
        
        totalWithdrawn += amount;
        uint256 remainingBalance = address(this).balance - amount;
        
        // Use call instead of transfer for better gas handling
        (bool success, ) = payable(owner).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit FundsWithdrawn(owner, amount, remainingBalance);
    }

    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================
    
    /// @notice Get the current balance of the contract
    /// @return The current ETH balance in wei
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /// @notice Get the number of unique donors
    /// @return The total number of unique donors
    function getDonorCount() external view returns (uint256) {
        return donors.length;
    }
    
    /// @notice Get donor address by index
    /// @param index The index in the donors array
    /// @return The donor address at the given index
    function getDonorByIndex(uint256 index) external view returns (address) {
        require(index < donors.length, "Index out of bounds");
        return donors[index];
    }
    
    /// @notice Get donation statistics
    /// @return totalBalance Current contract balance
    /// @return totalDonations Total amount ever donated
    /// @return totalWithdrawals Total amount withdrawn by owner
    /// @return uniqueDonors Number of unique donors
    function getStats() external view returns (
        uint256 totalBalance,
        uint256 totalDonations,
        uint256 totalWithdrawals,
        uint256 uniqueDonors
    ) {
        return (
            address(this).balance,
            totalDonated,
            totalWithdrawn,
            donors.length
        );
    }

    // =============================================================================
    // FALLBACK FUNCTIONS
    // =============================================================================
    
    /// @notice Receive function to handle direct ETH transfers
    /// @dev Treats direct transfers as donations
    receive() external payable {
        if (msg.value > 0) {
            // Update donor contributions
            donorContributions[msg.sender] += msg.value;
            
            // Add to donors array if first time donating
            if (!hasDonated[msg.sender]) {
                hasDonated[msg.sender] = true;
                donors.push(msg.sender);
            }
            
            // Update total donated
            totalDonated += msg.value;
            
            emit DirectTransferReceived(msg.sender, msg.value);
        }
    }
    
    /// @notice Fallback function for any other calls
    /// @dev Reverts to prevent accidental calls
    fallback() external payable {
        revert("Function not found");
    }
}
