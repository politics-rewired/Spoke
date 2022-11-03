/* eslint-disable import/prefer-default-export */
import type { Notice, Register10DlcBrandNotice } from "@spoke/spoke-codegen";
import type { GraphQLType } from "graphql";

export function isRegister10DlcBrandNotice(
  obj: Notice
): obj is Register10DlcBrandNotice {
  return (
    (obj as Register10DlcBrandNotice & GraphQLType).__typename ===
    "Register10DlcBrandNotice"
  );
}
