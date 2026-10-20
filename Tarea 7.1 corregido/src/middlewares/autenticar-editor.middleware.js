const crypto = require("crypto");
const { Buffer } = require("node:buffer");

const cuentas = [
  {
    usuario: process.env.INCIDENTE_ANALISTA_USERNAME,
    password: process.env.INCIDENTE_ANALISTA_PASSWORD,
    rol: "ANALISTA",
  },
  {
    usuario: process.env.INCIDENTE_SUPERVISOR_USERNAME,
    password: process.env.INCIDENTE_SUPERVISOR_PASSWORD,
    rol: "SUPERVISOR",
  },
  {
    usuario: process.env.INCIDENTE_ADMIN_USERNAME,
    password: process.env.INCIDENTE_ADMIN_PASSWORD,
    rol: "ADMIN",
  },
];

if (cuentas.some(({ usuario, password }) => !usuario || !password)) {
  throw new Error(
    "Configure INCIDENTE_{ANALISTA,SUPERVISOR,ADMIN}_USERNAME y _PASSWORD"
  );
}

if (cuentas.some(({ password }) => password.length < 12)) {
  throw new Error("Las contraseñas de roles deben tener al menos 12 caracteres");
}

if (
  cuentas.some(
    ({ usuario }) =>
      usuario.length > 64 ||
      usuario.includes(":") ||
      Array.from(usuario).some((character) => {
        const code = character.charCodeAt(0);
        return code <= 0x1f || code === 0x7f;
      })
  )
) {
  throw new Error("Los nombres de usuario deben tener hasta 64 caracteres y no incluir ':'");
}

const usuariosNormalizados = cuentas.map(({ usuario }) => usuario.toLowerCase());
const passwords = cuentas.map(({ password }) => password);
if (
  new Set(usuariosNormalizados).size !== cuentas.length ||
  new Set(passwords).size !== cuentas.length
) {
  throw new Error("Cada rol debe tener un usuario y contraseña únicos");
}

function coincide(valor, esperado) {
  const hashValor = crypto.createHash("sha256").update(valor).digest();
  const hashEsperado = crypto.createHash("sha256").update(esperado).digest();
  return crypto.timingSafeEqual(hashValor, hashEsperado);
}

function autenticarUsuario(req, res, next) {
  const authorization = req.get("Authorization") || "";
  const coincidencia = authorization.match(/^Basic ([A-Za-z0-9+/]+={0,2})$/);

  if (!coincidencia) {
    res.set("WWW-Authenticate", 'Basic realm="CSIRT", charset="UTF-8"');
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const encodedCredentials = coincidencia[1];
  const credentialBytes = Buffer.from(encodedCredentials, "base64");
  if (credentialBytes.toString("base64") !== encodedCredentials) {
    res.set("WWW-Authenticate", 'Basic realm="CSIRT", charset="UTF-8"');
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const credentials = credentialBytes.toString("utf8");
  const separator = credentials.indexOf(":");
  const username = separator < 0 ? "" : credentials.slice(0, separator);
  const password = separator < 0 ? "" : credentials.slice(separator + 1);
  let rol = null;

  for (const cuenta of cuentas) {
    const usuarioValido = coincide(username.toLowerCase(), cuenta.usuario.toLowerCase());
    const passwordValido = coincide(password, cuenta.password);
    if (usuarioValido && passwordValido) rol = cuenta.rol;
  }

  if (!rol) {
    res.set("WWW-Authenticate", 'Basic realm="CSIRT", charset="UTF-8"');
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  req.usuario = { rol };
  return next();
}

function permitir(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "Permiso insuficiente" });
    }
    return next();
  };
}

module.exports = { autenticarUsuario, permitir };
