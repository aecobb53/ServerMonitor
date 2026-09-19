import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

const CENTER_LINKS = [
  { to: '/events', label: 'Events' },
  { to: '/polls', label: 'Polls' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/maps', label: 'Maps' },
  { to: '/requests', label: 'Requests' },
];

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>

        {/* Left — identity / home */}
        <NavLink to="/" className={styles.brand}>
          <span className={styles.brandIcon}>⚔</span>
          <span className={styles.brandName}>Server Monitor</span>
        </NavLink>

        {/* Center — community pages */}
        <ul className={styles.centerLinks}>
          {CENTER_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  [styles.navLink, isActive ? styles.navLinkActive : ''].join(' ')
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right — servers dashboard */}
        <NavLink
          to="/servers"
          className={({ isActive }) =>
            [styles.navLinkRight, isActive ? styles.navLinkActive : ''].join(' ')
          }
        >
          Servers
        </NavLink>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
          aria-label="Toggle navigation menu"
        >
          <span className={styles.menuButtonBar} />
          <span className={styles.menuButtonBar} />
          <span className={styles.menuButtonBar} />
        </button>

      </div>

      <div
        id="mobile-nav-menu"
        className={[styles.mobileMenu, menuOpen ? styles.mobileMenuOpen : ''].join(' ')}
      >
        <ul className={styles.mobileLinks}>
          {CENTER_LINKS.map(({ to, label }) => (
            <li key={`mobile-${to}`}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  [styles.mobileNavLink, isActive ? styles.mobileNavLinkActive : ''].join(' ')
                }
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink
              to="/servers"
              className={({ isActive }) =>
                [styles.mobileServersLink, isActive ? styles.mobileServersLinkActive : ''].join(' ')
              }
              onClick={() => setMenuOpen(false)}
            >
              Servers Dashboard
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
