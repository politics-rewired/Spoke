// types for partial porting of js to ts components

export type Falsy = undefined | null | false | 0;
export type TruthyString = string | Falsy;
export type ISODateString = TruthyString;
