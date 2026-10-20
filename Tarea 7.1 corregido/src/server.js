const express = require("express");
const helmet = require("helmet");
const path = require("path");
const rutasIncidentes = require("./routes/incidente.routes");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const TRUST_PROXY_HOPS = Number(process.env.TRUST_PROXY_HOPS || 0);

if (!Number.isInteger(TRUST_PROXY_HOPS) || TRUST_PROXY_HOPS < 0) {
  throw new Error("TRUST_PROXY_HOPS debe ser un entero no negativo");
}

app.use(helmet());
app.set("trust proxy", TRUST_PROXY_HOPS);
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Conexión de API
app.use("/api", rutasIncidentes);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, HOST, () => {
    console.log(`Servidor de incidentes operativo en http://${HOST}:${PORT}`);
  });
}

module.exports = app;
