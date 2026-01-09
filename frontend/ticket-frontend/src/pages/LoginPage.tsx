import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logoImage from "../assets/logo.png";

interface LoginPageProps {
  onLogin: (token: string) => void;
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Récupérer les paramètres de redirection depuis l'URL
  const redirectPath = searchParams.get("redirect") || "/dashboard";
  const ticketId = searchParams.get("ticket");
  const action = searchParams.get("action");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (loading) return;
    setLoading(true);
    try {
      console.log("Connexion: démarrage");
      const base = "http://localhost:8000";
      const body = new URLSearchParams();
      body.append("username", username);
      body.append("password", password);
      body.append("grant_type", "password");
      body.append("scope", "");

      // Créer un AbortController pour gérer le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Timeout de 30 secondes

      let res;
      try {
        res = await fetch(base + "/auth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error("La requête a pris trop de temps. Vérifiez que le backend est accessible.");
        }
        throw fetchError;
      }
      console.log("Réponse /auth/token:", res.status, res.statusText);

      if (!res.ok) {
        let errorMessage = "Identifiants invalides";
        try {
          const errorData = await res.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // Si la réponse n'est pas du JSON, utiliser le message par défaut
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      
      // Récupérer les infos de l'utilisateur pour connaître son rôle
      try {
        const userController = new AbortController();
        const userTimeoutId = setTimeout(() => userController.abort(), 5000); // Timeout de 5 secondes
        
        let userRes;
        try {
          userRes = await fetch(base + "/auth/me", {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
            signal: userController.signal,
          });
          clearTimeout(userTimeoutId);
        } catch (fetchError: any) {
          clearTimeout(userTimeoutId);
          if (fetchError.name === 'AbortError') {
            console.warn("Timeout lors de la récupération des infos utilisateur");
            throw fetchError;
          }
          throw fetchError;
        }
        
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.role && userData.role.name) {
            localStorage.setItem("userRole", userData.role.name);
            console.log("Rôle utilisateur:", userData.role.name); // Debug
          }
        }
      } catch (err) {
        console.error("Erreur récupération infos utilisateur:", err);
        // Ne pas bloquer la connexion si la récupération du rôle échoue
      }
      
      onLogin(data.access_token);
      
      // Construire l'URL de redirection avec les paramètres préservés
      let finalRedirect = redirectPath;
      const redirectParams = new URLSearchParams();
      
      if (ticketId) {
        redirectParams.set("ticket", ticketId);
      }
      if (action) {
        redirectParams.set("action", action);
      }
      
      if (redirectParams.toString()) {
        finalRedirect = `${redirectPath}?${redirectParams.toString()}`;
      }
      
      // Petit délai pour laisser le temps au state de se mettre à jour
      setTimeout(() => {
        navigate(finalRedirect);
      }, 100);
    } catch (err: any) {
      const msg = err?.message ?? "Erreur de connexion";
      // Message plus spécifique si le backend n'est pas joignable
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("Impossible de contacter le serveur. Vérifiez que le backend est démarré sur http://localhost:8000");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ 
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
      padding: "20px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Éléments décoratifs en arrière-plan */}
      <div style={{
        position: "absolute",
        top: "-100px",
        right: "-100px",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)",
        zIndex: 0
      }}></div>
      <div style={{
        position: "absolute",
        bottom: "-150px",
        left: "-150px",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.03) 100%)",
        zIndex: 0
      }}></div>

      {/* Logo Caisse de Sécurité Sociale */}
      <div style={{
        marginBottom: "48px",
        textAlign: "center",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          marginBottom: "24px"
        }}>
          {/* Logo de l'entreprise */}
          <img 
            src={logoImage} 
            alt="Logo Caisse de Sécurité Sociale"
            style={{
              width: "100px",
              height: "100px",
              objectFit: "contain"
            }}
          />
          
          {/* Texte "Caisse de Sécurité Sociale" */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center"
          }}>
            <div style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#1a237e",
              lineHeight: "1.1",
              letterSpacing: "-0.5px",
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              Caisse de
            </div>
            <div style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#1a237e",
              lineHeight: "1.1",
              letterSpacing: "-0.5px",
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              Sécurité
            </div>
            <div style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#1a237e",
              lineHeight: "1.1",
              letterSpacing: "-0.5px",
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              Sociale
            </div>
          </div>
        </div>
        
        {/* Sous-titre Systèmes d'Incidents */}
        <div style={{
          marginTop: "16px",
          paddingTop: "24px",
          borderTop: "2px solid #e0e0e0"
        }}>
          <div style={{
            fontSize: "18px",
            color: "#546e7a",
            fontWeight: "600",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            marginBottom: "6px"
          }}>
            Systèmes d'Incidents
          </div>
          <div style={{
            width: "80px",
            height: "3px",
            background: "linear-gradient(90deg, #ff9800, #1976d2)",
            margin: "0 auto",
            borderRadius: "2px"
          }}></div>
        </div>
      </div>

      <div style={{ 
        maxWidth: 480, 
        width: "100%",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
          padding: "48px",
          border: "1px solid rgba(0,0,0,0.05)"
        }}>
          <h1 style={{ 
            marginBottom: "36px", 
            fontSize: "26px", 
            fontWeight: "600",
            color: "#1a237e",
            textAlign: "center",
            letterSpacing: "-0.3px"
          }}>
            Connexion à votre compte
          </h1>
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontSize: "14px", 
                fontWeight: "500",
                color: "#374151"
              }}>
                Nom d'utilisateur
              </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
                placeholder="Entrez votre nom d'utilisateur"
                style={{ 
                  width: "100%",
                  padding: "14px 18px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "15px",
                  background: "#fafafa",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                  color: "#1a237e",
                  fontFamily: "inherit"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#ff9800";
                  e.target.style.background = "white";
                  e.target.style.boxShadow = "0 0 0 3px rgba(255, 152, 0, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e0e0e0";
                  e.target.style.background = "#fafafa";
                  e.target.style.boxShadow = "none";
                }}
            />
          </div>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ 
                  fontSize: "14px", 
                  fontWeight: "500",
                  color: "#374151"
                }}>
                  Mot de passe
                </label>
                <a href="#" style={{ 
                  fontSize: "13px", 
                  color: "#1976d2",
                  textDecoration: "none",
                  fontWeight: "500",
                  transition: "color 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#ff9800"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#1976d2"}
                >
                  Mot de passe oublié ?
                </a>
              </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
                placeholder="Entrez votre mot de passe"
                style={{ 
                  width: "100%",
                  padding: "14px 18px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "10px",
                  fontSize: "15px",
                  background: "#fafafa",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                  color: "#1a237e",
                  fontFamily: "inherit"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#ff9800";
                  e.target.style.background = "white";
                  e.target.style.boxShadow = "0 0 0 3px rgba(255, 152, 0, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e0e0e0";
                  e.target.style.background = "#fafafa";
                  e.target.style.boxShadow = "none";
                }}
            />
          </div>
            {error && (
      <div style={{
                padding: "12px",
                background: "#fee2e2",
                border: "1px solid #fecaca",
        borderRadius: "8px",
                marginBottom: "20px",
                color: "#991b1b",
                fontSize: "14px"
              }}>
                {error}
              </div>
            )}
            <button 
              type="submit" 
              style={{ 
                width: "100%",
                padding: "16px",
                background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(255, 152, 0, 0.4)",
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                position: "relative",
                overflow: "hidden"
              }}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "linear-gradient(135deg, #f57c00 0%, #e65100 100%)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 152, 0, 0.5)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 152, 0, 0.4)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
