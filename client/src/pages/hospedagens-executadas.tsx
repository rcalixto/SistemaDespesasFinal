import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BedDouble, Calendar, DollarSign, TrendingUp, Hotel, Coffee } from "lucide-react";
import { Filters } from "@/components/Filters";
import type { HospedagemExecutada } from "@shared/schema";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";

interface FilterState {
  centroCusto: string;
  periodo: string;
  status: string;
}

export default function HospedagensExecutadas() {
  const [filters, setFilters] = useState<FilterState>({
    centroCusto: "",
    periodo: "",
    status: "",
  });

  const { data: hospedagens = [], isLoading } = useQuery<HospedagemExecutada[]>({
    queryKey: ["/api/hospedagens-executadas"],
  });

  // Filter and aggregate data
  const { filteredHospedagens, stats } = useMemo(() => {
    let filtered = hospedagens;

    // Apply centro de custo filter
    if (filters.centroCusto) {
      filtered = filtered.filter(h => 
        h.centroCusto?.toLowerCase().includes(filters.centroCusto.toLowerCase())
      );
    }

    // Apply periodo filter (last 30, 60, 90 days)
    if (filters.periodo) {
      const days = parseInt(filters.periodo);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter(h => new Date(h.dataHospedagem) >= cutoff);
    }

    // Calculate statistics
    const totalHospedagens = filtered.length;
    const valorTotal = filtered.reduce((sum, h) => sum + toNumber(h.valorTotal), 0);
    const valorMedio = totalHospedagens > 0 ? valorTotal / totalHospedagens : 0;
    
    // Valores por componente
    const totalDiarias = filtered.reduce((sum, h) => sum + toNumber(h.valorDiaria), 0);
    const totalCafe = filtered.reduce((sum, h) => sum + toNumber(h.cafe), 0);
    const totalTaxas = filtered.reduce((sum, h) => sum + toNumber(h.taxa), 0);
    const totalExtras = filtered.reduce((sum, h) => sum + toNumber(h.extrasPosteriores), 0);
    
    // Group by centro de custo
    const porCentroCusto = filtered.reduce((acc, h) => {
      const cc = h.centroCusto || "Não informado";
      if (!acc[cc]) {
        acc[cc] = { count: 0, total: 0 };
      }
      acc[cc].count += 1;
      acc[cc].total += toNumber(h.valorTotal);
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Hotéis mais utilizados
    const porHotel = filtered.reduce((acc, h) => {
      const hotel = h.hotel || "Não informado";
      acc[hotel] = (acc[hotel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      filteredHospedagens: filtered,
      stats: {
        totalHospedagens,
        valorTotal,
        valorMedio,
        totalDiarias,
        totalCafe,
        totalTaxas,
        totalExtras,
        porCentroCusto,
        porHotel,
      },
    };
  }, [hospedagens, filters]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Hospedagens Executadas
        </h1>
        <p className="text-muted-foreground">
          Visualize métricas, histórico e valores desembolsados em hospedagens
        </p>
      </div>

      {/* Summary Cards - Main Metrics */}
      {!isLoading && hospedagens.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card data-testid="card-total-hospedagens">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Hospedagens</CardTitle>
                <BedDouble className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalHospedagens}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {filters.centroCusto || filters.periodo ? "Filtros aplicados" : "Todas executadas"}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-valor-total">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Desembolsado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-abert-blue">{formatCurrency(stats.valorTotal)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor total pago
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-valor-medio">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.valorMedio)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Média por hospedagem
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-diarias">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total em Diárias</CardTitle>
                <Hotel className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalDiarias)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Somente hospedagem
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            {stats.totalCafe > 0 && (
              <Card data-testid="card-total-cafe">
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Café da Manhã</CardTitle>
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-valor-cafe">{formatCurrency(stats.totalCafe)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total gasto com café
                  </p>
                </CardContent>
              </Card>
            )}

            {stats.totalTaxas > 0 && (
              <Card data-testid="card-total-taxas">
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxas</CardTitle>
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600" data-testid="text-valor-taxas">{formatCurrency(stats.totalTaxas)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total em taxas
                  </p>
                </CardContent>
              </Card>
            )}

            {stats.totalExtras > 0 && (
              <Card data-testid="card-total-extras">
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Extras Posteriores</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-valor-extras">{formatCurrency(stats.totalExtras)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gastos adicionais
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Hotéis mais utilizados */}
          {Object.keys(stats.porHotel).length > 1 && (
            <Card data-testid="card-hoteis">
              <CardHeader>
                <CardTitle className="text-base">Hotéis Mais Utilizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.porHotel)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([hotel, count]) => (
                      <div key={hotel} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{hotel}</span>
                        <Badge variant="outline">{count} hospedagens</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Breakdown by Centro de Custo */}
          {Object.keys(stats.porCentroCusto).length > 1 && (
            <Card data-testid="card-centro-custo">
              <CardHeader>
                <CardTitle className="text-base">Distribuição por Centro de Custo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.porCentroCusto)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([cc, data]) => (
                      <div key={cc} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{cc}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{data.count} hospedagens</span>
                          <span className="font-semibold text-abert-blue min-w-[120px] text-right">
                            {formatCurrency(data.total)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Filters onFilterChange={handleFilterChange} showCentroCusto={true} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredHospedagens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BedDouble className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma hospedagem executada</h3>
            <p className="text-muted-foreground">
              {filters.centroCusto || filters.periodo
                ? "Nenhuma hospedagem encontrada com os filtros aplicados"
                : "Não há registros de hospedagens executadas no momento"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredHospedagens.map((hospedagem) => (
            <Card key={hospedagem.id} data-testid={`card-hospedagem-${hospedagem.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Hotel className="h-5 w-5 text-abert-blue" />
                    <CardTitle className="text-lg">{hospedagem.hotel}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {hospedagem.objetivo}
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Executada
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informações de Data e Custo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Data da Hospedagem
                    </p>
                    <p className="font-medium">{formatDate(hospedagem.dataHospedagem)}</p>
                  </div>
                  {hospedagem.centroCusto && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Centro de Custo</p>
                      <p className="font-medium">{hospedagem.centroCusto}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Valor Diária</p>
                    <p className="font-medium">{formatCurrency(hospedagem.valorDiaria)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Valor Total
                    </p>
                    <p className="font-semibold text-lg text-abert-blue">
                      {formatCurrency(hospedagem.valorTotal)}
                    </p>
                  </div>
                </div>

                {/* Detalhamento de Valores */}
                {(toNumber(hospedagem.cafe) > 0 || 
                  toNumber(hospedagem.taxa) > 0 || 
                  toNumber(hospedagem.extrasPosteriores) > 0) && (
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Detalhamento de Valores</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {toNumber(hospedagem.cafe) > 0 && (
                        <div>
                          <p className="text-muted-foreground">Café da Manhã</p>
                          <p className="font-medium">{formatCurrency(hospedagem.cafe)}</p>
                        </div>
                      )}
                      {toNumber(hospedagem.taxa) > 0 && (
                        <div>
                          <p className="text-muted-foreground">Taxas</p>
                          <p className="font-medium">{formatCurrency(hospedagem.taxa)}</p>
                        </div>
                      )}
                      {toNumber(hospedagem.extrasPosteriores) > 0 && (
                        <div>
                          <p className="text-muted-foreground">Extras Posteriores</p>
                          <p className="font-medium">{formatCurrency(hospedagem.extrasPosteriores)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Informações Adicionais */}
                {(hospedagem.formaPagamento || hospedagem.responsavelEmissao || hospedagem.observacoes) && (
                  <div className="border-t pt-3 space-y-2">
                    {hospedagem.formaPagamento && (
                      <div className="flex gap-2">
                        <span className="text-sm text-muted-foreground min-w-[140px]">Forma de Pagamento:</span>
                        <span className="text-sm font-medium">{hospedagem.formaPagamento}</span>
                      </div>
                    )}
                    {hospedagem.responsavelEmissao && (
                      <div className="flex gap-2">
                        <span className="text-sm text-muted-foreground min-w-[140px]">Responsável Emissão:</span>
                        <span className="text-sm font-medium">{hospedagem.responsavelEmissao}</span>
                      </div>
                    )}
                    {hospedagem.observacoes && (
                      <div className="flex gap-2">
                        <span className="text-sm text-muted-foreground min-w-[140px]">Observações:</span>
                        <span className="text-sm">{hospedagem.observacoes}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
