import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";

export default function Login() {
  const { login } = useAuth();

  function fakeGoogleLogin() {
    // Depois integramos o Google de verdade
    const data = {
      email: "admin@abert.org.br",
      name: "Administrador",
      picture: "",
      ColaboradorID: "C-TESTE"
    };

    login(data);
  }

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column"
    }}>
      <h1>Sistema de Gestão de Despesas</h1>
      <Button onClick={fakeGoogleLogin}>
        Entrar com Google
      </Button>
    </div>
  );
}

