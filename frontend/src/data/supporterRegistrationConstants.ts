export const SUPPORTER_TYPES = [
  'MonetaryDonor',
  'InKindDonor',
  'Volunteer',
  'SkillsContributor',
  'SocialMediaAdvocate',
  'PartnerOrganization',
] as const;

export const RELATIONSHIP_TYPES = ['Local', 'International', 'PartnerOrganization'] as const;

export const ACQUISITION_CHANNELS = [
  'Website',
  'SocialMedia',
  'Event',
  'WordOfMouth',
  'PartnerReferral',
  'Church',
] as const;

export const SUPPORTER_STATUSES = ['Active', 'Inactive'] as const;
