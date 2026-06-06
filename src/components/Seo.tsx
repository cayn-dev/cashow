import { Helmet } from "react-helmet-async";

const SITE = "https://cashowjf.lovable.app";

interface SeoProps {
  title: string;
  description: string;
  path: string; // e.g. "/", "/auth", "/privacy"
}

export function Seo({ title, description, path }: SeoProps) {
  const url = `${SITE}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:url" content={url} />
    </Helmet>
  );
}
