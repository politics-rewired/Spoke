export async function hasAssignment(_userId, _assignmentId) {}

export const assignmentCache = {
  clear: async (_id) => {},
  load: async (_id) => {
    // should load cache of campaign by id separately, so that can be updated on campaign-save
    // e.g. for script changes
    // should include:
    // texter: id, firstName, lastName, assignedCell, ?userCannedResponses
    // campaignId
    // organizationId
    // ?should contact ids be key'd off of campaign or assignment?
  }
};
