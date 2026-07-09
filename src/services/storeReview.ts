function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

export function getStoreReviewUrl(): string | null {
  const playPackage = import.meta.env.VITE_PLAY_STORE_PACKAGE?.trim();
  const appStoreId = import.meta.env.VITE_APP_STORE_ID?.trim();
  const playUrl = import.meta.env.VITE_PLAY_STORE_REVIEW_URL?.trim();
  const appStoreUrl = import.meta.env.VITE_APP_STORE_REVIEW_URL?.trim();

  if (isIOS() && appStoreId) {
    return (
      appStoreUrl ||
      `https://apps.apple.com/app/id${appStoreId}?action=write-review`
    );
  }

  if (isAndroid() && playPackage) {
    return (
      playUrl ||
      `https://play.google.com/store/apps/details?id=${playPackage}&showAllReviews=true`
    );
  }

  if (playPackage) {
    return (
      playUrl ||
      `https://play.google.com/store/apps/details?id=${playPackage}&showAllReviews=true`
    );
  }

  if (appStoreId) {
    return (
      appStoreUrl ||
      `https://apps.apple.com/app/id${appStoreId}?action=write-review`
    );
  }

  return playUrl || appStoreUrl || null;
}

export function openStoreReview(): boolean {
  const url = getStoreReviewUrl();
  if (!url) return false;

  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
