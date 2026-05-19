const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req,res)=>{
   res.send("Backend funcionando 🚀");
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      `SELECT 
          u.id,
          u.username,
          r.nombre AS rol,
          e.nombre AS estado
      FROM seguridad.usuario u
      INNER JOIN seguridad.rol r ON u.rol_id = r.id
      INNER JOIN catalogos.estado e ON u.estado_id = e.id
      WHERE u.username = $1 
      AND u.password = $2`,
      [username, password]
    );

    if (result.rows.length > 0) {
      res.json({
        success: true,
        mensaje: "Login correcto",
        usuario: result.rows[0]
      });
    } else {
      res.status(401).json({
        success: false,
        mensaje: "Usuario o contraseña incorrecta"
      });
    }

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});