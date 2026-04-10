namespace backend.Models.DTOs;

/// <summary>
/// Lookup: set FirstName + LastName only (email comes from the authenticated user).
/// Create: include supporter fields (same as register, without password).
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
