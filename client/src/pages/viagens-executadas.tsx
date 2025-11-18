import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlaneTakeoff, Calendar, DollarSign, MapPin } from "lucide-react";
import { Filters } from "@/components/Filters";
import type { ViagemExecutada } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ViagensExecutadas() {
  const { data: viagens = [], isLoading } = useQuery<ViagemExecutada[]>({
    queryKey: ["/api/viagens-executadas"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Viagens Executadas
        </h1>
        <p className="text-muted-foreground">
          Visualize o histórico de viagens executadas e valores desembolsados
        </p>
      </div>

      <Filters onFilterChange={() => {}} showCentroCusto={true} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : viagens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PlaneTakeoff className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma viagem executada</h3>
            <p className="text-muted-foreground">
              Não há registros de viagens executadas no momento
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {viagens.map((viagem) => (
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
                    <p className="font-medium">{formatCurrency(Number(viagem.valorPassagem))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Valor Total
                    </p>
                    <p className="font-semibold text-lg text-abert-blue">
                      {formatCurrency(Number(viagem.valorTotalDesembolsar))}
                    </p>
                  </div>
                </div>

                {/* Detalhamento de Taxas */}
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Detalhamento de Valores</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {viagem.taxaEmbarque && Number(viagem.taxaEmbarque) > 0 && (
                      <div>
                        <p className="text-muted-foreground">Taxa Embarque</p>
                        <p className="font-medium">{formatCurrency(Number(viagem.taxaEmbarque))}</p>
                      </div>
                    )}
                    {viagem.taxaAgencia && Number(viagem.taxaAgencia) > 0 && (
                      <div>
                        <p className="text-muted-foreground">Taxa Agência</p>
                        <p className="font-medium">{formatCurrency(Number(viagem.taxaAgencia))}</p>
                      </div>
                    )}
                    {viagem.outrasTaxas && Number(viagem.outrasTaxas) > 0 && (
                      <div>
                        <p className="text-muted-foreground">Outras Taxas</p>
                        <p className="font-medium">{formatCurrency(Number(viagem.outrasTaxas))}</p>
                      </div>
                    )}
                    {viagem.creditoBilheteAnterior && Number(viagem.creditoBilheteAnterior) > 0 && (
                      <div>
                        <p className="text-muted-foreground">Crédito Bilhete Anterior</p>
                        <p className="font-medium text-green-600">
                          -{formatCurrency(Number(viagem.creditoBilheteAnterior))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

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
