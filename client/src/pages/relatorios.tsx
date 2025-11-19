import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { FileBarChart, TrendingUp, Users, DollarSign } from "lucide-react";

const COLORS = ['#004650', '#FFC828', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const STATUS_COLORS: Record<string, string> = {
  'Solicitado': '#3B82F6',
  'AprovadoDiretoria': '#F59E0B',
  'AprovadoFinanceiro': '#10B981',
  'Pago': '#8B5CF6',
  'Concluído': '#059669',
  'Rejeitado': '#EF4444',
};

export default function Relatorios() {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [diretoria, setDiretoria] = useState('');

  // Construir query string com os filtros
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (dataInicio && dataInicio.trim() !== '') {
      params.append('dataInicio', dataInicio.trim());
    }
    if (dataFim && dataFim.trim() !== '') {
      params.append('dataFim', dataFim.trim());
    }
    if (diretoria && diretoria.trim() !== '') {
      params.append('diretoria', diretoria.trim());
    }
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  const { data, isLoading } = useQuery<{
    adiantamentosPorStatus: Array<{ status: string; quantidade: number; valor_total: string }>;
    reembolsosPorStatus: Array<{ status: string; quantidade: number; valor_total: string }>;
    reembolsosPorCategoria: Array<{ categoria: string; quantidade_reembolsos: number; valor_total: string }>;
    despesasMensais: Array<{ mes: string; tipo: string; valor_total: string }>;
    topColaboradores: Array<{ nome: string; departamento: string; total_solicitacoes: number; valor_total: string }>;
  }>({
    queryKey: ['/api/relatorios', dataInicio, dataFim, diretoria],
    queryFn: async () => {
      const url = `/api/relatorios${buildQueryString()}`;
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      return response.json();
    },
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Transformar dados para os gráficos
  const adiantamentosChartData = data?.adiantamentosPorStatus.map(item => ({
    name: item.status,
    quantidade: item.quantidade,
    valor: parseFloat(item.valor_total || '0'),
  })) || [];

  const reembolsosChartData = data?.reembolsosPorStatus.map(item => ({
    name: item.status,
    quantidade: item.quantidade,
    valor: parseFloat(item.valor_total || '0'),
  })) || [];

  const categoriasChartData = data?.reembolsosPorCategoria.map(item => ({
    name: item.categoria,
    valor: parseFloat(item.valor_total || '0'),
  })) || [];

  // Agrupar despesas mensais por mês e ordenar cronologicamente
  const despesasMensaisAgrupadas = data?.despesasMensais.reduce((acc, item) => {
    const existente = acc.find(a => a.mes === item.mes);
    if (existente) {
      if (item.tipo === 'Adiantamentos') {
        existente.adiantamentos = parseFloat(item.valor_total || '0');
      } else {
        existente.reembolsos = parseFloat(item.valor_total || '0');
      }
    } else {
      acc.push({
        mes: item.mes,
        adiantamentos: item.tipo === 'Adiantamentos' ? parseFloat(item.valor_total || '0') : 0,
        reembolsos: item.tipo === 'Reembolsos' ? parseFloat(item.valor_total || '0') : 0,
      });
    }
    return acc;
  }, [] as Array<{ mes: string; adiantamentos: number; reembolsos: number }>)
  .sort((a, b) => a.mes.localeCompare(b.mes)) || [];

  const topColaboradoresData = data?.topColaboradores.map(item => ({
    nome: item.nome.split(' ')[0] + ' ' + item.nome.split(' ').slice(-1)[0],
    valor: parseFloat(item.valor_total || '0'),
    solicitacoes: item.total_solicitacoes,
  })) || [];

  // Calcular totais para os cards de resumo
  const totalAdiantamentos = adiantamentosChartData.reduce((sum, item) => sum + item.valor, 0);
  const totalReembolsos = reembolsosChartData.reduce((sum, item) => sum + item.valor, 0);
  const totalDespesas = totalAdiantamentos + totalReembolsos;
  const totalSolicitacoes = 
    adiantamentosChartData.reduce((sum, item) => sum + item.quantidade, 0) +
    reembolsosChartData.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios e Análises</h1>
          <p className="text-muted-foreground mt-2">
            Visualize dados consolidados de despesas e solicitações
          </p>
        </div>
        <FileBarChart className="h-12 w-12 text-primary" />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                data-testid="input-data-inicio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                data-testid="input-data-fim"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diretoria">Diretoria</Label>
              <Input
                id="diretoria"
                placeholder="Ex: Administrativa"
                value={diretoria}
                onChange={(e) => setDiretoria(e.target.value)}
                data-testid="input-diretoria"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Adiantamentos + Reembolsos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adiantamentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAdiantamentos)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {adiantamentosChartData.reduce((sum, item) => sum + item.quantidade, 0)} solicitações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reembolsos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReembolsos)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {reembolsosChartData.reduce((sum, item) => sum + item.quantidade, 0)} solicitações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSolicitacoes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Todas as categorias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Adiantamentos por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Adiantamentos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={adiantamentosChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'valor') {
                      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
                    }
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="quantidade" fill="#004650" name="Quantidade" />
                <Bar dataKey="valor" fill="#FFC828" name="Valor (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reembolsos por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Reembolsos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reembolsosChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'valor') {
                      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
                    }
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="quantidade" fill="#004650" name="Quantidade" />
                <Bar dataKey="valor" fill="#FFC828" name="Valor (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria (Reembolsos)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoriasChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.valor)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {categoriasChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={despesasMensaisAgrupadas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                />
                <Legend />
                <Line type="monotone" dataKey="adiantamentos" stroke="#004650" name="Adiantamentos" strokeWidth={2} />
                <Line type="monotone" dataKey="reembolsos" stroke="#FFC828" name="Reembolsos" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Colaboradores */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Colaboradores por Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topColaboradoresData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="nome" type="category" width={150} />
              <Tooltip 
                formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
              />
              <Legend />
              <Bar dataKey="valor" fill="#004650" name="Valor Total (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
