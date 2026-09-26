/**
 * Counts client-side page views in this tab. `document.referrer` does not
 * change on client navigations, so this is the reliable way to know whether
 * "back" would stay on the site.
 */
let pageViews = 0;

export function recordPageView() {
  pageViews += 1;
}

export function canGoBackInSite(): boolean {
  return pageViews > 1;
}
