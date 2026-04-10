namespace backend.Models.DTOs;

/// <summary>
/// Step 1: provide FirstName + LastName only (email is taken from the authenticated Identity user).
/// Step 2: additionally provide supporter profile fields (same as RegisterDto minus Password) to create a supporter.
/// </summary>
public class LinkDonorProfileDto
{
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";

    public string? SupporterType { get; set; }
    public string? OrganizationName { get; set; }
    public string? RelationshipType { get; set; }
    public string? Region { get; set; }
    public string? Country { get; set; }
    public string? Phone { get; set; }
    public string? Status { get; set; }
    public string? AcquisitionChannel { get; set; }
}

