import { DriveStatusPage } from "@/components/dashboard/DriveStatusPage";
import { paths } from "../../routes/paths";

/** Purpose: /TPC/drives/:driveId - read-only drive progress view for TPCs. */
export default function TpcDriveStatusPage() {
  return <DriveStatusPage backPath={paths.tpcDrives} />;
}
