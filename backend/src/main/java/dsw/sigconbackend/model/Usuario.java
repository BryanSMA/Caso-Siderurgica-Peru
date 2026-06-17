package dsw.sigconbackend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "usuario", schema = "seguridad")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;

    // Join con seguridad.rol para traer nombre del rol
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rol_id")
    private Rol rol;

    // Método auxiliar para Spring Security y AuthService
    public String getRolNombre() {
        return rol != null ? rol.getNombre() : "VENDEDOR";
    }
}