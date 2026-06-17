package dsw.sigconbackend.service;

import dsw.sigconbackend.model.Despacho;
import dsw.sigconbackend.model.Venta;
import dsw.sigconbackend.repository.DespachoRepository;
import dsw.sigconbackend.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DespachoService {

    private final DespachoRepository despachoRepository;
    private final VentaRepository ventaRepository;

    // ─── Código correlativo ───────────────────────────────────────────────────
    private String generarCodigo() {
        Integer max = despachoRepository.findMaxCodigoNumber();
        int siguiente = (max == null ? 0 : max) + 1;
        return String.format("DES-%04d", siguiente);
    }

    // ─── Crear despacho desde venta ───────────────────────────────────────────
    @Transactional
    public Despacho crearDesdeVenta(Long ventaId) {
        Venta venta = ventaRepository.findById(ventaId)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada con id: " + ventaId));

        if (!"APROBADO".equalsIgnoreCase(venta.getEstado())) {
            throw new RuntimeException(
                    "Solo se pueden generar despachos desde ventas APROBADAS. Estado actual: "
                    + venta.getEstado());
        }

        List<Despacho> existentes = despachoRepository.findByVentaId(ventaId);
        if (!existentes.isEmpty()) {
            throw new RuntimeException(
                    "Ya existe un despacho generado para la venta: " + venta.getCodigo());
        }

        Despacho despacho = new Despacho();
        despacho.setCodigo(generarCodigo());
        despacho.setCliente(venta.getCliente());
        despacho.setRuc(venta.getRuc());
        despacho.setProducto(venta.getProducto());
        despacho.setCantidad(venta.getCantidad());
        despacho.setEstado("PENDIENTE");
        despacho.setVentaId(ventaId);
        despacho.setUsuarioId(venta.getUsuarioId());

        Despacho guardado = despachoRepository.save(despacho);

        // Marcar venta como COMPLETADO
        venta.setEstado("COMPLETADO");
        ventaRepository.save(venta);

        log.info("Despacho {} creado desde venta {}", guardado.getCodigo(), venta.getCodigo());
        return guardado;
    }

    // ─── Listar ───────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<Despacho> listarDespachos() {
        return despachoRepository.findAllByOrderByCreatedAtDesc();
    }

    // ─── Obtener por ID ───────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Despacho obtenerPorId(Long id) {
        return despachoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Despacho no encontrado con id: " + id));
    }

    // ─── Actualizar estado ────────────────────────────────────────────────────
    @Transactional
    public Despacho actualizarEstado(Long id, String nuevoEstado) {
        Despacho despacho = despachoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Despacho no encontrado con id: " + id));
        despacho.setEstado(nuevoEstado.toUpperCase());
        Despacho actualizado = despachoRepository.save(despacho);
        log.info("Despacho {} → {}", despacho.getCodigo(), nuevoEstado);
        return actualizado;
    }
}