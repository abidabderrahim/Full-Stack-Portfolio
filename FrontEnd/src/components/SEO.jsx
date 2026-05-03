import { useEffect, useState } from "react";

const SEO = ({ page, slug }) => {
  const [seoData, setSeoData] = useState(null);

  useEffect(() => {
    fetch("/Config/PortfolioConfig.json")
      .then((res) => res.json())
      .then((config) => {
        const data =
          config.portfolio_config.seo[page] || config.portfolio_config.seo.default;
        setSeoData(data);
      })
      .catch((err) => console.error("Failed to load SEO config:", err));
  }, [page]);

  useEffect(() => {
    if (!seoData) return;

    const title = seoData.title;
    const description = seoData.description;
    const path = (seoData.path || "/").replace("{slug}", slug || "");
    const url = `${import.meta.env.VITE_APP_BASE_URL}${path}`;
    const image = seoData.image;

    // Document title
    document.title = title;

    // Meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement("meta");
      descMeta.name = "description";
      document.head.appendChild(descMeta);
    }
    descMeta.content = description;

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // Open Graph
    const setOG = (property, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setOG("og:title", title);
    setOG("og:description", description);
    setOG("og:url", url);
    setOG("og:image", image);
    setOG("og:type", seoData.type || "website");

    // Twitter Card
    const setTwitter = (name, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setTwitter("twitter:card", "summary_large_image");
    setTwitter("twitter:title", title);
    setTwitter("twitter:description", description);
    setTwitter("twitter:image", image);

    // JSON-LD structured data
    let ldScript = document.getElementById("structured-data");
    if (!ldScript) {
      ldScript = document.createElement("script");
      ldScript.type = "application/ld+json";
      ldScript.id = "structured-data";
      document.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": seoData.schemaType || "WebPage",
      "name": title,
      "description": description,
      "url": url,
      "image": image ? [image] : undefined,
    });
  }, [seoData, slug]);

  return null;
};

export default SEO;