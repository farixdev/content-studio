/** Where a notification should take you, and how to open a chat from anywhere. */

/** Task detail route for the viewer's role. */
export function taskHrefForRole(role: string, taskId: string): string {
  switch (role) {
    case "WRITER":
      return `/writer/tasks/${taskId}`;
    case "DESIGNER":
      return `/designer/tasks/${taskId}`;
    case "DEVELOPER":
      return `/developer/tasks/${taskId}`;
    case "REVIEWER":
      return `/reviewer/tasks/${taskId}`;
    default:
      return `/admin/tasks/${taskId}`;
  }
}

/** Fired to ask the floating chat widget to open a specific conversation. */
export const OPEN_CHAT_EVENT = "mcs:open-chat";
/** Fired when a fresh notification list is fetched, so the bell can update live. */
export const NOTIFICATIONS_EVENT = "mcs:notifications";

export function openChatWith(userId: string) {
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT, { detail: { userId } }));
}
