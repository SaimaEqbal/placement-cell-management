import { ReadOnlyDrivesPage } from "@/components/dashboard/ReadOnlyDrivesPage";
import { paths } from "../../routes/paths";

/** Purpose: /TPC/drives - read-only listing of all drives for TPCs. */
export default function TpcDrivesPage() {
  return <ReadOnlyDrivesPage basePath={paths.tpcDrives} />;
}
