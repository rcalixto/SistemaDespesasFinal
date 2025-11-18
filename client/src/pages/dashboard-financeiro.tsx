import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, FileText, TrendingUp, TrendingDown } from "lucide-react";
import type { Adiantamento, Reembolso } from "@shared/schema";

export default function DashboardFinanceiro() {
  const { data: adiantamentos = [] } = useQuery<Adiantamento[]>({
    queryKey: ["/api/adiantamentos"],
  });

  const { data: reembolsos = [] } = useQuery<Reembolso[]>({
    queryKey: ["/api/reembolsos"],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalAdiantamentos = adiantamentos.reduce(
    (acc, a) => acc + Number(a.valorSolicitado || 0),
    0
  );

  const totalReembolsos = reembolsos.reduce(
    (acc, r) => acc + Number(r.valorTotalSolicitado || 0),
    0
  );

  const adiantamentosPagos = adiantamentos.filter((a) => a.status === "Pago");
  const totalPago = adiantamentosPagos.reduce(
    (acc, a) => acc + Number(a.valorSolicitado || 0),
    0
  );

  const adiantamentosPendentes = adiantamentos.filter((a) =>
    ["Solicitado", "AprovadoDiretoria", "AprovadoFinanceiro"].includes(a.status || "")
  );
  const totalPendente = adiantamentosPendentes.reduce(
    (acc, a) => acc + Number(a.valorSolicitado || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Dashboard Financeiro
        </h1>
        <p className="text-muted-foreground">
          Visão geral de todas as movimentações financeiras
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Adiantamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(totalAdiantamentos)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {adiantamentos.length} solicitações
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reembolsos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(totalReembolsos)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {reembolsos.length} solicitações
                </p>
              </div>
              <FileText className="w-8 h-8 text-accent/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(totalPago)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {adiantamentosPagos.length} pagamentos
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-success/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(totalPendente)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {adiantamentosPendentes.length} em andamento
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span>Adiantamentos por Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(
                adiantamentos.reduce((acc, a) => {
                  const status = a.status || "Solicitado";
                  if (!acc[status]) {
                    acc[status] = { count: 0, value: 0 };
                  }
                  acc[status].count++;
                  acc[status].value += Number(a.valorSolicitado || 0);
                  return acc;
                }, {} as Record<string, { count: number; value: number }>)
              ).map(([status, data]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{status}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.count} solicitações
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(data.value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-accent-foreground" />
              <span>Reembolsos por Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(
                reembolsos.reduce((acc, r) => {
                  const status = r.status || "Solicitado";
                  if (!acc[status]) {
                    acc[status] = { count: 0, value: 0 };
                  }
                  acc[status].count++;
                  acc[status].value += Number(r.valorTotalSolicitado || 0);
                  return acc;
                }, {} as Record<string, { count: number; value: number }>)
              ).map(([status, data]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{status}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.count} solicitações
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    {formatCurrency(data.value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
