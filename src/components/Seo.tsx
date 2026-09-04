import { Helmet } from "react-helmet-async";

const SITE = "https://cashow.lovable.app";

interface SeoProps {
  title: string;
  description: string;
  path: string; // e.g. "/", "/auth", "/privacy"
  image?: string;
  imageAlt?: string;
}

export function Seo({ title, description, path, image, imageAlt }: SeoProps) {
  const url = `${SITE}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && (
        <>
          <meta property="og:image" content={image} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={imageAlt || title} />
          <meta name="twitter:image" content={image} />
          <meta name="twitter:image:alt" content={imageAlt || title} />
        </>
      )}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:url" content={url} />
    </Helmet>
  );
}
