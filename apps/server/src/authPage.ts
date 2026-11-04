const escape = (value: string): string => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Human-facing auth pages. API endpoints keep structured responses for the native client. */
export function desktopPage(message: string, form = '', status = 200, title?: string): Response {
  const heading =
    title ??
    (status >= 400
      ? 'Sign-in could not finish'
      : form
        ? 'Connect your desktop game'
        : 'Return to Shattered Rifts');
  return new Response(
    `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0b0c10"><title>${escape(heading)} · Shattered Rifts</title>
<link rel="icon" href="/branding/logo-32.png" type="image/png">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;color:#ece8df;background:#0b0c10;font:16px/1.65 'Segoe UI',system-ui,sans-serif}
body::before{content:'';position:fixed;inset:0;z-index:-1;background:linear-gradient(110deg,#080c18ee,#14142ed9),url('/art/lore/key-art-clean.webp') center/cover}
main{width:min(100%,620px);padding:clamp(24px,5vw,48px);border:1px solid #94743d;border-radius:22px;background:linear-gradient(145deg,#15213aef,#090d19f7);box-shadow:0 25px 100px #000a}
.brand{display:flex;align-items:center;gap:14px;padding-bottom:24px;border-bottom:1px solid #d4a84b30}.brand img{width:56px;height:56px}.brand strong{font:700 23px/1.1 Georgia,serif;letter-spacing:.06em;color:#f4dc96}.brand span{display:block;font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:#aeb9d0;margin-top:7px}
.eyebrow{margin:28px 0 7px;color:#c5ad72;letter-spacing:.14em;text-transform:uppercase;font-size:12px;font-weight:700}h1{font:700 clamp(28px,5vw,38px)/1.15 Georgia,serif;color:#fae6af;margin:0 0 18px}p{margin:0 0 22px;color:#cbd3e3}.help{font-size:14px;color:#9caac1}
form{display:grid;gap:12px;margin:28px 0}button,.return{font:700 15px/1.4 'Segoe UI',system-ui,sans-serif;min-height:48px;border:1px solid #c7a055;border-radius:10px;padding:13px 20px;cursor:pointer;background:linear-gradient(#f0d48b,#c7a15b);color:#1b1820;transition:filter .15s}button:hover,.return:hover{filter:brightness(1.12)}button[name=cancel]{color:#dce3f0;background:#111b2d;border-color:#53627b}button:focus-visible,a:focus-visible{outline:3px solid #74d8ef;outline-offset:4px}a{color:#e3c578;text-underline-offset:4px}.footer{display:flex;gap:20px;flex-wrap:wrap;border-top:1px solid #d4a84b30;padding-top:22px;margin-top:28px;font-size:14px}.return{display:inline-flex;align-items:center;text-decoration:none}
@media(max-width:420px){body{padding:14px}main{border-radius:16px}.brand strong{font-size:20px}}
</style></head><body><main>
<header class="brand"><img src="/branding/logo-192.png" alt="" width="56" height="56"><div><strong>Shattered Rifts</strong><span>Desktop account</span></div></header>
<div class="eyebrow">${status >= 400 ? 'Let’s try that again' : form ? 'One last step' : 'Account connection'}</div>
<h1>${escape(heading)}</h1><p${status >= 400 ? ' role="alert"' : ''}>${escape(message)}</p>
${form || `<p class="help">${status >= 400 ? 'Return to the game, cancel the waiting request if it is still open, and choose Sign in with Google again. Your saved progress is unchanged.' : 'You can close this browser window and return to the desktop game.'}</p>`}
<footer class="footer"><a href="/#/">Visit the game website</a><span>Walk the broken worlds.</span></footer>
</main></body></html>`,
    {
      status,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'content-security-policy':
          "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
        // no-referrer makes navigation form POSTs carry Origin:null, which our origin gate rejects.
        'referrer-policy': 'same-origin',
        'x-content-type-options': 'nosniff',
      },
    },
  );
}
