import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Calendar, MapPin, TrendingUp, DollarSign } from "lucide-react";
import { Filters } from "@/components/Filters";
import { FileUpload } from "@/components/FileUpload";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Adiantamento } from "@shared/schema";
import { z } from "zod";

const formSchema = z.object({
  colaboradorId: z.number(),
  localViagem: z.string().min(1, "Local da viagem é obrigatório"),
  motivo: z.string().min(1, "Motivo é obrigatório"),
  dataIda: z.string().min(1, "Data de ida é obrigatória"),
  dataVolta: z.string().min(1, "Data de volta é obrigatória"),
  valorSolicitado: z.number().positive("Valor deve ser maior que zero"),
  diretoriaResponsavel: z.string().min(1, "Diretoria é obrigatória"),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Adiantamentos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anexos, setAnexos] = useState<File[]>([]);
  const { toast } = useToast();

  const { data: adiantamentos = [], isLoading } = useQuery<Adiantamento[]>({
    queryKey: ["/api/adiantamentos"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      colaboradorId: 1, // TODO: Get from auth user
      localViagem: "",
      motivo: "",
      dataIda: "",
      dataVolta: "",
      valorSolicitado: 0,
      diretoriaResponsavel: "",
      observacoes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/adiantamentos", {
        ...data,
        anexos: anexos.map((f) => f.name), // TODO: Upload files properly
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/adiantamentos"] });
      toast({
        title: "Sucesso",
        description: "Adiantamento criado com sucesso!",
      });
      setDialogOpen(false);
      form.reset();
      setAnexos([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate({
      ...data,
      valorSolicitado: Number(data.valorSolicitado),
    });
  };

  const handleFilterChange = (filters: any) => {
    // TODO: Implement filtering
    console.log("Filters:", filters);
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num || 0);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("pt-BR").format(d);
  };

  // Calculate summary
  const summary = {
    total: adiantamentos.length,
    totalValue: adiantamentos.reduce(
      (acc, a) => acc + Number(a.valorSolicitado || 0),
      0
    ),
    byStatus: adiantamentos.reduce(
      (acc, a) => {
        const status = a.status || "Solicitado";
        if (!acc[status]) {
          acc[status] = { count: 0, value: 0 };
        }
        acc[status].count++;
        acc[status].value += Number(a.valorSolicitado || 0);
        return acc;
      },
      {} as Record<string, { count: number; value: number }>
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Adiantamentos
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas solicitações de adiantamento para viagens
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="new-adiantamento">
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Solicitação de Adiantamento</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="localViagem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local da Viagem *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: São Paulo, SP"
                          {...field}
                          data-testid="input-local-viagem"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o motivo da viagem"
                          {...field}
                          data-testid="input-motivo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dataIda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Ida *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-data-ida"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataVolta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Volta *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-data-volta"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="valorSolicitado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Solicitado (R$) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-valor"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diretoriaResponsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diretoria Responsável *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Presidência"
                          {...field}
                          data-testid="input-diretoria"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais (opcional)"
                          {...field}
                          data-testid="input-observacoes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="mb-2 block">Anexar Documentos (Opcional)</Label>
                  <FileUpload
                    onUploadSuccess={setAnexos}
                    maxFiles={5}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                  data-testid="submit-adiantamento"
                >
                  {createMutation.isPending ? "Enviando..." : "Solicitar Adiantamento"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Solicitações</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {summary.total}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatCurrency(summary.totalValue)} acumulado
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.entries(summary.byStatus)
            .slice(0, 3)
            .map(([status, data]) => (
              <Card key={status}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground truncate">
                        {status}
                      </p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {data.count}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        {formatCurrency(data.value)}
                      </p>
                    </div>
                    <div className="p-2 bg-accent/10 rounded-full flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-accent-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Filters */}
      <Filters onFilterChange={handleFilterChange} />

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : adiantamentos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhum adiantamento encontrado
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie sua primeira solicitação de adiantamento
            </p>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(true)}
            >
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {adiantamentos.map((item) => (
            <Card
              key={item.id}
              className="border-l-4 border-l-primary hover:shadow-md transition-shadow"
              data-testid={`adiantamento-${item.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {item.localViagem}
                      </h3>
                    </div>
                    <p className="text-muted-foreground mb-3">{item.motivo}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(item.dataIda)} até {formatDate(item.dataVolta)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Diretoria:</span>{" "}
                        {item.diretoriaResponsavel}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <p className="text-2xl font-bold text-primary mb-2">
                      {formatCurrency(item.valorSolicitado)}
                    </p>
                    <StatusBadge status={item.status || "Solicitado"} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
