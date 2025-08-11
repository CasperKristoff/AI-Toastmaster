import { useState, useEffect, useCallback } from "react";

export const useFullScreenManager = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showFullScreenPrompt, setShowFullScreenPrompt] = useState(false);

  // Full-screen management
  const enterFullScreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        const element = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
          mozRequestFullScreen?: () => Promise<void>;
          msRequestFullscreen?: () => Promise<void>;
        };
        if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
      }
      setIsFullScreen(true);
      setShowFullScreenPrompt(false);
    } catch (error) {
      console.error("Error entering full screen:", error);
      // Fallback: just hide the prompt
      setShowFullScreenPrompt(false);
    }
  }, []);

  const exitFullScreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else {
        const doc = document as Document & {
          webkitExitFullscreen?: () => Promise<void>;
          mozCancelFullScreen?: () => Promise<void>;
          msExitFullscreen?: () => Promise<void>;
        };
        if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
      setIsFullScreen(false);
    } catch (error) {
      console.error("Error exiting full screen:", error);
    }
  }, []);

  // Check full-screen state
  const checkFullScreenState = useCallback(() => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      mozFullScreenElement?: Element | null;
      msFullscreenElement?: Element | null;
    };
    const isCurrentlyFullScreen = !!(
      document.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
    setIsFullScreen(isCurrentlyFullScreen);
  }, []);

  // Full-screen event listeners
  useEffect(() => {
    const handleFullScreenChange = () => {
      checkFullScreenState();
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange", handleFullScreenChange);
    document.addEventListener("MSFullscreenChange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullScreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullScreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullScreenChange,
      );
    };
  }, [checkFullScreenState]);

  return {
    isFullScreen,
    showFullScreenPrompt,
    setShowFullScreenPrompt,
    enterFullScreen,
    exitFullScreen,
  };
};
