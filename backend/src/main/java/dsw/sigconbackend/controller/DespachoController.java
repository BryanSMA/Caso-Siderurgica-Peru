package dsw.sigconbackend.controller;

import dsw.sigconbackend.model.Despacho;
import dsw.sigconbackend.service.DespachoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/despachos")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class DespachoController {

    private final DespachoService despachoService;

    @GetMapping
    public ResponseEntity<List<Despacho>> listar() {
        return ResponseEntity.ok(despachoService.listarDespachos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Despacho> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(despachoService.obtenerPorId(id));
    }

    @PostMapping("/desde-venta/{ventaId}")
    public ResponseEntity<?> crearDesdeVenta(@PathVariable Long ventaId) {
        try {
            Despacho despacho = despachoService.crearDesdeVenta(ventaId);
            return ResponseEntity.status(HttpStatus.CREATED).body(despacho);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(@PathVariable Long id,
                                              @RequestBody Map<String, String> body) {
        try {
            String nuevoEstado = body.get("estado");
            if (nuevoEstado == null || nuevoEstado.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Campo 'estado' requerido"));
            }
            return ResponseEntity.ok(despachoService.actualizarEstado(id, nuevoEstado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}