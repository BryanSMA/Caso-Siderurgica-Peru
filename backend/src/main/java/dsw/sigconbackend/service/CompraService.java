package dsw.sigconbackend.service;

import dsw.sigconbackend.model.Compra;
import dsw.sigconbackend.model.Inventario;
import dsw.sigconbackend.repository.CompraRepository;
import dsw.sigconbackend.repository.InventarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CompraService {

    @Autowired private CompraRepository repo;
    @Autowired private InventarioRepository inventarioRepo;

    public List<Compra> listar() { return repo.findAll(); }

    public Compra registrar(Compra c) {
        Compra guardada = repo.save(c);
        if (c.getInventarioId() != null) {
            Inventario inv = inventarioRepo.findById(c.getInventarioId())
                .orElseThrow(() -> new RuntimeException("Producto de inventario no encontrado"));
            inv.setStock(inv.getStock() + c.getCantidad());
            inv.setFechaActualizacion(LocalDateTime.now());
            inventarioRepo.save(inv);
        }
        return guardada;
    }
}