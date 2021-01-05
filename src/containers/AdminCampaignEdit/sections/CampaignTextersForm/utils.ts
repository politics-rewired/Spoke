// eslint-disable-next-line import/prefer-default-export
export const mapFormTexters = () => {
  //      // newFormValues.texters = newFormValues.texters.map((newTexter) => {
  //     //   const existingTexter = existingFormValues.texters.filter((texter) =>
  //     //     texter.id === newTexter.id ? texter : null
  //     //   )[0];
  //     //   let messagedCount = 0;
  //     //   if (existingTexter) {
  //     //     messagedCount =
  //     //       existingTexter.assignment.contactsCount -
  //     //       existingTexter.assignment.needsMessageCount;
  //     //     totalMessaged += messagedCount;
  //     //   }

  //     //   let convertedNeedsMessageCount = parseInt(
  //     //     newTexter.assignment.needsMessageCount,
  //     //     10
  //     //   );
  //     //   const convertedMaxContacts = newTexter.assignment.maxContacts
  //     //     ? parseInt(newTexter.assignment.maxContacts, 10)
  //     //     : null;

  //     //   if (Number.isNaN(convertedNeedsMessageCount)) {
  //     //     convertedNeedsMessageCount = 0;
  //     //   }
  //     //   if (
  //     //     convertedNeedsMessageCount + messagedCount >
  //     //     this.collectFormValues().contactsCount
  //     //   ) {
  //     //     convertedNeedsMessageCount =
  //     //       this.collectFormValues().contactsCount - messagedCount;
  //     //   }

  //     //   if (convertedNeedsMessageCount < 0) {
  //     //     convertedNeedsMessageCount = 0;
  //     //   }

  //     //   if (texterCountChanged && this.state.autoSplit) {
  //     //     convertedNeedsMessageCount = 0;
  //     //   }

  //     //   totalNeedsMessage += convertedNeedsMessageCount;

  //     //   return {
  //     //     ...newTexter,
  //     //     assignment: {
  //     //       ...newTexter.assignment,
  //     //       contactsCount: convertedNeedsMessageCount + messagedCount,
  //     //       messagedCount,
  //     //       needsMessageCount: convertedNeedsMessageCount,
  //     //       maxContacts: convertedMaxContacts
  //     //     }
  //     //   };
  //     // });
  console.log("map form values runs");
};

export const handleExtraTexterCapacity = () => {
  //       //   // 2. If extraTexterCapacity > 0, reduce the user's input to the number of contacts available
  //       // // for assignment
  //       // newFormValues.texters = newFormValues.texters.map((newTexter) => {
  //       //   if (newTexter.id === changedTexterId) {
  //       //     const returnTexter = newTexter;
  //       //     returnTexter.assignment.needsMessageCount -= extraTexterCapacity;
  //       //     returnTexter.assignment.contactsCount -= extraTexterCapacity;
  //       //     return returnTexter;
  //       //   }
  //       //   return newTexter;
  //       // });
  //       // const focusedTexter = newFormValues.texters.find((texter) => {
  //       //   return texter.id === changedTexterId;
  //       // });
  //       // this.setState({
  //       //   snackbarOpen: true,
  //       //   snackbarMessage: `${focusedTexter.assignment.contactsCount} contact${
  //       //     focusedTexter.assignment.contactsCount === 1 ? "" : "s"
  //       //   } assigned to ${this.getDisplayName(focusedTexter.id)}`
  //       // });
  console.log("handleExtra capacity runs");
};

export const handleAutoSplit = (
  newFormValues: any,
  extraTexterCapacity: number,
  changedTexterId: string,
  contactsCount: number
) => {
  // // 3. if we don't have extraTexterCapacity and auto-split is on, then fill the texters with assignments
  // const factor = 1;
  // let index = 0;
  // const skipsByIndex = new Array(newFormValues.texters.length).fill(0);
  // if (newFormValues.texters.length === 1) {
  //   const messagedCount =
  //     newFormValues.texters[0].assignment.contactsCount -
  //     newFormValues.texters[0].assignment.needsMessageCount;
  //   newFormValues.texters[0].assignment.contactsCount = contactsCount;
  //   newFormValues.texters[0].assignment.needsMessageCount =
  //     contactsCount - messagedCount;
  // } else if (newFormValues.texters.length > 1) {
  //   while (extraTexterCapacity < 0) {
  //     const texter = newFormValues.texters[index];
  //     if (
  //       skipsByIndex[index] <
  //       texter.assignment.contactsCount - texter.assignment.needsMessageCount
  //     ) {
  //       skipsByIndex[index] += 1;
  //     } else if (!changedTexterId || texter.id !== changedTexterId) {
  //       if (texter.assignment.needsMessageCount + factor >= 0) {
  //         texter.assignment.needsMessageCount += factor;
  //         texter.assignment.contactsCount += factor;
  //         extraTexterCapacity += factor;
  //       }
  //     }
  //     index += 1;
  //     if (index >= newFormValues.texters.length) {
  //       index = 0;
  //     }
  //   }
  // }
  console.log("handle auto split runs");
};
