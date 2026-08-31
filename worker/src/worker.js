/**
 * AgentDiff token service — mints short-lived GitHub App installation tokens
 * for AgentDiff workflows, so the approve bot runs as the branded
 * agentdiff[bot] identity with zero per-repo secrets.
 *
 * Trust model:
 * - Stateless. Nothing is stored: no logs of tokens, no KV, no D1.
 * - The caller must present a GitHub Actions token that already has access
 *   to the repository it claims — we verify it against the GitHub API and
 *   only then mint a token (and only if the AgentDiff App is installed there).
 * - Tokens minted here expire in <= 1 hour (GitHub-enforced).
 */

const GH_API = "https://api.github.com";
const UA = "agentdiff-token-service";

const enc = new TextEncoder();

function b64urlFromBytes(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64ToBytes(b64) {
  const clean = b64.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** DER length encoding for lengths >= 128. */
function derLength(n) {
  if (n < 0x80) return new Uint8Array([n]);
  const bytes = [];
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n >>= 8;
  }
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function concat(...arrays) {
  const len = arrays.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

/**
 * Normalizes a GitHub App PEM to PKCS#8 DER for WebCrypto importKey.
 * GitHub issues PKCS#1 ("BEGIN RSA PRIVATE KEY"); WebCrypto needs PKCS#8.
 * PKCS#8 PrivateKeyInfo = SEQUENCE { INTEGER 0, AlgorithmIdentifier, OCTET STRING pkcs1 }
 */
function pemToPkcs8(pem) {
  const der = b64ToBytes(pem);
  if (pem.includes("BEGIN PRIVATE KEY")) return der; // already PKCS#8
  // PKCS#1: SEQUENCE { ... } -> wrap
  const version = new Uint8Array([0x02, 0x01, 0x00]); // INTEGER 0
  const algId = new Uint8Array([
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01,
    0x01, 0x05, 0x00, // SEQUENCE { OID rsaEncryption, NULL }
  ]);
  const octetBody = concat(version, algId, new Uint8Array([0x04]), derLength(der.length), der);
  return concat(new Uint8Array([0x30]), derLength(octetBody.length), octetBody);
}

async function signAppJwt(env) {
  const der = pemToPkcs8(env.AGENTDIFF_APP_PRIVATE_KEY);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const now = Math.floor(Date.now() / 1000);
  const head = b64urlFromBytes(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const body = b64urlFromBytes(enc.encode(JSON.stringify({ iss: env.AGENTDIFF_APP_ID, iat: now - 60, exp: now + 540 })));
  const input = `${head}.${body}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(input));
  return `${input}.${b64urlFromBytes(new Uint8Array(sig))}`;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": UA,
    Accept: "application/vnd.github+json",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return json({
        service: "agentdiff-token",
        status: "ok",
        stateless: true,
        mint: "POST /token {repository, token}",
      });
    }

    if (request.method === "GET" && url.pathname === "/app") {
      const slug = env.AGENTDIFF_APP_SLUG || "agentdiff";
      return Response.redirect(`https://github.com/apps/${slug}/installations/new`, 302);
    }

    if (request.method === "POST" && url.pathname === "/token") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "invalid JSON body" }, 400);
      }
      const repository = body?.repository;
      const callerToken = body?.token;
      if (!repository || !callerToken || !/^[^/]+\/[^/]+$/.test(repository)) {
        return json({ error: "repository (owner/repo) and token are required" }, 400);
      }

      // 1. The caller's Actions token must already have access to the repo.
      const probe = await fetch(`${GH_API}/repos/${repository}`, {
        headers: ghHeaders(callerToken),
      });
      if (!probe.ok) {
        return json({ error: "caller token rejected for this repository" }, 403);
      }

      // 2. Authenticate as the AgentDiff App.
      let jwt;
      try {
        jwt = await signAppJwt(env);
      } catch {
        return json({ error: "service misconfigured (app key)" }, 500);
      }

      // 3. The App must be installed on this repository.
      const inst = await fetch(`${GH_API}/repos/${repository}/installation`, {
        headers: ghHeaders(jwt),
      });
      if (!inst.ok) {
        return json(
          { error: "AgentDiff App is not installed on this repository" },
          403
        );
      }
      const installationId = (await inst.json()).id;

      // 4. Mint a short-lived installation token.
      const minted = await fetch(`${GH_API}/app/installations/${installationId}/access_tokens`, {
        method: "POST",
        headers: ghHeaders(jwt),
      });
      if (!minted.ok) {
        return json({ error: "failed to mint installation token" }, 502);
      }
      const data = await minted.json();
      return json({ token: data.token, expires_at: data.expires_at });
    }

    return json({ error: "not found" }, 404);
  },
};
