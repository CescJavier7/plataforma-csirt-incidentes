const crypto = require("crypto");
const { Buffer } = require("node:buffer");

const editorUsuario = process.env.INCIDENTE_EDITOR_USERNAME;
const editorPassword = process.env.INCIDENTE_EDITOR_PASSWORD;

if (!editorUsuario || !editorPassword) {
  throw new Error(
    "INCIDENTE_EDITOR_USERNAME e INCIDENTE_EDITOR_PASSWORD son obligatorios"
  );
}
if (editorPassword.length < 12) {
  throw new Error("INCIDENTE_EDITOR_PASSWORD debe tener al menos 12 caracteres");
}

function coincide(valor, esperado) {
  const hashValor = crypto.createHash("sha256").update(valor).digest();
  const hashEsperado = crypto.createHash("sha256").update(esperado).digest();
  return crypto.timingSafeEqual(hashValor, hashEsperado);
}

function autenticarEditor(req, res, next) {
  const authorization = req.get("Authorization") || "";
  const coincidencia = authorization.match(/^Basic ([A-Za-z0-9+/]+={0,2})$/);

  if (!coincidencia) {
    res.set("WWW-Authenticate", 'Basic realm="CSIRT editor", charset="UTF-8"');
    return res.status(401).json({ error: "Autenticación requerida" });
  }

  if (Buffer.from(coincidencia[1], "base64").toString("base64") !== coincidencia[1]) {
    res.set("WWW-Authenticate", 'Basic realm="CSIRT editor", charset="UTF-8"');
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const credenciales = Buffer.from(coincidencia[1], "base64").toString("utf8");
  const separador = credenciales.indexOf(":");

  if (separador < 0) {
    res.set("WWW-Authenticate", 'Basic realm="CSIRT editor", charset="UTF-8"');
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const usuario = credenciales.slice(0, separador);
  const password = credenciales.slice(separador + 1);

  const usuarioValido = coincide(usuario, editorUsuario);
  const passwordValido = coincide(password, editorPassword);

  if (!usuarioValido || !passwordValido) {
    res.set("WWW-Authenticate", 'Basic realm="CSIRT editor", charset="UTF-8"');
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  return next();
}

module.exports = autenticarEditor;
