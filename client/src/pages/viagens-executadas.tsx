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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Plus, PlaneTakeoff, DollarSign, Calendar } from "lucide-react";
import { Filters } from "@/components/Filters";
import { FileUpload } from "@/components/FileUpload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ViagemExecutada } from "@shared/schema";
import { z } from "zod";

const formSchema = z.object({
  
  dataVoo: z.string().min(1, "Data do voo é obrigatória"),
  centroCusto: z.string().optional(),
  objetivo: z.string().min(1, "Objetivo é obrigatório"),
  trecho: z.string().min(1, "Trecho é obrigatório"),
  ciaAerea: z.string().optional(),
  valorPassagem: z.coerce.number().positive("Valor da passagem deve ser maior que zero"),
  taxaEmbarque: z.coerce.number().optional(),
  taxaAgencia: z.coerce.number().optional(),
  outrasTaxas: z.coerce.number().optional(),
  creditoBilheteAnterior: z.coerce.number().optional(),
  valorTotalDesembolsar: z.coerce.number().positive("Valor total deve ser maior que zero"),
  formaPagamento: z.string().optional(),
  responsavelEmissao: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ViagensExecutadas() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fatura, setFatura] = useState<File[]>([]);
  const { toast } = useToast();

  const { data: viagens = [], isLoading } = useQuery<ViagemExecutada[]>({
    queryKey: ["/api/viagens-executadas"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      
      dataVoo: "",
      centroCusto: "",
      objetivo: "",
      trecho: "",
      ciaAerea: "",
      valorPassagem: 0,
      taxaEmbarque: 0,
      taxaAgencia: 0,
      outrasTaxas: 0,
      creditoBilheteAnterior: 0,
      valorTotalDesembolsar: 0,
      formaPagamento: "",
      responsavelEmissao: "",
      observacoes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/viagens-executadas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/viagens-executadas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: "Viagem executada registrada com sucesso!",
      });
      setDialogOpen(false);
      form.reset();
      setFatura([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Viagens Executadas
          </h1>
          <p className="text-muted-foreground">
            Registre viagens aéreas já realizadas e emitidas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="new-viagem-executada">
              <Plus className="w-4 h-4" />
              Registrar Viagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Viagem Executada</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dataVoo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Voo *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-data-voo" />
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
                          <Input placeholder="Ex: Marketing" {...field} data-testid="input-centro-custo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="objetivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objetivo *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva o objetivo da viagem" {...field} data-testid="input-objetivo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trecho"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trecho *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: GRU-CGH" {...field} data-testid="input-trecho" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ciaAerea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Companhia Aérea</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: LATAM" {...field} data-testid="input-cia-aerea" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valorPassagem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Passagem (R$) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-valor-passagem"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxaEmbarque"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa de Embarque (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-taxa-embarque"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="taxaAgencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa Agência (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-taxa-agencia"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="outrasTaxas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outras Taxas (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-outras-taxas"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="creditoBilheteAnterior"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crédito Bilhete Anterior (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-credito"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="valorTotalDesembolsar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total a Desembolsar (R$) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-valor-total"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="formaPagamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Cartão Corporativo" {...field} data-testid="input-forma-pagamento" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsavelEmissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável pela Emissão</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do responsável" {...field} data-testid="input-responsavel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Informações adicionais" {...field} data-testid="input-observacoes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="mb-2 block">Fatura (Opcional)</Label>
                  <FileUpload onUploadSuccess={setFatura} maxFiles={1} multiple={false} />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                  data-testid="submit-viagem"
                >
                  {createMutation.isPending ? "Registrando..." : "Registrar Viagem"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Filters onFilterChange={() => {}} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : viagens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PlaneTakeoff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhuma viagem executada registrada
            </p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              Registrar Viagem
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {viagens.map((item) => (
            <Card
              key={item.id}
              className="border-l-4 border-l-primary hover:shadow-md transition-shadow"
              data-testid={`viagem-${item.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <PlaneTakeoff className="w-5 h-5 text-primary flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {item.trecho}
                        {item.ciaAerea && ` - ${item.ciaAerea}`}
                      </h3>
                    </div>
                    <p className="text-muted-foreground mb-3">{item.objetivo}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(item.dataVoo)}</span>
                      </div>
                      {item.centroCusto && (
                        <div>
                          <span className="font-medium">Centro de Custo:</span> {item.centroCusto}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <p className="text-2xl font-bold text-primary mb-1">
                      {formatCurrency(item.valorTotalDesembolsar)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Passagem: {formatCurrency(item.valorPassagem)}
                    </p>
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
