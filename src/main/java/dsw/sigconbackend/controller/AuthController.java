package dsw.sigconbackend.controller;

import dsw.sigconbackend.dto.LoginRequest;
import dsw.sigconbackend.dto.LoginResponse;
import dsw.sigconbackend.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request,
            HttpServletResponse response) {
        try {
            LoginResponse loginResponse = authService.login(
                request.getUsername(), request.getPassword()
            );

            if (loginResponse.isSuccess()) {
                ResponseCookie cookie = ResponseCookie
                    .from("refreshToken", loginResponse.getRefreshToken())
                    .httpOnly(true)
                    .secure(false)
                    .path("/auth/refresh")
                    .maxAge(7 * 24 * 60 * 60)
                    .sameSite("Lax")
                    .build();
                response.addHeader("Set-Cookie", cookie.toString());
                loginResponse.setRefreshToken(null); // no va en el body
            }

            return ResponseEntity.ok(loginResponse);

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginResponse(false, "Usuario o contraseña incorrecta", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new LoginResponse(false, "Error en el servidor", null));
        }
    }

    @PostMapping("/auth/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @CookieValue(value = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginResponse(false, "No hay refresh token", null));
        }
        try {
            LoginResponse response = authService.refresh(refreshToken);
            if (!response.isSuccess()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new LoginResponse(false, "Error en el servidor", null));
        }
    }
}