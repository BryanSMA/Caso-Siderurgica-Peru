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
// GESTIÓN DE PEDIDOS Y VENTAS
// ===============================

// Listar pedidos de venta
app.get("/ventas", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.codigo,
        p.cliente_id,
        p.cliente,
        p.ruc,
        p.producto,
        p.cantidad,
        p.precio_unitario,
        p.subtotal,
        p.total,
        p.estado,
        p.fecha_registro,
        u.username AS vendedor,
        cp.codigo AS comprobante_codigo,
        cp.tipo AS comprobante_tipo,
        cp.fecha_emision AS comprobante_fecha
      FROM comercial.pedido_venta p
      LEFT JOIN seguridad.usuario u ON p.usuario_id = u.id
      LEFT JOIN comercial.comprobante_pago cp ON cp.pedido_id = p.id
      ORDER BY p.id DESC
    `);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Error al listar pedidos de venta:", error.message);
    res.status(500).json({
      success: false,
      mensaje: "Error al listar pedidos de venta"
    });
  }
});

// Registrar pedido de venta
app.post("/ventas", async (req, res) => {
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

    let clienteId = null;

    if (ruc) {
      const clienteEncontrado = await pool.query(
        `
        SELECT id 
        FROM comercial.cliente
        WHERE ruc = $1
        AND estado = 'ACTIVO'
        `,
        [ruc]
      );

      if (clienteEncontrado.rows.length > 0) {
        clienteId = clienteEncontrado.rows[0].id;
      }
    }

    const subtotal = cantidadNum * precioNum;
    const total = subtotal;
    const codigo = "PED-" + Date.now();

    const result = await pool.query(
      `
      INSERT INTO comercial.pedido_venta (
        codigo,
        cliente_id,
        cliente,
        ruc,
        producto,
        cantidad,
        precio_unitario,
        subtotal,
        total,
        estado,
        usuario_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        codigo,
        clienteId,
        cliente,
        ruc || null,
        producto,
        cantidadNum,
        precioNum,
        subtotal,
        total,
        "PENDIENTE",
        usuario_id || null
      ]
    );

    res.status(201).json({
      success: true,
      mensaje: "Pedido de venta registrado correctamente",
      pedido: result.rows[0]
    });

  } catch (error) {
    console.error("Error al registrar pedido de venta:", error.message);
    res.status(500).json({
      success: false,
      mensaje: "Error al registrar pedido de venta"
    });
  }
});

// Validar cliente por RUC
app.get("/ventas/clientes/validar/:ruc", async (req, res) => {
  try {
    const ruc = String(req.params.ruc || "").trim();

    if (!ruc) {
      return res.status(400).json({
        success: false,
        mensaje: "Debe ingresar un RUC"
      });
    }

    const result = await pool.query(
      `
      SELECT 
        id,
        razon_social,
        ruc,
        direccion,
        estado
      FROM comercial.cliente
      WHERE ruc = $1
      `,
      [ruc]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "Cliente no encontrado"
      });
    }

    const cliente = result.rows[0];

    if (cliente.estado !== "ACTIVO") {
      return res.status(400).json({
        success: false,
        mensaje: "El cliente existe, pero no está activo",
        cliente
      });
    }

    res.json({
      success: true,
      mensaje: "Cliente validado correctamente",
      cliente
    });

  } catch (error) {
    console.error("Error al validar cliente:", error.message);
    res.status(500).json({
      success: false,
      mensaje: "Error al validar cliente"
    });
  }
});

// Validar pedido de venta
app.patch("/ventas/:id/validar", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        mensaje: "ID de pedido no válido"
      });
    }

    const pedidoResult = await pool.query(
      `
      SELECT *
      FROM comercial.pedido_venta
      WHERE id = $1
      `,
      [id]
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "Pedido de venta no encontrado"
      });
    }

    const pedido = pedidoResult.rows[0];

    if (!pedido.ruc) {
      return res.status(400).json({
        success: false,
        mensaje: "El pedido no tiene RUC para validar cliente"
      });
    }

    const clienteResult = await pool.query(
      `
      SELECT id
      FROM comercial.cliente
      WHERE ruc = $1
      AND estado = 'ACTIVO'
      `,
      [pedido.ruc]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: "No se puede validar el pedido porque el cliente no existe o no está activo"
      });
    }

    const clienteId = clienteResult.rows[0].id;

    const updateResult = await pool.query(
      `
      UPDATE comercial.pedido_venta
      SET estado = 'VALIDADO',
          cliente_id = $1
      WHERE id = $2
      RETURNING *
      `,
      [clienteId, id]
    );

    res.json({
      success: true,
      mensaje: "Pedido validado correctamente",
      pedido: updateResult.rows[0]
    });

  } catch (error) {
    console.error("Error al validar pedido:", error.message);
    res.status(500).json({
      success: false,
      mensaje: "Error al validar pedido"
    });
  }
});

// Generar comprobante de pago
app.post("/ventas/:id/comprobante", async (req, res) => {
  const client = await pool.connect();

  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        mensaje: "ID de pedido no válido"
      });
    }

    await client.query("BEGIN");

    const pedidoResult = await client.query(
      `
      SELECT *
      FROM comercial.pedido_venta
      WHERE id = $1
      `,
      [id]
    );

    if (pedidoResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        mensaje: "Pedido de venta no encontrado"
      });
    }

    const pedido = pedidoResult.rows[0];

    if (pedido.estado === "FACTURADO") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        mensaje: "Este pedido ya fue facturado"
      });
    }

    if (pedido.estado !== "VALIDADO") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        mensaje: "Primero debe validar el pedido antes de generar comprobante"
      });
    }

    const comprobanteExistente = await client.query(
      `
      SELECT *
      FROM comercial.comprobante_pago
      WHERE pedido_id = $1
      `,
      [id]
    );

    if (comprobanteExistente.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        mensaje: "El pedido ya tiene comprobante generado"
      });
    }

    const subtotal = Number(pedido.total);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    const codigo = "FAC-" + Date.now();

    const comprobanteResult = await client.query(
      `
      INSERT INTO comercial.comprobante_pago (
        codigo,
        pedido_id,
        tipo,
        subtotal,
        igv,
        total
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        codigo,
        id,
        "FACTURA",
        subtotal,
        igv,
        total
      ]
    );

    const pedidoActualizado = await client.query(
      `
      UPDATE comercial.pedido_venta
      SET estado = 'FACTURADO'
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      mensaje: "Comprobante generado correctamente",
      pedido: pedidoActualizado.rows[0],
      comprobante: comprobanteResult.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al generar comprobante:", error.message);
    res.status(500).json({
      success: false,
      mensaje: "Error al generar comprobante"
    });

  } finally {
    client.release();
  }
});
// ===============================
// SERVIDOR
// ===============================
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});