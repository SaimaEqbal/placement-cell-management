import { ReadOnlyDrivesPage } from "@/components/dashboard/ReadOnlyDrivesPage";
import { paths } from "../../routes/paths";

/** Purpose: /SPC/drives - read-only listing of all drives for SPCs. */
export default function SpcDrivesPage() {
  return <ReadOnlyDrivesPage basePath={paths.spcDrives} />;
}
