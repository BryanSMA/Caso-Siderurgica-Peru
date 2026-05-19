CREATE SCHEMA IF NOT EXISTS seguridad;
CREATE SCHEMA IF NOT EXISTS catalogos;

CREATE TABLE IF NOT EXISTS catalogos.estado (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS seguridad.rol (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS seguridad.usuario (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES seguridad.rol(id),
    estado_id INTEGER NOT NULL REFERENCES catalogos.estado(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO catalogos.estado (nombre)
VALUES 
('ACTIVO'),
('INACTIVO')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO seguridad.rol (nombre)
VALUES 
('ADMIN'),
('VENTAS'),
('ALMACEN'),
('RRHH'),
('CONSULTA')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO seguridad.usuario (username, password, rol_id, estado_id)
SELECT 'admin', '123456', r.id, e.id
FROM seguridad.rol r
CROSS JOIN catalogos.estado e
WHERE r.nombre = 'ADMIN'
AND e.nombre = 'ACTIVO'
ON CONFLICT (username)
DO UPDATE SET 
    password = EXCLUDED.password,
    rol_id = EXCLUDED.rol_id,
    estado_id = EXCLUDED.estado_id;

INSERT INTO seguridad.usuario (username, password, rol_id, estado_id)
SELECT 'ventas', '123456', r.id, e.id
FROM seguridad.rol r
CROSS JOIN catalogos.estado e
WHERE r.nombre = 'VENTAS'
AND e.nombre = 'ACTIVO'
ON CONFLICT (username)
DO UPDATE SET 
    password = EXCLUDED.password,
    rol_id = EXCLUDED.rol_id,
    estado_id = EXCLUDED.estado_id;

INSERT INTO seguridad.usuario (username, password, rol_id, estado_id)
SELECT 'almacen', '123456', r.id, e.id
FROM seguridad.rol r
CROSS JOIN catalogos.estado e
WHERE r.nombre = 'ALMACEN'
AND e.nombre = 'ACTIVO'
ON CONFLICT (username)
DO UPDATE SET 
    password = EXCLUDED.password,
    rol_id = EXCLUDED.rol_id,
    estado_id = EXCLUDED.estado_id;

INSERT INTO seguridad.usuario (username, password, rol_id, estado_id)
SELECT 'rrhh', '123456', r.id, e.id
FROM seguridad.rol r
CROSS JOIN catalogos.estado e
WHERE r.nombre = 'RRHH'
AND e.nombre = 'ACTIVO'
ON CONFLICT (username)
DO UPDATE SET 
    password = EXCLUDED.password,
    rol_id = EXCLUDED.rol_id,
    estado_id = EXCLUDED.estado_id;

INSERT INTO seguridad.usuario (username, password, rol_id, estado_id)
SELECT 'consulta', '123456', r.id, e.id
FROM seguridad.rol r
CROSS JOIN catalogos.estado e
WHERE r.nombre = 'CONSULTA'
AND e.nombre = 'ACTIVO'
ON CONFLICT (username)
DO UPDATE SET 
    password = EXCLUDED.password,
    rol_id = EXCLUDED.rol_id,
    estado_id = EXCLUDED.estado_id;