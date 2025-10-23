// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/// @title Simple On-Chain Voting with Proposer Allowlist
/// @author 
/// @notice This contract allows approved proposers to create proposals that tokenless users can vote on.
/// @dev Uses timestamps for proposal deadlines and simple majority to approve.
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
    Proposal[] public proposals;

    /// @notice Tracks whether an address has voted on a specific proposalId
    /// @dev hasVoted[proposalId][voter] => true if already voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Allowlist of addresses permitted to create proposals
    mapping(address => bool) public isApprovedProposer;

    /// @notice The owner address with permission to manage the proposer allowlist
    address public owner;

    /// @notice Emitted when a proposal is created
    /// @param proposalId Index of the proposal in `proposals`
    /// @param description The proposal description
    /// @param endTime UNIX timestamp when voting ends
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

    /// @notice Initializes the contract, setting the deployer as owner and approved proposer
    constructor(){
        owner = msg.sender;                     // Set contract owner
        isApprovedProposer[owner] = true;       // Owner is an approved proposer by default
    }

    /// @dev Restricts function to contract owner
    modifier onlyOwner{
        require(msg.sender == owner, "Not authorized");
        _;
    }

    /// @dev Restricts function to approved proposers
    modifier onlyApprovedProposer{
        require(isApprovedProposer[msg.sender], "Not an approved proposer");
        _;
    }

    /// @notice Owner can approve an address to create proposals
    /// @param _proposer The address to approve
    function approveProposal(address _proposer) public onlyOwner{
        isApprovedProposer[_proposer] = true;
        emit ProposalApproved(_proposer);
    }

    /// @notice Owner can remove an address from the proposer allowlist
    /// @param _proposer The address to remove
    function removeProposal(address _proposer) public onlyOwner{
        isApprovedProposer[_proposer] = false;
        emit ProposalRemoved(_proposer);
    }

    /// @notice Create a new proposal
    /// @dev The proposal is immediately active and can be voted on until `endTime`
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
    /// @param _proposalId The id of the proposal
    /// @param _vote true for yes, false for no
    function vote(uint256 _proposalId, bool _vote) public {
        require(_proposalId < proposals.length, "Proposal does not exist");
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.active, "Proposal is not active");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        require(block.timestamp < proposal.endTime, "Proposal has ended");

        if(_vote){
            proposal.yesVotes += 1;
        }else{
            proposal.noVotes += 1;
        }

        hasVoted[_proposalId][msg.sender] = true;
        emit VoteCast(_proposalId, msg.sender);
    }

    /// @notice Close a proposal after its voting deadline and finalize approval state
    /// @param _proposalId The id of the proposal to close
    function closeProposal(uint256 _proposalId) public{
        require(_proposalId < proposals.length, "Proposal does not exist");
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.active, "Proposal is not active");
        require(block.timestamp > proposal.endTime, "Proposal has not ended");

        proposal.active = false;
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

    function getProposalCount() public view returns(uint256){
        return proposals.length;
    }

}
