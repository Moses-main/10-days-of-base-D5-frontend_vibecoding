// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract VotingContract {


    struct Proposal{
        string description,
        uint256 yesVotes,
        uint256 noVotes,
        bool active,
        uint256 endTime,
        bool approved

    }

    Proposal[] public proposals;

    mapping(uint256 => mapping(address => bool)) hasVoted;
    mapping(address => bool) public isApprovedProposer;
    address public owner;

    event ProposalCreated(uint256 proposalId, string description, uint256 endTime);
    event VoteCast(uint256 proposalId, address voter);
    event ProposalClosed(uint256 proposalId, bool approved);
    event ProposalApproved(address proposer);
    event ProposalRemoved(address proposer);

    constructor(){
        owner = msg.sender,
        isApprovedProposer(owner) = true

    }

    modifier onlyOwner{
        require(msg.send == owner, "Not Authorized");
        _,
    }

    modifier onlyApprovedProposer{
        require(isApprovedProposer(msg.sender), "Not an Approved Proposer");
    }

    function approveProposal(address _proposer) public onlyOwner{
        isApprovedProposer(_proposer) = true;
        emit ProposalApproved(_proposer);
    }



    function removeProposal(address _proposer) public onlyOwner{
        isApprovedProposer(_proposer) = false;
        emit ProposalRemoved(_proposer);
    }



    function createProposal(string memory _description, uint256 _duration) public onlyApprovedProposer returns(uint256){
        uint256 _endTime = block.timestamp + _duration;
        Proposal memory newProposal = Proposal({
            description: _description,
            yesVotes: 0,
            noVotes: 0,
            active: true,
            endTime: _endTime,
            approved: false

        })

        proposals.push(newProposal)

        uint256 _proposalId = proposals.length -1;
        emit ProposalCreated( _proposalId,  _description,  _endTime);
        return _proposalId
    }



    function vote(uint256 _proposalId, bool _vote) public {
        require(_proposalId < proposals.length, "Proposal does not exist");
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.active, "Proposal is not active");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        require(block.timestamp < proposal.endTime, "Proposal has ended");

        if(_vote){
            proposals[_proposalId].yesVotes++;
        }else{
            proposals[_proposalId].noVotes++;
        }

        hasVoted[_proposalId][msg.sender] = true;
        emit VoteCast(_proposalId, msg.sender);
    }


    function closeProposal(uint256 _proposalId) public{
        require(_proposalId < proposals.length, "Proposal does not exist");
    }

}
