package dsw.sigconbackend.service;

import dsw.sigconbackend.dto.LoginResponse;
import dsw.sigconbackend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * HU02 — Autenticación con Spring Security
 * 
 * Flujo:
 * 1. Angular POST /login con { username, password }
 * 2. AuthenticationManager verifica con CustomUserDetailsService
 * 3. Si OK → devuelve usuario con rol y estado (mismo JSON que antes)
 * 4. Si falla → 401 Unauthorized
 */
@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public LoginResponse login(String username, String password) {
        // Spring Security verifica username + password contra BD
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                username.trim(),
                password.trim()
            )
        );

        // Si llegamos aquí, las credenciales son correctas
        // Traemos datos completos (rol, estado) para el response
        List<Object[]> rows = usuarioRepository.findLoginDataByUsername(username.trim());

        if (!rows.isEmpty()) {
            Object[] row = rows.get(0);
            LoginResponse.UsuarioDTO usuario = new LoginResponse.UsuarioDTO(
                ((Number) row[0]).longValue(),  // id
                (String) row[1],                 // username
                (String) row[2],                 // rol
                (String) row[3]                  // estado
            );
            return new LoginResponse(true, "Login correcto", usuario);
        }

        return new LoginResponse(false, "Error al obtener datos del usuario", null);
    }
}
