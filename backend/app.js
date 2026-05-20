require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Backend funcionando 🚀");
});

// ===============================
// LOGIN
// ===============================
app.post("/login", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "").trim();

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
    console.error("Error en login:", error.message);
    res.status(500).json({
      success: false,
      mensaje: "Error en el servidor"
    });
  }
});

// ===============================
// GESTIÓN DE COTIZACIONES
// ===============================
function calcularDescuento(cantidad) {
  if (cantidad >= 100) return 10;
  if (cantidad >= 50) return 7;
  if (cantidad >= 10) return 5;
  return 0;
}

// Listar cotizaciones
app.get("/cotizaciones", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.codigo,
        c.cliente,
        c.ruc,
        c.producto,
        c.cantidad,
        c.precio_unitario,
        c.subtotal,
        c.descuento_porcentaje,
        c.descuento_monto,
        c.total,
        c.estado,
        c.fecha_registro,
        u.username AS vendedor
      FROM comercial.cotizacion c
      LEFT JOIN seguridad.usuario u ON c.usuario_id = u.id
      ORDER BY c.id DESC
    `);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error al listar cotizaciones:", error.message);
    res.status(500).json({
      success: false,
      mensaje: "Error al listar cotizaciones"
    });
  }
});

// Registrar cotización
app.post("/cotizaciones", async (req, res) => {
  try {
    const {
      cliente,
      ruc,
      producto,
      cantidad,
      precio_unitario,
      usuario_id
    } = req.body;

    if (!cliente || !producto || !cantidad || !precio_unitario) {
      return res.status(400).json({
        success: false,
        mensaje: "Cliente, producto, cantidad y precio unitario son obligatorios."
      });
    }

    const cantidadNum = Number(cantidad);
    const precioNum = Number(precio_unitario);

    if (cantidadNum <= 0 || precioNum <= 0) {
      return res.status(400).json({
        success: false,
        mensaje: "La cantidad y el precio unitario deben ser mayores a 0."
      });
    }

    const subtotal = cantidadNum * precioNum;
    const descuentoPorcentaje = calcularDescuento(cantidadNum);
    const descuentoMonto = subtotal * (descuentoPorcentaje / 100);
    const total = subtotal - descuentoMonto;
    const codigo = "COT-" + Date.now();

    const result = await pool.query(
      `
      INSERT INTO comercial.cotizacion (
        codigo,
        cliente,
        ruc,
        producto,
        cantidad,
        precio_unitario,
        subtotal,
        descuento_porcentaje,
        descuento_monto,
        total,
        estado,
        usuario_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
      `,
      [
        codigo,
        cliente,
        ruc || null,
        producto,
        cantidadNum,
        precioNum,
        subtotal,
        descuentoPorcentaje,
        descuentoMonto,
        total,
        "PENDIENTE",
        usuario_id || null
      ]
    );

    res.status(201).json({
      success: true,
      mensaje: "Cotización registrada correctamente",
      cotizacion: result.rows[0]
    });

  } catch (error) {
    console.error("Error al registrar cotización:", error.message);
    res.status(500).json({
      success: false,
      mensaje: "Error al registrar cotización"
    });
  }
});

// Cambiar estado de cotización
app.patch("/cotizaciones/:id/estado", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    const estadosPermitidos = ["PENDIENTE", "APROBADA", "RECHAZADA"];

    if (!id) {
      return res.status(400).json({
        success: false,
        mensaje: "ID de cotización no válido"
      });
    }

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        mensaje: "Estado no válido"
      });
    }

    const result = await pool.query(
      `
      UPDATE comercial.cotizacion
      SET estado = $1
      WHERE id = $2
      RETURNING id, codigo, cliente, producto, total, estado
      `,
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "Cotización no encontrada"
      });
    }

    res.json({
      success: true,
      mensaje: "Estado de cotización actualizado",
      cotizacion: result.rows[0]
    });

  } catch (error) {
    console.error("Error real al cambiar estado de cotización:", error);

    res.status(500).json({
      success: false,
      mensaje: "Error al cambiar estado de cotización",
      detalle: error.message
    });
  }
});
// ===============================
// SERVIDOR
// ===============================
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});