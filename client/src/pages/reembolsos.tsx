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
import { Plus, FileText, Receipt, TrendingUp } from "lucide-react";
import { Filters } from "@/components/Filters";
import { FileUpload } from "@/components/FileUpload";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Reembolso } from "@shared/schema";
import { z } from "zod";

const formSchema = z.object({
  
  motivo: z.string().min(1, "Motivo é obrigatório"),
  centroCusto: z.string().optional(),
  valorTotalSolicitado: z.number().positive("Valor deve ser maior que zero"),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Reembolsos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anexos, setAnexos] = useState<File[]>([]);
  const { toast } = useToast();

  const { data: reembolsos = [], isLoading } = useQuery<Reembolso[]>({
    queryKey: ["/api/reembolsos"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      
      motivo: "",
      centroCusto: "",
      valorTotalSolicitado: 0,
      observacoes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/reembolsos", {
        ...data,
        anexos: anexos.map((f) => f.name),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reembolsos"] });
      toast({
        title: "Sucesso",
        description: "Reembolso criado com sucesso!",
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
      valorTotalSolicitado: Number(data.valorTotalSolicitado),
    });
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

  const summary = {
    total: reembolsos.length,
    totalValue: reembolsos.reduce(
      (acc, r) => acc + Number(r.valorTotalSolicitado || 0),
      0
    ),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Reembolsos</h1>
          <p className="text-muted-foreground">
            Solicite reembolsos de despesas corporativas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="new-reembolso">
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Solicitação de Reembolso</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="motivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o motivo do reembolso"
                          {...field}
                          data-testid="input-motivo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="centroCusto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Centro de Custo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Marketing"
                          {...field}
                          data-testid="input-centro-custo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valorTotalSolicitado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total (R$) *</FormLabel>
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
                  <Label className="mb-2 block">
                    Anexar Comprovantes e Notas Fiscais *
                  </Label>
                  <FileUpload onUploadSuccess={setAnexos} maxFiles={10} />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                  data-testid="submit-reembolso"
                >
                  {createMutation.isPending ? "Enviando..." : "Solicitar Reembolso"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-accent">
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
              <div className="p-3 bg-accent/10 rounded-full">
                <Receipt className="w-5 h-5 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Filters onFilterChange={() => {}} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : reembolsos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhum reembolso encontrado
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie sua primeira solicitação de reembolso
            </p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reembolsos.map((item) => (
            <Card
              key={item.id}
              className="border-l-4 border-l-accent hover:shadow-md transition-shadow"
              data-testid={`reembolso-${item.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Receipt className="w-5 h-5 text-accent-foreground flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-foreground">
                        Reembolso #{item.id}
                      </h3>
                    </div>
                    <p className="text-muted-foreground mb-3">{item.motivo}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Data:</span>{" "}
                        {formatDate(item.dataSolicitacao!)}
                      </div>
                      {item.centroCusto && (
                        <div>
                          <span className="font-medium">Centro de Custo:</span>{" "}
                          {item.centroCusto}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <p className="text-2xl font-bold text-accent-foreground mb-2">
                      {formatCurrency(item.valorTotalSolicitado)}
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
