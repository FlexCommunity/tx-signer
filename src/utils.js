export async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function getSessionKeyFromLocationUrl() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('session');
}
