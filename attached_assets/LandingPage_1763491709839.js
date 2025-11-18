// src/pages/LandingPage.js
import React from "react";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { login } = useAuth();

  function loginFake() {
    const fakeUser = {
      name: "Ricardo Calixto",
      email: "ricardo@abert.org.br",
      role: "admin",
      picture: "/logo-abert.svg",
      ColaboradorID: "DEV-ADMIN",
    };

    login(fakeUser);
    window.location.replace("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center text-center p-6"
      style={{
        backgroundColor: "#0E4B53", // Fundo moderno ABERT Blue40
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
      <p className="text-abert-gray20 text-sm mb-8">
        Acesso exclusivo para colaboradores ABERT
      </p>

      {/* BOTÃO DEV */}
      <button
        onClick={loginFake}
        className="px-8 py-3 rounded-lg font-semibold bg-abert-yellow text-abert-blue
                   hover:bg-yellow-400 transition shadow-md"
      >
        Entrar como Admin (DEV)
      </button>
    </div>
  );
}
