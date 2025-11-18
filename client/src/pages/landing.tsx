import { Button } from "@/components/ui/button";

export default function Landing() {
  const handleLogin = () => {
    // Redireciona normalmente
    window.location.href = "/api/login";
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center text-center p-6"
      style={{
        backgroundColor: "#0E4B53",
      }}
    >
      {/* LOGO */}
      <div className="flex flex-col items-center mb-8">
        <img
          src="/logo-abert-white.svg"
          alt="ABERT"
          className="h-24 drop-shadow-lg"
        />
      </div>

      {/* TÍTULO */}
      <h1 className="text-3xl font-bold text-white mb-2">
        Sistema de Gestão de Despesas
      </h1>

      {/* SUBTÍTULO */}
      <p className="text-sm mb-8" style={{ color: "#ECEFF0" }}>
        Acesso exclusivo para colaboradores ABERT
      </p>

      {/* BOTÃO LOGIN */}
      <Button
        onClick={handleLogin}
        data-testid="button-login"
        className="px-8 py-3 rounded-lg font-semibold hover-elevate active-elevate-2"
        style={{
          backgroundColor: "#FFC828",
          color: "#004650",
        }}
      >
        Entrar com Email ABERT
      </Button>

      {/* RODAPÉ */}
      <div className="mt-12 text-sm" style={{ color: "#ECEFF0" }}>
        Sistema de Gestão de Despesas — ABERT
      </div>
    </div>
  );
}

function OldLandingFeatures() {
  return (
    <div className="hidden">
      {/* Mantido para referência, mas não usado */}
      <div className="container mx-auto px-6 py-16">

      </div>
    </div>
  );
}
