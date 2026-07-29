import { DriveStatusPage } from "@/components/dashboard/DriveStatusPage";
import { paths } from "../../routes/paths";

/** Purpose: /SPC/drives/:driveId - read-only drive progress view for SPCs. */
export default function SpcDriveStatusPage() {
  return <DriveStatusPage backPath={paths.spcDrives} />;
}
