// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../App";

import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { DollarSign, FileText, Plane, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (err) {
      console.error("Erro carregando stats:", err);
      toast.error("Erro ao carregar dados do dashboard");
      setStats({
        total_adiantamentos: 0,
        total_adiantado: 0,
        total_reembolsos: 0,
        total_viagens: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // LOADING
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-abert-blue"></div>
      </div>
    );
  }

  // SAFE FALLBACK
  const {
    total_adiantamentos = 0,
    total_adiantado = 0,
    total_reembolsos = 0,
    total_viagens = 0,
  } = stats || {};

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-abert-blue">
          Bem-vindo, {user?.name?.split(" ")[0] || "Usuário"}
        </h1>
        <p className="text-abert-gray80">
          Aqui você acompanha um resumo geral das despesas e movimentações.
        </p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Adiantamentos */}
        <Card className="shadow-card border-l-4 border-abert-blue">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-abert-blue">
              <FileText className="w-5 h-5" />
              <span>Adiantamentos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-abert-blue">
              {total_adiantamentos}
            </p>
            <p className="text-abert-gray80 mt-1">Solicitações registradas</p>
          </CardContent>
        </Card>

        {/* Valor Adiantado */}
        <Card className="shadow-card border-l-4 border-abert-blue">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-abert-blue">
              <DollarSign className="w-5 h-5" />
              <span>Valor Adiantado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-abert-blue">
              R$ {Number(total_adiantado).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="text-abert-gray80 mt-1">Total liberado</p>
          </CardContent>
        </Card>

        {/* Reembolsos */}
        <Card className="shadow-card border-l-4 border-abert-blue">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-abert-blue">
              <TrendingUp className="w-5 h-5" />
              <span>Reembolsos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-abert-blue">
              {total_reembolsos}
            </p>
            <p className="text-abert-gray80 mt-1">Processos registrados</p>
          </CardContent>
        </Card>

        {/* Viagens */}
        <Card className="shadow-card border-l-4 border-abert-blue">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-abert-blue">
              <Plane className="w-5 h-5" />
              <span>Viagens</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-abert-blue">
              {total_viagens}
            </p>
            <p className="text-abert-gray80 mt-1">Executadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Rodapé simples */}
      <div className="mt-12 text-sm text-abert-gray60 text-center">
        Sistema de Gestão de Despesas — ABERT
      </div>
    </div>
  );
}
