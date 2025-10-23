// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/// @title Simple On-Chain Voting with Proposer Allowlist
/// @author 
/// @notice This contract allows approved proposers to create proposals that tokenless users can vote on.
/// @dev Uses timestamps for proposal deadlines and simple majority to approve.
/// @dev Security considerations:
/// - Anyone can vote and anyone can close a proposal after the deadline; gate these if needed.
/// - One-vote-per-address enforced via `hasVoted` mapping; does not prevent Sybil voting.
/// - No reentrancy risk as there are no external calls; all state changes are local.
/// @custom:invariants
/// - proposal.endTime is set at creation and never increases.
/// - proposal.active is true on creation and permanently false after close.
/// - proposal.approved is set only upon close and never reverts to false when set to true.
contract VotingContract {

    /// @notice Represents a proposal and its voting state
    /// @param description Human-readable description of the proposal
    /// @param yesVotes Total number of yes votes cast
    /// @param noVotes Total number of no votes cast
    /// @param active Whether the proposal is currently open for voting
    /// @param endTime UNIX timestamp after which votes are no longer accepted
    /// @param approved Whether the proposal passed (set when closed)
    struct Proposal{
        string description;        // Proposal description
        uint256 yesVotes;          // Count of yes votes
        uint256 noVotes;           // Count of no votes
        bool active;               // Is voting active
        uint256 endTime;           // Voting deadline
        bool approved;             // Did yes > no when closed
    }

    /// @notice Storage of all proposals by index (proposalId)
    /// @dev Solidity auto-generates a `proposals(uint256)` getter that returns a single `Proposal` by id
    Proposal[] public proposals;

    /// @notice Tracks whether an address has voted on a specific proposalId
    /// @dev hasVoted[proposalId][voter] => true if already voted (enforces one vote per address)
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Allowlist of addresses permitted to create proposals
    /// @dev Managed by the `owner`; used by the `onlyApprovedProposer` modifier
    mapping(address => bool) public isApprovedProposer;

    /// @notice The owner address with permission to manage the proposer allowlist
    /// @dev Set once in the constructor; no ownership transfer in this minimal example
    address public owner;

    /// @notice Emitted when a proposal is created
    /// @param proposalId Index of the proposal in `proposals`
    /// @param description The proposal description
    /// @param endTime UNIX timestamp when voting ends (inclusive-exclusive window: voting allowed while block.timestamp < endTime)
    event ProposalCreated(uint256 proposalId, string description, uint256 endTime);

    /// @notice Emitted when an address casts a vote
    /// @param proposalId The proposal voted on
    /// @param voter The address that cast the vote
    event VoteCast(uint256 proposalId, address voter);

    /// @notice Emitted when a proposal is closed
    /// @param proposalId The proposal that was closed
    /// @param approved Whether the proposal passed
    event ProposalClosed(uint256 proposalId, bool approved);

    /// @notice Emitted when an address is approved to create proposals
    /// @param proposer The newly-approved proposer address
    event ProposalApproved(address proposer);

    /// @notice Emitted when an address is removed from proposer allowlist
    /// @param proposer The removed proposer address
    event ProposalRemoved(address proposer);

    /// @notice Initializes the contract
    /// @dev Sets the deployer as the immutable `owner` and also as an approved proposer
    constructor(){
        owner = msg.sender;                     // Set contract owner
        isApprovedProposer[owner] = true;       // Owner is an approved proposer by default
    }

    /// @notice Restricts function to contract owner
    /// @dev Reverts with "Not authorized" when called by non-owner
    modifier onlyOwner{
        require(msg.sender == owner, "Not authorized");
        _;
    }

    /// @notice Restricts function to approved proposers
    /// @dev Reverts when `msg.sender` is not in `isApprovedProposer`
    modifier onlyApprovedProposer{
        require(isApprovedProposer[msg.sender], "Not an approved proposer");
        _;
    }

    /// @notice Owner can approve an address to create proposals
    /// @dev Access controlled by `onlyOwner`. Idempotent: calling twice keeps the flag true.
    /// @param _proposer The address to approve
    function approveProposal(address _proposer) public onlyOwner{
        isApprovedProposer[_proposer] = true;
        emit ProposalApproved(_proposer);
    }

    /// @notice Owner can remove an address from the proposer allowlist
    /// @dev Access controlled by `onlyOwner`. Idempotent: calling twice keeps the flag false.
    /// @param _proposer The address to remove
    function removeProposal(address _proposer) public onlyOwner{
        isApprovedProposer[_proposer] = false;
        emit ProposalRemoved(_proposer);
    }

    /// @notice Create a new proposal
    /// @dev The proposal is immediately active and can be voted on until `endTime`.
    /// @dev The returned `proposalId` is the index into the `proposals` array.
    /// @param _description Human-readable summary of the proposal
    /// @param _duration Duration in seconds that the proposal should remain open
    /// @return proposalId The newly created proposal's id
    function createProposal(string memory _description, uint256 _duration) public onlyApprovedProposer returns(uint256 proposalId){
        require(_duration > 0, "Duration must be > 0");
        uint256 _endTime = block.timestamp + _duration;
        Proposal memory newProposal = Proposal({
            description: _description,
            yesVotes: 0,
            noVotes: 0,
            active: true,
            endTime: _endTime,
            approved: false
        });

        proposals.push(newProposal);

        proposalId = proposals.length - 1;
        emit ProposalCreated(proposalId, _description, _endTime);
        return proposalId;
    }

    /// @notice Cast a vote on a proposal
    /// @dev One vote per address is enforced; function is open to all callers
    /// @param _proposalId The id of the proposal
    /// @param _vote true for yes, false for no
    function vote(uint256 _proposalId, bool _vote) public {
        require(_proposalId < proposals.length, "Proposal does not exist");
        Proposal storage proposal = proposals[_proposalId]; // Load proposal into storage for updates
        require(proposal.active, "Proposal is not active"); // Must be open
        require(!hasVoted[_proposalId][msg.sender], "Already voted"); // 1 vote per address
        require(block.timestamp < proposal.endTime, "Proposal has ended"); // Enforce deadline

        // Tally the vote
        if(_vote){
            proposal.yesVotes += 1; // Count a yes
        }else{
            proposal.noVotes += 1; // Count a no
        }

        // Mark the sender as having voted for this proposal id
        hasVoted[_proposalId][msg.sender] = true;
        emit VoteCast(_proposalId, msg.sender);
    }

    /// @notice Close a proposal after its voting deadline and finalize approval state
    /// @dev Anyone can call this after the deadline; sets `approved` if yesVotes > noVotes
    /// @param _proposalId The id of the proposal to close
    function closeProposal(uint256 _proposalId) public{
        require(_proposalId < proposals.length, "Proposal does not exist");
        Proposal storage proposal = proposals[_proposalId]; // Operate on storage
        require(proposal.active, "Proposal is not active"); // Only close once
        require(block.timestamp > proposal.endTime, "Proposal has not ended"); // Must be past deadline

        // Mark proposal closed and set approved if a simple majority of yes votes
        proposal.active = false;
        // Note: ties result in approved=false (no change), as the condition is strict '>'
        if(proposal.yesVotes > proposal.noVotes){
            proposal.approved = true;
        }
        emit ProposalClosed(_proposalId, proposal.approved);
    }

    /// @notice Get full details of a single proposal by id
    /// @dev Returns primitive fields instead of the struct for broader ABI compatibility
    /// @param _proposalId The id of the proposal to fetch
    /// @return description Proposal description
    /// @return yesVotes Count of yes votes
    /// @return noVotes Count of no votes
    /// @return active Whether the proposal is still open for voting
    /// @return endTime UNIX timestamp when voting ends
    /// @return approved Whether the proposal passed (computed when closed)
    function getProposals(uint256 _proposalId) public view returns( 
        string memory description, // Proposal description
        uint256 yesVotes,          // Count of yes votes
        uint256 noVotes,           // Count of no votes
        bool active,               // Is voting active
        uint256 endTime,           // Voting deadline
        bool approved){             
        require(_proposalId < proposals.length, "Proposal does not exist");
        // Copy from storage to memory for cheaper repeated reads of the same fields
        Proposal memory proposal = proposals[_proposalId];
        return (
            description = proposal.description,
            yesVotes = proposal.yesVotes,
            noVotes = proposal.noVotes,
            active = proposal.active,
            endTime = proposal.endTime,
            approved = proposal.approved
            );
    }

    /// @notice Get the total number of proposals created
    /// @dev Useful for iterating proposal ids off-chain (0..count-1). Ids are zero-based indices.
    /// @return count The number of proposals stored
    function getProposalCount() public view returns(uint256){
        return proposals.length;
    }

}
