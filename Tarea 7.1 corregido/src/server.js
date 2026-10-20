const express = require("express");
const path = require("path");
const rutasIncidentes = require("./routes/incidente.routes");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Conexión de API
app.use("/api", rutasIncidentes);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Servidor de incidentes operativo en http://localhost:${PORT}`);
  });
}

module.exports = app;
