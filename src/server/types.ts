import type { Request } from "express";

// copied from memoizer
export interface MemoizeOpts {
  key: string;
  lockTimeout?: number;
  ttl?: number;
}
export interface MemoizedFunctionArgs {
  [key: string]: any;
}
export declare type MemoizableFunction<T, U> = (args: T) => Promise<U>;
export interface Memoizer {
  invalidate(key: string, args: MemoizedFunctionArgs): Promise<void>;
  memoize<T, U>(
    fn: MemoizableFunction<T, U>,
    opts: MemoizeOpts
  ): MemoizableFunction<T, U>;
  quit(): Promise<"OK">;
  end(flush?: boolean): void;
}

export interface SpokeRequest extends Request {
  user?: any;
}
