import { ServiceTypes } from "../api/lib/types";
import { processDeliveryReport as processAssembleDeliveryReport } from "../api/lib/assemble-numbers";
import { processDeliveryReport as processTwilioDeliveryReport } from "../api/lib/twilio";

export const handleDeliveryReport = async (payload: any, _helpers: any) => {
  const { service_type, body: stringBody } = payload;
  const body = JSON.parse(stringBody);

  if (service_type === ServiceTypes.AssembleNumbers) {
    await processAssembleDeliveryReport(body);
  } else if (service_type === ServiceTypes.Twilio) {
    await processTwilioDeliveryReport(body);
  } else {
    throw new Error(`Unknown service type ${service_type}`);
  }
};

export default handleDeliveryReport;
