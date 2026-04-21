import { useEffect } from "react";

/**
 * Loads Google Website Translator (free, no API key) once.
 * Hidden gadget container — we trigger languages via the LanguageSwitcher.
 *
 * Available everywhere: Carnet, Suivi, Mood, Discover, Auth, Profil, Offres, etc.
 * Users can pick from 100+ languages even on pages we haven't manually translated yet.
 */
const GoogleTranslate = () => {
  useEffect(() => {
    if (document.getElementById("google-translate-script")) return;

    // Init callback (must exist on window before script loads)
    (window as any).googleTranslateElementInit = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "fr",
          // Curated list — Google can translate to 100+ but we expose the most common
          includedLanguages:
            "en,es,de,it,pt,nl,pl,ru,ja,zh-CN,ko,ar,tr,hi,id,th,vi,sv,da,no,fi,el,he,cs,ro,uk",
          layout: 0, // SIMPLE
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    // Hide Google's top banner that pushes the page down
    const style = document.createElement("style");
    style.id = "google-translate-style";
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate { display: none !important; }
      body { top: 0 !important; }
      .goog-tooltip, .goog-tooltip:hover { display: none !important; }
      .goog-text-highlight { background-color: transparent !important; box-shadow: none !important; }
      #google_translate_element { display: none; }
    `;
    document.head.appendChild(style);
  }, []);

  return <div id="google_translate_element" />;
};

export default GoogleTranslate;
