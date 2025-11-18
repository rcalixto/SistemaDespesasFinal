import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BedDouble, Calendar, DollarSign, Hotel } from "lucide-react";
import { Filters } from "@/components/Filters";
import type { HospedagemExecutada } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function HospedagensExecutadas() {
  const { data: hospedagens = [], isLoading } = useQuery<HospedagemExecutada[]>({
    queryKey: ["/api/hospedagens-executadas"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Hospedagens Executadas
        </h1>
        <p className="text-muted-foreground">
          Visualize o histórico de hospedagens executadas e valores desembolsados
        </p>
      </div>

      <Filters onFilterChange={() => {}} showCentroCusto={true} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : hospedagens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BedDouble className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma hospedagem executada</h3>
            <p className="text-muted-foreground">
              Não há registros de hospedagens executadas no momento
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {hospedagens.map((hospedagem) => (
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
                    <p className="font-medium">{formatCurrency(Number(hospedagem.valorDiaria))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Valor Total
                    </p>
                    <p className="font-semibold text-lg text-abert-blue">
                      {formatCurrency(Number(hospedagem.valorTotal))}
                    </p>
                  </div>
                </div>

                {/* Detalhamento de Valores */}
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Detalhamento de Valores</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {hospedagem.cafe && Number(hospedagem.cafe) > 0 && (
                      <div>
                        <p className="text-muted-foreground">Café da Manhã</p>
                        <p className="font-medium">{formatCurrency(Number(hospedagem.cafe))}</p>
                      </div>
                    )}
                    {hospedagem.taxa && Number(hospedagem.taxa) > 0 && (
                      <div>
                        <p className="text-muted-foreground">Taxas</p>
                        <p className="font-medium">{formatCurrency(Number(hospedagem.taxa))}</p>
                      </div>
                    )}
                    {hospedagem.extrasPosteriores && Number(hospedagem.extrasPosteriores) > 0 && (
                      <div>
                        <p className="text-muted-foreground">Extras Posteriores</p>
                        <p className="font-medium">{formatCurrency(Number(hospedagem.extrasPosteriores))}</p>
                      </div>
                    )}
                  </div>
                </div>

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
