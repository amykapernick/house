export function notificationsSupported(): boolean {
	return typeof Notification !== `undefined`;
}

export function notificationPermission(): NotificationPermission | `unsupported` {
	return notificationsSupported() ? Notification.permission : `unsupported`;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | `unsupported`> {
	if (!notificationsSupported()) return `unsupported`;
	return Notification.requestPermission();
}

export function notify(title: string, body: string, tag: string) {
	if (notificationsSupported() && Notification.permission === `granted`) {
		new Notification(title, { body, tag });
	}
}
