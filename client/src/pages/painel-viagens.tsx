import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, DollarSign, Building2, TrendingUp } from "lucide-react";
import { Filters } from "@/components/Filters";
import type { ViagemExecutada } from "@shared/schema";

export default function PainelViagens() {
  const { data: viagens = [] } = useQuery<ViagemExecutada[]>({
    queryKey: ["/api/viagens-executadas"],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalViagens = viagens.length;
  const totalGasto = viagens.reduce(
    (acc, v) => acc + Number(v.valorTotalDesembolsar || 0),
    0
  );
  const mediaGasto = totalViagens > 0 ? totalGasto / totalViagens : 0;

  const viagensPorCia = viagens.reduce((acc, v) => {
    const cia = v.ciaAerea || "Não informado";
    if (!acc[cia]) {
      acc[cia] = { count: 0, value: 0 };
    }
    acc[cia].count++;
    acc[cia].value += Number(v.valorTotalDesembolsar || 0);
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  const viagensPorCentroCusto = viagens.reduce((acc, v) => {
    const cc = v.centroCusto || "Não informado";
    if (!acc[cc]) {
      acc[cc] = { count: 0, value: 0 };
    }
    acc[cc].count++;
    acc[cc].value += Number(v.valorTotalDesembolsar || 0);
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Painel de Viagens
        </h1>
        <p className="text-muted-foreground">
          Análise detalhada de viagens aéreas executadas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Viagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-foreground">{totalViagens}</p>
              <Plane className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gasto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(totalGasto)}
              </p>
              <DollarSign className="w-8 h-8 text-accent/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Média por Viagem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(mediaGasto)}
              </p>
              <TrendingUp className="w-8 h-8 text-success/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Filters onFilterChange={() => {}} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="w-5 h-5 text-primary" />
              <span>Viagens por Companhia Aérea</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(viagensPorCia)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([cia, data]) => (
                  <div key={cia} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{cia}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.count} viagens
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
              <Building2 className="w-5 h-5 text-accent-foreground" />
              <span>Viagens por Centro de Custo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(viagensPorCentroCusto)
                .sort((a, b) => b[1].value - a[1].value)
                .map(([cc, data]) => (
                  <div key={cc} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{cc}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.count} viagens
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
