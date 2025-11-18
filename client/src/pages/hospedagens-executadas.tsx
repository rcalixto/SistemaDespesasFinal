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
import { Plus, BedDouble, DollarSign, Calendar } from "lucide-react";
import { Filters } from "@/components/Filters";
import { FileUpload } from "@/components/FileUpload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { HospedagemExecutada } from "@shared/schema";
import { z } from "zod";

const formSchema = z.object({
  colaboradorId: z.number(),
  dataHospedagem: z.string().min(1, "Data da hospedagem é obrigatória"),
  centroCusto: z.string().optional(),
  objetivo: z.string().min(1, "Objetivo é obrigatório"),
  hotel: z.string().min(1, "Nome do hotel é obrigatório"),
  valorDiaria: z.number().positive("Valor da diária deve ser maior que zero"),
  cafe: z.number().optional(),
  taxa: z.number().optional(),
  extrasPosteriores: z.number().optional(),
  valorTotal: z.number().positive("Valor total deve ser maior que zero"),
  responsavelEmissao: z.string().optional(),
  formaPagamento: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function HospedagensExecutadas() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fatura, setFatura] = useState<File[]>([]);
  const { toast } = useToast();

  const { data: hospedagens = [], isLoading } = useQuery<HospedagemExecutada[]>({
    queryKey: ["/api/hospedagens-executadas"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      colaboradorId: 1,
      dataHospedagem: "",
      centroCusto: "",
      objetivo: "",
      hotel: "",
      valorDiaria: 0,
      cafe: 0,
      taxa: 0,
      extrasPosteriores: 0,
      valorTotal: 0,
      responsavelEmissao: "",
      formaPagamento: "",
      observacoes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/hospedagens-executadas", {
        ...data,
        fatura: fatura[0]?.name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospedagens-executadas"] });
      toast({
        title: "Sucesso",
        description: "Hospedagem executada registrada com sucesso!",
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
            Hospedagens Executadas
          </h1>
          <p className="text-muted-foreground">
            Registre hospedagens já realizadas e valores pagos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="new-hospedagem-executada">
              <Plus className="w-4 h-4" />
              Registrar Hospedagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Hospedagem Executada</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dataHospedagem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Hospedagem *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-data-hospedagem" />
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
                        <Textarea placeholder="Descreva o objetivo da hospedagem" {...field} data-testid="input-objetivo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hotel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hotel *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do hotel" {...field} data-testid="input-hotel" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valorDiaria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Diária (R$) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-valor-diaria"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cafe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Café da Manhã (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-cafe"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa de Serviço (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-taxa"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="extrasPosteriores"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Extras Posteriores (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-extras"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="valorTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total (R$) *</FormLabel>
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
                        <FormLabel>Responsável pela Reserva</FormLabel>
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
                  data-testid="submit-hospedagem"
                >
                  {createMutation.isPending ? "Registrando..." : "Registrar Hospedagem"}
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
      ) : hospedagens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BedDouble className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhuma hospedagem executada registrada
            </p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              Registrar Hospedagem
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {hospedagens.map((item) => (
            <Card
              key={item.id}
              className="border-l-4 border-l-accent hover:shadow-md transition-shadow"
              data-testid={`hospedagem-${item.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <BedDouble className="w-5 h-5 text-accent-foreground flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {item.hotel}
                      </h3>
                    </div>
                    <p className="text-muted-foreground mb-3">{item.objetivo}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(item.dataHospedagem)}</span>
                      </div>
                      {item.centroCusto && (
                        <div>
                          <span className="font-medium">Centro de Custo:</span> {item.centroCusto}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-6">
                    <p className="text-2xl font-bold text-accent-foreground mb-1">
                      {formatCurrency(item.valorTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Diária: {formatCurrency(item.valorDiaria)}
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
