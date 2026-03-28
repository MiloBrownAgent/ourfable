"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, FolderLock, Users, Menu, X, Send,
  Bell, Settings, Sunrise, BookOpen, Globe, LogOut,
  ChevronDown, Check, Plus, Mail, PackageOpen,
} from "lucide-react";
import { useChildContext, type Child } from "@/components/ChildContext";

interface Notification { _id: string; memberName: string; preview: string; createdAt: number; readAt?: number; }

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

function buildChildNav(familyId: string) {
  return [
    { name: "Home", href: `/${familyId}`, icon: LayoutDashboard, exact: true },
    { name: "The Vault", href: `/${familyId}/vault`, icon: FolderLock },
    { name: "Dispatches", href: `/${familyId}/outgoings`, icon: Send },

    { name: "The World", href: `/${familyId}/born`, icon: Sunrise },
    { name: "Before You Were Born", href: `/${familyId}/before-born`, icon: BookOpen },
  ];
}

function buildShareNav(familyId: string) {
  return [
    { name: "Circle", href: `/${familyId}/circle`, icon: Users },
    { name: "Delivery", href: `/${familyId}/delivery`, icon: PackageOpen },
  ];
}

function buildBottomNav(familyId: string) {
  return [
    { name: "Settings", href: `/${familyId}/settings`, icon: Settings },
  ];
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "var(--font-body)",
      fontSize: 9,
      fontWeight: 600,
      letterSpacing: "0.14em",
      textTransform: "uppercase" as const,
      color: "var(--sage)",
      padding: "12px 16px 6px",
      margin: 0,
    }}>
      {children}
    </p>
  );
}

function NavItem({
  item,
  active,
}: {
  item: { name: string; href: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 12px",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        letterSpacing: "0.01em",
        fontFamily: "var(--font-body)",
        textDecoration: "none",
        color: active ? "var(--green)" : "#9A9590",
        background: "transparent",
        position: "relative" as const,
        transition: "color 160ms ease",
      }}
    >
      <Icon size={15} strokeWidth={active ? 1.8 : 1.4} />
      {item.name}
      {active && (
        <span style={{
          position: "absolute",
          bottom: 4,
          left: 12,
          right: 12,
          height: "0.5px",
          background: "var(--gold)",
          borderRadius: 1,
          animation: "goldLineDraw 300ms var(--spring) both",
          transformOrigin: "left",
        }} />
      )}
    </Link>
  );
}

// Child accent colors — subtle pastels
const CHILD_COLORS = [
  { bg: "rgba(74,94,76,0.12)", text: "var(--green)" },
  { bg: "rgba(200,168,122,0.18)", text: "var(--gold)" },
  { bg: "rgba(107,143,111,0.15)", text: "var(--sage)" },
  { bg: "rgba(120,80,160,0.1)", text: "#7850a0" },
];

function getChildColor(index: number) {
  return CHILD_COLORS[index % CHILD_COLORS.length];
}

function ChildSwitcher({ familyId }: { familyId: string }) {
  const { children, selectedChild, setSelectedChild, loading } = useChildContext();
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Only show switcher if there are 2+ children
  if (loading || children.length < 2) return null;

  const selectedIndex = children.findIndex((c) => c._id === selectedChild?._id);
  const selectedColor = getChildColor(selectedIndex < 0 ? 0 : selectedIndex);
  const firstName = selectedChild?.childName.split(" ")[0] ?? "Child";

  return (
    <div ref={dropRef} style={{ padding: "10px 12px 6px", position: "relative" }}>
      <button
        onClick={() => setOpen((s) => !s)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%",
          background: selectedColor.bg,
          border: "none",
          borderRadius: 20,
          padding: "6px 12px",
          cursor: "pointer",
          transition: "opacity 160ms",
        }}
      >
        <span style={{
          fontSize: 12, fontWeight: 600,
          fontFamily: "var(--font-body)",
          color: selectedColor.text,
          flex: 1,
          textAlign: "left",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {firstName}
        </span>
        <ChevronDown
          size={12}
          strokeWidth={2}
          color={selectedColor.text}
          style={{ transition: "transform 200ms", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
        />
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 2px)",
          left: 12,
          right: 12,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 100,
          overflow: "hidden",
          animation: "fadeDown 160ms ease both",
        }}>
          {children.map((child, idx) => {
            const isActive = child._id === selectedChild?._id;
            const color = getChildColor(idx);
            const first = child.childName.split(" ")[0];
            return (
              <button
                key={child._id}
                onClick={() => {
                  setSelectedChild(child._id);
                  setOpen(false);
                  // Reload current page so child-aware data refreshes
                  router.refresh();
                }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 14px",
                  background: isActive ? color.bg : "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderBottom: idx < children.length - 1 ? "0.5px solid var(--border)" : "none",
                  transition: "background 120ms",
                }}
              >
                <span style={{
                  fontSize: 13, fontFamily: "var(--font-body)",
                  color: isActive ? color.text : "var(--text-2)",
                  fontWeight: isActive ? 500 : 400,
                }}>
                  {first}
                </span>
                {isActive && <Check size={12} strokeWidth={2.5} color={color.text} />}
              </button>
            );
          })}
          <Link
            href={`/${familyId}/add-child`}
            onClick={() => setOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px",
              borderTop: "0.5px solid var(--border)",
              fontSize: 12, fontFamily: "var(--font-body)",
              color: "var(--text-3)",
              textDecoration: "none",
              transition: "color 160ms",
            }}
          >
            <Plus size={12} strokeWidth={2} />
            Add a child
          </Link>
        </div>
      )}

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function SidebarContent({
  familyId,
  familyDisplayName,
  childFirst,
  pathname,
  onClose,
}: {
  familyId: string;
  familyDisplayName?: string;
  childFirst?: string;
  pathname: string;
  onClose?: () => void;
}) {
  const { selectedChild, children: kids } = useChildContext();
  const childNav = buildChildNav(familyId);
  const shareNav = buildShareNav(familyId);
  const bottomNav = buildBottomNav(familyId);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // Derive the display name for the "For X" section label
  const displayFirst = selectedChild
    ? selectedChild.childName.split(" ")[0]
    : childFirst;

  useEffect(() => {
    fetch(`/api/ourfable/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:listNotifications", args: { familyId } }),
    }).then(r => r.json()).then(d => setNotifications(d.value ?? []));
  }, [familyId]);

  const unread = notifications.filter(n => !n.readAt).length;

  const markRead = () => {
    if (unread > 0) {
      fetch(`/api/ourfable/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:markNotificationsRead", args: { familyId }, type: "mutation" }),
      }).then(() => setNotifications(ns => ns.map(n => ({ ...n, readAt: n.readAt ?? Date.now() }))));
    }
    setShowNotifs(s => !s);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{
        padding: "22px 20px 18px",
        borderBottom: "0.5px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <span style={{
            fontFamily: "var(--font-playfair)",
            fontSize: 20, fontWeight: 700,
            color: "var(--green)",
            letterSpacing: "0.02em",
          }}>
            Our Fable
          </span>
          {familyDisplayName && (
            <p style={{
              fontSize: 10, color: "var(--text-3)",
              letterSpacing: "0.12em", textTransform: "uppercase",
              marginTop: 3,
            }}>
              {familyDisplayName}
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={markRead} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4 }}>
            <Bell size={15} strokeWidth={1.5} />
            {unread > 0 && (
              <span style={{ position: "absolute", top: 1, right: 1, width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", border: "1.5px solid var(--surface)" }} />
            )}
          </button>
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4 }}>
              <X size={17} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Notifications dropdown */}
      {showNotifs && (
        <div style={{ borderBottom: "0.5px solid var(--border)", padding: "10px 12px", background: "var(--bg-2)" }}>
          {notifications.length === 0 ? (
            <p style={{ fontSize: 11, color: "var(--text-3)", fontStyle: "italic", padding: "4px 4px" }}>No activity yet.</p>
          ) : notifications.slice(0, 5).map(n => (
            <div key={n._id} style={{ padding: "7px 6px", borderBottom: "0.5px solid var(--border)" }}>
              <p style={{ fontSize: 11, color: n.readAt ? "var(--text-3)" : "var(--text-2)", lineHeight: 1.5 }}>
                <strong style={{ color: n.readAt ? "var(--text-3)" : "var(--text)" }}>{n.memberName}</strong> · {n.preview}
              </p>
              <p style={{ fontSize: 10, color: "var(--text-4)", marginTop: 2 }}>{timeAgo(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Child Switcher — only visible if 2+ children */}
      {kids.length >= 2 && <ChildSwitcher familyId={familyId} />}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px 12px" }}>
        {/* For [displayFirst] */}
        <SectionLabel>{displayFirst ? `For ${displayFirst}` : "Family"}</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {childNav.map(item => {
            const active = ("exact" in item && item.exact)
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return <NavItem key={item.name} item={item} active={active} />;
          })}
        </div>

        {/* Share */}
        <SectionLabel>Share</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {shareNav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return <NavItem key={item.name} item={item} active={active} />;
          })}
        </div>

        {/* Bottom — Settings */}
        <div style={{ borderTop: "0.5px solid var(--border)", marginTop: 16, paddingTop: 8 }}>
          {bottomNav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return <NavItem key={item.name} item={item} active={active} />;
          })}
        </div>
      </nav>

      {/* Footer — Logout + branding */}
      <div style={{ padding: "10px 10px 14px", borderTop: "0.5px solid var(--border)" }}>
        <a
          href="/api/auth/logout"
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "11px 16px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: "0.01em",
            textDecoration: "none",
            color: "#9A9590",
            transition: "color 180ms",
          }}
        >
          <LogOut size={16} strokeWidth={1.4} />
          Log out
        </a>
        <p style={{ fontSize: 10, color: "var(--text-4)", letterSpacing: "0.08em", padding: "4px 16px 0" }}>ourfable.ai</p>
      </div>
    </div>
  );
}

export function Sidebar({ familyId, familyDisplayName, childFirst }: { familyId: string; familyDisplayName?: string; childFirst?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
          height: 52, display: "flex", alignItems: "center", gap: 12,
          padding: "0 16px",
          borderBottom: "0.5px solid var(--border)",
          background: "rgba(253,251,247,0.94)", backdropFilter: "blur(16px)",
          paddingLeft: "max(16px, env(safe-area-inset-left, 16px))",
          paddingRight: "max(16px, env(safe-area-inset-right, 16px))",
        }}
        className="sidebar-topbar"
      >
        <button
          onClick={() => setOpen(!open)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 6 }}
        >
          {open ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
        </button>
        <span style={{
          fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700,
          color: "var(--green)", letterSpacing: "0.02em",
        }}>
          Our Fable
        </span>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 45, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
          width: 224,
          background: "var(--surface)",
          borderRight: "0.5px solid var(--border)",
        }}
        className={`sidebar-desktop ${open ? "sidebar-open" : "sidebar-closed"}`}
      >
        <SidebarContent
          familyId={familyId}
          familyDisplayName={familyDisplayName}
          childFirst={childFirst}
          pathname={pathname}
          onClose={() => setOpen(false)}
        />
      </aside>

      <style>{`
        .sidebar-topbar { display: flex; }
        .sidebar-desktop {
          transform: translateX(-100%);
          transition: transform 280ms cubic-bezier(0.4,0,0.2,1);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .sidebar-open { transform: translateX(0) !important; }
        @media (min-width: 768px) {
          .sidebar-topbar { display: none !important; }
          .sidebar-desktop { transform: translateX(0) !important; }
        }
      `}</style>
    </>
  );
}
