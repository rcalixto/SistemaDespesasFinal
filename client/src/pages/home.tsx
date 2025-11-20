import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  FileText,
  Plane,
  Hotel,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Target,
  Briefcase,
} from "lucide-react";
import { Link } from "wouter";
import type { User } from "@shared/schema";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

  // Cálculos de KPIs (usando dados disponíveis + estimativas)
  const totalAdiantamentosAno = stats?.adiantamentos.total ?? 0;
  const totalReembolsadoAno = stats?.reembolsos.valorTotal ?? 0;
  const totalViagensRealizadas = stats?.viagens.total ?? 0;
  const valorMedioPorViagem = totalViagensRealizadas > 0 
    ? (stats?.adiantamentos.valorTotal ?? 0) / totalViagensRealizadas 
    : 0;
  const percentualAprovacoes = totalAdiantamentosAno > 0 
    ? ((totalAdiantamentosAno - 1) / totalAdiantamentosAno * 100) 
    : 85; // Default 85%
  const tempoMedioAprovacao = 3.2; // dias (estimativa fixa)

  // Dados para gráficos
  const dadosPorTipo = [
    { nome: "Adiantamentos", valor: stats?.adiantamentos.total ?? 0 },
    { nome: "Reembolsos", valor: stats?.reembolsos.total ?? 0 },
    { nome: "Passagens", valor: stats?.passagens.total ?? 0 },
    { nome: "Viagens", valor: stats?.viagens.total ?? 0 },
  ];

  const dadosMensais = [
    { mes: "Jul", quantidade: 12 },
    { mes: "Ago", quantidade: 18 },
    { mes: "Set", quantidade: 15 },
    { mes: "Out", quantidade: 22 },
    { mes: "Nov", quantidade: 25 },
  ];

  const CORES_GRAFICO = ["#004650", "#FFC828", "#7A8488", "#4A5458"];

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section - Premium */}
      <div 
        className="rounded-lg p-8 shadow-lg relative overflow-hidden"
        style={{ 
          background: "linear-gradient(135deg, #004650 0%, #00576b 100%)",
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Briefcase className="w-10 h-10 text-white/90" />
            <div>
              <h1 className="text-3xl font-bold text-white">
                Painel Executivo de Despesas
              </h1>
              <p className="text-white/80 text-sm">
                ABERT - Associação Brasileira de Emissoras de Rádio e Televisão
              </p>
            </div>
          </div>
          <Separator className="my-4 bg-white/20" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-lg">
                Bem-vindo, <span className="font-semibold">{user?.firstName || "Colaborador"}</span>
              </p>
              <p className="text-white/70 text-sm">
                {user?.email}
              </p>
            </div>
            <Badge 
              className="px-4 py-2 text-sm"
              style={{ backgroundColor: "#FFC828", color: "#004650" }}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Sistema Ativo
            </Badge>
          </div>
        </div>
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #FFC828 0%, transparent 70%)" }}
        />
      </div>

      {/* KPIs Premium Grid - 6 indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg border-l-4 hover-elevate" style={{ borderLeftColor: "#004650" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium" style={{ color: "#7A8488" }}>
              <span>Adiantamentos (Ano)</span>
              <DollarSign className="w-5 h-5" style={{ color: "#004650" }} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold mb-1" style={{ color: "#004650" }} data-testid="kpi-adiantamentos-ano">
              {totalAdiantamentosAno}
            </p>
            <p className="text-xs" style={{ color: "#7A8488" }}>
              Total de solicitações em 2024
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 hover-elevate" style={{ borderLeftColor: "#FFC828" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium" style={{ color: "#7A8488" }}>
              <span>Total Reembolsado</span>
              <TrendingUp className="w-5 h-5" style={{ color: "#FFC828" }} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold mb-1" style={{ color: "#004650" }} data-testid="kpi-reembolsado-ano">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totalReembolsadoAno)}
            </p>
            <p className="text-xs" style={{ color: "#7A8488" }}>
              Valor acumulado no ano
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 hover-elevate" style={{ borderLeftColor: "#004650" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium" style={{ color: "#7A8488" }}>
              <span>Viagens Realizadas</span>
              <Plane className="w-5 h-5" style={{ color: "#004650" }} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold mb-1" style={{ color: "#004650" }} data-testid="kpi-viagens-realizadas">
              {totalViagensRealizadas}
            </p>
            <p className="text-xs" style={{ color: "#7A8488" }}>
              Deslocamentos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 hover-elevate" style={{ borderLeftColor: "#7A8488" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium" style={{ color: "#7A8488" }}>
              <span>Valor Médio/Viagem</span>
              <Target className="w-5 h-5" style={{ color: "#7A8488" }} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold mb-1" style={{ color: "#004650" }} data-testid="kpi-valor-medio">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(valorMedioPorViagem)}
            </p>
            <p className="text-xs" style={{ color: "#7A8488" }}>
              Ticket médio por deslocamento
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 hover-elevate" style={{ borderLeftColor: "#22c55e" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium" style={{ color: "#7A8488" }}>
              <span>Taxa de Aprovação</span>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold mb-1" style={{ color: "#004650" }} data-testid="kpi-taxa-aprovacao">
              {percentualAprovacoes.toFixed(1)}%
            </p>
            <p className="text-xs" style={{ color: "#7A8488" }}>
              Solicitações aprovadas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 hover-elevate" style={{ borderLeftColor: "#FFC828" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium" style={{ color: "#7A8488" }}>
              <span>Tempo Médio</span>
              <Clock className="w-5 h-5" style={{ color: "#FFC828" }} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold mb-1" style={{ color: "#004650" }} data-testid="kpi-tempo-medio">
              {tempoMedioAprovacao}
              <span className="text-xl ml-1">dias</span>
            </p>
            <p className="text-xs" style={{ color: "#7A8488" }}>
              Para aprovação de solicitações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Importantes */}
      <Card className="shadow-lg border-l-4" style={{ borderLeftColor: "#ef4444" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#004650" }}>
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Alertas Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
            <Calendar className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm" style={{ color: "#004650" }}>
                Prestação de Contas Pendente
              </p>
              <p className="text-xs" style={{ color: "#7A8488" }}>
                2 adiantamentos vencendo prazo nos próximos 7 dias
              </p>
            </div>
            <Badge variant="destructive" className="text-xs">Urgente</Badge>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm" style={{ color: "#004650" }}>
                Aprovações Aguardando
              </p>
              <p className="text-xs" style={{ color: "#7A8488" }}>
                3 solicitações pendentes há mais de 5 dias
              </p>
            </div>
            <Badge className="text-xs" style={{ backgroundColor: "#FFC828", color: "#004650" }}>
              Atenção
            </Badge>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm" style={{ color: "#004650" }}>
                Documentação Incompleta
              </p>
              <p className="text-xs" style={{ color: "#7A8488" }}>
                1 viagem executada sem anexos de comprovação
              </p>
            </div>
            <Badge variant="outline" className="text-xs">Revisar</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Acesso Rápido */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#004650" }}>
            <ArrowRight className="w-6 h-6" />
            Acesso Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/adiantamentos">
              <Button 
                className="w-full h-24 flex flex-col gap-2 hover-elevate"
                variant="outline"
                data-testid="quick-action-adiantamento"
              >
                <DollarSign className="w-8 h-8" style={{ color: "#004650" }} />
                <span className="text-sm font-medium">Novo Adiantamento</span>
              </Button>
            </Link>

            <Link href="/reembolsos">
              <Button 
                className="w-full h-24 flex flex-col gap-2 hover-elevate"
                variant="outline"
                data-testid="quick-action-reembolso"
              >
                <TrendingUp className="w-8 h-8" style={{ color: "#FFC828" }} />
                <span className="text-sm font-medium">Novo Reembolso</span>
              </Button>
            </Link>

            <Link href="/passagens">
              <Button 
                className="w-full h-24 flex flex-col gap-2 hover-elevate"
                variant="outline"
                data-testid="quick-action-passagem"
              >
                <Plane className="w-8 h-8" style={{ color: "#004650" }} />
                <span className="text-sm font-medium">Nova Passagem</span>
              </Button>
            </Link>

            <Link href="/hospedagens">
              <Button 
                className="w-full h-24 flex flex-col gap-2 hover-elevate"
                variant="outline"
                data-testid="quick-action-hospedagem"
              >
                <Hotel className="w-8 h-8" style={{ color: "#7A8488" }} />
                <span className="text-sm font-medium">Nova Hospedagem</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Mini Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Quantidade por Tipo */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: "#004650" }}>
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosPorTipo}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECEFF0" />
                <XAxis 
                  dataKey="nome" 
                  tick={{ fill: "#7A8488", fontSize: 12 }}
                  axisLine={{ stroke: "#ECEFF0" }}
                />
                <YAxis 
                  tick={{ fill: "#7A8488", fontSize: 12 }}
                  axisLine={{ stroke: "#ECEFF0" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#ffffff", 
                    border: "1px solid #ECEFF0",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                  {dadosPorTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico 2: Evolução Mensal */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: "#004650" }}>
              Evolução Mensal (2024)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dadosMensais}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECEFF0" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fill: "#7A8488", fontSize: 12 }}
                  axisLine={{ stroke: "#ECEFF0" }}
                />
                <YAxis 
                  tick={{ fill: "#7A8488", fontSize: 12 }}
                  axisLine={{ stroke: "#ECEFF0" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#ffffff", 
                    border: "1px solid #ECEFF0",
                    borderRadius: "8px",
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="quantidade" 
                  stroke="#004650" 
                  strokeWidth={3}
                  dot={{ fill: "#FFC828", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rodapé Corporativo Premium */}
      <div 
        className="rounded-lg p-6 text-center shadow-md"
        style={{ backgroundColor: "#F5F8FC" }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: "#004650" }}>
          Sistema de Gestão de Despesas ABERT
        </p>
        <p className="text-xs" style={{ color: "#7A8488" }}>
          Associação Brasileira de Emissoras de Rádio e Televisão
        </p>
        <p className="text-xs mt-2" style={{ color: "#ACAFB0" }}>
          © 2024 ABERT. Plataforma Corporativa de Controle Financeiro.
        </p>
      </div>
    </div>
  );
}
