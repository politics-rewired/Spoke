export interface Register10DlcBrandNotice {
  id: string;
  tcrBrandRegistrationUrl: string | null;
}

export type Notice = Register10DlcBrandNotice;

export function isRegister10DlcBrandNotice(
  obj: Notice
): obj is Register10DlcBrandNotice {
  return (
    (obj as Register10DlcBrandNotice & Register10DlcBrandNotice)
      .tcrBrandRegistrationUrl !== undefined
  );
}

export const resolvers = {
  Register10DlcBrandNotice: {
    id: (notice: Register10DlcBrandNotice) => notice.id,
    tcrBrandRegistrationUrl: (notice: Register10DlcBrandNotice) =>
      notice.tcrBrandRegistrationUrl
  },
  Notice: {
    __resolveType(obj: Notice) {
      if (isRegister10DlcBrandNotice(obj)) {
        return "Register10DlcBrandNotice";
      }

      return null;
    }
  }
};
