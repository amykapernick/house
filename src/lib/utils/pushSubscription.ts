import { getToken } from '$lib/auth';
import { getGraphqlUrl } from '$utils/fetchClientData';
import { requestNotificationPermission } from '$utils/notifications';

// Web Push's applicationServerKey must be a Uint8Array, but the VAPID public key
// is handed around (and stored) as a URL-safe base64 string - standard conversion,
// same shape as every other Web Push integration's boilerplate.
function urlBase64ToUint8Array(base64: string): Uint8Array {
	const padding = `=`.repeat((4 - (base64.length % 4)) % 4);
	const base64Safe = (base64 + padding).replaceAll(`-`, `+`).replaceAll(`_`, `/`);
	const raw = atob(base64Safe);

	return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function fetchVapidPublicKey(): Promise<string | null> {
	const res = await fetch(getGraphqlUrl(), {
		method: `POST`,
		headers: { 'Content-Type': `application/json` },
		body: JSON.stringify({ query: `{ pushPublicKey }` }),
	}).then((r) => r.json());

	return res?.data?.pushPublicKey ?? null;
}

async function saveSubscription(subscription: PushSubscription): Promise<boolean> {
	const json = subscription.toJSON();
	const token = await getToken();

	const res = await fetch(getGraphqlUrl(), {
		method: `POST`,
		headers: {
			'Content-Type': `application/json`,
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			query: `mutation SaveSub($endpoint: String!, $p256dh: String!, $auth: String!) {
				savePushSubscription(endpoint: $endpoint, p256dh: $p256dh, auth: $auth) { success }
			}`,
			variables: { endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth },
		}),
	}).then((r) => r.json());

	return !!res?.data?.savePushSubscription?.success;
}

// Called from the tasks page's "Enable task reminders" button, alongside the
// existing plain Notification-permission request - this is what actually lets a
// push arrive while the app is closed, the permission grant alone doesn't.
export async function subscribeToPush(): Promise<boolean> {
	const permission = await requestNotificationPermission();
	if (permission !== `granted`) return false;
	if (!(`serviceWorker` in navigator) || !(`PushManager` in window)) return false;

	const vapidPublicKey = await fetchVapidPublicKey();
	if (!vapidPublicKey) return false;

	const registration = await navigator.serviceWorker.ready;
	const existing = await registration.pushManager.getSubscription();
	const subscription = existing ?? await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
	});

	return saveSubscription(subscription);
}
