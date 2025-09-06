import { Style } from "hono/css";
import { jsxRenderer } from "hono/jsx-renderer";
import { Script } from "honox/server";

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <Script src="/app/client.ts" async />
        <script src="https://cdn.tailwindcss.com"></script>
        <Style />
      </head>
      <body class="bg-white">
        <div>{children}</div>
      </body>
    </html>
  );
});
