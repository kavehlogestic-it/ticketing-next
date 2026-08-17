/**
 * Allowed userGroupType query parameter values for tickets API
 */
export const AVAILABLE_USER_GROUP_TYPES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010,
  2002, 2003, 2005, 2006, 2007, 2012,
] as const;

export type AvailableUserGroupType = (typeof AVAILABLE_USER_GROUP_TYPES)[number];
