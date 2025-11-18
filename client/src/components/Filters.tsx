import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface FiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  showCentroCusto?: boolean;
  showDiretoria?: boolean;
  showColaborador?: boolean;
  showStatus?: boolean;
  showDateRange?: boolean;
}

export interface FilterValues {
  centroCusto?: string;
  diretoria?: string;
  colaborador?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
}

const diretorias = [
  "Presidência",
  "Administrativa/Financeira",
  "Jurídica",
  "Comunicação",
  "Regulatória",
  "Tecnologia",
];

const statusOptions = [
  "Solicitado",
  "AprovadoDiretoria",
  "AprovadoFinanceiro",
  "Pago",
  "PrestacaoPendente",
  "Concluído",
  "Pendente",
  "Validado",
  "Finalizado",
];

export function Filters({
  onFilterChange,
  showCentroCusto = true,
  showDiretoria = true,
  showColaborador = false,
  showStatus = true,
  showDateRange = true,
}: FiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});

  const updateFilter = (key: keyof FilterValues, value: string) => {
    const newFilters = {
      ...filters,
      [key]: (value === "all" || !value) ? undefined : value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Filtros</h3>
            {hasActiveFilters && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {Object.values(filters).filter(Boolean).length} aplicado(s)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                data-testid="clear-filters"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid="toggle-filters"
            >
              {isExpanded ? "Ocultar" : "Expandir"}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {showCentroCusto && (
              <div className="space-y-2">
                <Label htmlFor="centro-custo">Centro de Custo</Label>
                <Input
                  id="centro-custo"
                  placeholder="Filtrar por centro de custo"
                  value={filters.centroCusto || ""}
                  onChange={(e) => updateFilter("centroCusto", e.target.value)}
                  data-testid="filter-centro-custo"
                />
              </div>
            )}

            {showDiretoria && (
              <div className="space-y-2">
                <Label htmlFor="diretoria">Diretoria</Label>
                <Select
                  value={filters.diretoria || "all"}
                  onValueChange={(value) => updateFilter("diretoria", value)}
                >
                  <SelectTrigger id="diretoria" data-testid="filter-diretoria">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {diretorias.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showColaborador && (
              <div className="space-y-2">
                <Label htmlFor="colaborador">Colaborador</Label>
                <Input
                  id="colaborador"
                  placeholder="Nome do colaborador"
                  value={filters.colaborador || ""}
                  onChange={(e) => updateFilter("colaborador", e.target.value)}
                  data-testid="filter-colaborador"
                />
              </div>
            )}

            {showStatus && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => updateFilter("status", value)}
                >
                  <SelectTrigger id="status" data-testid="filter-status">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showDateRange && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="data-inicio">Data Início</Label>
                  <Input
                    id="data-inicio"
                    type="date"
                    value={filters.dataInicio || ""}
                    onChange={(e) => updateFilter("dataInicio", e.target.value)}
                    data-testid="filter-data-inicio"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-fim">Data Fim</Label>
                  <Input
                    id="data-fim"
                    type="date"
                    value={filters.dataFim || ""}
                    onChange={(e) => updateFilter("dataFim", e.target.value)}
                    data-testid="filter-data-fim"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
