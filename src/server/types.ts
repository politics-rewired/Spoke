import type { Request } from "express";

export interface SpokeRequest extends Request {
  user?: any;
}
