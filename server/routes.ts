import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertAdiantamentoSchema,
  insertReembolsoSchema,
  insertPassagemAereaSchema,
  insertHospedagemSchema,
  insertViagemExecutadaSchema,
  insertHospedagemExecutadaSchema,
  insertPrestacaoAdiantamentoSchema,
  insertPrestacaoReembolsoSchema,
} from "@shared/schema";

// Helper to get current colaborador for logged-in user
async function getCurrentColaborador(req: Request) {
  const user = req.user as any;
  if (!user?.id) return null;
  
  const colaborador = await storage.getColaboradorByUserId(user.id);
  return colaborador;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================================
  // AUTH SETUP
  // ============================================================================
  
  await setupAuth(app);

  // Note: /api/auth/user is now handled in googleAuth.ts

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador não encontrado" });
      }

      const stats = await storage.getDashboardStats(colaborador.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // ============================================================================
  // ADIANTAMENTOS
  // ============================================================================

  app.get("/api/adiantamentos", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const filters = {
        colaboradorId: colaborador.id,
        status: req.query.status as string,
        diretoria: req.query.diretoria as string,
        dataInicio: req.query.dataInicio as string,
        dataFim: req.query.dataFim as string,
      };

      const result = await storage.getAdiantamentos(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/adiantamentos", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const validated = insertAdiantamentoSchema.parse({
        ...req.body,
        colaboradorId: colaborador.id,
      });

      // Convert string dates to Date objects for database
      const dataToInsert = {
        ...validated,
        dataIda: new Date(validated.dataIda),
        dataVolta: new Date(validated.dataVolta),
      };

      const result = await storage.createAdiantamento(dataToInsert as any);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/adiantamentos/:id/approve-diretoria", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const adiantamento = await storage.getAdiantamentoById(id);
      
      if (!adiantamento) {
        return res.status(404).json({ message: "Adiantamento not found" });
      }

      if (adiantamento.status !== "Solicitado") {
        return res.status(400).json({ message: "Invalid status for this operation" });
      }

      const updated = await storage.updateAdiantamento(id, {
        status: "AprovadoDiretoria",
        aprovacaoDiretoria: true,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/adiantamentos/:id/approve-financeiro", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const adiantamento = await storage.getAdiantamentoById(id);
      
      if (!adiantamento) {
        return res.status(404).json({ message: "Adiantamento not found" });
      }

      if (adiantamento.status !== "AprovadoDiretoria") {
        return res.status(400).json({ message: "Invalid status for this operation" });
      }

      const updated = await storage.updateAdiantamento(id, {
        status: "Pago",
        aprovacaoFinanceiro: true,
        dataPagamento: new Date(),
        formaPagamento: req.body.formaPagamento,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/adiantamentos/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateAdiantamento(id, {
        status: "Rejeitado",
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // REEMBOLSOS
  // ============================================================================

  app.get("/api/reembolsos", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const filters = {
        colaboradorId: colaborador.id,
        status: req.query.status as string,
        centroCusto: req.query.centroCusto as string,
        dataInicio: req.query.dataInicio as string,
        dataFim: req.query.dataFim as string,
      };

      const result = await storage.getReembolsos(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/reembolsos", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const validated = insertReembolsoSchema.parse({
        ...req.body,
        colaboradorId: colaborador.id,
      });

      const result = await storage.createReembolso(validated);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/reembolsos/:id/approve-diretoria", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateReembolso(id, {
        status: "AprovadoDiretoria",
        aprovacaoDiretoria: true,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/reembolsos/:id/approve-financeiro", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateReembolso(id, {
        status: "Pago",
        aprovacaoFinanceiro: true,
        dataPagamento: new Date(),
        formaPagamento: req.body.formaPagamento,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/reembolsos/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateReembolso(id, {
        status: "Rejeitado",
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // PASSAGENS AÉREAS
  // ============================================================================

  app.get("/api/passagens", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const result = await storage.getPassagensAereas({
        colaboradorId: colaborador.id,
        status: req.query.status as string,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/passagens", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const validated = insertPassagemAereaSchema.parse({
        ...req.body,
        colaboradorId: colaborador.id,
      });

      // Convert string dates to Date objects for database
      const dataToInsert = {
        ...validated,
        dataIda: new Date(validated.dataIda),
        dataVolta: validated.dataVolta ? new Date(validated.dataVolta) : undefined,
      };

      const result = await storage.createPassagemAerea(dataToInsert as any);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/passagens/:id/approve-diretoria", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updatePassagemAerea(id, {
        status: "AprovadoDiretoria",
        aprovacaoDiretoria: true,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/passagens/:id/approve-financeiro", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updatePassagemAerea(id, {
        status: "Emitido",
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/passagens/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updatePassagemAerea(id, {
        status: "Rejeitado",
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // HOSPEDAGENS
  // ============================================================================

  app.get("/api/hospedagens", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const result = await storage.getHospedagens({
        colaboradorId: colaborador.id,
        status: req.query.status as string,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/hospedagens", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const validated = insertHospedagemSchema.parse({
        ...req.body,
        colaboradorId: colaborador.id,
      });

      // Convert string dates to Date objects for database
      const dataToInsert = {
        ...validated,
        dataCheckin: new Date(validated.dataCheckin),
        dataCheckout: new Date(validated.dataCheckout),
      };

      const result = await storage.createHospedagem(dataToInsert as any);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/hospedagens/:id/approve-diretoria", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateHospedagem(id, {
        status: "AprovadoDiretoria",
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/hospedagens/:id/approve-financeiro", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateHospedagem(id, {
        status: "Confirmado",
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/hospedagens/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateHospedagem(id, {
        status: "Rejeitado",
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // VIAGENS EXECUTADAS
  // ============================================================================

  app.get("/api/viagens-executadas", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const result = await storage.getViagensExecutadas({
        colaboradorId: colaborador.id,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/viagens-executadas", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const validated = insertViagemExecutadaSchema.parse({
        ...req.body,
        colaboradorId: colaborador.id,
      });

      // Convert string dates to Date objects for database
      const dataToInsert = {
        ...validated,
        dataVoo: validated.dataVoo ? new Date(validated.dataVoo) : undefined,
      };

      const result = await storage.createViagemExecutada(dataToInsert as any);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // HOSPEDAGENS EXECUTADAS
  // ============================================================================

  app.get("/api/hospedagens-executadas", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const result = await storage.getHospedagensExecutadas({
        colaboradorId: colaborador.id,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/hospedagens-executadas", isAuthenticated, async (req, res) => {
    try {
      const colaborador = await getCurrentColaborador(req);
      if (!colaborador) {
        return res.status(404).json({ message: "Colaborador not found" });
      }

      const validated = insertHospedagemExecutadaSchema.parse({
        ...req.body,
        colaboradorId: colaborador.id,
      });

      // Convert string dates to Date objects for database
      const dataToInsert = {
        ...validated,
        dataHospedagem: validated.dataHospedagem ? new Date(validated.dataHospedagem) : undefined,
      };

      const result = await storage.createHospedagemExecutada(dataToInsert as any);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // PRESTAÇÃO DE ADIANTAMENTO
  // ============================================================================

  app.post("/api/prestacao-adiantamento", isAuthenticated, async (req, res) => {
    try {
      const validated = insertPrestacaoAdiantamentoSchema.parse(req.body);
      const result = await storage.createPrestacaoAdiantamento(validated);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // ============================================================================
  // PRESTAÇÃO DE REEMBOLSO
  // ============================================================================

  app.post("/api/prestacao-reembolso", isAuthenticated, async (req, res) => {
    try {
      const validated = insertPrestacaoReembolsoSchema.parse(req.body);
      const result = await storage.createPrestacaoReembolso(validated);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
