import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlaneTakeoff, Calendar, DollarSign, TrendingUp, Receipt, Plane } from "lucide-react";
import { Filters } from "@/components/Filters";
import type { ViagemExecutada } from "@shared/schema";
import { formatCurrency, formatDate, toNumber } from "@/lib/utils";

interface FilterState {
  centroCusto: string;
  periodo: string;
  status: string;
}

export default function ViagensExecutadas() {
  const [filters, setFilters] = useState<FilterState>({
    centroCusto: "",
    periodo: "",
    status: "",
  });

  const { data: viagens = [], isLoading } = useQuery<ViagemExecutada[]>({
    queryKey: ["/api/viagens-executadas"],
  });

  // Filter and aggregate data
  const { filteredViagens, stats } = useMemo(() => {
    let filtered = viagens;

    // Apply centro de custo filter
    if (filters.centroCusto) {
      filtered = filtered.filter(v => 
        v.centroCusto?.toLowerCase().includes(filters.centroCusto.toLowerCase())
      );
    }

    // Apply periodo filter (last 30, 60, 90 days)
    if (filters.periodo) {
      const days = parseInt(filters.periodo);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter(v => new Date(v.dataVoo) >= cutoff);
    }

    // Calculate statistics
    const totalViagens = filtered.length;
    const valorTotal = filtered.reduce((sum, v) => sum + toNumber(v.valorTotalDesembolsar), 0);
    const valorMedio = totalViagens > 0 ? valorTotal / totalViagens : 0;
    
    // Valores por componente
    const totalPassagens = filtered.reduce((sum, v) => sum + toNumber(v.valorPassagem), 0);
    const totalTaxas = filtered.reduce((sum, v) => 
      sum + toNumber(v.taxaEmbarque) + toNumber(v.taxaAgencia) + toNumber(v.outrasTaxas), 0);
    const totalCreditos = filtered.reduce((sum, v) => sum + toNumber(v.creditoBilheteAnterior), 0);
    
    // Group by centro de custo
    const porCentroCusto = filtered.reduce((acc, v) => {
      const cc = v.centroCusto || "Não informado";
      if (!acc[cc]) {
        acc[cc] = { count: 0, total: 0 };
      }
      acc[cc].count += 1;
      acc[cc].total += toNumber(v.valorTotalDesembolsar);
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Companhias aéreas mais utilizadas
    const porCiaAerea = filtered.reduce((acc, v) => {
      const cia = v.ciaAerea || "Não informado";
      acc[cia] = (acc[cia] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      filteredViagens: filtered,
      stats: {
        totalViagens,
        valorTotal,
        valorMedio,
        totalPassagens,
        totalTaxas,
        totalCreditos,
        porCentroCusto,
        porCiaAerea,
      },
    };
  }, [viagens, filters]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Viagens Executadas
        </h1>
        <p className="text-muted-foreground">
          Visualize métricas, histórico e valores desembolsados em viagens
        </p>
      </div>

      {/* Summary Cards - Main Metrics */}
      {!isLoading && viagens.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card data-testid="card-total-viagens">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Viagens</CardTitle>
                <PlaneTakeoff className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalViagens}</div>
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
                  Valor líquido pago
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-valor-medio">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.valorMedio)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Média por viagem
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-passagens">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor em Passagens</CardTitle>
                <Plane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalPassagens)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Somente bilhetes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card data-testid="card-total-taxas">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxas e Encargos</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="text-valor-taxas">{formatCurrency(stats.totalTaxas)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Embarque + Agência + Outras
                </p>
              </CardContent>
            </Card>

            {stats.totalCreditos > 0 && (
              <Card data-testid="card-total-creditos">
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Créditos Aplicados</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-valor-creditos">{formatCurrency(stats.totalCreditos)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bilhetes anteriores utilizados
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Companhias Aéreas */}
          {Object.keys(stats.porCiaAerea).length > 1 && (
            <Card data-testid="card-cias-aereas">
              <CardHeader>
                <CardTitle className="text-base">Companhias Aéreas Mais Utilizadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.porCiaAerea)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([cia, count]) => (
                      <div key={cia} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{cia}</span>
                        <Badge variant="outline">{count} viagens</Badge>
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
                          <span className="font-medium">{data.count} viagens</span>
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
      ) : filteredViagens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PlaneTakeoff className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma viagem executada</h3>
            <p className="text-muted-foreground">
              {filters.centroCusto || filters.periodo
                ? "Nenhuma viagem encontrada com os filtros aplicados"
                : "Não há registros de viagens executadas no momento"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredViagens.map((viagem) => (
            <Card key={viagem.id} data-testid={`card-viagem-${viagem.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <PlaneTakeoff className="h-5 w-5 text-abert-blue" />
                    <CardTitle className="text-lg">{viagem.trecho}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {viagem.objetivo}
                  </p>
                  {viagem.ciaAerea && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Companhia Aérea: {viagem.ciaAerea}
                    </p>
                  )}
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
                      Data do Voo
                    </p>
                    <p className="font-medium">{formatDate(viagem.dataVoo)}</p>
                  </div>
                  {viagem.centroCusto && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Centro de Custo</p>
                      <p className="font-medium">{viagem.centroCusto}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Valor Passagem</p>
                    <p className="font-medium">{formatCurrency(viagem.valorPassagem)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Valor Total
                    </p>
                    <p className="font-semibold text-lg text-abert-blue">
                      {formatCurrency(viagem.valorTotalDesembolsar)}
                    </p>
                  </div>
                </div>

                {/* Detalhamento de Taxas */}
                {(toNumber(viagem.taxaEmbarque) > 0 || 
                  toNumber(viagem.taxaAgencia) > 0 || 
                  toNumber(viagem.outrasTaxas) > 0 || 
                  toNumber(viagem.creditoBilheteAnterior) > 0) && (
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Detalhamento de Valores</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {toNumber(viagem.taxaEmbarque) > 0 && (
                        <div>
                          <p className="text-muted-foreground">Taxa Embarque</p>
                          <p className="font-medium">{formatCurrency(viagem.taxaEmbarque)}</p>
                        </div>
                      )}
                      {toNumber(viagem.taxaAgencia) > 0 && (
                        <div>
                          <p className="text-muted-foreground">Taxa Agência</p>
                          <p className="font-medium">{formatCurrency(viagem.taxaAgencia)}</p>
                        </div>
                      )}
                      {toNumber(viagem.outrasTaxas) > 0 && (
                        <div>
                          <p className="text-muted-foreground">Outras Taxas</p>
                          <p className="font-medium">{formatCurrency(viagem.outrasTaxas)}</p>
                        </div>
                      )}
                      {toNumber(viagem.creditoBilheteAnterior) > 0 && (
                        <div>
                          <p className="text-muted-foreground">Crédito Bilhete Anterior</p>
                          <p className="font-medium text-green-600">
                            -{formatCurrency(viagem.creditoBilheteAnterior)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Informações Adicionais */}
                {(viagem.formaPagamento || viagem.responsavelEmissao || viagem.observacoes) && (
                  <div className="border-t pt-3 space-y-2">
                    {viagem.formaPagamento && (
                      <div className="flex gap-2">
                        <span className="text-sm text-muted-foreground min-w-[140px]">Forma de Pagamento:</span>
                        <span className="text-sm font-medium">{viagem.formaPagamento}</span>
                      </div>
                    )}
                    {viagem.responsavelEmissao && (
                      <div className="flex gap-2">
                        <span className="text-sm text-muted-foreground min-w-[140px]">Responsável Emissão:</span>
                        <span className="text-sm font-medium">{viagem.responsavelEmissao}</span>
                      </div>
                    )}
                    {viagem.observacoes && (
                      <div className="flex gap-2">
                        <span className="text-sm text-muted-foreground min-w-[140px]">Observações:</span>
                        <span className="text-sm">{viagem.observacoes}</span>
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
