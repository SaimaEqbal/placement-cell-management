import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bell, LogOut, Menu, Trash2, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiError } from "../api/apiError";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import { deleteMyAccount } from "../services/authService";
import { accountPathForRole, notificationsPathForRole, paths } from "../routes/paths";
import { ROLE_LABEL } from "../lib/roleLabels";
import SidebarNav from "./dashboard/SidebarNav";

/**
 * Purpose: sticky page header showing a title/subtitle the page provides, plus a
 * role-aware (or caller-supplied) avatar. On small screens it also hosts the
 * hamburger that opens the navigation drawer, since the sidebar rail is hidden.
 */
export default function Topbar({
  title,
  subtitle,
  initials,
}: {
  title: string;
  subtitle: string;
  /** Optional override, e.g. initials derived from the loaded profile's name. Falls back to the signed-in role's initials. */
  initials?: string;
}) {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Self-service account deletion (admin & TPC only). Gated by a type-DELETE-to-
  // confirm dialog; on success the session is cleared and we return to /login.
  const canDeleteAccount = role === "admin" || role === "tpc";
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const deleteAccount = useMutation<{ message: string }, ApiError, void>({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      logout();
      navigate(paths.login, { replace: true });
    },
  });
  const displayInitials = initials ?? (role ? role.slice(0, 2).toUpperCase() : "??");
  const accountPath = accountPathForRole(role);
  const roleLabel = role ? ROLE_LABEL[role] : "Account";
  // Every role now has its own notifications page (see routes/paths.ts /
  // routes/AppRoutes.tsx) - student/spc share one route, tpc and admin each
  // have their own. useNotifications shares its react-query cache/key with
  // NotificationsPage, so this doesn't add an extra network request when
  // both are mounted.
  const notificationsPath = notificationsPathForRole(role);
  const canSeeNotifications = notificationsPath !== null;
  const { data: notifications } = useNotifications({ enabled: canSeeNotifications });
  const hasUnread = (notifications?.some((n) => !n.read)) ?? false;

  const handleBellClick = () => {
    if (notificationsPath) {
      navigate(notificationsPath);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open navigation menu"
            className="grid size-9 shrink-0 place-items-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Application navigation menu
          </SheetDescription>
          <SidebarNav onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground md:text-sm">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative grid size-9 cursor-pointer place-items-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          aria-label="Notifications"
          onClick={handleBellClick}
          disabled={!canSeeNotifications}
        >
          <Bell className="size-4" />
          {hasUnread && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
          )}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="grid size-9 cursor-pointer place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {displayInitials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="truncate text-sm font-medium">{roleLabel}</div>
              <div className="truncate text-xs font-normal text-muted-foreground">
                {user?.email ?? ""}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {accountPath && (
              <DropdownMenuItem onClick={() => navigate(accountPath)} className="cursor-pointer">
                <UserRound />
                View profile
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => logout()}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
            {canDeleteAccount && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 />
                  Delete account
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Destructive self-delete, gated by typing DELETE. */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setConfirmText("");
            deleteAccount.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your {roleLabel} account and cannot be undone.
              Type <span className="font-semibold">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            autoComplete="off"
            aria-label="Type DELETE to confirm"
          />
          {deleteAccount.isError && (
            <p className="text-sm text-destructive">
              {deleteAccount.error?.message ?? "Could not delete your account."}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== "DELETE" || deleteAccount.isPending}
              onClick={() => deleteAccount.mutate()}
            >
              {deleteAccount.isPending ? "Deleting..." : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
