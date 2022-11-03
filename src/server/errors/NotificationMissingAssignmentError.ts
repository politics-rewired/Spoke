export class NotificationMissingAssignmentError extends Error {
  readonly notificationId: number;

  constructor(notificationId: number) {
    super(`Notification ${notificationId} missing an assignment`);
    this.notificationId = notificationId;
  }
}

export default NotificationMissingAssignmentError;
