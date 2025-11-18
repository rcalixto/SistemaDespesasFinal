import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DollarSign,
  FileText,
  Plane,
  Hotel,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import { StatusBadge } from "@/components/StatusBadge";
import type { User } from "@shared/schema";

interface DashboardStats {
  adiantamentos: { total: number; valorTotal: number };
  reembolsos: { total: number; valorTotal: number };
  viagens: { total: number };
  passagens: { total: number };
}

export default function Home() {
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  const isLoading = userLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getUserInitials = () => {
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: "#004650" }}>
          Bem-vindo, {user?.firstName || "Colaborador"}!
        </h1>
        <p style={{ color: "#4A5458" }}>
          Aqui você acompanha um resumo geral das despesas e movimentações.
        </p>
      </div>

      {/* Quick Stats - Estilo ABERT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card border-l-4" style={{ borderLeftColor: "#004650" }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2" style={{ color: "#004650" }}>
              <FileText className="w-5 h-5" />
              <span>Adiantamentos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold" style={{ color: "#004650" }} data-testid="stat-adiantamentos-total">
              {stats?.adiantamentos.total ?? 0}
            </p>
            <p className="mt-1" style={{ color: "#4A5458" }}>
              Solicitações registradas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-l-4" style={{ borderLeftColor: "#004650" }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2" style={{ color: "#004650" }}>
              <DollarSign className="w-5 h-5" />
              <span>Valor Adiantado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold" style={{ color: "#004650" }} data-testid="stat-adiantamentos-valor">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(stats?.adiantamentos.valorTotal ?? 0)}
            </p>
            <p className="mt-1" style={{ color: "#4A5458" }}>
              Total liberado
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-l-4" style={{ borderLeftColor: "#004650" }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2" style={{ color: "#004650" }}>
              <TrendingUp className="w-5 h-5" />
              <span>Reembolsos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold" style={{ color: "#004650" }} data-testid="stat-reembolsos-total">
              {stats?.reembolsos.total ?? 0}
            </p>
            <p className="mt-1" style={{ color: "#4A5458" }}>
              Processos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-l-4" style={{ borderLeftColor: "#004650" }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2" style={{ color: "#004650" }}>
              <Plane className="w-5 h-5" />
              <span>Viagens</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold" style={{ color: "#004650" }} data-testid="stat-viagens-total">
              {stats?.viagens.total ?? 0}
            </p>
            <p className="mt-1" style={{ color: "#4A5458" }}>
              Executadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rodapé */}
      <div className="mt-12 text-sm text-center" style={{ color: "#7A8488" }}>
        Sistema de Gestão de Despesas — ABERT
      </div>
    </div>
  );
}

function OldQuickActions() {
  return (
    <div className="hidden">
      {/* Mantido para referência, mas não usado */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">
          Ações Rápidas (Old)
        </h2>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhuma atividade recente
            </p>
            <p className="text-sm text-muted-foreground">
              Suas solicitações e aprovações aparecerão aqui
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
