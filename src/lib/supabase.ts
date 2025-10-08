import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log(
  "[supabase] url:",
  url.replace(/^https:\/\/([^.]+)\..*$/, (_, ref) => `${ref.slice(-6)}`),
  "| anon tail:",
  anon.slice(-6),
);

export const supabase = createBrowserClient(url, anon);
