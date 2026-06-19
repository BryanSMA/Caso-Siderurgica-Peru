package dsw.sigconbackend.service;

import dsw.sigconbackend.model.FacturaProveedor;
import dsw.sigconbackend.model.PagoProveedor;
import dsw.sigconbackend.repository.FacturaProveedorRepository;
import dsw.sigconbackend.repository.PagoProveedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PagoProveedorService {

    @Autowired private PagoProveedorRepository repo;
    @Autowired private FacturaProveedorRepository facturaRepo;

    public PagoProveedor registrar(PagoProveedor pago) {
        FacturaProveedor factura = facturaRepo.findById(pago.getFacturaId())
            .orElseThrow(() -> new RuntimeException("Factura no encontrada"));
        if ("Pagada".equals(factura.getEstado())) throw new RuntimeException("La factura ya fue pagada");

        PagoProveedor guardado = repo.save(pago);
        factura.setEstado("Pagada");
        facturaRepo.save(factura);
        return guardado;
    }
}