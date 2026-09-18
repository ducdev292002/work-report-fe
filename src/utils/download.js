// Triggers a same-origin file download (relies on the browser sending the
// auth cookie automatically, same as any other same-origin navigation) via
// the API's Content-Disposition: attachment response — no extra fetch/blob
// handling needed, and it never navigates the SPA away.
export function downloadFromApi(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  const qs = query.toString();
  const url = `/api${path}${qs ? `?${qs}` : ''}`;

  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
