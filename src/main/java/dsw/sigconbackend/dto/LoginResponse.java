package dsw.sigconbackend.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * Devuelve exactamente el mismo JSON que tu Node:
 * { success, mensaje, usuario: { id, username, rol, estado } }
 * Tu Angular NO cambia nada.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private boolean success;
    private String mensaje;
    private UsuarioDTO usuario;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsuarioDTO {
        private Long id;
        private String username;
        private String rol;
        private String estado;
    }
}
