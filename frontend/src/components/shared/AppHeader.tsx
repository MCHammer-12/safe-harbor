import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { logoutUser } from '@/lib/AuthApi';
import LogoMark from '@/components/shared/LogoMark';

type NavLeaf = {
  kind: 'link';
  to: string;
  label: string;
};

type NavGroup = {
  kind: 'group';
  label: string;
  children: NavLeaf[];
};

type NavItem = NavLeaf | NavGroup;

const publicItems: NavItem[] = [
  { kind: 'link', to: '/', label: 'Home' },
  { kind: 'link', to: '/impact', label: 'Impact' },
];

export default function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { authSession, isAuthenticated, isLoading, refreshAuthState } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const roles = authSession.roles ?? [];
  const isAdmin = roles.includes('Admin');
  const isDonor = roles.includes('Donor');

  async function handleLogout() {
    try {
      await logoutUser();
      await refreshAuthState();
      setMenuOpen(false);
      navigate('/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  const roleItems: NavItem[] = [];

  if (isAdmin) {
    roleItems.push(
      { kind: 'link', to: '/admin', label: 'Dashboard' },
      {
        kind: 'group',
        label: 'Case Management',
        children: [
          { kind: 'link', to: '/caseload', label: 'Caseload' },
          { kind: 'link', to: '/process-recordings', label: 'Process Recordings' },
          { kind: 'link', to: '/visitation-logs', label: 'Visitation Logs' },
        ],
      },
      {
        kind: 'group',
        label: 'Fundraising',
        children: [
          { kind: 'link', to: '/donors', label: 'Donor Contributions' },
          { kind: 'link', to: '/social-media', label: 'Social Media' },
          { kind: 'link', to: '/reports', label: 'Reports' },
        ],
      }
    );
  }

  if (isDonor) {
    roleItems.push({ kind: 'link', to: '/donor', label: 'My Dashboard' });
  }

  const navItems: NavItem[] = [...publicItems, ...roleItems];

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setOpenGroup(null);
    setOpenMobileGroup(null);
  }, [pathname]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!menuOpen && !openGroup) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setOpenGroup(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setOpenGroup(null);
      }
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, openGroup]);

  function isLinkActive(to: string) {
    return pathname === to;
  }

  function isGroupActive(group: NavGroup) {
    return group.children.some((c) => isLinkActive(c.to));
  }

  function renderDesktopLeaf(item: NavLeaf) {
    const active = isLinkActive(item.to);
    return (
      <li key={item.to}>
        <Link to={item.to}>
          <span
            className={`text-base xl:text-lg font-medium cursor-pointer transition-colors relative py-1 whitespace-nowrap ${
              active ? 'text-primary' : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            {item.label}
            {active && (
              <span
                className="absolute left-0 right-0 -bottom-1 h-[2px] bg-primary rounded-full"
                aria-hidden="true"
              />
            )}
          </span>
        </Link>
      </li>
    );
  }

  function renderDesktopGroup(group: NavGroup) {
    const open = openGroup === group.label;
    const active = isGroupActive(group);
    return (
      <li key={group.label} className="relative">
        <button
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpenGroup(open ? null : group.label)}
          className={`inline-flex items-center gap-1 text-base xl:text-lg font-medium cursor-pointer transition-colors relative py-1 whitespace-nowrap ${
            active || open ? 'text-primary' : 'text-foreground/70 hover:text-foreground'
          }`}
        >
          {group.label}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {active && !open && (
            <span
              className="absolute left-0 right-4 -bottom-1 h-[2px] bg-primary rounded-full"
              aria-hidden="true"
            />
          )}
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 min-w-[220px] rounded-xl border border-border bg-white shadow-lg overflow-hidden z-50"
          >
            <ul className="py-2">
              {group.children.map((child) => {
                const childActive = isLinkActive(child.to);
                return (
                  <li key={child.to}>
                    <Link to={child.to} onClick={() => setOpenGroup(null)}>
                      <span
                        className={`block px-4 py-2.5 text-base font-medium transition-colors ${
                          childActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground'
                        }`}
                      >
                        {child.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </li>
    );
  }

  function renderMobileItem(item: NavItem) {
    if (item.kind === 'link') {
      const active = isLinkActive(item.to);
      return (
        <li key={item.to}>
          <Link to={item.to} onClick={() => setMenuOpen(false)}>
            <span
              className={`block px-5 py-3 text-base font-medium rounded-lg transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              {item.label}
            </span>
          </Link>
        </li>
      );
    }

    const open = openMobileGroup === item.label;
    const active = isGroupActive(item);
    return (
      <li key={item.label}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpenMobileGroup(open ? null : item.label)}
          className={`w-full flex items-center justify-between px-5 py-3 text-base font-medium rounded-lg transition-colors ${
            active
              ? 'bg-primary/10 text-primary'
              : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground'
          }`}
        >
          <span>{item.label}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {open && (
          <ul className="mt-1 ml-3 pl-3 border-l border-border/60 flex flex-col gap-1">
            {item.children.map((child) => {
              const childActive = isLinkActive(child.to);
              return (
                <li key={child.to}>
                  <Link to={child.to} onClick={() => setMenuOpen(false)}>
                    <span
                      className={`block px-4 py-2.5 text-[15px] font-medium rounded-lg transition-colors ${
                        childActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/75 hover:bg-foreground/5 hover:text-foreground'
                      }`}
                    >
                      {child.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/60">
      <div
        ref={menuRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4"
      >
        <Link to="/" className="shrink-0 flex items-center gap-2 cursor-pointer">
          <LogoMark className="w-8 h-8 sm:w-9 sm:h-9 text-primary" />
          <span className="font-serif italic font-medium text-foreground text-xl sm:text-2xl tracking-wide select-none whitespace-nowrap">
            Safe Harbor
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden lg:flex flex-1">
          <ul className="flex items-center justify-end gap-5 xl:gap-6 w-full">
            {navItems.map((item) =>
              item.kind === 'link' ? renderDesktopLeaf(item) : renderDesktopGroup(item)
            )}

            {!isLoading && !isAuthenticated && (
              <>
                <li>
                  <Link to="/register">
                    <span className="text-sm xl:text-base font-medium px-4 py-2 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer whitespace-nowrap">
                      Register
                    </span>
                  </Link>
                </li>
                <li>
                  <Link to="/login">
                    <span className="text-sm xl:text-base font-medium px-4 py-2 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer whitespace-nowrap">
                      Login
                    </span>
                  </Link>
                </li>
              </>
            )}

            {!isLoading && isAuthenticated && (
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm xl:text-base font-medium px-4 py-2 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* Mobile burger button */}
        <button
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-foreground/15 text-foreground hover:bg-foreground/5 transition-colors"
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        {/* Mobile menu panel */}
        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Mobile navigation"
            className="lg:hidden absolute left-0 right-0 top-full bg-background border-b border-border/60 shadow-lg"
          >
            <ul className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1">
              {navItems.map((item) => renderMobileItem(item))}

              <li className="pt-2 mt-2 border-t border-border/60 flex flex-col gap-2">
                {!isLoading && !isAuthenticated && (
                  <>
                    <Link to="/register" onClick={() => setMenuOpen(false)}>
                      <span className="block text-center text-base font-medium px-5 py-3 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer">
                        Register
                      </span>
                    </Link>
                    <Link to="/login" onClick={() => setMenuOpen(false)}>
                      <span className="block text-center text-base font-medium px-5 py-3 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer">
                        Login
                      </span>
                    </Link>
                  </>
                )}
                {!isLoading && isAuthenticated && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full text-center text-base font-medium px-5 py-3 rounded-full border border-foreground/20 text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                )}
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
