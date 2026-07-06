import SidebarNav from "./dashboard/SidebarNav";

/**
 * Fixed left navigation rail shown on lg+ screens. Below lg it is hidden and the
 * same navigation is reached through the Topbar's mobile drawer. The nav body
 * itself lives in SidebarNav so both surfaces stay in sync.
 */
export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-background lg:flex lg:flex-col">
      <SidebarNav />
    </aside>
  );
}
