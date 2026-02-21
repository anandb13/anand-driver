import { useEffect, useRef } from "react";

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

const useAutoLogout = (user, onLogout) => {
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetTimer = () => {
    clearTimer();

    timerRef.current = setTimeout(() => {
      clearTimer(); // clear immediately
      onLogout();
      alert("Logged out due to 15 minutes of inactivity.");
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    if (!user) {
      clearTimer();
      return;
    }

    const events = ["mousemove", "keydown", "click", "scroll"];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      clearTimer();
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [user]);
};

export default useAutoLogout;