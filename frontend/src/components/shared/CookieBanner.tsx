import { useEffect, useState } from 'react';

function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#212529',
        color: 'white',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        zIndex: 1050,
      }}
    >
      <span>
        We use cookies to support login sessions and improve your experience on
        the site.
      </span>
      <button className="btn btn-light btn-sm" onClick={acceptCookies}>
        Accept
      </button>
    </div>
  );
}

export default CookieBanner;