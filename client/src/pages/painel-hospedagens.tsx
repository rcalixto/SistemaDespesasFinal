import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, DollarSign, Building2, TrendingUp } from "lucide-react";
import { Filters } from "@/components/Filters";
import type { HospedagemExecutada } from "@shared/schema";

export default function PainelHospedagens() {
  const { data: hospedagens = [] } = useQuery<HospedagemExecutada[]>({
    queryKey: ["/api/hospedagens-executadas"],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalHospedagens = hospedagens.length;
  const totalGasto = hospedagens.reduce(
    (acc, h) => acc + Number(h.valorTotal || 0),
    0
  );
  const mediaGasto = totalHospedagens > 0 ? totalGasto / totalHospedagens : 0;

  const hospedagensPorHotel = hospedagens.reduce((acc, h) => {
    const hotel = h.hotel || "Não informado";
    if (!acc[hotel]) {
      acc[hotel] = { count: 0, value: 0 };
    }
    acc[hotel].count++;
    acc[hotel].value += Number(h.valorTotal || 0);
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  const hospedagensPorCentroCusto = hospedagens.reduce((acc, h) => {
    const cc = h.centroCusto || "Não informado";
    if (!acc[cc]) {
      acc[cc] = { count: 0, value: 0 };
    }
    acc[cc].count++;
    acc[cc].value += Number(h.valorTotal || 0);
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Painel de Hospedagens
        </h1>
        <p className="text-muted-foreground">
          Análise detalhada de hospedagens executadas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Hospedagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-foreground">
                {totalHospedagens}
              </p>
              <BedDouble className="w-8 h-8 text-primary/20" />
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
              Média por Hospedagem
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
              <BedDouble className="w-5 h-5 text-primary" />
              <span>Hospedagens por Hotel</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(hospedagensPorHotel)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 10)
                .map(([hotel, data]) => (
                  <div key={hotel} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground truncate">{hotel}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.count} hospedagens
                      </p>
                    </div>
                    <p className="font-semibold text-foreground ml-2">
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
              <span>Hospedagens por Centro de Custo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(hospedagensPorCentroCusto)
                .sort((a, b) => b[1].value - a[1].value)
                .map(([cc, data]) => (
                  <div key={cc} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{cc}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.count} hospedagens
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
