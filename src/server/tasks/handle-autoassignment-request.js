import { autoHandleRequest } from "../api/assignment";

const handleAutoassignmentRequest = async (payload, _helpers) => {
  await autoHandleRequest(payload);
};

export default handleAutoassignmentRequest;
