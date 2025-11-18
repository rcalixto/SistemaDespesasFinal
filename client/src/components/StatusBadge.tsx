import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  Solicitado: {
    label: "Solicitado",
    variant: "secondary",
    className: "bg-warning/10 text-warning-foreground hover:bg-warning/20 border-warning/20",
  },
  AprovadoDiretoria: {
    label: "Aprovado Diretoria",
    variant: "default",
    className: "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
  },
  AprovadoFinanceiro: {
    label: "Aprovado Financeiro",
    variant: "default",
    className: "bg-primary/15 text-primary hover:bg-primary/25 border-primary/25",
  },
  Pago: {
    label: "Pago",
    variant: "default",
    className: "bg-success/10 text-success hover:bg-success/20 border-success/20",
  },
  PrestacaoPendente: {
    label: "Prestação Pendente",
    variant: "secondary",
    className: "bg-accent/10 text-accent-foreground hover:bg-accent/20 border-accent/20",
  },
  Concluído: {
    label: "Concluído",
    variant: "default",
    className: "bg-success/10 text-success hover:bg-success/20 border-success/20",
  },
  Pendente: {
    label: "Pendente",
    variant: "secondary",
    className: "bg-warning/10 text-warning-foreground hover:bg-warning/20 border-warning/20",
  },
  Validado: {
    label: "Validado",
    variant: "default",
    className: "bg-success/10 text-success hover:bg-success/20 border-success/20",
  },
  Finalizado: {
    label: "Finalizado",
    variant: "default",
    className: "bg-success/10 text-success hover:bg-success/20 border-success/20",
  },
  Aprovado: {
    label: "Aprovado",
    variant: "default",
    className: "bg-success/10 text-success hover:bg-success/20 border-success/20",
  },
  Emitido: {
    label: "Emitido",
    variant: "default",
    className: "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
  },
  Rejeitado: {
    label: "Rejeitado",
    variant: "destructive",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    variant: "outline" as const,
    className: "",
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "font-medium border",
        config.className,
        className
      )}
      data-testid={`status-${status.toLowerCase()}`}
    >
      {config.label}
    </Badge>
  );
}
