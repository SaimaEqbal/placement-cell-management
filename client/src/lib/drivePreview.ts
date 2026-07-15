/**
 * Single source of truth for turning a stored document link into a URL that can
 * be embedded in an <iframe>. Google Drive share links only frame in their
 * `/preview` form: a `/file/d/<id>/view` link (or an `open?id=` / `uc?id=`
 * variant) is rewritten to `/file/d/<id>/preview`. Links to other hosts are
 * returned unchanged (they embed only if the host allows framing).
 *
 * Reuse this EVERYWHERE a Drive link is previewed so every surface renders the
 * same way the student profile does — DocumentPreview (student profile +
 * complete-profile wizard), StudentVerificationDetailPage (SPC/TPC review),
 * CompanyPostsPage (admin), and AnnouncementsPage (student feed) all go through
 * this one function.
 */
export function toDrivePreviewUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Standard share link: https://drive.google.com/file/d/<id>/view?usp=sharing
  const byPath = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (byPath) return `https://drive.google.com/file/d/${byPath[1]}/preview`;

  // Alternate forms: .../open?id=<id>, .../uc?id=<id>, ...&id=<id>
  const byQuery = trimmed.match(/[?&]id=([^&]+)/);
  if (byQuery && trimmed.includes("drive.google.com")) {
    return `https://drive.google.com/file/d/${byQuery[1]}/preview`;
  }

  return trimmed;
}
