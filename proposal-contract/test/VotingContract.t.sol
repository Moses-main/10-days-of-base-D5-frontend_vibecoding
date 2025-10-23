// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {VotingContract} from "src/VotingContract.sol";

/// @title VotingContract Foundry tests
/// @notice Covers constructor, modifiers, functions, events, and edge cases
contract VotingContractTest is Test {
    VotingContract internal voting;

    address internal owner = address(this); // Test contract deploys VotingContract
    address internal proposer = address(0xBEEF);
    address internal other = address(0xCAFE);
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    event ProposalCreated(uint256 proposalId, string description, uint256 endTime);
    event VoteCast(uint256 proposalId, address voter);
    event ProposalClosed(uint256 proposalId, bool approved);
    event ProposalApproved(address proposer);
    event ProposalRemoved(address proposer);

    function setUp() public {
        voting = new VotingContract();
        // By default, the deployer (this) is owner and an approved proposer
    }

    // --- Constructor and ownership ---

    function test_constructor_setsOwnerAndApprovedProposer() public {
        // owner should be this test contract, and approved proposer
        // check via createProposal success from owner without prior approval
        uint256 duration = 1 hours;
        uint256 id = voting.createProposal("init", duration);
        assertEq(id, 0);
        assertTrue(voting.isApprovedProposer(owner));
    }

    // --- onlyOwner modifier ---

    function test_onlyOwner_canApproveProposer_emitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit ProposalApproved(proposer);
        voting.approveProposal(proposer);
        assertTrue(voting.isApprovedProposer(proposer));
    }

    function test_onlyOwner_canRemoveProposer_emitsEvent() public {
        // First approve, then remove
        voting.approveProposal(proposer);
        vm.expectEmit(true, true, true, true);
        emit ProposalRemoved(proposer);
        voting.removeProposal(proposer);
        assertFalse(voting.isApprovedProposer(proposer));
    }

    function test_revert_nonOwner_cannotApproveOrRemove() public {
        vm.prank(other);
        vm.expectRevert(bytes("Not authorized"));
        voting.approveProposal(proposer);

        vm.prank(other);
        vm.expectRevert(bytes("Not authorized"));
        voting.removeProposal(proposer);
    }

    // --- onlyApprovedProposer modifier and createProposal ---

    function test_revert_nonApprovedProposer_cannotCreateProposal() public {
        // other is not approved
        vm.prank(other);
        vm.expectRevert(bytes("Not an approved proposer"));
        voting.createProposal("x", 1);
    }

    function test_createProposal_success_emitsEvent_andStoresState() public {
        uint256 duration = 1 days;
        uint256 tsBefore = block.timestamp;
        string memory desc = "Add feature X";

        vm.expectEmit(true, true, true, true);
        emit ProposalCreated(0, desc, tsBefore + duration);
        uint256 proposalId = voting.createProposal(desc, duration);

        assertEq(proposalId, 0);
        // Read via getter function and array length
        (
            string memory rDesc,
            uint256 yesVotes,
            uint256 noVotes,
            bool active,
            uint256 endTime,
            bool approved
        ) = voting.getProposals(proposalId);

        assertEq(rDesc, desc);
        assertEq(yesVotes, 0);
        assertEq(noVotes, 0);
        assertTrue(active);
        assertEq(endTime, tsBefore + duration);
        assertFalse(approved);
        assertEq(voting.getProposalCount(), 1);
    }

    function test_revert_createProposal_withZeroDuration() public {
        vm.expectRevert(bytes("Duration must be > 0"));
        voting.createProposal("bad", 0);
    }

    // --- Voting ---

    function _createBasicProposal() internal returns (uint256) {
        return voting.createProposal("P", 1 hours);
    }

    function test_vote_yes_increments_andEmits() public {
        uint256 id = _createBasicProposal();
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit VoteCast(id, alice);
        voting.vote(id, true);

        ( , uint256 y, uint256 n, , , ) = voting.getProposals(id);
        assertEq(y, 1);
        assertEq(n, 0);
        assertTrue(voting.hasVoted(id, alice));
    }

    function test_vote_no_increments_andEmits() public {
        uint256 id = _createBasicProposal();
        vm.prank(bob);
        vm.expectEmit(true, true, true, true);
        emit VoteCast(id, bob);
        voting.vote(id, false);

        ( , uint256 y, uint256 n, , , ) = voting.getProposals(id);
        assertEq(y, 0);
        assertEq(n, 1);
    }

    function test_revert_doubleVote_sameAddress() public {
        uint256 id = _createBasicProposal();
        vm.prank(alice);
        voting.vote(id, true);
        vm.prank(alice);
        vm.expectRevert(bytes("Already voted"));
        voting.vote(id, false);
    }

    function test_revert_vote_onNonexistentProposal() public {
        vm.prank(alice);
        vm.expectRevert(bytes("Proposal does not exist"));
        voting.vote(999, true);
    }

    function test_revert_vote_afterDeadline() public {
        uint256 id = _createBasicProposal();
        // Move time to end
        (, , , , uint256 endTime, ) = voting.getProposals(id);
        vm.warp(endTime);
        vm.prank(alice);
        vm.expectRevert(bytes("Proposal has ended"));
        voting.vote(id, true);
    }

    function test_revert_vote_whenInactive() public {
        uint256 id = _createBasicProposal();
        // Fast-forward and close first
        (, , , , uint256 endTime, ) = voting.getProposals(id);
        vm.warp(endTime + 1);
        voting.closeProposal(id);
        vm.prank(alice);
        vm.expectRevert(bytes("Proposal is not active"));
        voting.vote(id, true);
    }

    // --- Closing ---

    function test_closeProposal_afterDeadline_setsApprovedTrueOnMajorityYes() public {
        uint256 id = _createBasicProposal();
        vm.prank(alice);
        voting.vote(id, true); // 1 yes
        vm.prank(bob);
        voting.vote(id, false); // 1 no
        // Add one more yes
        address carol = makeAddr("carol");
        vm.prank(carol);
        voting.vote(id, true);

        (, , , , uint256 endTime, ) = voting.getProposals(id);
        vm.warp(endTime + 1);

        vm.expectEmit(true, true, true, true);
        emit ProposalClosed(id, true);
        voting.closeProposal(id);

        (, , , bool active, , bool approved) = voting.getProposals(id);
        assertFalse(active);
        assertTrue(approved);
    }

    function test_closeProposal_tie_resultsInNotApproved() public {
        uint256 id = _createBasicProposal();
        vm.prank(alice);
        voting.vote(id, true); // yes=1
        vm.prank(bob);
        voting.vote(id, false); // no=1

        (, , , , uint256 endTime, ) = voting.getProposals(id);
        vm.warp(endTime + 1);

        vm.expectEmit(true, true, true, true);
        emit ProposalClosed(id, false);
        voting.closeProposal(id);

        (, , , bool active, , bool approved) = voting.getProposals(id);
        assertFalse(active);
        assertFalse(approved);
    }

    function test_revert_closeProposal_beforeDeadline() public {
        uint256 id = _createBasicProposal();
        vm.expectRevert(bytes("Proposal has not ended"));
        voting.closeProposal(id);
    }

    function test_revert_closeProposal_nonexistent() public {
        vm.expectRevert(bytes("Proposal does not exist"));
        voting.closeProposal(777);
    }

    function test_revert_closeProposal_whenAlreadyClosed() public {
        uint256 id = _createBasicProposal();
        (, , , , uint256 endTime, ) = voting.getProposals(id);
        vm.warp(endTime + 1);
        voting.closeProposal(id);
        vm.expectRevert(bytes("Proposal is not active"));
        voting.closeProposal(id);
    }

    // --- Views ---

    function test_getProposals_returnsExpectedData() public {
        uint256 id = _createBasicProposal();
        (
            string memory d,
            uint256 y,
            uint256 n,
            bool a,
            uint256 e,
            bool ap
        ) = voting.getProposals(id);
        assertEq(d, "P");
        assertEq(y, 0);
        assertEq(n, 0);
        assertTrue(a);
        assertGt(e, block.timestamp);
        assertFalse(ap);
    }

    function test_revert_getProposals_outOfRange() public {
        vm.expectRevert(bytes("Proposal does not exist"));
        voting.getProposals(42);
    }

    function test_getProposalCount_incrementsWithNewProposals() public {
        assertEq(voting.getProposalCount(), 0);
        voting.createProposal("a", 10);
        voting.createProposal("b", 20);
        assertEq(voting.getProposalCount(), 2);
    }

    // --- Allowlist flow ---
    function test_approvedProposer_canCreate_afterOwnerApproval() public {
        vm.prank(other);
        vm.expectRevert(bytes("Not an approved proposer"));
        voting.createProposal("nope", 10);

        voting.approveProposal(other);
        vm.prank(other);
        uint256 id = voting.createProposal("ok", 10);
        assertEq(id, voting.getProposalCount() - 1);
    }
}
