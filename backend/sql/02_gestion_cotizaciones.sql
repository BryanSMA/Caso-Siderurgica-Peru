CREATE SCHEMA IF NOT EXISTS comercial;
CREATE TABLE IF NOT EXISTS comercial.cotizacion(
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    cliente VARCHAR(150) NOT NULL,
    ruc VARCHAR(20),
    producto VARCHAR(150) NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad<0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario > 0),
    subtotal NUMERIC(10,2) NOT NULL,
    descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
    descuento_monto NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    usuario_id INTEGER REFERENCES seguridad.usuario(id),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
);