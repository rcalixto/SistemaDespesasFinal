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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Plane, Calendar, Hotel } from "lucide-react";
import { Filters } from "@/components/Filters";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PassagemAerea, Hospedagem } from "@shared/schema";
import { z } from "zod";

const formSchema = z.object({
  
  origem: z.string().min(1, "Origem é obrigatória"),
  destino: z.string().min(1, "Destino é obrigatório"),
  dataIda: z.string().min(1, "Data de ida é obrigatória"),
  dataVolta: z.string().optional(),
  objetivo: z.string().min(1, "Objetivo é obrigatório"),
  diretoria: z.string().optional(),
  observacoes: z.string().optional(),
  hospedagemId: z.coerce.number().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Passagens() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: passagens = [], isLoading } = useQuery<PassagemAerea[]>({
    queryKey: ["/api/passagens"],
  });

  // Fetch hospedagens for linking
  const { data: hospedagens = [] } = useQuery<Hospedagem[]>({
    queryKey: ["/api/hospedagens"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      
      origem: "",
      destino: "",
      dataIda: "",
      dataVolta: "",
      objetivo: "",
      diretoria: "",
      observacoes: "",
      hospedagemId: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/passagens", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passagens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sucesso",
        description: "Solicitação de passagem criada com sucesso!",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("pt-BR").format(d);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Passagens Aéreas
          </h1>
          <p className="text-muted-foreground">
            Solicite passagens aéreas para viagens corporativas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="new-passagem">
              <Plus className="w-4 h-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Solicitação de Passagem Aérea</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="origem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: São Paulo" {...field} data-testid="input-origem" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destino"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destino *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Rio de Janeiro" {...field} data-testid="input-destino" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dataIda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Ida *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-data-ida" />
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
                        <FormLabel>Data de Volta</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-data-volta" />
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

                <FormField
                  control={form.control}
                  name="diretoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diretoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Presidência" {...field} data-testid="input-diretoria" />
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
                        <Textarea placeholder="Informações adicionais (opcional)" {...field} data-testid="input-observacoes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hospedagemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospedagem Relacionada (Opcional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))} 
                        value={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-hospedagem">
                            <SelectValue placeholder="Selecione uma hospedagem" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma hospedagem</SelectItem>
                          {hospedagens.map((h) => (
                            <SelectItem key={h.id} value={h.id.toString()}>
                              {h.localidade} - {h.nomeHotel} ({formatDate(h.checkIn)} até {formatDate(h.checkOut)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        <Hotel className="inline h-4 w-4 mr-1" />
                        Vincule esta passagem a uma solicitação de hospedagem existente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                  data-testid="submit-passagem"
                >
                  {createMutation.isPending ? "Enviando..." : "Solicitar Passagem"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Filters onFilterChange={() => {}} showCentroCusto={false} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : passagens.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Nenhuma solicitação de passagem encontrada
            </p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {passagens.map((item) => (
            <Card
              key={item.id}
              className="border-l-4 border-l-primary hover:shadow-md transition-shadow"
              data-testid={`passagem-${item.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Plane className="w-5 h-5 text-primary flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {item.origem} → {item.destino}
                      </h3>
                    </div>
                    <p className="text-muted-foreground mb-3">{item.objetivo}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Ida: {formatDate(item.dataIda)}
                          {item.dataVolta && ` | Volta: ${formatDate(item.dataVolta)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6">
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
