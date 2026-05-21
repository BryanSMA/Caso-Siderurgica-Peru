CREATE SCHEMA IF NOT EXISTS comercial;

CREATE TABLE IF NOT EXISTS comercial.cliente (
    id SERIAL PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL,
    ruc VARCHAR(20) UNIQUE NOT NULL,
    direccion VARCHAR(200),
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comercial.pedido_venta (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    cliente_id INTEGER REFERENCES comercial.cliente(id),
    cliente VARCHAR(150) NOT NULL,
    ruc VARCHAR(20),
    producto VARCHAR(150) NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario > 0),
    subtotal NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    usuario_id INTEGER REFERENCES seguridad.usuario(id),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comercial.comprobante_pago (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    pedido_id INTEGER UNIQUE NOT NULL REFERENCES comercial.pedido_venta(id),
    tipo VARCHAR(30) NOT NULL DEFAULT 'FACTURA',
    subtotal NUMERIC(10,2) NOT NULL,
    igv NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO comercial.cliente (razon_social, ruc, direccion, estado)
VALUES
('Constructora Lima S.A.', '20412345678', 'Av. Javier Prado 4200', 'ACTIVO'),
('Minera Andina Corp.', '20512345679', 'Carretera Central Km 45', 'ACTIVO'),
('Infraestructura Sur SAC', '20312345670', 'Av. Separadora Industrial', 'ACTIVO')
ON CONFLICT (ruc) DO NOTHING;