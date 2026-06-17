export const JWT_REGEX = {
  signed: {
    jwt: new RegExp("^([^\\.]+)\\.([^\\.]+)\\.([^\\.]+)$"),
    cm: new RegExp("^([^\\.]+)(\\.)([^\\.]+)(\\.)([^\\.]+)$"),
  },
  encrypted: {
    jwt: new RegExp(
      "^([^\\.]+)\\.([^\\.]*)\\.([^\\.]+)\\.([^\\.]+)\\.([^\\.]+)$",
    ),
    cm: new RegExp(
      "^([^\\.]+)(\\.)([^\\.]*)(\\.)([^\\.]+)(\\.)([^\\.]+)(\\.)([^\\.]+)$",
    ),
  },
};

export function algPermutations(prefixes) {
  return prefixes.reduce(
    (a, v) => [...a, ...[256, 384, 512].map((x) => v + x)],
    [],
  );
}

export const rsaSigningAlgs = algPermutations(["RS", "PS"]);
export const ecdsaSigningAlgs = algPermutations(["ES"]);
export const hmacSigningAlgs = algPermutations(["HS"]);

export const signingAlgs = [
  ...rsaSigningAlgs,
  ...ecdsaSigningAlgs,
  ...hmacSigningAlgs,
];

export const rsaKeyEncryptionAlgs = ["RSA-OAEP", "RSA-OAEP-256"];
export const ecdhKeyEncryptionAlgs = [
  "ECDH-ES",
  "ECDH-ES+A128KW",
  "ECDH-ES+A256KW",
];
export const pbes2KeyEncryptionAlgs = [
  "PBES2-HS256+A128KW",
  "PBES2-HS384+A192KW",
  "PBES2-HS512+A256KW",
];
export const kwKeyEncryptionAlgs = ["A128KW", "A256KW", "A128GCMKW", "A256GCMKW"];

export const keyEncryptionAlgs = [
  ...rsaKeyEncryptionAlgs,
  ...pbes2KeyEncryptionAlgs,
  ...kwKeyEncryptionAlgs,
  ...ecdhKeyEncryptionAlgs,
  "dir",
];

export const contentEncryptionAlgs = [
  "A128CBC-HS256",
  "A256CBC-HS512",
  "A128GCM",
  "A256GCM",
];

export function quantify(quantity, term) {
  const termIsPlural = term.endsWith("s");
  const quantityIsPlural = quantity != 1 && quantity != -1;
  if (termIsPlural && !quantityIsPlural) return term.slice(0, -1);
  return !termIsPlural && quantityIsPlural ? term + "s" : term;
}

export function reformIndents(s) {
  return s
    .split(/\n/g)
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

export function timeAgo(time, now = Date.now()) {
  const diffSec = Math.round((time.getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  const abs = Math.abs(diffSec);
  if (abs >= 86400 * 365) {
    return rtf.format(Math.round(diffSec / (86400 * 365)), "year");
  }
  if (abs >= 86400 * 30) {
    return rtf.format(Math.round(diffSec / (86400 * 30)), "month");
  }
  if (abs >= 86400 * 7) {
    return rtf.format(Math.round(diffSec / (86400 * 7)), "week");
  }
  if (abs >= 86400) {
    return rtf.format(Math.round(diffSec / 86400), "day");
  }
  if (abs >= 3600) {
    return rtf.format(Math.round(diffSec / 3600), "hour");
  }
  if (abs >= 60) {
    return rtf.format(Math.round(diffSec / 60), "minute");
  }
  return rtf.format(diffSec, "second");
}

export function formatTimeString(time) {
  return time.toISOString().replace(".000Z", "Z");
}

export function hmacToKeyBits(alg) {
  switch (alg) {
    case "HS256":
      return 256;
    case "HS384":
      return 384;
    case "HS512":
      return 512;
  }
  return 9999999;
}

export function requiredKeyBitsForAlg(alg) {
  if (alg.startsWith("PBES2")) {
    return hmacToKeyBits(alg.substring(6, 11));
  }
  if (alg.startsWith("HS")) {
    return hmacToKeyBits(alg);
  }
  switch (alg) {
    case "A128CBC-HS256":
      return 256;
    case "A192CBC-HS384":
      return 384;
    case "A256CBC-HS512":
      return 512;
    case "A128GCM":
      return 128;
    case "A192GCM":
      return 192;
    case "A256GCM":
      return 256;
    case "A128KW":
      return 128;
    case "A192KW":
      return 192;
    case "A256KW":
      return 256;
    case "A128GCMKW":
      return 128;
    case "A256GCMKW":
      return 256;
  }
  return 99999;
}

export function looksLikePem(s) {
  s = s.trim();
  return (
    (s.startsWith("-----BEGIN PRIVATE KEY-----") &&
      s.endsWith("-----END PRIVATE KEY-----")) ||
    (s.startsWith("-----BEGIN PUBLIC KEY-----") &&
      s.endsWith("-----END PUBLIC KEY-----")) ||
    (s.startsWith("-----BEGIN RSA PUBLIC KEY-----") &&
      s.endsWith("-----END RSA PUBLIC KEY-----")) ||
    (s.startsWith("-----BEGIN RSA PRIVATE KEY-----") &&
      s.endsWith("-----END RSA PRIVATE KEY-----"))
  );
}

export function looksLikeJwks(s) {
  try {
    const parsed = JSON.parse(s);
    return parsed.keys && parsed.keys.length > 0 && parsed.keys[0].kty
      ? parsed
      : null;
  } catch (_exc1) {
    return false;
  }
}

export function checkValidityReasons(
  pHeader,
  pPayload,
  acceptableAlgorithms,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  const wantCheckIat = true;
  const reasons = [];

  if (pHeader.alg === undefined) {
    reasons.push("the header lacks the required alg property");
  }

  if (acceptableAlgorithms.indexOf(pHeader.alg) < 0) {
    reasons.push(`the algorithm is (${pHeader.alg}) not acceptable`);
  }

  if (pPayload.exp !== undefined && typeof pPayload.exp == "number") {
    const expiry = new Date(pPayload.exp * 1000);
    const expiresString = formatTimeString(expiry);
    const delta = nowSeconds - pPayload.exp;
    const timeUnit = quantify(delta, "seconds");
    if (delta > 0) {
      reasons.push(
        `the expiry time (${expiresString}) is in the past, ${delta} ${timeUnit} ago`,
      );
    }
  }

  if (pPayload.nbf !== undefined && typeof pPayload.nbf == "number") {
    const notBefore = new Date(pPayload.nbf * 1000);
    const notBeforeString = formatTimeString(notBefore);
    const delta = pPayload.nbf - nowSeconds;
    const timeUnit = quantify(delta, "seconds");
    if (delta > 0) {
      reasons.push(
        `the not-before time (${notBeforeString}) is in the future, in ${delta} ${timeUnit}`,
      );
    }
  }

  if (wantCheckIat && pPayload.iat !== undefined && typeof pPayload.iat == "number") {
    const issuedAt = new Date(pPayload.iat * 1000);
    const issuedAtString = formatTimeString(issuedAt);
    const delta = pPayload.iat - nowSeconds;
    const timeUnit = quantify(delta, "seconds");
    if (delta > 0) {
      reasons.push(
        `the issued-at time (${issuedAtString}) is in the future, in ${delta} ${timeUnit}`,
      );
    }
  }

  return reasons;
}

export function keysAreCompatible(alg1, alg2) {
  const prefix1 = alg1.substring(0, 2);
  const prefix2 = alg2.substring(0, 2);
  if (["RS", "PS"].indexOf(prefix1) >= 0 && ["RS", "PS"].indexOf(prefix2) >= 0) {
    return true;
  }
  if (prefix1 == "ES") return alg1 == alg2;
  return false;
}

export const isSymmetric = (alg) => alg.startsWith("HS");

export function looksLikeJwt(possibleJwt) {
  if (!possibleJwt || possibleJwt == "") return false;
  let matches = JWT_REGEX.signed.jwt.exec(possibleJwt);
  if (matches && matches.length == 4) {
    return true;
  }
  matches = JWT_REGEX.encrypted.jwt.exec(possibleJwt);
  return !!(matches && matches.length == 6);
}