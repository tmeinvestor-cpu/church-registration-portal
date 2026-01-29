"""
Role-based level assignment for COZA Global Church System

Levels:
- 1: Regular Member
- 2: Active Worker
- 3: Leader (HOD/AHOD)
- 4: CMT (Church Management Team)
- 5: SOP (Son of the Prophet)
- 7: Branch Pastor
"""

def resolve_level(role, is_worker):
    """
    Determine the access level based on role and worker status.
    
    Args:
        role (str): The role of the member (member, worker, leader, cmt, sop, pastor)
        is_worker (bool): Whether the member is an active worker
    
    Returns:
        int: The access level (1-7)
    """
    
    # Role to level mapping
    role_map = {
        "member": 1,
        "worker": 2,
        "leader": 3,
        "cmt": 4,
        "sop": 5,
        "pastor": 7
    }
    
    # If no specific role but is a worker, assign level 2
    if not role or role == "member":
        return 2 if is_worker else 1
    
    # Return the appropriate level based on role
    return role_map.get(role.lower(), 1)


def get_role_name(level):
    """
    Get the role name from level number.
    
    Args:
        level (int): The access level
    
    Returns:
        str: The role name
    """
    level_map = {
        1: "Member",
        2: "Worker",
        3: "Leader",
        4: "CMT",
        5: "Son of the Prophet",
        7: "Branch Pastor"
    }
    
    return level_map.get(level, "Member")


def is_vip_visitor(level, member_branch_id, current_branch_id):
    """
    Check if a visitor should trigger VIP notification to branch pastor.
    
    Criteria:
    - Visiting member (different branch_id)
    - Level 3 or above (Leader, CMT, SOP, or Branch Pastor)
    
    Args:
        level (int): Member's access level
        member_branch_id (int): Member's home branch ID
        current_branch_id (int): Current branch being visited
    
    Returns:
        bool: True if VIP notification should be sent
    """
    is_visitor = member_branch_id != current_branch_id
    is_high_level = level >= 3
    
    return is_visitor and is_high_level
