import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import logoWhite from "@assets/logo-abert-white.svg";

export default function AuthError() {
  const [, setLocation] = useLocation();
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");
    setErrorMessage(message || "Erro desconhecido ao fazer login");
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-6"
      style={{
        background: "linear-gradient(135deg, #004650 0%, #0E4B53 100%)",
      }}
    >
      {/* LOGO */}
      <img
        src={logoWhite}
        alt="ABERT Logo"
        className="mb-8"
        style={{ width: "280px" }}
      />

      {/* TÍTULO */}
      <h1
        className="text-4xl font-bold mb-4 text-center"
        style={{ color: "#FFFFFF" }}
        data-testid="text-access-denied-title"
      >
        Acesso Negado
      </h1>

      {/* MENSAGEM DE ERRO */}
      <div
        className="mb-8 p-6 rounded-lg max-w-md text-center"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "2px solid #FFC828",
        }}
      >
        <div className="flex items-center justify-center mb-3">
          <AlertTriangle className="w-8 h-8" style={{ color: "#FFC828" }} />
        </div>
        <p className="text-lg mb-2" style={{ color: "#FFC828" }} data-testid="text-error-message">
          {errorMessage}
        </p>
        <p className="text-sm" style={{ color: "#ECEFF0" }} data-testid="text-domain-requirement">
          Este sistema é exclusivo para colaboradores ABERT com email @abert.org.br
        </p>
      </div>

      {/* BOTÃO VOLTAR */}
      <Button
        onClick={() => setLocation("/")}
        data-testid="button-back-home"
        className="px-8 py-3 rounded-lg font-semibold hover-elevate active-elevate-2"
        style={{
          backgroundColor: "#FFC828",
          color: "#004650",
        }}
      >
        Voltar à Página Inicial
      </Button>
    </div>
  );
}
